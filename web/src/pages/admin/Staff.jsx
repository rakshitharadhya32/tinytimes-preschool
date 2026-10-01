import { useEffect, useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

function emptyForm() {
  return { name: '', email: '', password: '', phone: '', title: '', role: 'staff' };
}

export default function Staff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState('');

  function load() {
    api.get('/staff').then((res) => setStaff(res.data));
  }
  useEffect(load, []);

  async function createStaff(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/staff', form);
      setShowForm(false);
      setForm(emptyForm());
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create staff member');
    }
  }

  async function removeStaff(id) {
    if (!confirm('Remove this staff member?')) return;
    await api.delete(`/staff/${id}`);
    load();
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-slate-800">Staff</h1>
          <p className="text-sm text-slate-400">{staff.length} team members</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Plus size={16} /> Add staff
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((s) => (
          <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-800">{s.name}</p>
                <p className="text-xs text-slate-400">{s.title || (s.role === 'admin' ? 'Administrator' : 'Staff')}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-500">
                {s.role}
              </span>
            </div>
            <div className="mt-3 space-y-0.5 text-xs text-slate-500">
              <p>{s.email}</p>
              {s.phone && <p>{s.phone}</p>}
            </div>
            {user?.role === 'admin' && s.id !== user.id && (
              <button
                onClick={() => removeStaff(s.id)}
                className="mt-3 flex items-center gap-1 text-xs text-slate-400 hover:text-red-500"
              >
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-slate-800">Add staff member</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={createStaff} className="space-y-3">
              <input
                required
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                required
                type="password"
                placeholder="Temporary password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Job title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
                Create account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
