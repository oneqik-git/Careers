import Link from 'next/link';

function BrandLockup() {
  return (
    <Link className="inline-flex items-center gap-3" href="/">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/10 bg-[linear-gradient(180deg,#1f4b7d_0%,#102742_100%)] text-sm font-semibold text-white">
        C
      </span>
      <div>
        <p className="text-lg font-semibold tracking-tight text-[var(--text)]">Careers</p>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">by OneQik</p>
      </div>
    </Link>
  );
}

export default function AuthLayout({
  title,
  subtitle,
  footerLabel,
  footerHref,
  footerText,
  children,
  variant = 'candidate',
  eyebrow,
  sideTitle,
  sideBody,
  sidePoints = [],
}) {
  const isEmployer = variant === 'employer';

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className={`oq-shell grid w-full max-w-6xl overflow-hidden rounded-[2.2rem] ${isEmployer ? 'lg:grid-cols-[1.05fr_0.95fr]' : 'max-w-4xl lg:grid-cols-[0.88fr_1.12fr]'}`.trim()}>
        <section className={`relative overflow-hidden border-b border-[var(--border)] p-8 lg:border-b-0 ${isEmployer ? 'oq-hero text-white' : 'bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent),var(--surface-muted)]'} `.trim()}>
          {isEmployer ? <div className="oq-grid-overlay absolute inset-0 opacity-25" aria-hidden="true" /> : null}
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div>
              <BrandLockup />
              <p className={`mt-8 ${isEmployer ? 'oq-kicker text-white/80' : 'oq-kicker'}`.trim()}>{eyebrow || (isEmployer ? 'Employer access' : 'Candidate sign in')}</p>
              <h1 className={`mt-3 max-w-md text-4xl font-semibold leading-tight ${isEmployer ? 'text-white' : 'text-[var(--text)]'}`.trim()}>
                {sideTitle || (isEmployer ? 'Run hiring from a cleaner front door.' : 'A lighter way back into your career flow.')}
              </h1>
              <p className={`mt-4 max-w-md text-sm leading-7 ${isEmployer ? 'text-white/82' : 'text-[var(--text-soft)]'}`.trim()}>
                {sideBody || (isEmployer
                  ? 'Use your work email to manage roles, review applicants, and keep employer actions connected to the right company.'
                  : 'Sign in quickly, browse roles, and continue applications without landing on a heavy sales page.')}
              </p>
            </div>

            {sidePoints.length ? (
              <div className={`space-y-3 rounded-[1.7rem] border p-5 ${isEmployer ? 'border-white/12 bg-white/10 backdrop-blur' : 'border-[var(--border)] bg-[var(--surface-elevated)]'}`.trim()}>
                {sidePoints.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <span className="oq-dot mt-2 shrink-0" />
                    <p className={`text-sm leading-6 ${isEmployer ? 'text-white/84' : 'text-[var(--text-soft)]'}`.trim()}>{point}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="bg-transparent p-6 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-md">
            <div className="flex items-center justify-between gap-3">
              <Link className="oq-button-ghost" href="/">
                Home
              </Link>
              {isEmployer ? (
                <Link className="oq-button-secondary" href="/employers">
                  For Employers
                </Link>
              ) : (
                <Link className="oq-button-secondary" href="/jobs">
                  Browse Opportunities
                </Link>
              )}
            </div>
            <h2 className="mt-8 text-3xl font-semibold tracking-tight text-[var(--text)]">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <p className="mt-6 text-sm text-[var(--text-soft)]">
              {footerLabel}{' '}
              <Link className="oq-link" href={footerHref}>
                {footerText}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
