'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { getStoredRole, getStoredUser } from '@/utils/authStorage';
import { getDashboardRoute } from '@/utils/roles';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Jobs', href: '/jobs' },
  { label: 'Community', href: '/community' },
  { label: 'Learn', href: '/learn' },
  { label: 'For Employers', href: '/employers' },
  { label: 'About', href: '/about' },
];

const footerGroups = [
  {
    title: 'Explore',
    links: [
      { label: 'Jobs', href: '/jobs' },
      { label: 'Community', href: '/community' },
      { label: 'Learn', href: '/learn' },
      { label: 'About', href: '/about' },
      { label: 'How it works', href: '/about#how-it-works' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'OneQik', href: '/about#oneqik' },
      { label: 'Community', href: '/community' },
      { label: 'Services', href: '/about#services' },
      { label: 'Contact', href: 'mailto:hello@oneqik.com' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/about#privacy' },
      { label: 'Terms', href: '/about#terms' },
    ],
  },
];

function BrandLockup() {
  return (
    <Link className="inline-flex items-center gap-3" href="/">
      <span className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-[14px] border border-[var(--dark-1)] bg-[linear-gradient(180deg,#08214b_0%,#031128_100%)] text-sm font-semibold text-white shadow-[var(--shadow-soft)]">
        <span className="absolute left-2.5 top-2.5 h-5 w-5 rounded-full border-2 border-[#51d8ff]/85" />
        <span className="absolute bottom-2.5 left-3 h-1.5 w-4 rounded-full bg-[#51d8ff]/70" />
        <span className="absolute right-2.5 top-4 h-3 w-3 rounded-full bg-[var(--brand-accent)] shadow-[0_0_18px_rgba(93,224,230,0.45)]" />
      </span>
      <div>
        <p className="text-[1.35rem] font-medium tracking-[-0.04em] text-[var(--text)]">Careers</p>
        <p className="text-[0.68rem] font-light tracking-[0.16em] text-[var(--secondary-1)]">by OneQik</p>
      </div>
    </Link>
  );
}

export default function PublicShell({ children, utilityContent }) {
  const pathname = usePathname();
  const [session, setSession] = useState({ role: null, user: null });

  useEffect(() => {
    setSession({
      role: getStoredRole(),
      user: getStoredUser(),
    });
  }, []);

  const viewerName = String(session.user?.full_name || '').trim();
  const dashboardHref = getDashboardRoute(session.role);
  const workspaceLabel = session.role === 'candidate' ? 'Candidate Workspace' : 'Employer Workspace';

  return (
    <main className="oq-public-root min-h-screen px-4 pb-5 pt-0 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="oq-header-shell sticky top-0 z-20 mb-12 rounded-b-[15px] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-6">
            <div className="flex items-center justify-between gap-4">
              <BrandLockup />
            </div>

            <nav className="flex flex-wrap items-center justify-start gap-2 lg:justify-center lg:gap-5">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    className={`oq-nav-link ${isActive ? 'oq-nav-link-active' : ''}`.trim()}
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
              {utilityContent || (
                <>
                  <ThemeToggle className="shrink-0" tone="public" />
                  {session.role ? (
                    <>
                      {viewerName ? (
                        <span className="rounded-full border border-[var(--dark-1)] px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--secondary-1)]">
                          {viewerName}
                        </span>
                      ) : null}
                      {session.role === 'candidate' ? (
                        <Link className="oq-nav-utility-link" href="/candidate/applications">
                          Applications
                        </Link>
                      ) : (
                        <Link className="oq-nav-utility-link" href="/employer/jobs">
                          Jobs
                        </Link>
                      )}
                      <Link className="oq-nav-cta oq-nav-cta-secondary" href={dashboardHref}>
                        {workspaceLabel}
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link className="oq-nav-utility-link" href="/login">
                        Login
                      </Link>
                      <Link className="oq-nav-cta oq-nav-cta-secondary" href="/employer/login">
                        Employer Login
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </header>

        {children}

        <footer className="oq-footer-shell mt-20 overflow-hidden rounded-[24px] px-6 py-10 sm:px-8 sm:py-12">
          <div className="h-[1px] w-full rounded-full bg-[linear-gradient(90deg,rgba(93,224,230,0.6),rgba(49,131,255,0.55),rgba(192,207,225,0.35))]" />
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
            <div className="space-y-4">
              <BrandLockup />
              <p className="max-w-md text-[0.98rem] font-light leading-8 text-[var(--secondary-1)]">
                Candidate-first discovery, structured applications, and a clearer path from public browsing to real hiring progress.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-[var(--secondary-1)]">
                <Link className="oq-link" href="/jobs">Browse Jobs</Link>
                <Link className="oq-link" href="/employers">For Employers</Link>
              </div>
            </div>

            {footerGroups.map((group) => (
              <div key={group.title}>
                <p className="text-[0.8rem] font-medium uppercase tracking-[0.16em] text-[var(--primary-2)]">{group.title}</p>
                <div className="mt-5 flex flex-col gap-3.5 text-[0.98rem] font-light text-[var(--secondary-1)]">
                  {group.links.map((link) => (
                    <Link key={link.label} className="transition-colors hover:text-[var(--text)]" href={link.href}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-[rgba(93,224,230,0.12)] pt-6 text-sm font-light text-[var(--graytexts)] sm:flex-row sm:items-center sm:justify-between">
            <p>Careers by OneQik</p>
            <p>Structured applications. Clear progress. Better visibility.</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
