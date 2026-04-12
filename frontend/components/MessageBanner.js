export default function MessageBanner({ tone = 'info', message }) {
  if (!message) {
    return null;
  }

  const tones = {
    info: 'border-slate-200 bg-slate-50 text-slate-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    error: 'border-red-200 bg-red-50 text-red-700',
  };

  return (
    <div className={`rounded-2xl border p-4 text-sm ${tones[tone] || tones.info}`}>
      {message}
    </div>
  );
}
