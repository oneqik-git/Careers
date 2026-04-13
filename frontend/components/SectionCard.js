export default function SectionCard({ title, description, children, action, eyebrow, className = '' }) {
  return (
    <section className={`oq-card rounded-[2rem] p-6 ${className}`.trim()}>
      {(title || description || action || eyebrow) ? (
        <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {eyebrow ? <p className="oq-kicker">{eyebrow}</p> : null}
            {title ? <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--text)]">{title}</h2> : null}
            {description ? <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={title || description || action || eyebrow ? 'pt-6' : ''}>{children}</div>
    </section>
  );
}
