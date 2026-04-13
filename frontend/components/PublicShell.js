'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import { getStoredRole, getStoredToken } from '@/utils/authStorage';
import { getDashboardRoute } from '@/utils/roles';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Jobs', href: '/jobs' },
  { label: 'About', href: '/about' },
];

const footerGroups = [
  {
    title: 'Explore',
    links: [
      { label: 'Jobs', href: '/jobs' },
      { label: 'About', href: '/about' },
      { label: 'How it works', href: '/about#how-it-works' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'OneQik', href: '/about#oneqik' },
      { label: 'Community', href: '/about#community' },
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
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-[1.15rem] border border-white/10 bg-[linear-gradient(180deg,#1f4b7d_0%,#102742_100%)] text-sm font-semibold text-white shadow-[0_18px_38px_rgba(6,16,29,0.34)]">
        C
      </span>
      <div>
        <p className="text-xl font-semibold tracking-tight text-[var(--text)]">Careers</p>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">by OneQik</p>
      </div>
    </Link>
  );
}

export default function PublicShell({ children }) {
  const pathname = usePathname();
  const [session, setSession] = useState({ hasToken: false, role: null });

  useEffect(() => {
    setSession({
      hasToken: Boolean(getStoredToken()),
      role: getStoredRole(),
    });
  }, [pathname]);

  const dashboardHref = getDashboardRoute(session.role);

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="oq-shell sticky top-4 z-20 mb-8 rounded-[2rem] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-4">
              <BrandLockup />
            </div>

            <nav className="flex flex-wrap items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    className={`oq-nav-pill ${isActive ? 'oq-nav-pill-active' : ''}`.trim()}
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex flex-wrap items-center gap-2">
              <ThemeToggle />
              {session.hasToken && session.role ? (
                <>
                  <Link className="oq-button-secondary" href="/employers">
                    For Employers
                  </Link>
                  <Link className="oq-button-primary" href={dashboardHref}>
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link className="oq-button-ghost" href="/login">
                    Sign in
                  </Link>
                  <Link className="oq-button-secondary" href="/employers">
                    For Employers
                  </Link>
                  <Link className="oq-button-primary" href="/register">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {children}

        <footer className="oq-shell mt-12 overflow-hidden rounded-[2.2rem] px-6 py-8 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
            <div className="space-y-4">
              <BrandLockup />
              <p className="max-w-md text-sm leading-7 text-[var(--text-soft)]">
                Careers helps serious job seekers show more than a resume and gives employers a cleaner way to spot the right people.
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-[var(--text-soft)]">
                <Link className="oq-link" href="/jobs">Browse Jobs</Link>
                <Link className="oq-link" href="/employers">For Employers</Link>
              </div>
            </div>

            {footerGroups.map((group) => (
              <div key={group.title}>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{group.title}</p>
                <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--text-soft)]">
                  {group.links.map((link) => (
                    <Link key={link.label} className="transition-colors hover:text-[var(--text)]" href={link.href}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-[var(--border)] pt-5 text-sm text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
            <p>Careers by OneQik</p>
            <p>Structured applications. Clear progress. Better visibility.</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
