import { Router } from 'express';
import { body, param } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ELEVATOR_STATUSES } from '../config/constants.js';
import { listElevators, getElevator, createElevator, updateElevator, deleteElevator } from '../controllers/elevatorController.js';

const router = Router();
router.use(protect);

const id = param('id').isMongoId().withMessage('Invalid elevator id');
const fields = (optional = false) => {
  const wrap = (chain) => (optional ? chain.optional() : chain);
  return [
    wrap(body('elevatorId').trim().matches(/^[A-Za-z0-9-]{3,20}$/)).withMessage('Elevator ID must be 3-20 letters, numbers or hyphens'),
    wrap(body('building').trim().isLength({ min: 2, max: 120 })).withMessage('Building is required (max 120 characters)'),
    wrap(body('location').trim().isLength({ min: 2, max: 160 })).withMessage('Location is required (max 160 characters)'),
    wrap(body('floors').isInt({ min: 2, max: 200 })).withMessage('Floors must be between 2 and 200').bail().toInt(),
    wrap(body('model').trim().isLength({ min: 2, max: 120 })).withMessage('Model is required (max 120 characters)'),
    body('status').optional().isIn(ELEVATOR_STATUSES).withMessage('Invalid status'),
    body('installedOn').optional({ values: 'falsy' }).isISO8601().withMessage('Installation date is invalid'),
  ];
};

router.get('/', listElevators);
router.get('/:id', [id], validate, getElevator);
router.post('/', authorize('admin'), fields(), validate, createElevator);
router.put('/:id', authorize('admin'), [id, ...fields(true)], validate, updateElevator);
router.delete('/:id', authorize('admin'), [id], validate, deleteElevator);

export default router;
