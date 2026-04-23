'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { getStoredRole, getStoredUser } from '@/utils/authStorage';
import { getDashboardRoute } from '@/utils/roles';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Opportunities', href: '/jobs' },
  { label: 'Community', href: '/community' },
];

const mobileHomeDockItems = [
  { label: 'Home', href: '/' },
  { label: 'Opportunities', href: '/jobs' },
  { label: 'Community', href: '/community' },
];

const footerGroups = [
  {
    title: 'Explore',
    links: [
      { label: 'Opportunities', href: '/jobs' },
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

function getViewerInitial(value) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    return 'P';
  }

  return normalized.charAt(0).toUpperCase() || 'P';
}

function getViewerImage(user) {
  const possibleKeys = [
    'profile_photo_url',
    'profile_image_url',
    'avatar_url',
    'photo_url',
    'image_url',
    'avatar',
    'photo',
    'image',
  ];

  for (const key of possibleKeys) {
    const value = String(user?.[key] || '').trim();

    if (value) {
      return value;
    }
  }

  return '';
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
  const isHome = pathname === '/';
  const isEmployerSession = session.role === 'employer' || session.role === 'admin';
  const profileHref = session.role === 'candidate'
    ? '/candidate/profile'
    : isEmployerSession
      ? dashboardHref
      : '/login';
  const employersHref = isEmployerSession ? dashboardHref : '/employer/login';
  const profileImage = getViewerImage(session.user);
  const profileInitial = getViewerInitial(viewerName);
  const mainClassName = isHome
    ? 'oq-public-root min-h-screen px-4 pb-[124px] pt-6 md:px-6 md:pb-5 md:pt-[220px] lg:px-8 lg:pt-[136px]'
    : 'oq-public-root min-h-screen px-4 pb-5 pt-[260px] sm:px-6 sm:pt-[220px] lg:px-8 lg:pt-[136px]';
  const headerClassName = isHome
    ? `oq-header-shell hidden fixed left-1/2 top-0 z-50 w-[calc(100%-3rem)] max-w-7xl -translate-x-1/2 rounded-b-[15px] px-6 py-5 md:block lg:w-[calc(100%-4rem)] ${isHome ? 'nav-home-highlight-2' : ''}`.trim()
    : `oq-header-shell fixed left-1/2 top-0 z-50 w-[calc(100%-2rem)] max-w-7xl -translate-x-1/2 rounded-b-[15px] px-5 py-5 sm:w-[calc(100%-3rem)] sm:px-6 lg:w-[calc(100%-4rem)] ${isHome ? 'nav-home-highlight-2' : ''}`.trim();

  return (
    <main className={mainClassName}>
      <div className="mx-auto max-w-7xl">
        {isHome ? (
          <div className="mb-6 flex items-center justify-between gap-3 md:hidden">
            <Link
              aria-label={viewerName ? `${viewerName} profile` : 'Profile'}
              className="oq-home-mobile-profile-chip"
              href={profileHref}
            >
              <span className="oq-home-mobile-profile-avatar" aria-hidden="true">
                {profileImage ? (
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    src={profileImage}
                  />
                ) : (
                  profileInitial
                )}
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <ThemeToggle
                className="h-auto border-transparent bg-transparent px-0 shadow-none hover:border-transparent"
                tone="public"
              />
              <Link className="oq-home-mobile-topbar-link" href={employersHref}>
                Employers
              </Link>
            </div>
          </div>
        ) : null}

        <header className={headerClassName}>
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
                    className={`oq-nav-link ${isHome ? 'nav-link-hover-2' : ''} ${isActive ? 'oq-nav-link-active' : ''}`.trim()}
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex flex-wrap items-center gap-4 lg:gap-5 lg:justify-end">
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
                      <Link className={isHome ? 'oq-nav-utility-link' : 'oq-nav-cta oq-nav-cta-secondary'} href="/employer/login">
                        Employers
                      </Link>
                      <Link className={isHome ? 'oq-nav-cta oq-nav-cta-secondary btn-box-style-2' : 'oq-nav-utility-link'} href="/login">
                        Login
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
                <Link className="oq-link" href="/jobs">Browse Opportunities</Link>
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

      {isHome ? (
        <nav className="oq-home-mobile-dock md:hidden" aria-label="Home mobile navigation">
          <div className="oq-home-mobile-dock-strip">
            {mobileHomeDockItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  className={`oq-home-mobile-dock-link ${isActive ? 'oq-nav-link-active' : ''}`.trim()}
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </main>
  );
}
