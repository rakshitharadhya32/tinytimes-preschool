import { useEffect, useState } from 'react';
import api, { mediaUrl } from '../../lib/api';

export default function ParentFeed() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    api.get('/messages').then((res) => setMessages(res.data));
  }, []);

  return (
    <div className="space-y-3 p-4">
      <h1 className="font-heading mb-1 text-lg font-semibold text-slate-800">Feed</h1>
      {messages.map((m) => (
        <div key={m.id} className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-800">{m.title || 'Update'}</p>
          <p className="mt-1 text-sm text-slate-500">{m.body}</p>
          {m.photoUrl && <img src={mediaUrl(m.photoUrl)} alt="" className="mt-2 rounded-xl" />}
          <p className="mt-2 text-[11px] text-slate-400">
            {m.authorName}
            {m.classroom ? ` · ${m.classroom}` : ''} · {new Date(m.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
      {messages.length === 0 && (
        <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
          No updates yet.
        </div>
      )}
    </div>
  );
}
