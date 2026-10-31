import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../api/client.js';
import { Spinner } from '../components/Spinner.jsx';
import Field from '../components/FormField.jsx';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', building: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 8 || !/\d/.test(form.password) || !/[A-Za-z]/.test(form.password)) {
      return setError('Password must be at least 8 characters and include a letter and a number');
    }
    setLoading(true);
    try {
      const { confirm, ...payload } = form;
      const user = await register(payload);
      toast.success('Account created. Welcome to ElevAI.');
      return navigate(`/${user.role}/dashboard`, { replace: true });
    } catch (err) {
      return setError(getErrorMessage(err, 'Could not create the account.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-navy-500">Building users can report faults and track repairs. Technician accounts are created by an administrator.</p>
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <Field label="Full name"><input className="input" required value={form.name} onChange={set('name')} autoComplete="name" /></Field>
          <Field label="Email"><input className="input" type="email" required value={form.email} onChange={set('email')} autoComplete="email" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone (optional)"><input className="input" value={form.phone} onChange={set('phone')} autoComplete="tel" /></Field>
            <Field label="Building (optional)"><input className="input" value={form.building} onChange={set('building')} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Password"><input className="input" type="password" required value={form.password} onChange={set('password')} autoComplete="new-password" /></Field>
            <Field label="Confirm password"><input className="input" type="password" required value={form.confirm} onChange={set('confirm')} autoComplete="new-password" /></Field>
          </div>
          <button className="btn-primary w-full py-2.5" disabled={loading || !form.name || !form.email || !form.password}>
            {loading && <Spinner size={16} />} Create account
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-navy-500">
          Already registered? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
