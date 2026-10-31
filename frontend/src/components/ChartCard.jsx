export default function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <section className={`card card-pad ${className}`}>
      <h3 className="font-bold text-navy-900">{title}</h3>
      {subtitle && <p className="text-xs text-navy-400">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export const NoData = ({ message = 'No data available yet' }) => (
  <div className="flex h-48 items-center justify-center text-sm text-navy-400">{message}</div>
);
