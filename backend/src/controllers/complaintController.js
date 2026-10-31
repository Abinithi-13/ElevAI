import Complaint from '../models/Complaint.js';
import Elevator from '../models/Elevator.js';
import Maintenance from '../models/Maintenance.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { assertObjectId, escapeRegex, removeUploadedFile } from '../utils/helpers.js';
import { diagnoseFault } from '../services/grokService.js';
import { syncElevatorStatus } from '../services/elevatorStatus.js';
import { CATEGORY_LABELS } from '../config/constants.js';

const POPULATE = [
  { path: 'elevator', select: 'elevatorId building location floors model status' },
  { path: 'reportedBy', select: 'name email phone building' },
  { path: 'assignedTo', select: 'name email phone specialization' },
  { path: 'statusHistory.by', select: 'name role' },
];

const canAccess = (user, c) => {
  if (user.role === 'admin') return true;
  if (user.role === 'user') return String(c.reportedBy?._id || c.reportedBy) === String(user._id);
  return String(c.assignedTo?._id || c.assignedTo) === String(user._id);
};

const loadComplaint = async (req) => {
  assertObjectId(req.params.id);
  const complaint = await Complaint.findById(req.params.id).populate(POPULATE);
  if (!complaint) throw new ApiError(404, 'Complaint not found');
  if (!canAccess(req.user, complaint)) throw new ApiError(403, 'You do not have access to this complaint');
  return complaint;
};

export const listComplaints = asyncHandler(async (req, res) => {
  const { status, category, severity, elevator, search } = req.query;
  const filter = {};
  if (req.user.role === 'user') filter.reportedBy = req.user._id;
  if (req.user.role === 'technician') filter.assignedTo = req.user._id;
  if (status) filter.status = String(status);
  if (category) filter.category = String(category);
  if (severity) filter.severity = String(severity);
  if (elevator) {
    assertObjectId(elevator, 'elevator');
    filter.elevator = elevator;
  }
  if (search) {
    const rx = new RegExp(escapeRegex(String(search)), 'i');
    filter.$or = [{ complaintId: rx }, { description: rx }];
  }
  const complaints = await Complaint.find(filter).populate(POPULATE.slice(0, 3)).sort({ createdAt: -1 }).limit(500);
  res.json({ complaints });
});

export const getComplaint = asyncHandler(async (req, res) => {
  res.json({ complaint: await loadComplaint(req) });
});

export const createComplaint = asyncHandler(async (req, res) => {
  const { elevator, category, description } = req.body;
  const found = await Elevator.findById(elevator);
  if (!found) {
    if (req.file) removeUploadedFile(`uploads/${req.file.filename}`);
    throw new ApiError(404, 'Elevator not found');
  }
  const complaint = await Complaint.create({
    elevator,
    category,
    description,
    reportedBy: req.user._id,
    image: req.file ? `/uploads/${req.file.filename}` : undefined,
    statusHistory: [{ status: 'pending', note: 'Complaint submitted', by: req.user._id }],
  });
  await complaint.populate(POPULATE);
  res.status(201).json({ complaint });
});

export const diagnoseComplaint = asyncHandler(async (req, res) => {
  const complaint = await loadComplaint(req);
  const diagnosis = await diagnoseFault({ elevator: complaint.elevator, category: complaint.category, description: complaint.description });
  complaint.aiDiagnosis = diagnosis;
  complaint.severity = diagnosis.severity;
  await complaint.save();
  res.json({ complaint });
});

export const assignComplaint = asyncHandler(async (req, res) => {
  const complaint = await loadComplaint(req);
  if (['completed', 'rejected'].includes(complaint.status)) throw new ApiError(409, `A ${complaint.status} complaint cannot be assigned`);

  const tech = await User.findOne({ _id: req.body.technicianId, role: 'technician', isActive: true });
  if (!tech) throw new ApiError(404, 'Active technician not found');

  complaint.assignedTo = tech._id;
  complaint.assignedAt = new Date();
  if (complaint.status === 'pending') complaint.status = 'assigned';
  if (req.body.severity) complaint.severity = req.body.severity;
  complaint.statusHistory.push({ status: complaint.status, note: req.body.note || `Assigned to ${tech.name}`, by: req.user._id });
  await complaint.save();
  await complaint.populate(POPULATE);
  res.json({ complaint });
});

export const updateComplaintStatus = asyncHandler(async (req, res) => {
  const complaint = await loadComplaint(req);
  const { status, note, repairNotes, component, severity } = req.body;

  if (req.user.role === 'technician') {
    if (!['in_progress', 'completed'].includes(status)) throw new ApiError(403, 'Technicians can only mark complaints as in progress or completed');
    if (['completed', 'rejected'].includes(complaint.status)) throw new ApiError(409, 'This complaint is already closed. Ask an admin to reopen it.');
  }
  if (status === 'assigned' && !complaint.assignedTo) throw new ApiError(400, 'Assign a technician before setting status to assigned');
  if (['in_progress', 'completed'].includes(status) && !complaint.assignedTo) throw new ApiError(400, 'Assign a technician first');

  const wasCompleted = complaint.status === 'completed';
  if (repairNotes) complaint.repairNotes = repairNotes;
  if (severity) complaint.severity = severity;
  if (status === 'completed') {
    if (!complaint.repairNotes || complaint.repairNotes.length < 5) throw new ApiError(422, 'Repair notes are required to complete a complaint');
    complaint.component = component || complaint.aiDiagnosis?.affectedComponent || complaint.category;
    complaint.resolvedAt = new Date();
  } else {
    complaint.resolvedAt = undefined;
  }
  complaint.status = status;
  complaint.statusHistory.push({ status, note: note || (status === 'completed' ? complaint.repairNotes : undefined), by: req.user._id });
  await complaint.save();

  const elevatorId = complaint.elevator._id;
  if (status === 'completed' && !wasCompleted) {
    const now = new Date();
    await Maintenance.create({
      elevator: elevatorId,
      type: 'corrective',
      title: `Repair: ${CATEGORY_LABELS[complaint.component]} (${complaint.complaintId})`,
      scheduledDate: now,
      technician: complaint.assignedTo?._id,
      status: 'completed',
      servicedComponents: [{ component: complaint.component, action: 'repaired', note: complaint.repairNotes.slice(0, 500) }],
      notes: complaint.repairNotes,
      relatedComplaint: complaint._id,
      startedAt: complaint.assignedAt,
      completedAt: now,
      createdBy: req.user._id,
    });
    await Elevator.findByIdAndUpdate(elevatorId, { lastServiceDate: now });
  } else if (wasCompleted && status !== 'completed') {
    await Maintenance.deleteMany({ relatedComplaint: complaint._id });
  }
  await syncElevatorStatus(elevatorId);

  await complaint.populate(POPULATE);
  res.json({ complaint });
});

export const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await loadComplaint(req);
  removeUploadedFile(complaint.image);
  await Maintenance.deleteMany({ relatedComplaint: complaint._id });
  const elevatorId = complaint.elevator._id;
  await complaint.deleteOne();
  await syncElevatorStatus(elevatorId);
  res.json({ message: 'Complaint deleted' });
});
