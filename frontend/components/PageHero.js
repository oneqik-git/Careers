import Link from 'next/link';

export default function PageHero({
  eyebrow,
  title,
  description,
  badges = [],
  actions = [],
  aside,
  children,
  className = '',
}) {
  return (
    <section className={`oq-hero rounded-[2.2rem] p-6 text-white lg:p-8 ${className}`.trim()}>
      <div className="oq-grid-overlay absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_82%_30%,rgba(239,138,36,0.16),transparent_18%)]" aria-hidden="true" />

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div>
          {eyebrow ? <p className="oq-kicker text-white/82">{eyebrow}</p> : null}
          <h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">{title}</h2>
          {description ? <p className="mt-4 max-w-3xl text-base leading-8 text-white/82">{description}</p> : null}

          {badges.length ? (
            <div className="mt-6 flex flex-wrap gap-2.5">
              {badges.map((badge, index) => {
                const label = typeof badge === 'string' ? badge : badge?.label;

                if (!label) {
                  return null;
                }

                return (
                  <span
                    key={`${label}-${index}`}
                    className="rounded-full border border-white/12 bg-white/10 px-3.5 py-2 text-sm font-medium text-white/90 backdrop-blur"
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          ) : null}

          {actions.length ? (
            <div className="mt-7 flex flex-wrap gap-3">
              {actions.map((action) => {
                const className = action.variant === 'secondary'
                  ? 'oq-button-secondary border-white/14 bg-white/10 text-white hover:bg-white/14'
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

          {children ? <div className="mt-8">{children}</div> : null}
        </div>

        {aside ? (
          <div className="relative rounded-[1.8rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.13),rgba(255,255,255,0.06))] p-5 shadow-[0_20px_42px_rgba(3,10,20,0.22)] backdrop-blur">
            {aside}
          </div>
        ) : null}
      </div>
    </section>
  );
}
