import { Router } from 'express';
import { body, param } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadImage } from '../middleware/upload.js';
import { CATEGORIES, SEVERITIES, COMPLAINT_STATUSES } from '../config/constants.js';
import {
  listComplaints, getComplaint, createComplaint, diagnoseComplaint, assignComplaint, updateComplaintStatus, deleteComplaint,
} from '../controllers/complaintController.js';

const router = Router();
router.use(protect);

const id = param('id').isMongoId().withMessage('Invalid complaint id');

router.get('/', listComplaints);
router.post(
  '/',
  authorize('user', 'admin'),
  uploadImage,
  [
    body('elevator').isMongoId().withMessage('Select an elevator'),
    body('category').isIn(CATEGORIES).withMessage('Select a valid fault category'),
    body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  ],
  validate,
  createComplaint
);
router.get('/:id', [id], validate, getComplaint);
router.post('/:id/diagnose', [id], validate, diagnoseComplaint);
router.patch(
  '/:id/assign',
  authorize('admin'),
  [id, body('technicianId').isMongoId().withMessage('Select a technician'), body('severity').optional({ values: 'falsy' }).isIn(SEVERITIES).withMessage('Invalid severity'), body('note').optional().trim().isLength({ max: 500 })],
  validate,
  assignComplaint
);
router.patch(
  '/:id/status',
  authorize('admin', 'technician'),
  [
    id,
    body('status').isIn(COMPLAINT_STATUSES).withMessage('Invalid status'),
    body('note').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }).withMessage('Note is too long'),
    body('repairNotes').optional({ values: 'falsy' }).trim().isLength({ min: 5, max: 2000 }).withMessage('Repair notes must be 5-2000 characters'),
    body('component').optional({ values: 'falsy' }).isIn(CATEGORIES).withMessage('Invalid component'),
    body('severity').optional({ values: 'falsy' }).isIn(SEVERITIES).withMessage('Invalid severity'),
  ],
  validate,
  updateComplaintStatus
);
router.delete('/:id', authorize('admin'), [id], validate, deleteComplaint);

export default router;
