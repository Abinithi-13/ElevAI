import { Link } from 'react-router-dom';
import { Building2, ClipboardList, Hourglass, CheckCircle2, Users, AlertTriangle } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useApi from '../../hooks/useApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import ChartCard, { NoData } from '../../components/ChartCard.jsx';
import { PageLoader, ErrorState } from '../../components/Spinner.jsx';
import { Badge } from '../../components/Badges.jsx';
import { CATEGORY_LABELS, CHART_COLORS, SEVERITY_COLORS } from '../../utils/constants.js';
import { formatDate, titleCase } from '../../utils/format.js';

export default function AdminDashboard() {
  const { data, loading, error, reload } = useApi('/dashboard/admin');
  if (loading) return <PageLoader label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { stats, charts, recentComplaints } = data;
  const faults = charts.faultsByCategory.map((c) => ({ name: CATEGORY_LABELS[c.category] || c.category, count: c.count }));
  const statusData = charts.complaintsByStatus.map((c) => ({ name: titleCase(c.status), value: c.count }));
  const severity = charts.severity.map((s) => ({ name: titleCase(s.severity), value: s.count, key: s.severity }));
  const out = (stats.elevatorStatus.out_of_service || 0) + (stats.elevatorStatus.under_maintenance || 0);

  return (
    <>
      <PageHeader title="Admin dashboard" subtitle="Fleet health, open repairs and maintenance activity at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Building2} label="Total elevators" value={stats.totalElevators} hint={`${stats.elevatorStatus.operational || 0} operational, ${out} unavailable`} />
        <StatCard icon={ClipboardList} label="Total complaints" value={stats.totalComplaints} tone="navy" hint="All time" />
        <StatCard icon={Hourglass} label="Pending repairs" value={stats.pendingRepairs} tone="amber" hint="Pending, assigned or in progress" />
        <StatCard icon={CheckCircle2} label="Completed maintenance" value={stats.completedMaintenance} tone="green" hint="Services and repairs recorded" />
        <StatCard icon={AlertTriangle} label="Overdue maintenance" value={stats.overdueMaintenance} tone={stats.overdueMaintenance ? 'red' : 'green'} hint={`${stats.upcomingMaintenance} due in the next 7 days`} />
        <StatCard icon={Users} label="Active technicians" value={stats.technicians} tone="navy" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <ChartCard title="Complaints received vs resolved" subtitle="Last 6 months" className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={charts.monthly}>
              <defs>
                <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7437e8" stopOpacity={0.3} /><stop offset="95%" stopColor="#7437e8" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e8f4" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="received" name="Received" stroke="#7437e8" strokeWidth={2} fill="url(#gRec)" />
              <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#233159" strokeWidth={2} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Complaint status" subtitle="Current distribution" className="lg:col-span-2">
          {statusData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>

        <ChartCard title="Fault statistics by category" subtitle="All recorded complaints" className="lg:col-span-3">
          {faults.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={faults} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e8f4" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Complaints" fill="#7437e8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>

        <ChartCard title="Severity breakdown" subtitle="Excludes rejected complaints" className="lg:col-span-2">
          {severity.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={severity} dataKey="value" nameKey="name" outerRadius={95} label>
                  {severity.map((s) => <Cell key={s.key} fill={SEVERITY_COLORS[s.key]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>

      <section className="card mt-6">
        <div className="flex items-center justify-between border-b border-navy-100 px-5 py-4">
          <h3 className="font-bold">Recent complaints</h3>
          <Link to="/admin/complaints" className="text-sm font-semibold text-brand-600 hover:underline">View all</Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Complaint</th><th>Elevator</th><th>Category</th><th>Severity</th><th>Status</th><th>Technician</th><th>Reported</th></tr></thead>
            <tbody>
              {recentComplaints.map((c) => (
                <tr key={c._id}>
                  <td><Link className="font-semibold text-brand-600 hover:underline" to={`/admin/complaints/${c._id}`}>{c.complaintId}</Link></td>
                  <td>{c.elevator?.elevatorId}<span className="block text-xs text-navy-400">{c.elevator?.building}</span></td>
                  <td>{CATEGORY_LABELS[c.category]}</td>
                  <td><Badge value={c.severity} /></td>
                  <td><Badge value={c.status} /></td>
                  <td>{c.assignedTo?.name || <span className="text-navy-300">Unassigned</span>}</td>
                  <td>{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
