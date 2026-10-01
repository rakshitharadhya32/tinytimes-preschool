import { useEffect, useState } from 'react';
import { Users, UserCheck, ClipboardCheck, Briefcase, UserPlus, Megaphone } from 'lucide-react';
import api from '../../lib/api';
import StatCard from '../../components/StatCard';

const stageLabels = {
  inquiry: 'Inquiry',
  tour_scheduled: 'Tour scheduled',
  enrolled: 'Enrolled',
  waitlisted: 'Waitlisted',
  withdrawn: 'Withdrawn',
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    api.get('/dashboard/summary').then((res) => setSummary(res.data));
    api.get('/messages').then((res) => setMessages(res.data.slice(0, 4)));
  }, []);

  if (!summary) {
    return <div className="p-6 text-slate-400">Loading dashboard...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-slate-800">Good day 👋</h1>
        <p className="text-sm text-slate-400">Here's what's happening at your school today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Enrolled students" value={summary.enrolledCount} icon={Users} tone="brand" />
        <StatCard label="Present today" value={summary.presentToday} icon={UserCheck} tone="green" />
        <StatCard label="Checked out today" value={summary.checkedOutToday} icon={ClipboardCheck} tone="blue" />
        <StatCard label="Staff members" value={summary.staffCount} icon={Briefcase} tone="slate" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-1">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <UserPlus size={16} /> Enrollment pipeline
          </h2>
          <div className="space-y-3">
            {Object.entries(stageLabels).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{label}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
                  {summary.stageCounts[key] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Megaphone size={16} /> Recent announcements
          </h2>
          <div className="space-y-4">
            {messages.length === 0 && <p className="text-sm text-slate-400">No announcements yet.</p>}
            {messages.map((m) => (
              <div key={m.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-800">{m.title || 'Update'}</p>
                  <span className="text-xs text-slate-400">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">{m.body}</p>
                <p className="mt-1 text-xs text-slate-400">
                  &mdash; {m.authorName}
                  {m.classroom ? ` · ${m.classroom}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
