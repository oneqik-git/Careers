export default function LoadingState({
  label = 'Loading',
  title = 'Preparing this view',
  description = 'Pulling the latest workspace data now.',
  compact = false,
}) {
  return (
    <div className={`oq-loading-state ${compact ? 'px-4 py-4' : ''}`.trim()}>
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[var(--text)]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{description}</p>
    </div>
  );
}
