export default function StatCard({ label, value, helper, tone = 'default' }) {
  const tones = {
    default: 'border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text)]',
    accent: 'border-[rgba(245,138,31,0.28)] bg-[rgba(245,138,31,0.12)] text-[var(--text)]',
    success: 'border-emerald-200 bg-emerald-50 text-slate-950',
    warning: 'border-amber-200 bg-amber-50 text-slate-950',
    dark: 'border-[var(--border-strong)] bg-[var(--brand-primary)] text-white',
  };

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${tones[tone] || tones.default}`}>
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      {helper ? <p className="mt-2 text-sm text-[var(--text-soft)]">{helper}</p> : null}
    </div>
  );
}
