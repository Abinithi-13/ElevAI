import { useState } from 'react';
import { History, Pencil, Plus, Trash2, Users } from 'lucide-react';
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
import { CATEGORY_LABELS } from '../../utils/constants.js';
import { formatDate } from '../../utils/format.js';

const EMPTY = { name: '', email: '', phone: '', specialization: '', password: '', isActive: true };

export default function Technicians() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi('/technicians');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [historyId, setHistoryId] = useState(null);
  const history = useApi(historyId ? `/technicians/${historyId}/history` : null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const openForm = (t) => {
    setFormError('');
    setEditing(t || 'new');
    setForm(t ? { ...EMPTY, ...t, password: '' } : EMPTY);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = { name: form.name, email: form.email, phone: form.phone, specialization: form.specialization, isActive: form.isActive };
      if (form.password) payload.password = form.password;
      if (editing === 'new') await api.post('/technicians', payload);
      else await api.put(`/technicians/${editing._id}`, payload);
      toast.success(editing === 'new' ? 'Technician added' : 'Technician updated');
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
      await api.delete(`/technicians/${toDelete._id}`);
      toast.success(`${toDelete.name} removed`);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  return (
    <>
      <PageHeader title="Technicians" subtitle="Manage your field team, workloads and repair history." actions={<button className="btn-primary" onClick={() => openForm()}><Plus size={16} /> Add technician</button>} />

      <div className="card">
        {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : data.technicians.length === 0 ? (
          <EmptyState icon={Users} title="No technicians yet" message="Add a technician so complaints can be assigned." action={<button className="btn-primary" onClick={() => openForm()}>Add technician</button>} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Contact</th><th>Specialization</th><th>Awaiting</th><th>In progress</th><th>Completed</th><th>Account</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {data.technicians.map((t) => (
                  <tr key={t._id}>
                    <td className="font-semibold text-navy-900">{t.name}</td>
                    <td>{t.email}<span className="block text-xs text-navy-400">{t.phone}</span></td>
                    <td>{t.specialization || '-'}</td>
                    <td>{t.workload.assigned}</td>
                    <td>{t.workload.inProgress}</td>
                    <td>{t.workload.completed}</td>
                    <td><span className={`badge ${t.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-navy-100 text-navy-600'}`}>{t.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost btn-sm" onClick={() => setHistoryId(t._id)} aria-label={`Repair history for ${t.name}`}><History size={16} /></button>
                        <button className="btn-ghost btn-sm" onClick={() => openForm(t)} aria-label={`Edit ${t.name}`}><Pencil size={16} /></button>
                        <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setToDelete(t)} aria-label={`Delete ${t.name}`}><Trash2 size={16} /></button>
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
        title={editing === 'new' ? 'Add technician' : 'Edit technician'}
        footer={<><button className="btn-secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</button><button className="btn-primary" form="tech-form" disabled={saving}>{saving && <Spinner size={16} />} {editing === 'new' ? 'Add technician' : 'Save changes'}</button></>}
      >
        <form id="tech-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          {formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{formError}</div>}
          <Field label="Full name"><input className="input" required value={form.name} onChange={set('name')} /></Field>
          <Field label="Email"><input className="input" type="email" required value={form.email} onChange={set('email')} /></Field>
          <Field label="Phone"><input className="input" value={form.phone || ''} onChange={set('phone')} /></Field>
          <Field label="Specialization"><input className="input" value={form.specialization || ''} onChange={set('specialization')} placeholder="Door systems, drives..." /></Field>
          <Field label={editing === 'new' ? 'Temporary password' : 'New password (optional)'} hint="At least 8 characters with a number." className="sm:col-span-2">
            <input className="input" type="password" required={editing === 'new'} value={form.password} onChange={set('password')} autoComplete="new-password" />
          </Field>
          {editing !== 'new' && (
            <label className="flex items-center gap-2 text-sm font-medium text-navy-700 sm:col-span-2">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded border-navy-300 text-brand-600" /> Account is active
            </label>
          )}
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(toDelete)} title="Delete technician" message={`Delete ${toDelete?.name}? Technicians with open complaints cannot be deleted. Deactivate the account instead to keep their history.`} onConfirm={remove} onClose={() => setToDelete(null)} loading={deleting} />

      <Modal open={Boolean(historyId)} onClose={() => setHistoryId(null)} title={history.data ? `Repair history - ${history.data.technician.name}` : 'Repair history'} size="xl">
        {history.loading ? <PageLoader /> : history.error ? <ErrorState message={history.error} /> : history.data && (
          <div className="space-y-6">
            <div>
              <h4 className="mb-2 font-bold">Repair jobs ({history.data.repairs.length})</h4>
              {history.data.repairs.length === 0 ? <p className="text-sm text-navy-400">No repair jobs yet.</p> : (
                <div className="table-wrap rounded-lg border border-navy-100"><table className="table"><thead><tr><th>Complaint</th><th>Elevator</th><th>Category</th><th>Status</th><th>Resolved</th></tr></thead><tbody>
                  {history.data.repairs.map((r) => <tr key={r._id}><td className="font-semibold">{r.complaintId}</td><td>{r.elevator?.elevatorId}</td><td>{CATEGORY_LABELS[r.category]}</td><td><Badge value={r.status} /></td><td>{formatDate(r.resolvedAt)}</td></tr>)}
                </tbody></table></div>
              )}
            </div>
            <div>
              <h4 className="mb-2 font-bold">Maintenance services ({history.data.services.length})</h4>
              {history.data.services.length === 0 ? <p className="text-sm text-navy-400">No maintenance services yet.</p> : (
                <div className="table-wrap rounded-lg border border-navy-100"><table className="table"><thead><tr><th>Service</th><th>Elevator</th><th>Type</th><th>Status</th><th>Date</th></tr></thead><tbody>
                  {history.data.services.map((s) => <tr key={s._id}><td className="font-semibold">{s.title}</td><td>{s.elevator?.elevatorId}</td><td><Badge value={s.type} /></td><td><Badge value={s.status} /></td><td>{formatDate(s.completedAt || s.scheduledDate)}</td></tr>)}
                </tbody></table></div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
