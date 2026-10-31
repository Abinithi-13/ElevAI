import { Router } from 'express';
import authRoutes from './authRoutes.js';
import technicianRoutes from './technicianRoutes.js';
import elevatorRoutes from './elevatorRoutes.js';
import complaintRoutes from './complaintRoutes.js';
import maintenanceRoutes from './maintenanceRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import predictiveRoutes from './predictiveRoutes.js';
import aiRoutes from './aiRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';

const router = Router();
router.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
router.use('/auth', authRoutes);
router.use('/technicians', technicianRoutes);
router.use('/elevators', elevatorRoutes);
router.use('/complaints', complaintRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/predictive', predictiveRoutes);
router.use('/ai', aiRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
