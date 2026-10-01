import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const demoAccounts = [
  { label: 'Admin', email: 'admin@tinytimes.demo' },
  { label: 'Staff', email: 'staff@tinytimes.demo' },
  { label: 'Parent', email: 'parent@tinytimes.demo' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@tinytimes.demo');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'parent' ? '/parent' : '/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 via-white to-sprout-50 px-4">
      <div className="bg-blobs" />
      <div className="relative z-10 w-full max-w-sm rounded-[2rem] border border-white bg-white/90 p-8 shadow-xl shadow-brand-100 backdrop-blur-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/logo-wordmark.png" alt="TinyTimes Preschool" className="mb-2 h-20 w-auto" />
          <p className="font-heading text-sm text-slate-400">Sign in to your school</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              required
            />
          </div>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3 text-sm font-bold text-white shadow-lg shadow-brand-200 transition hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-xl disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
          >
            <LogIn size={16} /> {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 border-t border-dashed border-slate-200 pt-4">
          <p className="mb-2 text-center text-xs text-slate-400">Demo accounts (password: password123)</p>
          <div className="flex justify-center gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                onClick={() => {
                  setEmail(acc.email);
                  setPassword('password123');
                }}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] tracking-wide text-slate-300">
          Powered by Ankura
        </p>
      </div>
    </div>
  );
}
