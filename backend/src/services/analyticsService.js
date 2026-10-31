import Complaint from '../models/Complaint.js';
import Maintenance from '../models/Maintenance.js';
import User from '../models/User.js';
import { CATEGORIES } from '../config/constants.js';
import { lastMonthKeys, monthKey, monthLabel, monthRange, startOfMonthsAgo } from '../utils/helpers.js';

const hours = (a, b) => (new Date(a) - new Date(b)) / 3600000;
const avg = (arr) => (arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : null);
const r1 = (n) => (n == null ? null : Number(n.toFixed(1)));

export async function faultTrends(months = 6) {
  const keys = lastMonthKeys(months);
  const complaints = await Complaint.find({ createdAt: { $gte: startOfMonthsAgo(months) }, status: { $ne: 'rejected' } })
    .select('category severity createdAt resolvedAt')
    .lean();

  const rows = keys.map((key) => ({
    month: key,
    label: monthLabel(key),
    total: 0,
    resolved: 0,
    byCategory: Object.fromEntries(CATEGORIES.map((c) => [c, 0])),
    bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
  }));
  const index = Object.fromEntries(rows.map((r) => [r.month, r]));

  complaints.forEach((c) => {
    const row = index[monthKey(c.createdAt)];
    if (!row) return;
    row.total += 1;
    row.byCategory[c.category] += 1;
    row.bySeverity[c.severity] += 1;
    if (c.resolvedAt) row.resolved += 1;
  });

  const totals = Object.fromEntries(CATEGORIES.map((c) => [c, rows.reduce((s, r) => s + r.byCategory[c], 0)]));
  const topCategories = Object.entries(totals)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({ category, count }));

  return { months: rows, topCategories, totalComplaints: complaints.length };
}

export async function maintenanceHistory(months = 6) {
  const keys = lastMonthKeys(months);
  const records = await Maintenance.find({ status: 'completed', completedAt: { $gte: startOfMonthsAgo(months) } })
    .populate('elevator', 'elevatorId building')
    .populate('technician', 'name')
    .sort({ completedAt: -1 })
    .lean();

  const rows = keys.map((key) => ({ month: key, label: monthLabel(key), preventive: 0, corrective: 0, inspection: 0, emergency: 0, total: 0, cost: 0 }));
  const index = Object.fromEntries(rows.map((r) => [r.month, r]));
  records.forEach((m) => {
    const row = index[monthKey(m.completedAt)];
    if (!row) return;
    row[m.type] += 1;
    row.total += 1;
    row.cost += m.cost || 0;
  });

  return { months: rows, recent: records.slice(0, 15), totalCompleted: records.length, totalCost: records.reduce((s, m) => s + (m.cost || 0), 0) };
}

export async function technicianPerformance() {
  const [technicians, complaints, maintenance] = await Promise.all([
    User.find({ role: 'technician' }).select('name email specialization isActive').lean(),
    Complaint.find({ assignedTo: { $ne: null } }).select('assignedTo status assignedAt resolvedAt').lean(),
    Maintenance.find({ technician: { $ne: null } }).select('technician status scheduledDate completedAt').lean(),
  ]);

  return technicians.map((t) => {
    const id = String(t._id);
    const mine = complaints.filter((c) => String(c.assignedTo) === id);
    const done = mine.filter((c) => c.status === 'completed' && c.resolvedAt && c.assignedAt);
    const jobs = maintenance.filter((m) => String(m.technician) === id);
    const jobsDone = jobs.filter((m) => m.status === 'completed' && m.completedAt);
    const onTime = jobsDone.filter((m) => new Date(m.completedAt) <= new Date(new Date(m.scheduledDate).getTime() + 86400000));
    return {
      technicianId: id,
      name: t.name,
      specialization: t.specialization,
      isActive: t.isActive,
      assigned: mine.length,
      completed: mine.filter((c) => c.status === 'completed').length,
      inProgress: mine.filter((c) => c.status === 'in_progress').length,
      completionRate: mine.length ? Math.round((mine.filter((c) => c.status === 'completed').length / mine.length) * 100) : 0,
      avgResolutionHours: r1(avg(done.map((c) => hours(c.resolvedAt, c.assignedAt)))),
      maintenanceJobs: jobs.length,
      maintenanceCompleted: jobsDone.length,
      onTimeRate: jobsDone.length ? Math.round((onTime.length / jobsDone.length) * 100) : null,
    };
  });
}

export async function monthlyReport(key) {
  const { start, end } = monthRange(key);
  const [received, resolved, maintenanceDone, maintenanceScheduled] = await Promise.all([
    Complaint.find({ createdAt: { $gte: start, $lt: end } }).populate('elevator', 'elevatorId building').populate('assignedTo', 'name').lean(),
    Complaint.find({ resolvedAt: { $gte: start, $lt: end } }).select('createdAt resolvedAt assignedAt assignedTo').lean(),
    Maintenance.find({ status: 'completed', completedAt: { $gte: start, $lt: end } }).populate('technician', 'name').lean(),
    Maintenance.find({ scheduledDate: { $gte: start, $lt: end }, status: { $ne: 'cancelled' } }).select('status').lean(),
  ]);

  const count = (arr, fn) => arr.reduce((acc, item) => ({ ...acc, [fn(item)]: (acc[fn(item)] || 0) + 1 }), {});
  const byCategory = count(received, (c) => c.category);
  const bySeverity = count(received, (c) => c.severity);
  const byElevator = count(received.filter((c) => c.elevator), (c) => `${c.elevator.elevatorId}|${c.elevator.building}`);

  return {
    month: key,
    label: monthLabel(key),
    complaints: {
      received: received.length,
      resolved: resolved.length,
      unresolvedFromMonth: received.filter((c) => !['completed', 'rejected'].includes(c.status)).length,
      avgResolutionHours: r1(avg(resolved.map((c) => hours(c.resolvedAt, c.createdAt)))),
      byCategory: Object.entries(byCategory).map(([category, n]) => ({ category, count: n })).sort((a, b) => b.count - a.count),
      bySeverity: Object.entries(bySeverity).map(([severity, n]) => ({ severity, count: n })),
    },
    maintenance: {
      scheduled: maintenanceScheduled.length,
      completed: maintenanceDone.length,
      totalCost: maintenanceDone.reduce((s, m) => s + (m.cost || 0), 0),
      byType: Object.entries(count(maintenanceDone, (m) => m.type)).map(([type, n]) => ({ type, count: n })),
    },
    topElevators: Object.entries(byElevator)
      .map(([k, n]) => ({ elevatorId: k.split('|')[0], building: k.split('|')[1], faults: n }))
      .sort((a, b) => b.faults - a.faults)
      .slice(0, 5),
    technicians: Object.values(
      resolved.reduce((acc, c) => {
        if (!c.assignedTo) return acc;
        const k = String(c.assignedTo);
        acc[k] = acc[k] || { technicianId: k, resolved: 0 };
        acc[k].resolved += 1;
        return acc;
      }, {})
    ),
    generatedAt: new Date(),
  };
}
