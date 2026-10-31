import { Link } from 'react-router-dom';
import { ClipboardList, Wrench, CheckCircle2, CalendarClock } from 'lucide-react';
import useApi from '../../hooks/useApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { PageLoader, ErrorState } from '../../components/Spinner.jsx';
import { Badge } from '../../components/Badges.jsx';
import { CATEGORY_LABELS } from '../../utils/constants.js';
import { formatDate, daysFromNow } from '../../utils/format.js';

export default function TechnicianDashboard() {
  const { data, loading, error, reload } = useApi('/dashboard/technician');
  if (loading) return <PageLoader label="Loading your workload..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { stats, queue, maintenance } = data;

  return (
    <>
      <PageHeader title="Technician dashboard" subtitle="Your repair queue and upcoming maintenance." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardList} label="Awaiting action" value={stats.assigned} tone="amber" hint="Assigned to you" />
        <StatCard icon={Wrench} label="In progress" value={stats.inProgress} />
        <StatCard icon={CheckCircle2} label="Completed this month" value={stats.completedThisMonth} tone="green" hint={`${stats.completed} completed overall`} />
        <StatCard icon={CalendarClock} label="Maintenance jobs" value={stats.upcomingMaintenance} tone={stats.overdueMaintenance ? 'red' : 'navy'} hint={stats.overdueMaintenance ? `${stats.overdueMaintenance} overdue` : 'None overdue'} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card">
          <div className="flex items-center justify-between border-b border-navy-100 px-5 py-4">
            <h3 className="font-bold">Repair queue</h3>
            <Link to="/technician/complaints" className="text-sm font-semibold text-brand-600 hover:underline">All jobs</Link>
          </div>
          {queue.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Nothing in your queue" message="New assignments from the administrator will show up here." />
          ) : (
            <ul className="divide-y divide-navy-50">
              {queue.map((c) => (
                <li key={c._id}>
                  <Link to={`/technician/complaints/${c._id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-brand-50/40">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy-900">{c.complaintId} <span className="font-normal text-navy-400">- {c.elevator?.elevatorId}</span></p>
                      <p className="truncate text-sm text-navy-500">{CATEGORY_LABELS[c.category]} at {c.elevator?.building}</p>
                    </div>
                    <div className="flex shrink-0 gap-1.5"><Badge value={c.severity} /><Badge value={c.status} /></div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="flex items-center justify-between border-b border-navy-100 px-5 py-4">
            <h3 className="font-bold">Upcoming maintenance</h3>
            <Link to="/technician/maintenance" className="text-sm font-semibold text-brand-600 hover:underline">Open schedule</Link>
          </div>
          {maintenance.length === 0 ? (
            <EmptyState icon={CalendarClock} title="No scheduled maintenance" message="Scheduled services assigned to you will appear here." />
          ) : (
            <ul className="divide-y divide-navy-50">
              {maintenance.map((m) => {
                const d = daysFromNow(m.scheduledDate);
                return (
                  <li key={m._id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy-900">{m.title}</p>
                      <p className="text-sm text-navy-500">{m.elevator?.elevatorId} - {m.elevator?.building}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium text-navy-700">{formatDate(m.scheduledDate)}</p>
                      <p className={`text-xs ${d < 0 ? 'font-semibold text-red-600' : 'text-navy-400'}`}>{d < 0 ? `${-d} day(s) overdue` : d === 0 ? 'Today' : `In ${d} day(s)`}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
