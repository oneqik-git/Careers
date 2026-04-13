export default function MessageBanner({ tone = 'info', title, message }) {
  if (!message) {
    return null;
  }

  const tones = {
    info: {
      className: 'border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-soft)]',
      title: 'Heads up',
    },
    success: {
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      title: 'Success',
    },
    error: {
      className: 'border-red-200 bg-red-50 text-red-700',
      title: 'Something went wrong',
    },
  };

  const currentTone = tones[tone] || tones.info;

  return (
    <div className={`rounded-2xl border p-4 text-sm ${currentTone.className}`}>
      <p className="font-semibold">{title || currentTone.title}</p>
      <p className="mt-1">{message}</p>
    </div>
  );
}
