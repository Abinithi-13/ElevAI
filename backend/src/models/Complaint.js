import mongoose from 'mongoose';
import { CATEGORIES, SEVERITIES, COMPLAINT_STATUSES } from '../config/constants.js';
import { nextSequence } from './Counter.js';

const { Schema } = mongoose;

const diagnosisSchema = new Schema(
  {
    probableFault: { type: String, required: true },
    affectedComponent: { type: String, enum: CATEGORIES },
    possibleCauses: [String],
    severity: { type: String, enum: SEVERITIES, required: true },
    recommendedActions: [String],
    precautions: [String],
    model: String,
    generatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const historySchema = new Schema(
  {
    status: { type: String, enum: COMPLAINT_STATUSES, required: true },
    note: { type: String, trim: true, maxlength: 1000 },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const complaintSchema = new Schema(
  {
    complaintId: { type: String, unique: true, index: true },
    elevator: { type: Schema.Types.ObjectId, ref: 'Elevator', required: true, index: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, enum: CATEGORIES, required: [true, 'Fault category is required'], index: true },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: 2000,
    },
    image: { type: String },
    status: { type: String, enum: COMPLAINT_STATUSES, default: 'pending', index: true },
    severity: { type: String, enum: SEVERITIES, default: 'medium' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    assignedAt: { type: Date },
    component: { type: String, enum: CATEGORIES },
    repairNotes: { type: String, trim: true, maxlength: 2000 },
    resolvedAt: { type: Date },
    aiDiagnosis: { type: diagnosisSchema, default: null },
    statusHistory: [historySchema],
  },
  { timestamps: true }
);

complaintSchema.pre('validate', async function generateId(next) {
  if (this.isNew && !this.complaintId) {
    const year = new Date().getFullYear();
    const seq = await nextSequence(`complaint-${year}`);
    this.complaintId = `CMP-${year}-${String(seq).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('Complaint', complaintSchema);
