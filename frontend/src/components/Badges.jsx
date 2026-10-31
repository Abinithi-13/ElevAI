import { BADGE_STYLES } from '../utils/constants.js';
import { titleCase } from '../utils/format.js';

export const Badge = ({ value, label }) => (
  <span className={`badge ${BADGE_STYLES[value] || 'bg-navy-100 text-navy-600'}`}>{label || titleCase(value)}</span>
);

export const SourceBadge = ({ kind }) =>
  kind === 'ai' ? (
    <span className="badge bg-brand-600 text-white">AI prediction</span>
  ) : (
    <span className="badge bg-navy-800 text-white">Rule-based estimate</span>
  );
