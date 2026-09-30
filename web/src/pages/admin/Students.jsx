import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../../lib/api';

const stageStyles = {
  inquiry: 'bg-sky-100 text-sky-700',
  tour_scheduled: 'bg-amber-100 text-amber-700',
  enrolled: 'bg-emerald-100 text-emerald-700',
  waitlisted: 'bg-purple-100 text-purple-700',
  withdrawn: 'bg-slate-100 text-slate-600',
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get('/students').then((res) => setStudents(res.data));
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return students
      .filter((s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(q))
      .sort((a, b) => a.firstName.localeCompare(b.firstName));
  }, [students, query]);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Students</h1>
          <p className="text-sm text-slate-400">{students.length} total records</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm sm:w-64"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Classroom</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Allergies</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/admin/students/${s.id}`} className="font-medium text-slate-800 hover:text-brand-600">
                    {s.firstName} {s.lastName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-500">{s.classroom || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stageStyles[s.stage]}`}>
                    {s.stage.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{s.allergies || '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
