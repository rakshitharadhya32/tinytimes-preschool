export default function StatCard({ label, value, icon: Icon, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-sprout-50 text-sprout-600',
    blue: 'bg-sky-50 text-sky-600',
    slate: 'bg-slate-100 text-slate-600',
    sun: 'bg-sun-50 text-sun-500',
    bloom: 'bg-bloom-50 text-bloom-600',
  };
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}>
        {Icon && <Icon size={21} />}
      </div>
      <div>
        <p className="font-heading text-2xl font-semibold text-slate-800">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}
