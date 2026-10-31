import Elevator from '../models/Elevator.js';
import Complaint from '../models/Complaint.js';
import Maintenance from '../models/Maintenance.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { assertObjectId, escapeRegex } from '../utils/helpers.js';

const FIELDS = ['elevatorId', 'building', 'location', 'floors', 'model', 'status', 'installedOn'];
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined && body[f] !== '').map((f) => [f, body[f]]));

export const listElevators = asyncHandler(async (req, res) => {
  const { search, status, building } = req.query;
  const filter = {};
  if (status) filter.status = String(status);
  if (building) filter.building = String(building);
  if (search) {
    const rx = new RegExp(escapeRegex(String(search)), 'i');
    filter.$or = [{ elevatorId: rx }, { building: rx }, { location: rx }, { model: rx }];
  }
  const elevators = await Elevator.find(filter).sort({ building: 1, elevatorId: 1 }).lean();

  const open = await Complaint.aggregate([
    { $match: { status: { $in: ['pending', 'assigned', 'in_progress'] } } },
    { $group: { _id: '$elevator', n: { $sum: 1 } } },
  ]);
  const openMap = Object.fromEntries(open.map((o) => [String(o._id), o.n]));
  res.json({ elevators: elevators.map((e) => ({ ...e, openComplaints: openMap[String(e._id)] || 0 })) });
});

export const getElevator = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const elevator = await Elevator.findById(req.params.id).lean();
  if (!elevator) throw new ApiError(404, 'Elevator not found');
  const [complaints, maintenance] = await Promise.all([
    Complaint.find({ elevator: elevator._id }).select('complaintId category severity status createdAt').sort({ createdAt: -1 }).limit(8).lean(),
    Maintenance.find({ elevator: elevator._id }).select('maintenanceId type title status scheduledDate completedAt').sort({ scheduledDate: -1 }).limit(8).lean(),
  ]);
  res.json({ elevator, complaints, maintenance });
});

export const createElevator = asyncHandler(async (req, res) => {
  const elevator = await Elevator.create({ ...pick(req.body), createdBy: req.user._id });
  res.status(201).json({ elevator });
});

export const updateElevator = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const elevator = await Elevator.findById(req.params.id);
  if (!elevator) throw new ApiError(404, 'Elevator not found');
  Object.assign(elevator, pick(req.body));
  await elevator.save();
  res.json({ elevator });
});

export const deleteElevator = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const elevator = await Elevator.findById(req.params.id);
  if (!elevator) throw new ApiError(404, 'Elevator not found');
  const [c, m] = await Promise.all([Complaint.countDocuments({ elevator: elevator._id }), Maintenance.countDocuments({ elevator: elevator._id })]);
  if (c || m) {
    throw new ApiError(409, `This elevator has ${c} complaint(s) and ${m} maintenance record(s). Set its status to out of service instead of deleting it.`);
  }
  await elevator.deleteOne();
  res.json({ message: 'Elevator deleted' });
});
