import Elevator from '../models/Elevator.js';
import Complaint from '../models/Complaint.js';
import Maintenance from '../models/Maintenance.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { faultTrends } from '../services/analyticsService.js';
import { OPEN_COMPLAINT_STATUSES } from '../config/constants.js';

const startOfToday = () => new Date(new Date().setHours(0, 0, 0, 0));
const toMap = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.n]));
const group = (Model, field, match = {}) => Model.aggregate([{ $match: match }, { $group: { _id: `$${field}`, n: { $sum: 1 } } }]);

export const adminDashboard = asyncHandler(async (_req, res) => {
  const today = startOfToday();
  const [totalElevators, elevatorStatus, totalComplaints, pendingRepairs, completedMaintenance, technicians, byCategory, byStatus, bySeverity, recent, trends, overdue, upcoming] =
    await Promise.all([
      Elevator.countDocuments(),
      group(Elevator, 'status'),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: { $in: OPEN_COMPLAINT_STATUSES } }),
      Maintenance.countDocuments({ status: 'completed' }),
      User.countDocuments({ role: 'technician', isActive: true }),
      group(Complaint, 'category', { status: { $ne: 'rejected' } }),
      group(Complaint, 'status'),
      group(Complaint, 'severity', { status: { $ne: 'rejected' } }),
      Complaint.find().populate('elevator', 'elevatorId building').populate('assignedTo', 'name').sort({ createdAt: -1 }).limit(6).lean(),
      faultTrends(6),
      Maintenance.countDocuments({ status: { $in: ['scheduled', 'in_progress'] }, scheduledDate: { $lt: today } }),
      Maintenance.countDocuments({ status: 'scheduled', scheduledDate: { $gte: today, $lt: new Date(today.getTime() + 8 * 86400000) } }),
    ]);

  res.json({
    stats: {
      totalElevators,
      totalComplaints,
      pendingRepairs,
      completedMaintenance,
      technicians,
      elevatorStatus: toMap(elevatorStatus),
      overdueMaintenance: overdue,
      upcomingMaintenance: upcoming,
    },
    charts: {
      faultsByCategory: byCategory.map((r) => ({ category: r._id, count: r.n })).sort((a, b) => b.count - a.count),
      complaintsByStatus: byStatus.map((r) => ({ status: r._id, count: r.n })),
      severity: bySeverity.map((r) => ({ severity: r._id, count: r.n })),
      monthly: trends.months.map((m) => ({ label: m.label, received: m.total, resolved: m.resolved })),
    },
    recentComplaints: recent,
  });
});

export const technicianDashboard = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const today = startOfToday();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [byStatus, completedThisMonth, queue, overdue, upcoming, upcomingList] = await Promise.all([
    group(Complaint, 'status', { assignedTo: me }),
    Complaint.countDocuments({ assignedTo: me, status: 'completed', resolvedAt: { $gte: monthStart } }),
    Complaint.find({ assignedTo: me, status: { $in: ['assigned', 'in_progress'] } }).populate('elevator', 'elevatorId building location').sort({ createdAt: 1 }).limit(8).lean(),
    Maintenance.countDocuments({ technician: me, status: { $in: ['scheduled', 'in_progress'] }, scheduledDate: { $lt: today } }),
    Maintenance.countDocuments({ technician: me, status: 'scheduled', scheduledDate: { $gte: today } }),
    Maintenance.find({ technician: me, status: { $in: ['scheduled', 'in_progress'] } }).populate('elevator', 'elevatorId building').sort({ scheduledDate: 1 }).limit(5).lean(),
  ]);
  const s = toMap(byStatus);
  res.json({
    stats: { assigned: s.assigned || 0, inProgress: s.in_progress || 0, completed: s.completed || 0, completedThisMonth, overdueMaintenance: overdue, upcomingMaintenance: upcoming },
    queue,
    maintenance: upcomingList,
  });
});

export const userDashboard = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const [byStatus, recent, totalElevators, attention] = await Promise.all([
    group(Complaint, 'status', { reportedBy: me }),
    Complaint.find({ reportedBy: me }).populate('elevator', 'elevatorId building location').sort({ createdAt: -1 }).limit(6).lean(),
    Elevator.countDocuments(),
    Elevator.find({ status: { $ne: 'operational' } }).select('elevatorId building location status').limit(8).lean(),
  ]);
  const s = toMap(byStatus);
  res.json({
    stats: {
      total: Object.values(s).reduce((a, b) => a + b, 0),
      pending: s.pending || 0,
      inProgress: (s.assigned || 0) + (s.in_progress || 0),
      completed: s.completed || 0,
      totalElevators,
    },
    recent,
    attention,
  });
});
