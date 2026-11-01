import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../lib/api';
import { Spinner } from '../components/ui';
import AuthShell from './AuthShell';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname?: string } } };
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return toast.error('Enter your username and password');
    setBusy(true);
    try {
      await login(username.trim(), password);
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname ?? '/dashboard', { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your accounts.">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="label" htmlFor="u">Username</label>
          <input id="u" className="input" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" />
        </div>
        <div>
          <label className="label" htmlFor="p">Password</label>
          <div className="relative">
            <input id="p" type={show ? 'text' : 'password'} className="input pr-11" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full">{busy && <Spinner className="h-4 w-4" />} Sign in</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        New to BankOS? <Link to="/register" className="font-semibold text-bank-600 hover:text-bank-700">Create an account</Link>
      </p>
    </AuthShell>
  );
}
