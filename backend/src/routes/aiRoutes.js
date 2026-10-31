import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { aiStatus, chat } from '../controllers/aiController.js';

const router = Router();
router.use(protect);

const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many AI requests. Please wait a few minutes.' } });

router.get('/status', aiStatus);
router.post(
  '/chat',
  aiLimiter,
  [
    body('messages').isArray({ min: 1, max: 30 }).withMessage('Send at least one message'),
    body('messages.*.role').isIn(['user', 'assistant']).withMessage('Invalid message role'),
    body('messages.*.content').isString().trim().isLength({ min: 1, max: 2000 }).withMessage('Each message must be 1-2000 characters'),
  ],
  validate,
  chat
);

export default router;
