import Link from 'next/link';

export default function PageHero({
  eyebrow,
  title,
  description,
  badges = [],
  actions = [],
  aside,
  children,
  titleAs = 'h2',
  titleClassName = '',
  descriptionClassName = '',
  asideClassName = '',
  align = 'start',
  layout = 'split',
  className = '',
}) {
  const TitleTag = titleAs;
  const isCentered = align === 'center';
  const layoutClassName = layout === 'stacked'
    ? 'gap-8'
    : 'gap-10 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start';
  const titleSizeClassName = titleAs === 'h1'
    ? 'oq-display-title'
    : 'text-4xl leading-[1.05] tracking-[-0.05em] sm:text-5xl lg:text-[3.25rem]';

  return (
    <section className={`oq-hero rounded-[22px] p-6 sm:p-8 lg:p-12 ${className}`.trim()}>
      <div className="oq-grid-overlay absolute inset-0 opacity-24" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(93,224,230,0.08),transparent_20%),radial-gradient(circle_at_82%_24%,rgba(49,131,255,0.12),transparent_22%)]" aria-hidden="true" />

      <div className={`relative grid ${layoutClassName}`.trim()}>
        <div className={isCentered ? 'mx-auto max-w-5xl text-center' : ''}>
          {eyebrow ? <p className={`oq-kicker ${isCentered ? 'text-center text-[var(--primary-2)]' : 'text-[var(--primary-2)]'}`.trim()}>{eyebrow}</p> : null}
          <TitleTag className={`${titleSizeClassName} mt-4 max-w-5xl font-medium text-[var(--text)] ${isCentered ? 'mx-auto text-center' : ''} ${titleClassName}`.trim()}>
            {title}
          </TitleTag>
          {description ? (
            <p className={`mt-5 max-w-3xl text-[1.02rem] font-light leading-8 text-[var(--secondary-1)] ${isCentered ? 'mx-auto text-center' : ''} ${descriptionClassName}`.trim()}>
              {description}
            </p>
          ) : null}

          {badges.length ? (
            <div className={`mt-7 flex flex-wrap gap-2.5 ${isCentered ? 'justify-center' : ''}`.trim()}>
              {badges.map((badge, index) => {
                const label = typeof badge === 'string' ? badge : badge?.label;

                if (!label) {
                  return null;
                }

                return (
                  <span
                    key={`${label}-${index}`}
                    className="rounded-full border border-[var(--dark-1)] bg-[rgba(93,224,230,0.05)] px-3.5 py-2 text-sm font-light text-[var(--secondary-1)] backdrop-blur"
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          ) : null}

          {actions.length ? (
            <div className={`mt-8 flex flex-wrap gap-3 ${isCentered ? 'justify-center' : ''}`.trim()}>
              {actions.map((action) => {
                const className = action.variant === 'secondary'
                  ? 'oq-button-secondary'
                  : 'oq-button-primary';

                if (action.href) {
                  return (
                    <Link key={`${action.href}-${action.label}`} className={className} href={action.href}>
                      {action.label}
                    </Link>
                  );
                }

                return (
                  <button key={action.label} className={className} onClick={action.onClick} type="button">
                    {action.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          {children ? <div className="mt-10">{children}</div> : null}
        </div>

        {aside ? (
          <div className={`oq-media-frame relative p-4 sm:p-5 ${layout === 'stacked' ? 'mx-auto w-full max-w-5xl' : ''} ${asideClassName}`.trim()}>
            {aside}
          </div>
        ) : null}
      </div>
    </section>
  );
}
