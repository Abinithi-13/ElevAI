import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect, authorize } from '../middleware/auth.js';
import { ruleBased, aiPrediction } from '../controllers/predictiveController.js';

const router = Router();
router.use(protect, authorize('admin', 'technician'));

const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many AI requests. Please wait a few minutes.' } });

router.get('/rule-based', ruleBased);
router.post('/ai', authorize('admin'), aiLimiter, aiPrediction);

export default router;
