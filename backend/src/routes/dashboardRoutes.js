import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { adminDashboard, technicianDashboard, userDashboard } from '../controllers/dashboardController.js';

const router = Router();
router.use(protect);
router.get('/admin', authorize('admin'), adminDashboard);
router.get('/technician', authorize('technician'), technicianDashboard);
router.get('/user', authorize('user'), userDashboard);

export default router;
