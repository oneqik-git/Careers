export default function StatCard({ label, value, helper, tone = 'default' }) {
  const tones = {
    default: 'border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text)]',
    accent: 'border-[rgba(239,138,36,0.24)] bg-[rgba(239,138,36,0.1)] text-[var(--text)]',
    success: 'border-emerald-200 bg-emerald-50 text-slate-950',
    warning: 'border-amber-200 bg-amber-50 text-slate-950',
    dark: 'border-[var(--border-strong)] bg-[linear-gradient(180deg,#173b67_0%,#102742_100%)] text-white',
  };

  return (
    <div className={`rounded-[1.8rem] border p-5 shadow-[var(--shadow-soft)] ${tones[tone] || tones.default}`}>
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      {helper ? <p className="mt-2 text-sm text-[var(--text-soft)]">{helper}</p> : null}
    </div>
  );
}
