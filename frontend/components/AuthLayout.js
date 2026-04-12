import Link from 'next/link';

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
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden bg-[linear-gradient(135deg,#0f6cbd_0%,#153e75_55%,#0f172a_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-sky-100/80">OQ Career</p>
            <h1 className="mt-6 max-w-sm text-4xl font-semibold leading-tight">Frontend Foundation Pass 1</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-sky-50/82">
              Candidate and employer auth plus dashboard foundations, connected directly to the backend contract.
            </p>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/10 p-6 text-sm text-sky-50/86 backdrop-blur">
            Minimal for now, structured for expansion later.
          </div>
        </section>

        <section className="bg-white p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500 lg:hidden">OQ Career</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <p className="mt-6 text-sm text-slate-600">
              {footerLabel}{' '}
              <Link className="font-medium text-sky-700 hover:text-sky-800" href={footerHref}>
                {footerText}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
