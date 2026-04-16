export default function EmptyState({
  eyebrow,
  title,
  description,
  action,
  secondaryAction,
  align = 'center',
}) {
  const isCentered = align === 'center';

  return (
    <div className={`oq-empty-state p-8 ${isCentered ? 'text-center' : ''}`.trim()}>
      {eyebrow ? (
        <p className={`text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] ${isCentered ? 'text-center' : ''}`.trim()}>
          {eyebrow}
        </p>
      ) : null}
      <p className={`mt-2 text-base font-semibold text-[var(--text)] ${isCentered ? 'mx-auto max-w-xl' : ''}`.trim()}>{title}</p>
      <p className={`mt-3 text-sm leading-7 text-[var(--text-soft)] ${isCentered ? 'mx-auto max-w-xl' : 'max-w-xl'}`.trim()}>{description}</p>
      {action || secondaryAction ? (
        <div className={`mt-6 flex flex-wrap gap-3 ${isCentered ? 'justify-center' : ''}`.trim()}>
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
