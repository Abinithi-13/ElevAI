import { Link } from 'react-router-dom';
import { ClipboardList, Hourglass, Wrench, CheckCircle2, AlertTriangle, Plus } from 'lucide-react';
import useApi from '../../hooks/useApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { PageLoader, ErrorState } from '../../components/Spinner.jsx';
import { Badge } from '../../components/Badges.jsx';
import { CATEGORY_LABELS } from '../../utils/constants.js';
import { formatDate } from '../../utils/format.js';

export default function UserDashboard() {
  const { data, loading, error, reload } = useApi('/dashboard/user');
  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { stats, recent, attention } = data;

  return (
    <>
      <PageHeader
        title="My dashboard"
        subtitle="Track the faults you have reported."
        actions={<Link to="/user/report" className="btn-primary"><Plus size={16} /> Report a fault</Link>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardList} label="Total reported" value={stats.total} tone="navy" />
        <StatCard icon={Hourglass} label="Waiting for assignment" value={stats.pending} tone="amber" />
        <StatCard icon={Wrench} label="Being repaired" value={stats.inProgress} />
        <StatCard icon={CheckCircle2} label="Resolved" value={stats.completed} tone="green" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-navy-100 px-5 py-4">
            <h3 className="font-bold">Recent complaints</h3>
            <Link to="/user/complaints" className="text-sm font-semibold text-brand-600 hover:underline">View all</Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="No complaints yet" message="If an elevator is misbehaving, report it and we will diagnose it." action={<Link to="/user/report" className="btn-primary">Report a fault</Link>} />
          ) : (
            <ul className="divide-y divide-navy-50">
              {recent.map((c) => (
                <li key={c._id}>
                  <Link to={`/user/complaints/${c._id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-brand-50/40">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy-900">{c.complaintId}</p>
                      <p className="truncate text-sm text-navy-500">{CATEGORY_LABELS[c.category]} - {c.elevator?.elevatorId}, {c.elevator?.building} - {formatDate(c.createdAt)}</p>
                    </div>
                    <Badge value={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="border-b border-navy-100 px-5 py-4">
            <h3 className="font-bold">Elevator availability</h3>
            <p className="text-xs text-navy-400">Units that are not fully operational</p>
          </div>
          {attention.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="All elevators operational" message={`${stats.totalElevators} elevators are running normally.`} />
          ) : (
            <ul className="divide-y divide-navy-50">
              {attention.map((e) => (
                <li key={e._id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy-900">{e.elevatorId}</p>
                    <p className="truncate text-xs text-navy-500">{e.building} - {e.location}</p>
                  </div>
                  <Badge value={e.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
