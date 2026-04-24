'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import LoggedOutMobileChrome from '@/components/LoggedOutMobileChrome';
import PublicHeaderNav, { PublicBrandLockup } from '@/components/PublicHeaderNav';
import { getStoredRole } from '@/utils/authStorage';

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

export default function PublicShell({ children, utilityContent }) {
  const pathname = usePathname();
  const [role, setRole] = useState(null);
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    setRole(getStoredRole());
    setIsSessionReady(true);
  }, []);

  const isHome = pathname === '/';
  const usesLoggedOutSpacing = isHome || !isSessionReady || !role;
  const mainClassName = usesLoggedOutSpacing
    ? 'oq-public-root min-h-screen px-[30px] pb-[124px] pt-6 md:px-6 md:pb-5 md:pt-[220px] lg:px-8 lg:pt-[136px]'
    : 'oq-public-root min-h-screen px-[30px] pb-5 pt-[260px] sm:px-6 sm:pt-[220px] lg:px-8 lg:pt-[136px]';

  return (
    <main className={mainClassName}>
      <div className="mx-auto max-w-7xl">
        <LoggedOutMobileChrome showDock={false} />

        <PublicHeaderNav utilityContent={utilityContent} />

        {children}

        <footer className="oq-footer-shell mt-20 overflow-hidden rounded-[24px] px-6 py-10 sm:px-8 sm:py-12">
          <div className="h-[1px] w-full rounded-full bg-[linear-gradient(90deg,rgba(93,224,230,0.6),rgba(49,131,255,0.55),rgba(192,207,225,0.35))]" />
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
            <div className="space-y-4">
              <PublicBrandLockup />
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

      <LoggedOutMobileChrome showTopbar={false} />
    </main>
  );
}
