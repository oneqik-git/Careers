import Link from 'next/link';
import LoggedOutMobileChrome from '@/components/LoggedOutMobileChrome';
import PublicHeaderNav from '@/components/PublicHeaderNav';

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
  const shellClassName = `oq-shell grid w-full max-w-6xl overflow-hidden rounded-[2.2rem] ${isEmployer ? 'lg:grid-cols-[1.05fr_0.95fr]' : 'max-w-xl'}`;

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 pb-[124px] pt-24 sm:px-6 md:pb-10 md:pt-[220px] lg:pt-[136px]">
      <LoggedOutMobileChrome topbarClassName="absolute left-6 right-6 top-6 flex items-center justify-between gap-3 md:hidden" />
      <PublicHeaderNav loggedOutOnly />
      <div className={shellClassName}>
        {isEmployer ? (
          <section className="oq-hero relative overflow-hidden border-b border-[var(--border)] p-8 text-white lg:border-b-0">
            <div className="oq-grid-overlay absolute inset-0 opacity-25" aria-hidden="true" />
            <div className="relative flex h-full flex-col justify-between gap-10">
              <div>
                <BrandLockup />
                <p className="oq-kicker mt-8 text-white/80">{eyebrow || 'Employer access'}</p>
                <h1 className="mt-3 max-w-md text-4xl font-semibold leading-tight text-white">
                  {sideTitle || 'Run hiring from a cleaner front door.'}
                </h1>
                <p className="mt-4 max-w-md text-sm leading-7 text-white/82">
                  {sideBody || 'Use your work email to manage roles, review applicants, and keep employer actions connected to the right company.'}
                </p>
              </div>

              {sidePoints.length ? (
                <div className="space-y-3 rounded-[1.7rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
                  {sidePoints.map((point) => (
                    <div key={point} className="flex items-start gap-3">
                      <span className="oq-dot mt-2 shrink-0" />
                      <p className="text-sm leading-6 text-white/84">{point}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

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
