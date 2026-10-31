const TONES = {
  purple: 'bg-brand-50 text-brand-600',
  navy: 'bg-navy-100 text-navy-700',
  amber: 'bg-amber-50 text-amber-600',
  green: 'bg-emerald-50 text-emerald-600',
  red: 'bg-red-50 text-red-600',
};

export default function StatCard({ icon: Icon, label, value, hint, tone = 'purple' }) {
  return (
    <div className="card card-pad flex items-start gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-navy-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-navy-900">{value}</p>
        {hint && <p className="mt-0.5 truncate text-xs text-navy-400">{hint}</p>}
      </div>
    </div>
  );
}
