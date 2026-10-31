import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronsUpDown, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { getErrorMessage } from '../api/client.js';
import { Spinner } from '../components/Spinner.jsx';
import Field from '../components/FormField.jsx';

const DEMOS = [
  { role: 'Admin', email: 'admin@elevai.com', password: 'Admin@123' },
  { role: 'Technician', email: 'technician@elevai.com', password: 'Tech@123' },
  { role: 'Building user', email: 'user@elevai.com', password: 'User@123' },
];

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email.trim(), form.password);
      toast.success(`Signed in as ${user.name}`);
      navigate(`/${user.role}/dashboard`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not sign in.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-navy-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600"><ChevronsUpDown size={22} /></div>
          <span className="text-xl font-extrabold">ElevAI</span>
        </div>
        <div>
          <h1 className="max-w-md text-4xl font-extrabold leading-tight text-white">Fewer breakdowns. Faster repairs. Clear maintenance priorities.</h1>
          <p className="mt-4 max-w-md text-navy-200">Report faults, assign technicians, schedule services and let AI explain what is probably wrong, all from one workspace.</p>
          <ul className="mt-8 space-y-4 text-sm text-navy-100">
            <li className="flex items-center gap-3"><Sparkles size={18} className="text-brand-300" /> AI diagnosis for every reported fault</li>
            <li className="flex items-center gap-3"><Wrench size={18} className="text-brand-300" /> Maintenance schedules, reminders and component history</li>
            <li className="flex items-center gap-3"><ShieldCheck size={18} className="text-brand-300" /> Role-based access for admins, technicians and building users</li>
          </ul>
        </div>
        <p className="text-xs text-navy-300">Built on your own maintenance records. No sensor data is used or simulated.</p>
      </section>

      <section className="flex items-center justify-center bg-white p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold">Sign in</h2>
          <p className="mt-1 text-sm text-navy-500">Use your ElevAI account to continue.</p>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <Field label="Email">
              <input className="input" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" />
            </Field>
            <Field label="Password">
              <input className="input" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Your password" />
            </Field>
            <button className="btn-primary w-full py-2.5" disabled={loading || !form.email || !form.password}>
              {loading && <Spinner size={16} />} Sign in
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-navy-500">
            New building user? <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create an account</Link>
          </p>

          <div className="mt-8 rounded-xl border border-navy-100 bg-navy-50/60 p-4">
            <p className="text-sm font-semibold text-navy-800">Demo accounts</p>
            <p className="text-xs text-navy-500">Available after running the seed script. Select one to fill the form.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DEMOS.map((d) => (
                <button key={d.role} type="button" className="btn-secondary btn-sm" onClick={() => setForm({ email: d.email, password: d.password })}>{d.role}</button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
