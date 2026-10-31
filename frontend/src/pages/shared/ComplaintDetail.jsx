import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, Trash2, UserPlus, Wrench, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import api, { fileUrl, getErrorMessage } from '../../api/client.js';
import useApi from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Modal from '../../components/Modal.jsx';
import Field from '../../components/FormField.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import AssignModal from '../../components/AssignModal.jsx';
import DiagnosisPanel from '../../components/DiagnosisPanel.jsx';
import { Badge } from '../../components/Badges.jsx';
import { PageLoader, ErrorState, Spinner } from '../../components/Spinner.jsx';
import { CATEGORY_LABELS, CATEGORY_OPTIONS, COMPLAINT_STATUSES } from '../../utils/constants.js';
import { formatDateTime, titleCase } from '../../utils/format.js';

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi(`/complaints/${id}`);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagError, setDiagError] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ status: 'in_progress', note: '', repairNotes: '', component: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [local, setLocal] = useState(null);

  useEffect(() => {
    setLocal(null);
    setDiagError('');
  }, [id]);

  const base = `/${user.role}`;
  if (loading) return <PageLoader label="Loading complaint..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const c = local || data.complaint;
  const isAdmin = user.role === 'admin';
  const isOpen = ['pending', 'assigned', 'in_progress'].includes(c.status);
  const canUpdate = isAdmin || (user.role === 'technician' && isOpen);
  const statusOptions = isAdmin ? COMPLAINT_STATUSES : ['in_progress', 'completed'];

  const runDiagnosis = async () => {
    setDiagnosing(true);
    setDiagError('');
    try {
      const res = await api.post(`/complaints/${c._id}/diagnose`);
      setLocal(res.data.complaint);
      toast.success('AI diagnosis generated');
    } catch (err) {
      setDiagError(getErrorMessage(err));
    } finally {
      setDiagnosing(false);
    }
  };

  const openStatus = (status) => {
    setFormError('');
    setForm({ status: status || (c.status === 'pending' ? 'in_progress' : c.status), note: '', repairNotes: c.repairNotes || '', component: c.component || c.aiDiagnosis?.affectedComponent || c.category });
    setStatusOpen(true);
  };

  const saveStatus = async () => {
    setSaving(true);
    setFormError('');
    try {
      const payload = { status: form.status, note: form.note || undefined };
      if (form.status === 'completed') {
        payload.repairNotes = form.repairNotes;
        payload.component = form.component;
      }
      const res = await api.patch(`/complaints/${c._id}/status`, payload);
      setLocal(res.data.complaint);
      setStatusOpen(false);
      toast.success(`Status updated to ${titleCase(form.status)}`);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/complaints/${c._id}`);
      toast.success('Complaint deleted');
      navigate(`${base}/complaints`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <>
      <Link to={`${base}/complaints`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-brand-600"><ArrowLeft size={16} /> Back to complaints</Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{c.complaintId}</h1>
            <Badge value={c.status} /><Badge value={c.severity} label={`${titleCase(c.severity)} severity`} />
          </div>
          <p className="mt-1 text-sm text-navy-500">Reported {formatDateTime(c.createdAt)} by {c.reportedBy?.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.role === 'technician' && c.status === 'assigned' && <button className="btn-primary" onClick={() => openStatus('in_progress')}><Wrench size={16} /> Start work</button>}
          {user.role === 'technician' && c.status === 'in_progress' && <button className="btn-primary" onClick={() => openStatus('completed')}><CheckCircle2 size={16} /> Mark completed</button>}
          {isAdmin && isOpen && <button className="btn-secondary" onClick={() => setAssignOpen(true)}><UserPlus size={16} /> {c.assignedTo ? 'Reassign' : 'Assign technician'}</button>}
          {canUpdate && <button className="btn-secondary" onClick={() => openStatus()}>Update status</button>}
          {isAdmin && <button className="btn-secondary text-red-600" onClick={() => setDeleteOpen(true)}><Trash2 size={16} /> Delete</button>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card card-pad">
            <h2 className="mb-4 text-base font-bold">Fault details</h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-navy-400">Elevator</dt><dd className="font-semibold">{c.elevator?.elevatorId} - {c.elevator?.model}</dd></div>
              <div><dt className="text-navy-400">Building and location</dt><dd className="font-semibold">{c.elevator?.building}, {c.elevator?.location}</dd></div>
              <div><dt className="text-navy-400">Fault category</dt><dd className="font-semibold">{CATEGORY_LABELS[c.category]}</dd></div>
              <div><dt className="text-navy-400">Reporter contact</dt><dd className="font-semibold">{c.reportedBy?.email}{c.reportedBy?.phone ? ` - ${c.reportedBy.phone}` : ''}</dd></div>
            </dl>
            <div className="mt-4">
              <p className="text-sm text-navy-400">Description</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-navy-800">{c.description}</p>
            </div>
            {c.image && (
              <div className="mt-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-sm text-navy-400"><ImageIcon size={14} /> Attached photo</p>
                <a href={fileUrl(c.image)} target="_blank" rel="noreferrer"><img src={fileUrl(c.image)} alt="Reported fault" className="max-h-72 rounded-lg border border-navy-100 object-cover" /></a>
              </div>
            )}
          </section>

          <section className="card card-pad">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold">AI diagnosis</h2>
              <button className="btn-primary btn-sm" onClick={runDiagnosis} disabled={diagnosing}>
                {diagnosing ? <Spinner size={14} /> : <Sparkles size={14} />} {c.aiDiagnosis ? 'Run again' : 'Run AI diagnosis'}
              </button>
            </div>
            {diagnosing && <div className="flex items-center gap-3 rounded-lg bg-brand-50 p-4 text-sm text-brand-700" role="status"><Spinner /> Gemini is analyzing this fault. This can take up to a minute.</div>}
            {diagError && !diagnosing && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{diagError}</div>}
            {!diagnosing && c.aiDiagnosis && <DiagnosisPanel diagnosis={c.aiDiagnosis} />}
            {!diagnosing && !c.aiDiagnosis && !diagError && <p className="text-sm text-navy-500">No diagnosis yet. Run the AI diagnosis to get the probable fault, causes, severity and recommended actions.</p>}
          </section>

          {c.status === 'completed' && (
            <section className="card card-pad">
              <h2 className="mb-3 text-base font-bold">Repair summary</h2>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div><dt className="text-navy-400">Component repaired</dt><dd className="font-semibold">{CATEGORY_LABELS[c.component] || '-'}</dd></div>
                <div><dt className="text-navy-400">Resolved</dt><dd className="font-semibold">{formatDateTime(c.resolvedAt)}</dd></div>
              </dl>
              <p className="mt-3 whitespace-pre-wrap text-sm text-navy-800">{c.repairNotes}</p>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="card card-pad">
            <h2 className="mb-3 text-base font-bold">Assigned technician</h2>
            {c.assignedTo ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">{c.assignedTo.name.charAt(0)}</div>
                <div className="min-w-0 text-sm"><p className="font-semibold text-navy-900">{c.assignedTo.name}</p><p className="truncate text-navy-500">{c.assignedTo.specialization || c.assignedTo.email}</p></div>
              </div>
            ) : <p className="text-sm text-navy-500">Not assigned yet.</p>}
          </section>

          <section className="card card-pad">
            <h2 className="mb-4 text-base font-bold">Status timeline</h2>
            <ol className="relative space-y-5 border-l-2 border-navy-100 pl-5">
              {[...c.statusHistory].reverse().map((h, i) => (
                <li key={`${h.at}-${i}`} className="relative">
                  <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white ${i === 0 ? 'bg-brand-600' : 'bg-navy-300'}`} />
                  <Badge value={h.status} />
                  {h.note && <p className="mt-1 text-sm text-navy-700">{h.note}</p>}
                  <p className="mt-0.5 text-xs text-navy-400">{formatDateTime(h.at)}{h.by ? ` by ${h.by.name}` : ''}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      <AssignModal open={assignOpen} complaint={c} onClose={() => setAssignOpen(false)} onDone={(updated) => setLocal(updated)} />

      <Modal
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        title="Update repair status"
        footer={<><button className="btn-secondary" onClick={() => setStatusOpen(false)} disabled={saving}>Cancel</button><button className="btn-primary" onClick={saveStatus} disabled={saving || (form.status === 'completed' && form.repairNotes.trim().length < 5)}>{saving && <Spinner size={16} />} Save status</button></>}
      >
        <div className="space-y-4">
          {formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}
          <Field label="Status">
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statusOptions.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</select>
          </Field>
          {form.status === 'completed' && (
            <>
              <Field label="Component repaired" hint="Used for component history and predictive maintenance.">
                <select className="input" value={form.component} onChange={(e) => setForm({ ...form, component: e.target.value })}>{CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
              </Field>
              <Field label="Repair notes" hint="Describe what was found and what was done (min 5 characters).">
                <textarea className="input" rows={4} value={form.repairNotes} onChange={(e) => setForm({ ...form, repairNotes: e.target.value })} maxLength={2000} />
              </Field>
            </>
          )}
          <Field label="Note (optional)"><textarea className="input" rows={2} maxLength={1000} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
        </div>
      </Modal>

      <ConfirmDialog open={deleteOpen} title="Delete complaint" message={`Delete ${c.complaintId} and its related repair record? This cannot be undone.`} onConfirm={remove} onClose={() => setDeleteOpen(false)} loading={deleting} />
    </>
  );
}
