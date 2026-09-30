import { useEffect, useMemo, useState } from 'react';
import { Send, Image as ImageIcon, Trash2 } from 'lucide-react';
import api, { mediaUrl } from '../../lib/api';

export default function Announcements() {
  const [messages, setMessages] = useState([]);
  const [students, setStudents] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('school');
  const [classroom, setClassroom] = useState('');
  const [studentId, setStudentId] = useState('');
  const [photo, setPhoto] = useState(null);
  const [sending, setSending] = useState(false);

  function load() {
    api.get('/messages').then((res) => setMessages(res.data));
    api.get('/students').then((res) => setStudents(res.data.filter((s) => s.stage === 'enrolled')));
  }
  useEffect(load, []);

  const classrooms = useMemo(() => [...new Set(students.map((s) => s.classroom).filter(Boolean))], [students]);

  async function send(e) {
    e.preventDefault();
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('body', body);
      if (audience === 'classroom') fd.append('classroom', classroom);
      if (audience === 'student') fd.append('studentId', studentId);
      if (photo) fd.append('photo', photo);
      await api.post('/messages', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setTitle('');
      setBody('');
      setPhoto(null);
      load();
    } finally {
      setSending(false);
    }
  }

  async function remove(id) {
    await api.delete(`/messages/${id}`);
    load();
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <h1 className="mb-1 text-2xl font-semibold text-slate-800">Announcements</h1>
      <p className="mb-5 text-sm text-slate-400">Share updates with the whole school, a classroom, or one family.</p>

      <form onSubmit={send} className="mb-8 space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <input
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <textarea
          required
          placeholder="What would you like to share?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="school">Whole school</option>
            <option value="classroom">A classroom</option>
            <option value="student">One family</option>
          </select>

          {audience === 'classroom' && (
            <select
              value={classroom}
              onChange={(e) => setClassroom(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Select classroom</option>
              {classrooms.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {audience === 'student' && (
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
          )}

          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 hover:border-brand-300">
            <ImageIcon size={14} /> {photo ? photo.name.slice(0, 18) : 'Attach photo'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files[0])} />
          </label>
        </div>
        <button
          disabled={sending}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          <Send size={15} /> {sending ? 'Posting...' : 'Post announcement'}
        </button>
      </form>

      <div className="space-y-4">
        {messages.map((m) => (
          <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-800">{m.title || 'Update'}</p>
                <p className="text-xs text-slate-400">
                  {m.authorName} · {new Date(m.createdAt).toLocaleString()}
                  {m.classroom ? ` · ${m.classroom}` : ''}
                </p>
              </div>
              <button onClick={() => remove(m.id)} className="text-slate-300 hover:text-red-500">
                <Trash2 size={15} />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-600">{m.body}</p>
            {m.photoUrl && (
              <img src={mediaUrl(m.photoUrl)} alt="" className="mt-3 max-h-64 rounded-xl object-cover" />
            )}
          </div>
        ))}
        {messages.length === 0 && <p className="text-center text-slate-400">No announcements yet.</p>}
      </div>
    </div>
  );
}
