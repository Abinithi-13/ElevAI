import { useMemo, useState } from 'react';
import { Building2, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '../../api/client.js';
import useApi from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Field from '../../components/FormField.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { Badge } from '../../components/Badges.jsx';
import { PageLoader, ErrorState, Spinner } from '../../components/Spinner.jsx';
import { ELEVATOR_STATUSES, CATEGORY_LABELS } from '../../utils/constants.js';
import { formatDate, titleCase, toInputDate } from '../../utils/format.js';

const EMPTY = { elevatorId: '', building: '', location: '', floors: '', model: '', status: 'operational', installedOn: '' };

export default function Elevators() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi('/elevators');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | elevator
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewId, setViewId] = useState(null);
  const detail = useApi(viewId ? `/elevators/${viewId}` : null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.elevators || []).filter(
      (e) => (!status || e.status === status) && (!q || [e.elevatorId, e.building, e.location, e.model].some((v) => v.toLowerCase().includes(q)))
    );
  }, [data, search, status]);

  const openForm = (elevator) => {
    setFormError('');
    setEditing(elevator || 'new');
    setForm(elevator ? { ...EMPTY, ...elevator, installedOn: toInputDate(elevator.installedOn) } : EMPTY);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const payload = { elevatorId: form.elevatorId, building: form.building, location: form.location, floors: Number(form.floors), model: form.model, status: form.status, installedOn: form.installedOn || undefined };
    try {
      if (editing === 'new') await api.post('/elevators', payload);
      else await api.put(`/elevators/${editing._id}`, payload);
      toast.success(editing === 'new' ? 'Elevator added' : 'Elevator updated');
      setEditing(null);
      reload();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/elevators/${toDelete._id}`);
      toast.success(`${toDelete.elevatorId} deleted`);
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHeader title="Elevators" subtitle="Register and manage every elevator in your portfolio." actions={<button className="btn-primary" onClick={() => openForm()}><Plus size={16} /> Add elevator</button>} />

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-navy-100 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
            <input className="input pl-9" placeholder="Search by ID, building, location or model" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search elevators" />
          </div>
          <select className="input sm:w-52" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {ELEVATOR_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
        </div>

        {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : rows.length === 0 ? (
          <EmptyState icon={Building2} title="No elevators found" message="Add your first elevator or adjust the filters." action={<button className="btn-primary" onClick={() => openForm()}>Add elevator</button>} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Elevator ID</th><th>Building</th><th>Location</th><th>Floors</th><th>Model</th><th>Status</th><th>Open complaints</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e._id}>
                    <td className="font-semibold text-navy-900">{e.elevatorId}</td>
                    <td>{e.building}</td>
                    <td>{e.location}</td>
                    <td>{e.floors}</td>
                    <td>{e.model}</td>
                    <td><Badge value={e.status} /></td>
                    <td>{e.openComplaints || <span className="text-navy-300">0</span>}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost btn-sm" onClick={() => setViewId(e._id)} aria-label={`View ${e.elevatorId}`}><Eye size={16} /></button>
                        <button className="btn-ghost btn-sm" onClick={() => openForm(e)} aria-label={`Edit ${e.elevatorId}`}><Pencil size={16} /></button>
                        <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setToDelete(e)} aria-label={`Delete ${e.elevatorId}`}><Trash2 size={16} /></button>
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
        title={editing === 'new' ? 'Add elevator' : 'Edit elevator'}
        footer={<><button className="btn-secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</button><button className="btn-primary" form="elevator-form" disabled={saving}>{saving && <Spinner size={16} />} {editing === 'new' ? 'Add elevator' : 'Save changes'}</button></>}
      >
        <form id="elevator-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          {formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{formError}</div>}
          <Field label="Elevator ID" hint="For example ELV-1009"><input className="input" required value={form.elevatorId} onChange={set('elevatorId')} disabled={editing !== 'new'} /></Field>
          <Field label="Status"><select className="input" value={form.status} onChange={set('status')}>{ELEVATOR_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</select></Field>
          <Field label="Building"><input className="input" required value={form.building} onChange={set('building')} /></Field>
          <Field label="Location in building"><input className="input" required value={form.location} onChange={set('location')} placeholder="Tower A - Lobby Lift 1" /></Field>
          <Field label="Number of floors"><input className="input" type="number" min={2} max={200} required value={form.floors} onChange={set('floors')} /></Field>
          <Field label="Model"><input className="input" required value={form.model} onChange={set('model')} /></Field>
          <Field label="Installed on (optional)" className="sm:col-span-2"><input className="input" type="date" value={form.installedOn} onChange={set('installedOn')} /></Field>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(toDelete)} title="Delete elevator" message={`Delete ${toDelete?.elevatorId}? This cannot be undone. Elevators with complaint or maintenance history cannot be deleted.`} onConfirm={remove} onClose={() => setToDelete(null)} loading={deleting} />

      <Modal open={Boolean(viewId)} onClose={() => setViewId(null)} title="Elevator details" size="lg">
        {detail.loading ? <PageLoader /> : detail.error ? <ErrorState message={detail.error} /> : detail.data && (
          <div className="space-y-5">
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              {[['Elevator ID', detail.data.elevator.elevatorId], ['Building', detail.data.elevator.building], ['Location', detail.data.elevator.location], ['Floors', detail.data.elevator.floors], ['Model', detail.data.elevator.model], ['Installed', formatDate(detail.data.elevator.installedOn)], ['Last service', formatDate(detail.data.elevator.lastServiceDate)]].map(([k, v]) => (
                <div key={k}><dt className="text-navy-400">{k}</dt><dd className="font-semibold text-navy-900">{v}</dd></div>
              ))}
              <div><dt className="text-navy-400">Status</dt><dd><Badge value={detail.data.elevator.status} /></dd></div>
            </dl>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-bold">Recent complaints</h4>
                {detail.data.complaints.length === 0 ? <p className="text-sm text-navy-400">None recorded.</p> : (
                  <ul className="space-y-2 text-sm">{detail.data.complaints.map((c) => <li key={c._id} className="flex items-center justify-between rounded-lg border border-navy-100 px-3 py-2"><span>{c.complaintId} - {CATEGORY_LABELS[c.category]}</span><Badge value={c.status} /></li>)}</ul>
                )}
              </div>
              <div>
                <h4 className="mb-2 font-bold">Maintenance records</h4>
                {detail.data.maintenance.length === 0 ? <p className="text-sm text-navy-400">None recorded.</p> : (
                  <ul className="space-y-2 text-sm">{detail.data.maintenance.map((m) => <li key={m._id} className="flex items-center justify-between gap-2 rounded-lg border border-navy-100 px-3 py-2"><span className="truncate">{m.title}<span className="block text-xs text-navy-400">{formatDate(m.completedAt || m.scheduledDate)}</span></span><Badge value={m.status} /></li>)}</ul>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
