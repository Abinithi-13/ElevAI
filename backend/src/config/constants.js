export const ROLES = ['admin', 'technician', 'user'];

export const CATEGORIES = [
  'door_system',
  'motor_drive',
  'cables_ropes',
  'control_panel',
  'buttons_indicators',
  'lighting',
  'safety_brake',
  'leveling',
  'ventilation',
  'noise_vibration',
  'other',
];

export const CATEGORY_LABELS = {
  door_system: 'Door system',
  motor_drive: 'Motor and drive',
  cables_ropes: 'Cables and ropes',
  control_panel: 'Control panel',
  buttons_indicators: 'Buttons and indicators',
  lighting: 'Lighting',
  safety_brake: 'Safety and brake',
  leveling: 'Leveling',
  ventilation: 'Ventilation',
  noise_vibration: 'Noise and vibration',
  other: 'Other',
};

export const SEVERITIES = ['low', 'medium', 'high', 'critical'];
export const COMPLAINT_STATUSES = ['pending', 'assigned', 'in_progress', 'completed', 'rejected'];
export const OPEN_COMPLAINT_STATUSES = ['pending', 'assigned', 'in_progress'];
export const ELEVATOR_STATUSES = ['operational', 'under_maintenance', 'out_of_service'];
export const MAINTENANCE_TYPES = ['preventive', 'corrective', 'inspection', 'emergency'];
export const MAINTENANCE_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];
export const SERVICE_ACTIONS = ['inspected', 'lubricated', 'adjusted', 'repaired', 'replaced'];
