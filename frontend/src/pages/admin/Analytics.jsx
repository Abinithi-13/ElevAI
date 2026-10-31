import { useState } from 'react';
import { Printer, Wrench, Banknote } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useApi from '../../hooks/useApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import ChartCard, { NoData } from '../../components/ChartCard.jsx';
import { Badge } from '../../components/Badges.jsx';
import { PageLoader, ErrorState } from '../../components/Spinner.jsx';
import { CATEGORY_LABELS, CHART_COLORS } from '../../utils/constants.js';
import { formatDate, hoursLabel, money, titleCase } from '../../utils/format.js';

const TABS = [['faults', 'Fault trends'], ['maintenance', 'Maintenance history'], ['technicians', 'Technician performance'], ['report', 'Monthly report']];
const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function Analytics() {
  const [tab, setTab] = useState('faults');
  const [months, setMonths] = useState(6);
  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Trends, history, team performance and printable reports."
        actions={(tab === 'faults' || tab === 'maintenance') && <select className="input w-40" value={months} onChange={(e) => setMonths(Number(e.target.value))} aria-label="Period"><option value={6}>Last 6 months</option><option value={12}>Last 12 months</option></select>}
      />
      <div className="no-print mb-5 flex gap-1 overflow-x-auto border-b border-navy-100" role="tablist">
        {TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === id ? 'border-brand-600 text-brand-700' : 'border-transparent text-navy-500 hover:text-navy-800'}`}>{label}</button>)}
      </div>
      {tab === 'faults' && <FaultTrends months={months} />}
      {tab === 'maintenance' && <MaintenanceHistory months={months} />}
      {tab === 'technicians' && <TechnicianPerformance />}
      {tab === 'report' && <MonthlyReport />}
    </>
  );
}

function FaultTrends({ months }) {
  const { data, loading, error, reload } = useApi('/analytics/fault-trends', { months });
  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const rows = data.months.map((m) => ({ label: m.label, total: m.total, resolved: m.resolved, ...m.byCategory }));
  const cats = data.topCategories.map((c) => c.category);
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Complaints per month" subtitle="Received vs resolved">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={rows}><CartesianGrid strokeDasharray="3 3" stroke="#e4e8f4" /><XAxis dataKey="label" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip /><Legend />
              <Bar dataKey="total" name="Received" fill="#7437e8" radius={[4, 4, 0, 0]} /><Line type="monotone" dataKey="resolved" name="Resolved" stroke="#233159" strokeWidth={2} /></ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Faults by category per month" subtitle="Stacked by category">
          {cats.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={rows}><CartesianGrid strokeDasharray="3 3" stroke="#e4e8f4" /><XAxis dataKey="label" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip />
                {cats.map((c, i) => <Bar key={c} dataKey={c} name={CATEGORY_LABELS[c]} stackId="a" fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </ChartCard>
      </div>
      <section className="card card-pad">
        <h3 className="mb-3 font-bold">Most common faults ({data.totalComplaints} complaints)</h3>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{data.topCategories.map((c) => <li key={c.category} className="flex items-center justify-between rounded-lg border border-navy-100 px-3 py-2 text-sm"><span>{CATEGORY_LABELS[c.category]}</span><span className="font-bold text-navy-900">{c.count}</span></li>)}</ul>
      </section>
    </div>
  );
}

function MaintenanceHistory({ months }) {
  const { data, loading, error, reload } = useApi('/analytics/maintenance-history', { months });
  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2"><StatCard icon={Wrench} label="Services completed" value={data.totalCompleted} tone="navy" /><StatCard icon={Banknote} label="Total recorded cost" value={money(data.totalCost)} tone="purple" /></div>
      <ChartCard title="Completed maintenance per month" subtitle="By type, with cost on the right axis">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data.months}><CartesianGrid strokeDasharray="3 3" stroke="#e4e8f4" /><XAxis dataKey="label" tick={{ fontSize: 12 }} /><YAxis yAxisId="l" allowDecimals={false} tick={{ fontSize: 12 }} /><YAxis yAxisId="r" orientation="right" tick={{ fontSize: 12 }} /><Tooltip /><Legend />
            <Bar yAxisId="l" dataKey="preventive" name="Preventive" stackId="a" fill="#7437e8" /><Bar yAxisId="l" dataKey="corrective" name="Corrective" stackId="a" fill="#233159" /><Bar yAxisId="l" dataKey="inspection" name="Inspection" stackId="a" fill="#a177fb" /><Bar yAxisId="l" dataKey="emergency" name="Emergency" stackId="a" fill="#dc2626" />
            <Line yAxisId="r" type="monotone" dataKey="cost" name="Cost" stroke="#16a34a" strokeWidth={2} /></ComposedChart>
        </ResponsiveContainer>
      </ChartCard>
      <section className="card">
        <div className="border-b border-navy-100 px-5 py-4"><h3 className="font-bold">Recently completed</h3></div>
        <div className="table-wrap"><table className="table"><thead><tr><th>Record</th><th>Elevator</th><th>Type</th><th>Technician</th><th>Completed</th><th>Cost</th></tr></thead><tbody>
          {data.recent.map((r) => <tr key={r._id}><td className="font-semibold text-navy-900">{r.title}</td><td>{r.elevator?.elevatorId}</td><td><Badge value={r.type} /></td><td>{r.technician?.name || '-'}</td><td>{formatDate(r.completedAt)}</td><td>{r.cost ? money(r.cost) : '-'}</td></tr>)}
        </tbody></table></div>
      </section>
    </div>
  );
}

function TechnicianPerformance() {
  const { data, loading, error, reload } = useApi('/analytics/technician-performance');
  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const list = data.technicians;
  return (
    <div className="space-y-6">
      <ChartCard title="Repair jobs per technician" subtitle="Assigned vs completed complaints">
        {list.length ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={list}><CartesianGrid strokeDasharray="3 3" stroke="#e4e8f4" /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip /><Legend />
              <Bar dataKey="assigned" name="Assigned" fill="#a177fb" radius={[4, 4, 0, 0]} /><Bar dataKey="completed" name="Completed" fill="#7437e8" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        ) : <NoData />}
      </ChartCard>
      <section className="card">
        <div className="table-wrap"><table className="table"><thead><tr><th>Technician</th><th>Assigned</th><th>Completed</th><th>In progress</th><th>Completion rate</th><th>Avg resolution</th><th>Maintenance jobs</th><th>On-time rate</th></tr></thead><tbody>
          {list.map((t) => <tr key={t.technicianId}><td className="font-semibold text-navy-900">{t.name}<span className="block text-xs font-normal text-navy-400">{t.specialization}</span></td><td>{t.assigned}</td><td>{t.completed}</td><td>{t.inProgress}</td><td>{t.completionRate}%</td><td>{hoursLabel(t.avgResolutionHours)}</td><td>{t.maintenanceCompleted}/{t.maintenanceJobs}</td><td>{t.onTimeRate == null ? '-' : `${t.onTimeRate}%`}</td></tr>)}
        </tbody></table></div>
      </section>
    </div>
  );
}

function MonthlyReport() {
  const [month, setMonth] = useState(currentMonth());
  const { data, loading, error, reload } = useApi('/analytics/monthly-report', { month });
  return (
    <>
      <div className="no-print mb-5 flex flex-wrap items-end gap-3">
        <div><label className="label" htmlFor="rep-month">Report month</label><input id="rep-month" className="input w-48" type="month" max={currentMonth()} value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} /></div>
        <button className="btn-secondary" onClick={() => window.print()} disabled={!data}><Printer size={16} /> Print or save as PDF</button>
      </div>
      {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <div className="space-y-6">
          <div><h2 className="text-xl font-bold">Monthly report - {data.label}</h2><p className="text-xs text-navy-400">Generated {formatDate(data.generatedAt)} from recorded complaints and maintenance records.</p></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Mini label="Complaints received" value={data.complaints.received} />
            <Mini label="Complaints resolved" value={data.complaints.resolved} />
            <Mini label="Avg resolution time" value={hoursLabel(data.complaints.avgResolutionHours)} />
            <Mini label="Maintenance completed" value={`${data.maintenance.completed} of ${data.maintenance.scheduled} scheduled`} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <ListCard title="Faults by category" rows={data.complaints.byCategory.map((c) => [CATEGORY_LABELS[c.category], c.count])} />
            <ListCard title="Faults by severity" rows={data.complaints.bySeverity.map((s) => [titleCase(s.severity), s.count])} />
            <ListCard title="Most affected elevators" rows={data.topElevators.map((e) => [`${e.elevatorId} (${e.building})`, e.faults])} />
            <ListCard title="Complaints resolved by technician" rows={data.technicians.map((t) => [t.name, t.resolved])} />
          </div>
          <p className="text-sm text-navy-500">Maintenance cost recorded this month: <strong className="text-navy-900">{money(data.maintenance.totalCost)}</strong>. Complaints from this month still open: <strong className="text-navy-900">{data.complaints.unresolvedFromMonth}</strong>.</p>
        </div>
      )}
    </>
  );
}

const Mini = ({ label, value }) => <div className="card card-pad"><p className="text-sm text-navy-500">{label}</p><p className="mt-1 text-2xl font-bold text-navy-900">{value}</p></div>;
const ListCard = ({ title, rows }) => (
  <section className="card card-pad"><h3 className="mb-3 font-bold">{title}</h3>
    {rows.length === 0 ? <p className="text-sm text-navy-400">No data for this month.</p> : <ul className="divide-y divide-navy-50 text-sm">{rows.map(([k, v]) => <li key={k} className="flex items-center justify-between py-2"><span>{k}</span><span className="font-bold text-navy-900">{v}</span></li>)}</ul>}
  </section>
);
