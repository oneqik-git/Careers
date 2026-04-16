export default function MessageBanner({ tone = 'info', title, message }) {
  if (!message) {
    return null;
  }

  const tones = {
    info: {
      className: 'border-[rgba(93,224,230,0.18)] bg-[rgba(93,224,230,0.08)] text-[var(--text)]',
      title: 'Heads up',
    },
    success: {
      className: 'border-[rgba(34,197,94,0.22)] bg-[rgba(34,197,94,0.12)] text-[var(--text)]',
      title: 'Saved',
    },
    error: {
      className: 'border-[rgba(244,63,94,0.24)] bg-[rgba(244,63,94,0.12)] text-[var(--text)]',
      title: 'Action needed',
    },
    warning: {
      className: 'border-[rgba(245,158,11,0.24)] bg-[rgba(245,158,11,0.12)] text-[var(--text)]',
      title: 'Check this',
    },
    muted: {
      className: 'border-[var(--border)] bg-[rgba(255,255,255,0.03)] text-[var(--text)]',
      title: 'Note',
    },
  };

  const currentTone = tones[tone] || tones.info;

  return (
    <div className={`rounded-[1.2rem] border p-4 text-sm shadow-[0_14px_24px_rgba(0,0,0,0.12)] ${currentTone.className}`}>
      <p className="font-semibold uppercase tracking-[0.12em]">{title || currentTone.title}</p>
      <p className="mt-2 leading-7 text-[var(--text-soft)]">{message}</p>
    </div>
  );
}
