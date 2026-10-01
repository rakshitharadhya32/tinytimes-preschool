import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import api from '../../lib/api';

const columns = [
  { key: 'inquiry', label: 'Inquiry', tone: 'bg-sky-100 text-sky-700' },
  { key: 'tour_scheduled', label: 'Tour Scheduled', tone: 'bg-amber-100 text-amber-700' },
  { key: 'enrolled', label: 'Enrolled', tone: 'bg-emerald-100 text-emerald-700' },
  { key: 'waitlisted', label: 'Waitlisted', tone: 'bg-purple-100 text-purple-700' },
  { key: 'withdrawn', label: 'Withdrawn', tone: 'bg-slate-100 text-slate-600' },
];

function emptyForm() {
  return { firstName: '', lastName: '', dob: '', gender: '', classroomId: '' };
}

export default function Enrollment() {
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [dragId, setDragId] = useState(null);
  const [saving, setSaving] = useState(false);

  function load() {
    api.get('/students').then((res) => setStudents(res.data));
    api.get('/classrooms').then((res) => setClassrooms(res.data));
  }

  useEffect(load, []);

  async function moveStage(id, stage) {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, stage } : s)));
    await api.patch(`/students/${id}`, { stage });
  }

  async function createInquiry(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/students', { ...form, stage: 'inquiry' });
      setShowForm(false);
      setForm(emptyForm());
      load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-slate-800">Enrollment pipeline</h1>
          <p className="text-sm text-slate-400">Drag a card to move it through the pipeline.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus size={16} /> New inquiry
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {columns.map((col) => {
          const items = students.filter((s) => s.stage === col.key);
          return (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragId) moveStage(dragId, col.key);
                setDragId(null);
              }}
              className="min-h-[200px] rounded-2xl bg-slate-100/60 p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${col.tone}`}>
                  {col.label}
                </span>
                <span className="text-xs text-slate-400">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((s) => (
                  <div
                    key={s.id}
                    draggable
                    onDragStart={() => setDragId(s.id)}
                    className="cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing"
                  >
                    <p className="text-sm font-medium text-slate-800">
                      {s.firstName} {s.lastName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {s.dob ? new Date(s.dob).toLocaleDateString() : 'DOB not set'}
                    </p>
                    {s.classroom && (
                      <span className="mt-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-600">
                        {s.classroom}
                      </span>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {columns
                        .filter((c) => c.key !== s.stage)
                        .map((c) => (
                          <button
                            key={c.key}
                            onClick={() => moveStage(s.id, c.key)}
                            className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500 hover:border-brand-300 hover:text-brand-600"
                          >
                            → {c.label}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-300">
                    Drop here
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-slate-800">New inquiry</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={createInquiry} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  required
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Gender</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </div>
              <select
                value={form.classroomId}
                onChange={(e) => setForm({ ...form, classroomId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Classroom (optional)</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                disabled={saving}
                className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Add to pipeline'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
