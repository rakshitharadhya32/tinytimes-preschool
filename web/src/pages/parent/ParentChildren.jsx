import { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function ParentChildren() {
  const [students, setStudents] = useState([]);
  const [history, setHistory] = useState({});

  useEffect(() => {
    api.get('/students').then((res) => {
      setStudents(res.data);
      res.data.forEach((s) => {
        api.get(`/attendance/history/${s.id}`).then((h) =>
          setHistory((prev) => ({ ...prev, [s.id]: h.data.slice(0, 5) }))
        );
      });
    });
  }, []);

  return (
    <div className="space-y-4 p-4">
      <h1 className="font-heading mb-1 text-lg font-semibold text-slate-800">My kids</h1>
      {students.map((s) => (
        <div key={s.id} className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="font-semibold text-slate-800">
            {s.firstName} {s.lastName}
          </p>
          <p className="mb-3 text-xs text-slate-400">
            {s.classroom || 'Unassigned'} {s.allergies ? `· Allergy: ${s.allergies}` : ''}
          </p>
          <p className="mb-1 text-xs font-medium text-slate-500">Recent attendance</p>
          <div className="space-y-1">
            {(history[s.id] || []).map((h) => (
              <div key={h.id} className="flex justify-between text-xs text-slate-500">
                <span>{h.date}</span>
                <span>
                  {h.checkInTime ? new Date(h.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  {' → '}
                  {h.checkOutTime ? new Date(h.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </div>
            ))}
            {(!history[s.id] || history[s.id].length === 0) && (
              <p className="text-xs text-slate-300">No records yet.</p>
            )}
          </div>
        </div>
      ))}
      {students.length === 0 && (
        <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
          No children linked to your account yet.
        </div>
      )}
    </div>
  );
}
