import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Newspaper } from 'lucide-react';
import api, { mediaUrl } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function ParentHome() {
  const { user } = useAuth();
  const [roster, setRoster] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    api.get('/attendance').then((res) => setRoster(res.data.roster));
    api.get('/messages').then((res) => setMessages(res.data.slice(0, 3)));
  }, []);

  return (
    <div className="space-y-5 p-4">
      <div>
        <p className="text-sm text-slate-400">Welcome back, {user?.name?.split(' ')[0]}</p>
        <h1 className="text-lg font-semibold text-slate-800">Today</h1>
        <p className="text-sm text-slate-400">{new Date().toDateString()}</p>
      </div>

      <div className="space-y-3">
        {roster.map(({ student, attendance }) => {
          const checkedIn = !!attendance?.checkInTime;
          const checkedOut = !!attendance?.checkOutTime;
          const status = checkedOut ? 'Picked up' : checkedIn ? 'Checked in' : 'Not arrived yet';
          const tone = checkedOut ? 'bg-slate-100 text-slate-500' : checkedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
          return (
            <div key={student.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-xs text-slate-400">{student.classroom}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${tone}`}>{status}</span>
              </div>
              {attendance?.checkInTime && (
                <div className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                  <Clock size={13} />
                  Checked in at{' '}
                  {new Date(attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {attendance.checkOutTime && (
                    <>
                      {' · Out at '}
                      {new Date(attendance.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {roster.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
            No children linked to your account yet. Reach out to the school office.
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <Newspaper size={15} /> Recent updates
        </div>
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-slate-800">{m.title || 'Update'}</p>
              <p className="mt-1 text-sm text-slate-500">{m.body}</p>
              {m.photoUrl && <img src={mediaUrl(m.photoUrl)} alt="" className="mt-2 rounded-xl" />}
              <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                <CheckCircle2 size={11} /> {m.authorName} · {new Date(m.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
          {messages.length === 0 && <p className="text-sm text-slate-400">Nothing new yet.</p>}
        </div>
      </div>
    </div>
  );
}
