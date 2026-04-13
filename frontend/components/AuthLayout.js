import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function AuthLayout({
  title,
  subtitle,
  footerLabel,
  footerHref,
  footerText,
  children,
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="oq-shell grid w-full max-w-5xl overflow-hidden rounded-[32px] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="oq-hero hidden p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-white/78">OQ Career</p>
            <h1 className="mt-6 max-w-sm text-4xl font-semibold leading-tight">Public discovery, protected credibility workflows.</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/84">
              Sign in to manage candidate progress, employer hiring actions, and application timelines while the public layer stays open for browsing.
            </p>
          </div>
          <div className="rounded-3xl border border-white/12 bg-white/10 p-6 text-sm text-white/84 backdrop-blur">
            Built for the OneQik brand direction with navy surfaces, orange actions, and a public-first entry path.
          </div>
        </section>

        <section className="bg-transparent p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm uppercase tracking-[0.28em] text-[var(--text-muted)] lg:hidden">OQ Career</p>
              <div className="flex items-center gap-2">
                <Link className="oq-button-ghost" href="/">
                  Home
                </Link>
                <ThemeToggle />
              </div>
            </div>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--text)]">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <p className="mt-6 text-sm text-[var(--text-soft)]">
              {footerLabel}{' '}
              <Link className="font-medium text-[var(--brand-accent)] hover:text-[var(--brand-accent-strong)]" href={footerHref}>
                {footerText}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
