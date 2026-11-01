import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../lib/api';
import { Spinner } from '../components/ui';
import AuthShell from './AuthShell';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ username: '', email: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const validate = (): string | null => {
    if (f.username.trim().length < 3) return 'Username must be at least 3 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return 'Enter a valid email address';
    if (f.password.length < 6) return 'Password must be at least 6 characters';
    if (f.password !== f.confirm) return 'Passwords do not match';
    return null;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return toast.error(problem);
    setBusy(true);
    try {
      await register(f.username.trim(), f.email.trim(), f.password);
      toast.success('Account created! Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Start banking with BankOS in under a minute.">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label" htmlFor="ru">Username</label>
          <input id="ru" className="input" autoComplete="username" value={f.username} onChange={set('username')} placeholder="Choose a username" /></div>
        <div><label className="label" htmlFor="re">Email</label>
          <input id="re" type="email" className="input" autoComplete="email" value={f.email} onChange={set('email')} placeholder="you@example.com" /></div>
        <div>
          <label className="label" htmlFor="rp">Password</label>
          <div className="relative">
            <input id="rp" type={show ? 'text' : 'password'} className="input pr-11" autoComplete="new-password" value={f.password} onChange={set('password')} placeholder="At least 6 characters" />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div><label className="label" htmlFor="rc">Confirm password</label>
          <input id="rc" type={show ? 'text' : 'password'} className="input" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} placeholder="Repeat your password" />
          {f.confirm && f.confirm !== f.password && <p className="mt-1.5 text-xs text-rose-600">Passwords do not match.</p>}
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full">{busy && <Spinner className="h-4 w-4" />} Create account</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account? <Link to="/login" className="font-semibold text-bank-600 hover:text-bank-700">Sign in</Link>
      </p>
    </AuthShell>
  );
}
