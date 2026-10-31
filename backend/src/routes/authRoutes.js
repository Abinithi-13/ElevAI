import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { register, login, me } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in 15 minutes.' },
});

const strongPassword = body('password')
  .isLength({ min: 8, max: 72 }).withMessage('Password must be 8-72 characters')
  .matches(/[A-Za-z]/).withMessage('Password must contain a letter')
  .matches(/\d/).withMessage('Password must contain a number');

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
    body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
    strongPassword,
    body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 20 }).withMessage('Phone is too long'),
    body('building').optional({ values: 'falsy' }).trim().isLength({ max: 120 }).withMessage('Building name is too long'),
  ],
  validate,
  register
);
router.post(
  '/login',
  authLimiter,
  [body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(), body('password').notEmpty().withMessage('Password is required')],
  validate,
  login
);
router.get('/me', protect, me);

export default router;
