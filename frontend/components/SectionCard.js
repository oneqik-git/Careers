export default function SectionCard({ title, description, children, action, eyebrow, className = '' }) {
  return (
    <section className={`oq-card rounded-[22px] p-6 sm:p-8 lg:p-10 ${className}`.trim()}>
      {(title || description || action || eyebrow) ? (
        <div className="flex flex-col gap-3 border-b border-[rgba(93,224,230,0.12)] pb-7 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {eyebrow ? <p className="oq-kicker">{eyebrow}</p> : null}
            {title ? <h2 className="oq-section-title mt-3 max-w-4xl font-medium text-[var(--text)]">{title}</h2> : null}
            {description ? <p className="mt-3 max-w-3xl text-[1rem] font-light leading-8 text-[var(--secondary-1)]">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={title || description || action || eyebrow ? 'pt-8' : ''}>{children}</div>
    </section>
  );
}
