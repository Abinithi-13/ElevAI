import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Plus, Search, UserPlus } from 'lucide-react';
import useApi from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import AssignModal from '../../components/AssignModal.jsx';
import { Badge } from '../../components/Badges.jsx';
import { PageLoader, ErrorState } from '../../components/Spinner.jsx';
import { CATEGORY_OPTIONS, COMPLAINT_STATUSES, SEVERITIES, CATEGORY_LABELS } from '../../utils/constants.js';
import { formatDate, titleCase } from '../../utils/format.js';

const COPY = {
  admin: { title: 'Complaints', subtitle: 'Review reported faults, assign technicians and follow repairs.' },
  technician: { title: 'My repair jobs', subtitle: 'Complaints assigned to you.' },
  user: { title: 'My complaints', subtitle: 'Faults you have reported and their progress.' },
};

export default function Complaints() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ status: '', category: '', severity: '' });
  const [search, setSearch] = useState('');
  const [assigning, setAssigning] = useState(null);
  const { data, loading, error, reload } = useApi('/complaints', filters);
  const base = `/${user.role}`;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.complaints || []).filter(
      (c) => !q || [c.complaintId, c.elevator?.elevatorId, c.elevator?.building, c.reportedBy?.name, c.description].some((v) => v?.toLowerCase().includes(q))
    );
  }, [data, search]);

  const setFilter = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const isAdmin = user.role === 'admin';

  return (
    <>
      <PageHeader
        title={COPY[user.role].title}
        subtitle={COPY[user.role].subtitle}
        actions={user.role === 'user' && <Link to="/user/report" className="btn-primary"><Plus size={16} /> Report a fault</Link>}
      />
      <div className="card">
        <div className="grid gap-3 border-b border-navy-100 p-4 md:grid-cols-4">
          <div className="relative md:col-span-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
            <input className="input pl-9" placeholder="Search complaints" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search complaints" />
          </div>
          <select className="input" value={filters.status} onChange={setFilter('status')} aria-label="Filter by status">
            <option value="">All statuses</option>{COMPLAINT_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
          <select className="input" value={filters.category} onChange={setFilter('category')} aria-label="Filter by category">
            <option value="">All categories</option>{CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select className="input" value={filters.severity} onChange={setFilter('severity')} aria-label="Filter by severity">
            <option value="">All severities</option>{SEVERITIES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
        </div>

        {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : rows.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No complaints found"
            message={user.role === 'user' ? 'You have not reported any matching faults.' : 'Nothing matches the current filters.'}
            action={user.role === 'user' && <Link to="/user/report" className="btn-primary">Report a fault</Link>}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Complaint</th><th>Elevator</th><th>Category</th><th>Severity</th><th>Status</th>{isAdmin && <th>Reported by</th>}{user.role !== 'technician' && <th>Technician</th>}<th>Reported</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c._id}>
                    <td><Link className="font-semibold text-brand-600 hover:underline" to={`${base}/complaints/${c._id}`}>{c.complaintId}</Link></td>
                    <td>{c.elevator?.elevatorId}<span className="block text-xs text-navy-400">{c.elevator?.building}</span></td>
                    <td>{CATEGORY_LABELS[c.category]}</td>
                    <td><Badge value={c.severity} /></td>
                    <td><Badge value={c.status} /></td>
                    {isAdmin && <td>{c.reportedBy?.name}</td>}
                    {user.role !== 'technician' && <td>{c.assignedTo?.name || <span className="text-navy-300">Unassigned</span>}</td>}
                    <td>{formatDate(c.createdAt)}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        {isAdmin && ['pending', 'assigned', 'in_progress'].includes(c.status) && (
                          <button className="btn-secondary btn-sm" onClick={() => setAssigning(c)}><UserPlus size={14} /> {c.assignedTo ? 'Reassign' : 'Assign'}</button>
                        )}
                        <Link to={`${base}/complaints/${c._id}`} className="btn-ghost btn-sm">Open</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <AssignModal open={Boolean(assigning)} complaint={assigning} onClose={() => setAssigning(null)} onDone={reload} />
    </>
  );
}
