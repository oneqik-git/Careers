export default function StatCard({ label, value, helper, tone = 'default' }) {
  const tones = {
    default: 'border-slate-200 bg-white text-slate-950',
    accent: 'border-sky-200 bg-sky-50 text-slate-950',
    success: 'border-emerald-200 bg-emerald-50 text-slate-950',
    warning: 'border-amber-200 bg-amber-50 text-slate-950',
    dark: 'border-slate-900 bg-slate-950 text-white',
  };

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${tones[tone] || tones.default}`}>
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-600">{helper}</p> : null}
    </div>
  );
}
