import { useEffect, useState } from 'react';
import { Plus, X, Trash2, Users as UsersIcon, School } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const colorOptions = ['#f97316', '#0ea5a4', '#eab308', '#ec4899', '#6366f1', '#22c55e'];

function emptyForm() {
  return { name: '', capacity: '', teacherId: '', color: colorOptions[0] };
}

export default function Classrooms() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  function load() {
    api.get('/classrooms').then((res) => setClassrooms(res.data));
    api.get('/staff').then((res) => setTeachers(res.data));
  }
  useEffect(load, []);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  }

  function startEdit(c) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      capacity: c.capacity ?? '',
      teacherId: c.teacherId ?? '',
      color: c.color || colorOptions[0],
    });
    setShowForm(true);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        capacity: form.capacity ? Number(form.capacity) : null,
        teacherId: form.teacherId ? Number(form.teacherId) : null,
        color: form.color,
      };
      if (editingId) {
        await api.patch(`/classrooms/${editingId}`, payload);
      } else {
        await api.post('/classrooms', payload);
      }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!confirm('Delete this classroom? Students assigned to it will become unassigned.')) return;
    await api.delete(`/classrooms/${id}`);
    load();
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-slate-800">Classrooms</h1>
          <p className="text-sm text-slate-400">Capacity, assigned teacher, and current roster size.</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-200 hover:bg-brand-600"
          >
            <Plus size={16} /> New classroom
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classrooms.map((c) => {
          const full = c.capacity != null && c.studentCount >= c.capacity;
          return (
            <div key={c.id} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm shadow-slate-100">
              <div className="h-2.5" style={{ backgroundColor: c.color }} />
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${c.color}22`, color: c.color }}
                    >
                      <School size={18} />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.teacherName || 'No teacher assigned'}</p>
                    </div>
                  </div>
                  {user?.role === 'admin' && (
                    <button onClick={() => remove(c.id)} className="text-slate-300 hover:text-red-500">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <UsersIcon size={14} /> {c.studentCount}
                    {c.capacity != null ? ` / ${c.capacity}` : ''} children
                  </span>
                  {full && (
                    <span className="rounded-full bg-bloom-50 px-2.5 py-0.5 text-[10px] font-semibold text-bloom-600">
                      Full
                    </span>
                  )}
                </div>

                {user?.role === 'admin' && (
                  <button
                    onClick={() => startEdit(c)}
                    className="mt-3 w-full rounded-xl border border-slate-200 py-1.5 text-xs font-semibold text-slate-500 hover:border-brand-300 hover:text-brand-600"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {classrooms.length === 0 && (
          <p className="col-span-full rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
            No classrooms yet.
          </p>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-slate-800">
                {editingId ? 'Edit classroom' : 'New classroom'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={save} className="space-y-3">
              <input
                required
                placeholder="Classroom name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="1"
                  placeholder="Capacity"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <select
                  value={form.teacherId}
                  onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">No teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-slate-500">Color</p>
                <div className="flex gap-2">
                  {colorOptions.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className={`h-7 w-7 rounded-full transition ${form.color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <button
                disabled={saving}
                className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create classroom'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
