import Link from 'next/link';

export default function PageHero({ eyebrow, title, description, badges = [], actions = [], aside }) {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_42%),linear-gradient(135deg,_#0f172a_0%,_#1e293b_55%,_#334155_100%)] p-6 text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)] lg:p-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-100/90">{eyebrow}</p>
          ) : null}
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">{title}</h2>
          {description ? <p className="mt-3 max-w-3xl text-sm text-slate-200 sm:text-base">{description}</p> : null}

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
                    className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-slate-100"
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
                const className = `inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                  action.variant === 'secondary'
                    ? 'border border-white/20 bg-white/10 text-white hover:bg-white/15'
                    : 'bg-white text-slate-950 hover:bg-slate-100'
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

        {aside ? <div className="rounded-[28px] border border-white/15 bg-white/10 p-5">{aside}</div> : null}
      </div>
    </section>
  );
}
