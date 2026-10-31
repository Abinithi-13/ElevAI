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
export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
export const SEVERITIES = ['low', 'medium', 'high', 'critical'];
export const COMPLAINT_STATUSES = ['pending', 'assigned', 'in_progress', 'completed', 'rejected'];
export const ELEVATOR_STATUSES = ['operational', 'under_maintenance', 'out_of_service'];
export const MAINTENANCE_TYPES = ['preventive', 'corrective', 'inspection', 'emergency'];
export const SERVICE_ACTIONS = ['inspected', 'lubricated', 'adjusted', 'repaired', 'replaced'];

export const CURRENCY = '\u20B9';
export const CHART_COLORS = ['#7437e8', '#233159', '#a177fb', '#42568a', '#bfa3ff', '#6577a8', '#d9c9ff', '#9aa8cc', '#5024a1', '#2f4170', '#c8d0e6'];
export const SEVERITY_COLORS = { low: '#16a34a', medium: '#d97706', high: '#ea580c', critical: '#dc2626' };

// Tailwind classes for badge tones
export const BADGE_STYLES = {
  // complaint statuses
  pending: 'bg-amber-50 text-amber-700',
  assigned: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-brand-50 text-brand-700',
  completed: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-navy-100 text-navy-600',
  // severities
  low: 'bg-emerald-50 text-emerald-700',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-orange-50 text-orange-700',
  critical: 'bg-red-50 text-red-700',
  // elevator statuses
  operational: 'bg-emerald-50 text-emerald-700',
  under_maintenance: 'bg-amber-50 text-amber-700',
  out_of_service: 'bg-red-50 text-red-700',
  // maintenance
  scheduled: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-navy-100 text-navy-600',
  overdue: 'bg-red-50 text-red-700',
  preventive: 'bg-brand-50 text-brand-700',
  corrective: 'bg-orange-50 text-orange-700',
  inspection: 'bg-blue-50 text-blue-700',
  emergency: 'bg-red-50 text-red-700',
};
