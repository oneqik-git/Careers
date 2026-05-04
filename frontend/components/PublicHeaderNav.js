'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import { getStoredRole, getStoredUser } from '@/utils/authStorage';
import { getDashboardRoute } from '@/utils/roles';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Opportunities', href: '/jobs' },
  { label: 'Community', href: '/community' },
];

export function PublicBrandLockup() {
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

export default function PublicHeaderNav({
  utilityContent,
  loggedOutOnly = false,
}) {
  const pathname = usePathname();
  const [session, setSession] = useState({ role: null, user: null });
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    setSession({
      role: getStoredRole(),
      user: getStoredUser(),
    });
    setIsSessionReady(true);
  }, []);

  const hasLoggedInSession = isSessionReady && Boolean(session.role);
  const isLoggedOut = !isSessionReady || !session.role;

  if (loggedOutOnly && hasLoggedInSession) {
    return null;
  }

  const viewerName = String(session.user?.full_name || '').trim();
  const dashboardHref = getDashboardRoute(session.role);
  const workspaceLabel = session.role === 'candidate' ? 'Candidate Workspace' : 'Employer Workspace';
  const isHome = pathname === '/';
  const usesHomeNav = isHome || isLoggedOut;
  const candidateLoginHref = `${pathname || '/'}?auth=login`;
  const headerClassName = usesHomeNav
    ? 'oq-header-shell hidden fixed left-1/2 top-0 z-50 w-[calc(100%-3rem)] max-w-7xl -translate-x-1/2 rounded-b-[15px] px-6 py-5 md:block lg:w-[calc(100%-4rem)] nav-home-highlight-2'
    : 'oq-header-shell fixed left-1/2 top-0 z-50 w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2 rounded-b-[15px] px-5 py-5 sm:w-[calc(100%-3rem)] sm:px-6 lg:w-[calc(100%-4rem)]';

  return (
    <header className={headerClassName}>
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-6">
        <div className="flex items-center justify-between gap-4">
          <PublicBrandLockup />
        </div>

        <nav className="flex flex-wrap items-center justify-start gap-2 lg:justify-center lg:gap-5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                className={`oq-nav-link ${usesHomeNav ? 'nav-link-hover-2' : ''} ${isActive ? 'oq-nav-link-active' : ''}`.trim()}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-center gap-4 lg:justify-end lg:gap-5">
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
                      Opportunities
                    </Link>
                  )}
                  <Link className="oq-nav-cta oq-nav-cta-secondary" href={dashboardHref}>
                    {workspaceLabel}
                  </Link>
                </>
              ) : (
                <>
                  <Link className={usesHomeNav ? 'oq-nav-utility-link' : 'oq-nav-cta oq-nav-cta-secondary'} href="/employer/login">
                    Employers
                  </Link>
                  <Link className={usesHomeNav ? 'oq-nav-cta oq-nav-cta-secondary btn-box-style-2' : 'oq-nav-utility-link'} href={candidateLoginHref}>
                    Login
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
