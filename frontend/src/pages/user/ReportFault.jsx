import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ImagePlus, RefreshCw, Sparkles, X } from 'lucide-react';
import api, { getErrorMessage } from '../../api/client.js';
import useApi from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Field from '../../components/FormField.jsx';
import DiagnosisPanel from '../../components/DiagnosisPanel.jsx';
import { Spinner, PageLoader, ErrorState } from '../../components/Spinner.jsx';
import { CATEGORY_OPTIONS } from '../../utils/constants.js';

const MAX_MB = 5;

export default function ReportFault() {
  const toast = useToast();
  const elevators = useApi('/elevators');
  const fileInput = useRef(null);
  const [form, setForm] = useState({ elevator: '', category: '', description: '' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [complaint, setComplaint] = useState(null);
  const [diag, setDiag] = useState({ status: 'idle', error: '' });

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const pickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setError('Only JPG, PNG or WebP images are allowed');
    if (file.size > MAX_MB * 1024 * 1024) return setError(`Image must be ${MAX_MB} MB or smaller`);
    setError('');
    setImage(file);
    return setPreview(URL.createObjectURL(file));
  };
  const clearImage = () => {
    setImage(null);
    setPreview(null);
    if (fileInput.current) fileInput.current.value = '';
  };

  const diagnose = async (id) => {
    setDiag({ status: 'loading', error: '' });
    try {
      const res = await api.post(`/complaints/${id}/diagnose`);
      setComplaint(res.data.complaint);
      setDiag({ status: 'done', error: '' });
    } catch (err) {
      setDiag({ status: 'error', error: getErrorMessage(err) });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const body = new FormData();
      body.append('elevator', form.elevator);
      body.append('category', form.category);
      body.append('description', form.description);
      if (image) body.append('image', image);
      const res = await api.post('/complaints', body);
      setComplaint(res.data.complaint);
      toast.success(`Complaint ${res.data.complaint.complaintId} submitted`);
      diagnose(res.data.complaint._id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setComplaint(null);
    setDiag({ status: 'idle', error: '' });
    setForm({ elevator: '', category: '', description: '' });
    clearImage();
  };

  if (elevators.loading) return <PageLoader />;
  if (elevators.error) return <ErrorState message={elevators.error} onRetry={elevators.reload} />;

  if (complaint) {
    return (
      <>
        <PageHeader title="Fault reported" subtitle="Your complaint has been logged and the maintenance team has been notified." />
        <div className="mx-auto max-w-3xl space-y-6">
          <section className="card card-pad flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={26} /></div>
            <div className="flex-1">
              <p className="text-sm text-navy-500">Complaint ID</p>
              <p className="text-2xl font-extrabold text-navy-900">{complaint.complaintId}</p>
              <p className="text-sm text-navy-500">{complaint.elevator?.elevatorId} - {complaint.elevator?.building}</p>
            </div>
            <div className="flex gap-2">
              <Link to={`/user/complaints/${complaint._id}`} className="btn-primary">Track status</Link>
              <button className="btn-secondary" onClick={reset}>Report another</button>
            </div>
          </section>

          <section className="card card-pad">
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold"><Sparkles size={18} className="text-brand-600" /> AI fault analysis</h2>
            {diag.status === 'loading' && <div className="flex items-center gap-3 rounded-lg bg-brand-50 p-4 text-sm text-brand-700" role="status"><Spinner /> Analyzing your description with Gemini. This can take up to a minute.</div>}
            {diag.status === 'error' && (
              <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">AI analysis is unavailable right now</p>
                <p className="mt-1">{diag.error} Your complaint was still submitted and will be reviewed by the team.</p>
                <button className="btn-secondary btn-sm mt-3" onClick={() => diagnose(complaint._id)}><RefreshCw size={14} /> Retry analysis</button>
              </div>
            )}
            {diag.status === 'done' && <DiagnosisPanel diagnosis={complaint.aiDiagnosis} />}
          </section>
        </div>
      </>
    );
  }

  const list = elevators.data.elevators;
  return (
    <>
      <PageHeader title="Report a fault" subtitle="Describe what you noticed. We will log it, diagnose it with AI and assign a technician." />
      <form onSubmit={submit} className="card card-pad mx-auto max-w-3xl space-y-5" noValidate>
        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Elevator">
            <select className="input" required value={form.elevator} onChange={(e) => setForm({ ...form, elevator: e.target.value })}>
              <option value="">Select the elevator</option>
              {list.map((el) => <option key={el._id} value={el._id}>{el.elevatorId} - {el.building}, {el.location}</option>)}
            </select>
          </Field>
          <Field label="Fault category">
            <select className="input" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select a category</option>
              {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="What is happening?" hint={`${form.description.length}/2000 - mention floors, sounds, smells or when it started.`}>
          <textarea className="input" rows={5} required minLength={10} maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Example: The doors reopen several times on the 9th floor and the lift then moves very slowly." />
        </Field>
        <div>
          <span className="label">Photo (optional)</span>
          {preview ? (
            <div className="relative inline-block">
              <img src={preview} alt="Selected fault" className="h-40 rounded-lg border border-navy-100 object-cover" />
              <button type="button" onClick={clearImage} className="absolute -right-2 -top-2 rounded-full bg-navy-800 p-1 text-white" aria-label="Remove photo"><X size={14} /></button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInput.current?.click()} className="flex w-full flex-col items-center gap-1 rounded-lg border-2 border-dashed border-navy-200 px-4 py-6 text-sm text-navy-500 hover:border-brand-400 hover:bg-brand-50/40">
              <ImagePlus size={22} className="text-brand-600" /> Add a JPG, PNG or WebP photo (max {MAX_MB} MB)
            </button>
          )}
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pickImage} />
        </div>
        <button className="btn-primary w-full py-2.5 sm:w-auto" disabled={submitting || !form.elevator || !form.category || form.description.trim().length < 10}>
          {submitting && <Spinner size={16} />} Submit complaint
        </button>
      </form>
    </>
  );
}
