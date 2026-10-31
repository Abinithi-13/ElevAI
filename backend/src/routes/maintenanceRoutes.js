import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { CATEGORIES, MAINTENANCE_TYPES, SERVICE_ACTIONS } from '../config/constants.js';
import {
  listMaintenance, createMaintenance, updateMaintenance, startMaintenance, completeMaintenance, deleteMaintenance, getReminders, componentHistory,
} from '../controllers/maintenanceController.js';

const router = Router();
router.use(protect, authorize('admin', 'technician'));

const id = param('id').isMongoId().withMessage('Invalid maintenance id');
const fields = (optional = false) => {
  const wrap = (chain) => (optional ? chain.optional() : chain);
  return [
    wrap(body('elevator').isMongoId()).withMessage('Select an elevator'),
    wrap(body('title').trim().isLength({ min: 3, max: 140 })).withMessage('Title must be 3-140 characters'),
    wrap(body('scheduledDate').isISO8601()).withMessage('Enter a valid scheduled date'),
    body('type').optional().isIn(MAINTENANCE_TYPES).withMessage('Invalid maintenance type'),
    body('technician').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid technician'),
    body('plannedComponents').optional().isArray({ max: 11 }).withMessage('Planned components must be a list'),
    body('plannedComponents.*').optional().isIn(CATEGORIES).withMessage('Invalid component'),
    body('notes').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }).withMessage('Notes are too long'),
    body('recurrenceDays').optional({ values: 'falsy' }).isInt({ min: 0, max: 730 }).withMessage('Recurrence must be 0-730 days').toInt(),
  ];
};

router.get('/reminders', getReminders);
router.get('/component-history', [query('elevator').isMongoId().withMessage('Select an elevator')], validate, componentHistory);
router.get('/', listMaintenance);
router.post('/', authorize('admin'), fields(), validate, createMaintenance);
router.put('/:id', authorize('admin'), [id, ...fields(true)], validate, updateMaintenance);
router.patch('/:id/start', [id], validate, startMaintenance);
router.patch(
  '/:id/complete',
  [
    id,
    body('servicedComponents').optional().isArray({ max: 11 }).withMessage('Serviced components must be a list'),
    body('servicedComponents.*.component').isIn(CATEGORIES).withMessage('Invalid component'),
    body('servicedComponents.*.action').isIn(SERVICE_ACTIONS).withMessage('Invalid service action'),
    body('servicedComponents.*.note').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Component note is too long'),
    body('notes').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }).withMessage('Notes are too long'),
    body('cost').optional({ values: 'falsy' }).isFloat({ min: 0, max: 10000000 }).withMessage('Cost must be a positive number').toFloat(),
  ],
  validate,
  completeMaintenance
);
router.delete('/:id', authorize('admin'), [id], validate, deleteMaintenance);

export default router;
