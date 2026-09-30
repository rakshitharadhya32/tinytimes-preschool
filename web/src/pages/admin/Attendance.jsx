import { useEffect, useMemo, useState } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import api from '../../lib/api';

export default function Attendance() {
  const [roster, setRoster] = useState([]);
  const [date, setDate] = useState('');
  const [classroom, setClassroom] = useState('all');
  const [busyId, setBusyId] = useState(null);

  function load() {
    api.get('/attendance').then((res) => {
      setDate(res.data.date);
      setRoster(res.data.roster);
    });
  }
  useEffect(load, []);

  const classrooms = useMemo(() => {
    const set = new Set(roster.map((r) => r.student.classroom).filter(Boolean));
    return ['all', ...set];
  }, [roster]);

  const visible = roster.filter((r) => classroom === 'all' || r.student.classroom === classroom);

  async function checkIn(studentId) {
    setBusyId(studentId);
    try {
      await api.post('/attendance/checkin', { studentId });
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function checkOut(studentId) {
    setBusyId(studentId);
    try {
      await api.post('/attendance/checkout', { studentId });
      load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Attendance</h1>
          <p className="text-sm text-slate-400">{date && new Date(date).toDateString()}</p>
        </div>
        <select
          value={classroom}
          onChange={(e) => setClassroom(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          {classrooms.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'All classrooms' : c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map(({ student, attendance }) => {
          const checkedIn = !!attendance?.checkInTime;
          const checkedOut = !!attendance?.checkOutTime;
          return (
            <div key={student.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-xs text-slate-400">{student.classroom || 'Unassigned'}</p>
                </div>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    checkedOut ? 'bg-slate-300' : checkedIn ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                  title={checkedOut ? 'Checked out' : checkedIn ? 'Present' : 'Not arrived'}
                />
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <span>
                  In:{' '}
                  {attendance?.checkInTime
                    ? new Date(attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </span>
                <span>
                  Out:{' '}
                  {attendance?.checkOutTime
                    ? new Date(attendance.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  disabled={checkedIn || busyId === student.id}
                  onClick={() => checkIn(student.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-white disabled:bg-slate-100 disabled:text-slate-300"
                >
                  <LogIn size={14} /> Check in
                </button>
                <button
                  disabled={!checkedIn || checkedOut || busyId === student.id}
                  onClick={() => checkOut(student.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-700 py-2 text-xs font-semibold text-white disabled:bg-slate-100 disabled:text-slate-300"
                >
                  <LogOut size={14} /> Check out
                </button>
              </div>
            </div>
          );
        })}
        {visible.length === 0 && (
          <p className="col-span-full py-8 text-center text-slate-400">No enrolled students in this classroom.</p>
        )}
      </div>
    </div>
  );
}
