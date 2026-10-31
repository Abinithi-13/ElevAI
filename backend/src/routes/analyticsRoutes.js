import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getFaultTrends, getMaintenanceHistory, getTechnicianPerformance, getMonthlyReport } from '../controllers/analyticsController.js';

const router = Router();
router.use(protect, authorize('admin'));
router.get('/fault-trends', getFaultTrends);
router.get('/maintenance-history', getMaintenanceHistory);
router.get('/technician-performance', getTechnicianPerformance);
router.get('/monthly-report', getMonthlyReport);

export default router;
