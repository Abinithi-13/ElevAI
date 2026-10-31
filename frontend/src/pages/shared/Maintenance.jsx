import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, CalendarClock, CheckCircle2, History, Pencil, Play, Plus, Trash2, Wrench } from 'lucide-react';
import api, { getErrorMessage } from '../../api/client.js';
import useApi from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Field from '../../components/FormField.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { Badge } from '../../components/Badges.jsx';
import { PageLoader, ErrorState, Spinner } from '../../components/Spinner.jsx';
import { CATEGORY_LABELS, CATEGORY_OPTIONS, MAINTENANCE_TYPES, SERVICE_ACTIONS } from '../../utils/constants.js';
import { daysFromNow, formatDate, money, titleCase, toInputDate } from '../../utils/format.js';

const TABS = [
  { id: 'schedule', label: 'Schedule', icon: CalendarClock },
  { id: 'reminders', label: 'Reminders', icon: AlertTriangle },
  { id: 'history', label: 'Component history', icon: History },
];
const EMPTY = { elevator: '', type: 'preventive', title: '', scheduledDate: '', technician: '', plannedComponents: [], recurrenceDays: 0, notes: '' };

export default function Maintenance() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'schedule';
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  return (
    <>
      <PageHeader title="Maintenance" subtitle={user.role === 'admin' ? 'Schedule services, record completed work and review component history.' : 'Your assigned services, reminders and component history.'} />
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-navy-100" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setParams({ tab: id })} className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${tab === id ? 'border-brand-600 text-brand-700' : 'border-transparent text-navy-500 hover:text-navy-800'}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>
      {tab === 'schedule' && <ScheduleTab isAdmin={user.role === 'admin'} version={version} onChanged={refresh} />}
      {tab === 'reminders' && <RemindersTab version={version} />}
      {tab === 'history' && <HistoryTab />}
    </>
  );
}

function ScheduleTab({ isAdmin, version, onChanged }) {
  const toast = useToast();
  const [filters, setFilters] = useState({ status: '', type: '' });
  const { data, loading, error, reload } = useApi('/maintenance', filters, [version]);
  const elevators = useApi(isAdmin ? '/elevators' : null);
  const technicians = useApi(isAdmin ? '/technicians' : null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const openForm = (r) => {
    setFormError('');
    setEditing(r || 'new');
    setForm(r ? { ...EMPTY, ...r, elevator: r.elevator?._id, technician: r.technician?._id || '', scheduledDate: toInputDate(r.scheduledDate), notes: r.notes || '' } : EMPTY);
  };
  const toggleComponent = (c) => setForm({ ...form, plannedComponents: form.plannedComponents.includes(c) ? form.plannedComponents.filter((x) => x !== c) : [...form.plannedComponents, c] });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const payload = { elevator: form.elevator, type: form.type, title: form.title, scheduledDate: form.scheduledDate, plannedComponents: form.plannedComponents, recurrenceDays: Number(form.recurrenceDays) || 0, notes: form.notes || undefined };
    if (form.technician) payload.technician = form.technician;
    try {
      if (editing === 'new') await api.post('/maintenance', payload);
      else await api.put(`/maintenance/${editing._id}`, payload);
      toast.success(editing === 'new' ? 'Maintenance scheduled' : 'Maintenance updated');
      setEditing(null);
      onChanged();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const start = async (r) => {
    setBusyId(r._id);
    try {
      await api.patch(`/maintenance/${r._id}/start`);
      toast.success('Job started');
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    setBusyId(toDelete._id);
    try {
      await api.delete(`/maintenance/${toDelete._id}`);
      toast.success('Maintenance record deleted');
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
      setToDelete(null);
    }
  };

  return (
    <>
      <div className="card">
        <div className="flex flex-col gap-3 border-b border-navy-100 p-4 sm:flex-row sm:items-center">
          <select className="input sm:w-48" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} aria-label="Filter by status">
            <option value="">All statuses</option>{['scheduled', 'in_progress', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
          <select className="input sm:w-48" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} aria-label="Filter by type">
            <option value="">All types</option>{MAINTENANCE_TYPES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
          {isAdmin && <button className="btn-primary sm:ml-auto" onClick={() => openForm()}><Plus size={16} /> Schedule maintenance</button>}
        </div>
        {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : data.records.length === 0 ? (
          <EmptyState icon={Wrench} title="No maintenance records" message="Scheduled and completed services will be listed here." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Record</th><th>Elevator</th><th>Type</th><th>Scheduled</th><th>Technician</th><th>Status</th><th>Cost</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {data.records.map((r) => (
                  <tr key={r._id}>
                    <td><span className="font-semibold text-navy-900">{r.title}</span><span className="block text-xs text-navy-400">{r.maintenanceId}</span></td>
                    <td>{r.elevator?.elevatorId}<span className="block text-xs text-navy-400">{r.elevator?.building}</span></td>
                    <td><Badge value={r.type} /></td>
                    <td>{formatDate(r.scheduledDate)}</td>
                    <td>{r.technician?.name || <span className="text-navy-300">Unassigned</span>}</td>
                    <td><div className="flex gap-1"><Badge value={r.status} />{r.isOverdue && <Badge value="overdue" />}</div></td>
                    <td>{r.cost ? money(r.cost) : '-'}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        {r.status === 'scheduled' && <button className="btn-secondary btn-sm" disabled={busyId === r._id} onClick={() => start(r)}><Play size={14} /> Start</button>}
                        {['scheduled', 'in_progress'].includes(r.status) && <button className="btn-primary btn-sm" onClick={() => setCompleting(r)}><CheckCircle2 size={14} /> Complete</button>}
                        {isAdmin && r.status !== 'completed' && <button className="btn-ghost btn-sm" onClick={() => openForm(r)} aria-label="Edit record"><Pencil size={16} /></button>}
                        {isAdmin && <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setToDelete(r)} aria-label="Delete record"><Trash2 size={16} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Schedule maintenance' : 'Edit maintenance'}
        size="lg"
        footer={<><button className="btn-secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</button><button className="btn-primary" form="mnt-form" disabled={saving}>{saving && <Spinner size={16} />} {editing === 'new' ? 'Schedule' : 'Save changes'}</button></>}
      >
        <form id="mnt-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          {formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{formError}</div>}
          <Field label="Elevator"><select className="input" required value={form.elevator} onChange={set('elevator')}><option value="">Select elevator</option>{elevators.data?.elevators.map((e) => <option key={e._id} value={e._id}>{e.elevatorId} - {e.building}</option>)}</select></Field>
          <Field label="Type"><select className="input" value={form.type} onChange={set('type')}>{MAINTENANCE_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}</select></Field>
          <Field label="Title" className="sm:col-span-2"><input className="input" required minLength={3} maxLength={140} value={form.title} onChange={set('title')} placeholder="Quarterly preventive maintenance" /></Field>
          <Field label="Scheduled date"><input className="input" type="date" required value={form.scheduledDate} onChange={set('scheduledDate')} /></Field>
          <Field label="Technician"><select className="input" value={form.technician} onChange={set('technician')}><option value="">Unassigned</option>{technicians.data?.technicians.filter((t) => t.isActive).map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}</select></Field>
          <Field label="Repeat every (days)" hint="Set to 0 for a one-off job. The next job is scheduled when this one is completed."><input className="input" type="number" min={0} max={730} value={form.recurrenceDays} onChange={set('recurrenceDays')} /></Field>
          <div className="sm:col-span-2">
            <span className="label">Components to service</span>
            <div className="grid gap-2 sm:grid-cols-3">
              {CATEGORY_OPTIONS.filter((c) => c.value !== 'other').map((c) => (
                <label key={c.value} className="flex items-center gap-2 text-sm text-navy-700"><input type="checkbox" className="h-4 w-4 rounded border-navy-300 text-brand-600" checked={form.plannedComponents.includes(c.value)} onChange={() => toggleComponent(c.value)} /> {c.label}</label>
              ))}
            </div>
          </div>
          <Field label="Notes (optional)" className="sm:col-span-2"><textarea className="input" rows={2} maxLength={2000} value={form.notes} onChange={set('notes')} /></Field>
        </form>
      </Modal>

      <CompleteModal record={completing} onClose={() => setCompleting(null)} onDone={onChanged} />
      <ConfirmDialog open={Boolean(toDelete)} title="Delete maintenance record" message={`Delete "${toDelete?.title}"? This cannot be undone.`} onConfirm={remove} onClose={() => setToDelete(null)} loading={busyId === toDelete?._id} />
    </>
  );
}

function CompleteModal({ record, onClose, onDone }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [notes, setNotes] = useState('');
  const [cost, setCost] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (record) {
      setRows((record.plannedComponents || []).map((component) => ({ component, action: 'inspected', note: '' })));
      setNotes(record.notes || '');
      setCost('');
      setError('');
    }
  }, [record]);

  const update = (i, k, v) => setRows(rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = { servicedComponents: rows.map((r) => ({ ...r, note: r.note || undefined })), notes: notes || undefined };
      if (cost !== '') payload.cost = Number(cost);
      const res = await api.patch(`/maintenance/${record._id}/complete`, payload);
      toast.success(res.data.nextScheduled ? `Service recorded. Next one scheduled for ${formatDate(res.data.nextScheduled.scheduledDate)}.` : 'Service recorded');
      onDone();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={Boolean(record)} onClose={onClose} title="Record completed service" size="lg" footer={<><button className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button><button className="btn-primary" onClick={submit} disabled={saving}>{saving && <Spinner size={16} />} Save service record</button></>}>
      <div className="space-y-4">
        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <p className="text-sm text-navy-500">{record?.title} - {record?.elevator?.elevatorId}, {record?.elevator?.building}</p>
        <div>
          <div className="mb-2 flex items-center justify-between"><span className="label !mb-0">Components serviced</span><button type="button" className="btn-secondary btn-sm" onClick={() => setRows([...rows, { component: 'door_system', action: 'inspected', note: '' }])}><Plus size={14} /> Add component</button></div>
          {rows.length === 0 && <p className="rounded-lg bg-navy-50 p-3 text-sm text-navy-500">No components added. Add at least one, or describe the work in the notes.</p>}
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="grid gap-2 rounded-lg border border-navy-100 p-3 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
                <select className="input" value={r.component} onChange={(e) => update(i, 'component', e.target.value)} aria-label="Component">{CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
                <select className="input" value={r.action} onChange={(e) => update(i, 'action', e.target.value)} aria-label="Action">{SERVICE_ACTIONS.map((a) => <option key={a} value={a}>{titleCase(a)}</option>)}</select>
                <input className="input" placeholder="Note (optional)" maxLength={500} value={r.note} onChange={(e) => update(i, 'note', e.target.value)} aria-label="Component note" />
                <button type="button" className="btn-ghost btn-sm text-red-600" onClick={() => setRows(rows.filter((_, idx) => idx !== i))} aria-label="Remove component"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
        <Field label="Service notes"><textarea className="input" rows={3} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <Field label="Cost (optional)"><input className="input" type="number" min={0} value={cost} onChange={(e) => setCost(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function RemindersTab({ version }) {
  const { data, loading, error, reload } = useApi('/maintenance/reminders', { days: 14 }, [version]);
  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const List = ({ title, items, tone }) => (
    <section className="card">
      <div className="border-b border-navy-100 px-5 py-4"><h3 className="font-bold">{title} <span className="ml-1 text-sm font-medium text-navy-400">({items.length})</span></h3></div>
      {items.length === 0 ? <EmptyState icon={CheckCircle2} title="All clear" message="Nothing to show here." /> : (
        <ul className="divide-y divide-navy-50">
          {items.map((r) => {
            const d = daysFromNow(r.scheduledDate);
            return (
              <li key={r._id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-navy-900">{r.title}</p>
                  <p className="text-sm text-navy-500">{r.elevator?.elevatorId} - {r.elevator?.building}{r.technician ? ` - ${r.technician.name}` : ''}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium">{formatDate(r.scheduledDate)}</p>
                  <p className={`text-xs font-semibold ${tone}`}>{d < 0 ? `${-d} day(s) overdue` : d === 0 ? 'Due today' : `In ${d} day(s)`}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <List title="Overdue" items={data.overdue} tone="text-red-600" />
      <List title="Due in the next 14 days" items={data.upcoming} tone="text-brand-600" />
    </div>
  );
}

function HistoryTab() {
  const elevators = useApi('/elevators');
  const [elevator, setElevator] = useState('');
  const history = useApi(elevator ? '/maintenance/component-history' : null, { elevator });
  const list = useMemo(() => elevators.data?.elevators || [], [elevators.data]);

  return (
    <>
      <div className="card card-pad mb-6">
        <Field label="Select an elevator to see the history of each component">
          <select className="input max-w-md" value={elevator} onChange={(e) => setElevator(e.target.value)}>
            <option value="">Choose elevator</option>{list.map((e) => <option key={e._id} value={e._id}>{e.elevatorId} - {e.building}, {e.location}</option>)}
          </select>
        </Field>
      </div>
      {!elevator ? <div className="card"><EmptyState icon={History} title="No elevator selected" message="Faults and services are grouped by component so you can see what keeps failing and what was done about it." /></div>
        : history.loading ? <PageLoader /> : history.error ? <ErrorState message={history.error} onRetry={history.reload} />
        : history.data.components.length === 0 ? <div className="card"><EmptyState icon={History} title="No component history" message="No faults or services have been recorded for this elevator yet." /></div>
        : (
          <div className="grid gap-5 lg:grid-cols-2">
            {history.data.components.map((g) => (
              <section key={g.component} className="card">
                <div className="flex items-center justify-between border-b border-navy-100 px-5 py-3">
                  <h3 className="font-bold">{CATEGORY_LABELS[g.component] || g.component}</h3>
                  <div className="flex gap-1.5"><span className="badge bg-red-50 text-red-700">{g.faultCount} fault(s)</span><span className="badge bg-brand-50 text-brand-700">{g.serviceCount} service(s)</span></div>
                </div>
                <ol className="max-h-72 space-y-3 overflow-y-auto px-5 py-4">
                  {g.events.map((ev, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${ev.kind === 'fault' ? 'bg-red-500' : 'bg-brand-600'}`} />
                      <div className="min-w-0">
                        <p className="font-medium text-navy-900">{ev.kind === 'fault' ? 'Fault reported' : `Service: ${titleCase(ev.action)}`} <span className="font-normal text-navy-400">- {ev.reference}</span></p>
                        <p className="text-navy-600">{ev.title}</p>
                        {ev.note && ev.kind === 'service' && <p className="text-xs text-navy-400">{ev.note}</p>}
                        <p className="text-xs text-navy-400">{formatDate(ev.date)}{ev.by ? ` - ${ev.by}` : ''}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
    </>
  );
}
