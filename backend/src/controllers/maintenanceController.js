import Maintenance from '../models/Maintenance.js';
import Complaint from '../models/Complaint.js';
import Elevator from '../models/Elevator.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { assertObjectId } from '../utils/helpers.js';
import { syncElevatorStatus } from '../services/elevatorStatus.js';

const POPULATE = [
  { path: 'elevator', select: 'elevatorId building location status' },
  { path: 'technician', select: 'name email specialization' },
];
const EDITABLE = ['elevator', 'type', 'title', 'scheduledDate', 'technician', 'plannedComponents', 'notes', 'recurrenceDays'];
const DAY = 86400000;
const startOfToday = () => new Date(new Date().setHours(0, 0, 0, 0));

const scopeFilter = (user) => (user.role === 'technician' ? { technician: user._id } : {});

const loadRecord = async (req) => {
  assertObjectId(req.params.id);
  const record = await Maintenance.findById(req.params.id).populate(POPULATE);
  if (!record) throw new ApiError(404, 'Maintenance record not found');
  if (req.user.role === 'technician' && String(record.technician?._id) !== String(req.user._id)) {
    throw new ApiError(403, 'This maintenance job is not assigned to you');
  }
  return record;
};

const assertTechnician = async (id) => {
  if (!id) return;
  const tech = await User.findOne({ _id: id, role: 'technician', isActive: true });
  if (!tech) throw new ApiError(404, 'Active technician not found');
};

export const listMaintenance = asyncHandler(async (req, res) => {
  const { status, type, elevator } = req.query;
  const filter = scopeFilter(req.user);
  if (status) filter.status = String(status);
  if (type) filter.type = String(type);
  if (elevator) {
    assertObjectId(elevator, 'elevator');
    filter.elevator = elevator;
  }
  const records = await Maintenance.find(filter).populate(POPULATE).sort({ scheduledDate: -1 }).limit(500);
  res.json({ records });
});

export const createMaintenance = asyncHandler(async (req, res) => {
  if (!(await Elevator.exists({ _id: req.body.elevator }))) throw new ApiError(404, 'Elevator not found');
  await assertTechnician(req.body.technician);
  const data = Object.fromEntries(EDITABLE.filter((f) => req.body[f] !== undefined && req.body[f] !== '').map((f) => [f, req.body[f]]));
  const record = await Maintenance.create({ ...data, createdBy: req.user._id });
  await record.populate(POPULATE);
  res.status(201).json({ record });
});

export const updateMaintenance = asyncHandler(async (req, res) => {
  const record = await loadRecord(req);
  if (record.status === 'completed') throw new ApiError(409, 'Completed records cannot be edited');
  if (req.body.technician) await assertTechnician(req.body.technician);
  EDITABLE.forEach((f) => {
    if (req.body[f] !== undefined) record[f] = req.body[f] === '' ? undefined : req.body[f];
  });
  if (req.body.status === 'cancelled') record.status = 'cancelled';
  await record.save();
  await record.populate(POPULATE);
  await syncElevatorStatus(record.elevator._id);
  res.json({ record });
});

export const startMaintenance = asyncHandler(async (req, res) => {
  const record = await loadRecord(req);
  if (record.status !== 'scheduled') throw new ApiError(409, 'Only scheduled jobs can be started');
  record.status = 'in_progress';
  record.startedAt = new Date();
  await record.save();
  await syncElevatorStatus(record.elevator._id);
  const fresh = await Maintenance.findById(record._id).populate(POPULATE);
  res.json({ record: fresh });
});

export const completeMaintenance = asyncHandler(async (req, res) => {
  const record = await loadRecord(req);
  if (!['scheduled', 'in_progress'].includes(record.status)) throw new ApiError(409, 'This job is already closed');
  const { servicedComponents = [], notes, cost } = req.body;
  if (!servicedComponents.length && !(notes && notes.trim().length >= 5)) {
    throw new ApiError(422, 'Record at least one serviced component or add service notes');
  }

  const now = new Date();
  record.servicedComponents = servicedComponents;
  if (notes) record.notes = notes;
  if (cost !== undefined) record.cost = cost;
  record.status = 'completed';
  record.completedAt = now;
  if (!record.startedAt) record.startedAt = now;
  await record.save();
  await Elevator.findByIdAndUpdate(record.elevator._id, { lastServiceDate: now });

  let next = null;
  if (record.recurrenceDays > 0) {
    next = await Maintenance.create({
      elevator: record.elevator._id,
      type: record.type,
      title: record.title,
      scheduledDate: new Date(now.getTime() + record.recurrenceDays * DAY),
      technician: record.technician?._id,
      plannedComponents: record.plannedComponents,
      recurrenceDays: record.recurrenceDays,
      createdBy: req.user._id,
    });
  }
  await syncElevatorStatus(record.elevator._id);
  const fresh = await Maintenance.findById(record._id).populate(POPULATE);
  res.json({ record: fresh, nextScheduled: next });
});

export const deleteMaintenance = asyncHandler(async (req, res) => {
  const record = await loadRecord(req);
  await record.deleteOne();
  await syncElevatorStatus(record.elevator._id);
  res.json({ message: 'Maintenance record deleted' });
});

export const getReminders = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 60);
  const today = startOfToday();
  const horizon = new Date(today.getTime() + (days + 1) * DAY);
  const base = { ...scopeFilter(req.user), status: { $in: ['scheduled', 'in_progress'] } };

  const [overdue, upcoming] = await Promise.all([
    Maintenance.find({ ...base, scheduledDate: { $lt: today } }).populate(POPULATE).sort({ scheduledDate: 1 }).limit(50),
    Maintenance.find({ ...base, status: 'scheduled', scheduledDate: { $gte: today, $lt: horizon } }).populate(POPULATE).sort({ scheduledDate: 1 }).limit(50),
  ]);
  res.json({ overdue, upcoming, count: overdue.length + upcoming.length, days });
});

export const componentHistory = asyncHandler(async (req, res) => {
  const { elevator } = req.query;
  assertObjectId(elevator, 'elevator');
  const [services, faults] = await Promise.all([
    Maintenance.find({ elevator, status: 'completed' }).populate('technician', 'name').lean(),
    Complaint.find({ elevator, status: { $ne: 'rejected' } }).select('complaintId category component description status severity createdAt').lean(),
  ]);

  const groups = {};
  const add = (component, event) => {
    groups[component] = groups[component] || { component, faultCount: 0, serviceCount: 0, events: [] };
    groups[component].events.push(event);
    if (event.kind === 'fault') groups[component].faultCount += 1;
    else groups[component].serviceCount += 1;
  };
  services.forEach((m) =>
    (m.servicedComponents || []).forEach((sc) =>
      add(sc.component, { kind: 'service', date: m.completedAt, title: m.title, action: sc.action, note: sc.note || m.notes, reference: m.maintenanceId, by: m.technician?.name })
    )
  );
  faults.forEach((c) =>
    add(c.component || c.category, { kind: 'fault', date: c.createdAt, title: c.description.slice(0, 140), status: c.status, severity: c.severity, reference: c.complaintId })
  );

  const components = Object.values(groups)
    .map((g) => ({ ...g, events: g.events.sort((a, b) => new Date(b.date) - new Date(a.date)), lastEventAt: g.events.reduce((m, e) => (new Date(e.date) > m ? new Date(e.date) : m), new Date(0)) }))
    .sort((a, b) => b.faultCount - a.faultCount || b.lastEventAt - a.lastEventAt);
  res.json({ components });
});
