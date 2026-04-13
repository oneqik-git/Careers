import Link from 'next/link';

export default function PageHero({ eyebrow, title, description, badges = [], actions = [], aside }) {
  return (
    <section className="oq-hero rounded-[32px] p-6 text-white lg:p-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/78">{eyebrow}</p>
          ) : null}
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">{title}</h2>
          {description ? <p className="mt-3 max-w-3xl text-sm text-slate-100/86 sm:text-base">{description}</p> : null}

          {badges.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {badges.map((badge, index) => {
                const label = typeof badge === 'string' ? badge : badge?.label;

                if (!label) {
                  return null;
                }

                return (
                  <span
                    key={`${label}-${index}`}
                    className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-sm text-slate-100"
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          ) : null}

          {actions.length ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {actions.map((action) => {
                const className = `${
                  action.variant === 'secondary'
                    ? 'oq-button-secondary border-white/10 bg-white/10 text-white hover:bg-white/15'
                    : 'oq-button-primary'
                }`;

                if (action.href) {
                  return (
                    <Link key={action.href} className={className} href={action.href}>
                      {action.label}
                    </Link>
                  );
                }

                return (
                  <button
                    key={action.label}
                    className={className}
                    onClick={action.onClick}
                    type="button"
                  >
                    {action.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {aside ? <div className="rounded-[28px] border border-white/12 bg-white/10 p-5">{aside}</div> : null}
      </div>
    </section>
  );
}
