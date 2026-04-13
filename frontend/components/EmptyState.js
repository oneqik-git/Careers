export default function EmptyState({ title, description, action }) {
  return (
    <div className="oq-card-muted rounded-[28px] border-dashed p-8 text-center">
      <p className="text-base font-semibold text-[var(--text)]">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--text-soft)]">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
