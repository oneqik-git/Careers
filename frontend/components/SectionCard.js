export default function SectionCard({ title, description, children, action }) {
  return (
    <section className="oq-card rounded-[28px] p-5">
      <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[var(--text)]">{title}</h2>
          {description ? <p className="mt-1 text-sm text-[var(--text-soft)]">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}
