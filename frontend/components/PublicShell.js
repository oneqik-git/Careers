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
  { label: 'For Employers', href: '/register?role=employer' },
];

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
        <header className="oq-shell mb-6 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Link className="inline-flex items-center gap-3" href="/">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-accent)] text-sm font-semibold text-white shadow-[0_14px_28px_rgba(245,138,31,0.28)]">
                  OQ
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--text-muted)]">OneQik Family</p>
                  <p className="text-lg font-semibold text-[var(--text)]">OQ Career</p>
                </div>
              </Link>
            </div>

            <nav className="flex flex-wrap gap-2">
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
                <Link className="oq-button-primary" href={dashboardHref}>
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link className="oq-button-secondary" href="/login">
                    Sign in
                  </Link>
                  <Link className="oq-button-primary" href="/register?role=candidate">
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {children}

        <footer className="mt-8 rounded-[32px] border border-[var(--border)] bg-[var(--surface-muted)] px-5 py-6 text-sm text-[var(--text-soft)] shadow-[var(--shadow-soft)] sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>OQ Career brings public discovery and protected career credibility workflows into one prototype-friendly surface.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/jobs">Browse jobs</Link>
              <Link href="/login">Candidate and employer sign in</Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
