const dateFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const formatDate = (d) => (d ? dateFmt.format(new Date(d)) : '-');
export const formatDateTime = (d) => (d ? dateTimeFmt.format(new Date(d)) : '-');
export const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
export const titleCase = (s = '') => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
export const money = (n) => `\u20B9${Number(n || 0).toLocaleString('en-IN')}`;
export const hoursLabel = (h) => {
  if (h == null) return '-';
  return h >= 48 ? `${(h / 24).toFixed(1)} days` : `${h} hrs`;
};
export const daysFromNow = (d) => Math.ceil((new Date(d).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
