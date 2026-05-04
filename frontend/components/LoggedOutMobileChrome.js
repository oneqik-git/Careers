'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import { getStoredRole } from '@/utils/authStorage';

const mobileDockItems = [
  { label: 'Home', href: '/' },
  { label: 'Opportunities', href: '/jobs' },
  { label: 'Community', href: '/community' },
];

export default function LoggedOutMobileChrome({
  showTopbar = true,
  showDock = true,
  topbarClassName = 'mb-6 flex items-center justify-between gap-3 md:hidden',
}) {
  const pathname = usePathname();
  const [role, setRole] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setRole(getStoredRole());
    setIsReady(true);
  }, []);

  if (!isReady || role) {
    return null;
  }

  const candidateLoginHref = `${pathname || '/'}?auth=login`;

  return (
    <>
      {showTopbar ? (
        <div className={topbarClassName}>
          <Link
            aria-label="Login"
            className="oq-home-mobile-profile-chip"
            href={candidateLoginHref}
          >
            <span className="oq-home-mobile-profile-avatar" aria-hidden="true">
              P
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle
              className="h-auto border-transparent bg-transparent px-0 shadow-none hover:border-transparent"
              tone="public"
            />
            <Link className="oq-home-mobile-topbar-link" href="/employer/login">
              Employers
            </Link>
          </div>
        </div>
      ) : null}

      {showDock ? (
        <nav className="oq-home-mobile-dock md:hidden" aria-label="Public mobile navigation">
          <div className="oq-home-mobile-dock-strip">
            {mobileDockItems.map((item) => {
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
    </>
  );
}
