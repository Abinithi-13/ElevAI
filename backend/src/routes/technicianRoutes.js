import { Router } from 'express';
import { body, param } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { listTechnicians, createTechnician, updateTechnician, deleteTechnician, technicianHistory } from '../controllers/technicianController.js';

const router = Router();
router.use(protect);

const id = param('id').isMongoId().withMessage('Invalid technician id');
const common = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 20 }).withMessage('Phone is too long'),
  body('specialization').optional({ values: 'falsy' }).trim().isLength({ max: 120 }).withMessage('Specialization is too long'),
];

router.get('/', authorize('admin'), listTechnicians);
router.post(
  '/',
  authorize('admin'),
  [
    ...common,
    body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('password').isLength({ min: 8, max: 72 }).withMessage('Password must be 8-72 characters').matches(/\d/).withMessage('Password must contain a number'),
  ],
  validate,
  createTechnician
);
router.put(
  '/:id',
  authorize('admin'),
  [
    id,
    body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
    body('email').optional().trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
    body('password').optional({ values: 'falsy' }).isLength({ min: 8, max: 72 }).withMessage('Password must be 8-72 characters'),
    body('isActive').optional().isBoolean().withMessage('isActive must be true or false').toBoolean(),
  ],
  validate,
  updateTechnician
);
router.delete('/:id', authorize('admin'), [id], validate, deleteTechnician);
router.get('/:id/history', authorize('admin', 'technician'), [id], validate, technicianHistory);

export default router;
