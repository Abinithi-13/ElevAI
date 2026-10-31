import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client.js';
import useApi from '../hooks/useApi.js';
import { useToast } from '../context/ToastContext.jsx';
import Modal from './Modal.jsx';
import Field from './FormField.jsx';
import { Spinner } from './Spinner.jsx';
import { SEVERITIES } from '../utils/constants.js';
import { titleCase } from '../utils/format.js';

export default function AssignModal({ open, complaint, onClose, onDone }) {
  const toast = useToast();
  const { data, loading } = useApi(open ? '/technicians' : null);
  const [form, setForm] = useState({ technicianId: '', severity: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && complaint) {
      setForm({ technicianId: complaint.assignedTo?._id || '', severity: complaint.severity || 'medium', note: '' });
      setError('');
    }
  }, [open, complaint]);

  const technicians = (data?.technicians || []).filter((t) => t.isActive);

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.patch(`/complaints/${complaint._id}/assign`, form);
      toast.success(`${complaint.complaintId} assigned successfully`);
      onDone(res.data.complaint);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={complaint?.assignedTo ? 'Reassign technician' : 'Assign technician'}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={saving || !form.technicianId}>{saving && <Spinner size={16} />} Assign</button>
        </>
      }
    >
      {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="space-y-4">
        <p className="text-sm text-navy-500">{complaint?.complaintId} - {complaint?.elevator?.elevatorId}, {complaint?.elevator?.building}</p>
        <Field label="Technician">
          <select className="input" value={form.technicianId} onChange={(e) => setForm({ ...form, technicianId: e.target.value })} disabled={loading}>
            <option value="">{loading ? 'Loading technicians...' : 'Select a technician'}</option>
            {technicians.map((t) => (
              <option key={t._id} value={t._id}>{t.name} - {t.workload.assigned + t.workload.inProgress} open job(s){t.specialization ? ` - ${t.specialization}` : ''}</option>
            ))}
          </select>
        </Field>
        <Field label="Severity" hint="Set after reviewing the report or AI diagnosis.">
          <select className="input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
            {SEVERITIES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
        </Field>
        <Field label="Note for technician (optional)">
          <textarea className="input" rows={3} maxLength={500} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}
