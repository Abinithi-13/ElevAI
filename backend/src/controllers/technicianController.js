import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import Maintenance from '../models/Maintenance.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { assertObjectId } from '../utils/helpers.js';

export const listTechnicians = asyncHandler(async (_req, res) => {
  const technicians = await User.find({ role: 'technician' }).sort({ name: 1 }).lean();
  const workload = await Complaint.aggregate([
    { $match: { assignedTo: { $ne: null } } },
    { $group: { _id: { tech: '$assignedTo', status: '$status' }, n: { $sum: 1 } } },
  ]);
  const map = {};
  workload.forEach((w) => {
    const k = String(w._id.tech);
    map[k] = map[k] || { assigned: 0, inProgress: 0, completed: 0 };
    if (w._id.status === 'assigned') map[k].assigned += w.n;
    if (w._id.status === 'in_progress') map[k].inProgress += w.n;
    if (w._id.status === 'completed') map[k].completed += w.n;
  });
  res.json({
    technicians: technicians.map((t) => {
      delete t.password;
      return { ...t, workload: map[String(t._id)] || { assigned: 0, inProgress: 0, completed: 0 } };
    }),
  });
});

export const createTechnician = asyncHandler(async (req, res) => {
  const { name, email, password, phone, specialization } = req.body;
  if (await User.findOne({ email: email.toLowerCase() })) throw new ApiError(409, 'An account with this email already exists');
  const tech = await User.create({ name, email, password, phone, specialization, role: 'technician' });
  res.status(201).json({ technician: tech });
});

export const updateTechnician = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const tech = await User.findOne({ _id: req.params.id, role: 'technician' }).select('+password');
  if (!tech) throw new ApiError(404, 'Technician not found');
  ['name', 'phone', 'specialization', 'isActive'].forEach((f) => {
    if (req.body[f] !== undefined) tech[f] = req.body[f];
  });
  if (req.body.email && req.body.email.toLowerCase() !== tech.email) {
    if (await User.findOne({ email: req.body.email.toLowerCase() })) throw new ApiError(409, 'Email already in use');
    tech.email = req.body.email;
  }
  if (req.body.password) tech.password = req.body.password;
  await tech.save();
  res.json({ technician: tech });
});

export const deleteTechnician = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const tech = await User.findOne({ _id: req.params.id, role: 'technician' });
  if (!tech) throw new ApiError(404, 'Technician not found');
  const open = await Complaint.countDocuments({ assignedTo: tech._id, status: { $in: ['assigned', 'in_progress'] } });
  if (open) throw new ApiError(409, `This technician has ${open} open complaint(s). Reassign them first or deactivate the account.`);
  await tech.deleteOne();
  res.json({ message: 'Technician deleted' });
});

export const technicianHistory = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  if (req.user.role !== 'admin' && String(req.user._id) !== req.params.id) throw new ApiError(403, 'You can only view your own repair history');
  const tech = await User.findOne({ _id: req.params.id, role: 'technician' });
  if (!tech) throw new ApiError(404, 'Technician not found');

  const [repairs, services] = await Promise.all([
    Complaint.find({ assignedTo: tech._id }).populate('elevator', 'elevatorId building location').sort({ updatedAt: -1 }).limit(100).lean(),
    Maintenance.find({ technician: tech._id }).populate('elevator', 'elevatorId building').sort({ scheduledDate: -1 }).limit(100).lean(),
  ]);
  res.json({ technician: tech, repairs, services });
});
