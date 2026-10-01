import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Trash2 } from 'lucide-react';
import api from '../../lib/api';

export default function StudentDetail() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [form, setForm] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [guardians, setGuardians] = useState([]);
  const [history, setHistory] = useState([]);
  const [showGuardianForm, setShowGuardianForm] = useState(false);
  const [guardianForm, setGuardianForm] = useState({ name: '', email: '', phone: '', relationship: 'Parent' });
  const [saved, setSaved] = useState(false);

  function loadAll() {
    api.get(`/students/${id}`).then((res) => {
      setStudent(res.data);
      setForm(res.data);
    });
    api.get(`/students/${id}/guardians`).then((res) => setGuardians(res.data));
    api.get(`/attendance/history/${id}`).then((res) => setHistory(res.data));
    api.get('/classrooms').then((res) => setClassrooms(res.data));
  }

  useEffect(loadAll, [id]);

  async function saveStudent(e) {
    e.preventDefault();
    const { firstName, lastName, dob, gender, classroomId, allergies, notes, stage } = form;
    await api.patch(`/students/${id}`, { firstName, lastName, dob, gender, classroomId: classroomId || null, allergies, notes, stage });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function addGuardian(e) {
    e.preventDefault();
    await api.post(`/students/${id}/guardians`, guardianForm);
    setShowGuardianForm(false);
    setGuardianForm({ name: '', email: '', phone: '', relationship: 'Parent' });
    loadAll();
  }

  async function removeGuardian(guardianId) {
    await api.delete(`/students/${id}/guardians/${guardianId}`);
    loadAll();
  }

  if (!student || !form) return <div className="p-6 text-slate-400">Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <Link to="/admin/students" className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Back to students
      </Link>

      <h1 className="font-heading mb-4 text-2xl font-semibold text-slate-800">
        {student.firstName} {student.lastName}
      </h1>

      <form onSubmit={saveStudent} className="mb-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-700">Profile</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">First name</label>
            <input
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Last name</label>
            <input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Date of birth</label>
            <input
              type="date"
              value={form.dob ? form.dob.slice(0, 10) : ''}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Classroom</label>
            <select
              value={form.classroomId || ''}
              onChange={(e) => setForm({ ...form, classroomId: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Stage</label>
            <select
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {['inquiry', 'tour_scheduled', 'enrolled', 'waitlisted', 'withdrawn'].map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Allergies</label>
            <input
              value={form.allergies || ''}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Notes</label>
          <textarea
            value={form.notes || ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <button className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600">
          {saved ? 'Saved ✓' : 'Save changes'}
        </button>
      </form>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Guardians / Parent accounts</h2>
          <button
            onClick={() => setShowGuardianForm((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            <UserPlus size={14} /> Add guardian
          </button>
        </div>
        <div className="space-y-2">
          {guardians.map((g) => (
            <div key={g.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-slate-700">{g.name} <span className="text-xs text-slate-400">({g.relationship})</span></p>
                <p className="text-xs text-slate-400">{g.email} {g.phone ? `· ${g.phone}` : ''}</p>
              </div>
              <button onClick={() => removeGuardian(g.id)} className="text-slate-300 hover:text-red-500">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {guardians.length === 0 && <p className="text-sm text-slate-400">No guardians linked yet.</p>}
        </div>

        {showGuardianForm && (
          <form onSubmit={addGuardian} className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
            <input
              placeholder="Name"
              required
              value={guardianForm.name}
              onChange={(e) => setGuardianForm({ ...guardianForm, name: e.target.value })}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              placeholder="Email"
              type="email"
              required
              value={guardianForm.email}
              onChange={(e) => setGuardianForm({ ...guardianForm, email: e.target.value })}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              placeholder="Phone"
              value={guardianForm.phone}
              onChange={(e) => setGuardianForm({ ...guardianForm, phone: e.target.value })}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              placeholder="Relationship"
              value={guardianForm.relationship}
              onChange={(e) => setGuardianForm({ ...guardianForm, relationship: e.target.value })}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <p className="col-span-2 text-xs text-slate-400">
              New parent accounts get password <code className="rounded bg-slate-100 px-1">kriyo123</code> by default.
            </p>
            <button className="col-span-2 rounded-lg bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600">
              Add guardian
            </button>
          </form>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Attendance history</h2>
        <div className="space-y-1">
          {history.slice(0, 10).map((h) => (
            <div key={h.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{h.date}</span>
              <span className="text-slate-700">
                {h.checkInTime ? new Date(h.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                {' → '}
                {h.checkOutTime ? new Date(h.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
              </span>
            </div>
          ))}
          {history.length === 0 && <p className="text-sm text-slate-400">No attendance recorded yet.</p>}
        </div>
      </div>
    </div>
  );
}
