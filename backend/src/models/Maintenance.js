import mongoose from 'mongoose';
import { CATEGORIES, MAINTENANCE_TYPES, MAINTENANCE_STATUSES, SERVICE_ACTIONS } from '../config/constants.js';
import { nextSequence } from './Counter.js';

const { Schema } = mongoose;

const servicedSchema = new Schema(
  {
    component: { type: String, enum: CATEGORIES, required: true },
    action: { type: String, enum: SERVICE_ACTIONS, required: true },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false }
);

const maintenanceSchema = new Schema(
  {
    maintenanceId: { type: String, unique: true, index: true },
    elevator: { type: Schema.Types.ObjectId, ref: 'Elevator', required: true, index: true },
    type: { type: String, enum: MAINTENANCE_TYPES, default: 'preventive' },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 140 },
    scheduledDate: { type: Date, required: [true, 'Scheduled date is required'], index: true },
    technician: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    status: { type: String, enum: MAINTENANCE_STATUSES, default: 'scheduled', index: true },
    plannedComponents: [{ type: String, enum: CATEGORIES }],
    servicedComponents: [servicedSchema],
    notes: { type: String, trim: true, maxlength: 2000 },
    cost: { type: Number, min: 0, default: 0 },
    recurrenceDays: { type: Number, min: 0, max: 730, default: 0 },
    relatedComplaint: { type: Schema.Types.ObjectId, ref: 'Complaint' },
    startedAt: { type: Date },
    completedAt: { type: Date, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

maintenanceSchema.virtual('isOverdue').get(function isOverdue() {
  return ['scheduled', 'in_progress'].includes(this.status) && this.scheduledDate < new Date(new Date().setHours(0, 0, 0, 0));
});

maintenanceSchema.pre('validate', async function generateId(next) {
  if (this.isNew && !this.maintenanceId) {
    const seq = await nextSequence('maintenance');
    this.maintenanceId = `MNT-${String(seq).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('Maintenance', maintenanceSchema);
