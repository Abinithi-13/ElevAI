import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { faultTrends, maintenanceHistory, technicianPerformance, monthlyReport } from '../services/analyticsService.js';
import { monthKey } from '../utils/helpers.js';

const monthsFrom = (req) => Math.min(Math.max(Number(req.query.months) || 6, 3), 12);

export const getFaultTrends = asyncHandler(async (req, res) => res.json(await faultTrends(monthsFrom(req))));
export const getMaintenanceHistory = asyncHandler(async (req, res) => res.json(await maintenanceHistory(monthsFrom(req))));
export const getTechnicianPerformance = asyncHandler(async (_req, res) => res.json({ technicians: await technicianPerformance() }));

export const getMonthlyReport = asyncHandler(async (req, res) => {
  const key = req.query.month || monthKey(new Date());
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(key)) throw new ApiError(400, 'Month must use the format YYYY-MM');
  const report = await monthlyReport(key);
  const names = Object.fromEntries((await User.find({ role: 'technician' }).select('name').lean()).map((u) => [String(u._id), u.name]));
  report.technicians = report.technicians.map((t) => ({ ...t, name: names[t.technicianId] || 'Unknown' })).sort((a, b) => b.resolved - a.resolved);
  res.json(report);
});
