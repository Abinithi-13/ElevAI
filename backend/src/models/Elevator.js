import mongoose from 'mongoose';
import { ELEVATOR_STATUSES } from '../config/constants.js';

const elevatorSchema = new mongoose.Schema(
  {
    elevatorId: {
      type: String,
      required: [true, 'Elevator ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9-]{3,20}$/, 'Elevator ID may contain letters, numbers and hyphens (3-20 chars)'],
    },
    building: { type: String, required: [true, 'Building is required'], trim: true, maxlength: 120, index: true },
    location: { type: String, required: [true, 'Location is required'], trim: true, maxlength: 160 },
    floors: { type: Number, required: [true, 'Number of floors is required'], min: 2, max: 200 },
    model: { type: String, required: [true, 'Model is required'], trim: true, maxlength: 120 },
    status: { type: String, enum: ELEVATOR_STATUSES, default: 'operational', index: true },
    installedOn: { type: Date },
    lastServiceDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Elevator', elevatorSchema);
