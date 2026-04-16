'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearAuthStorage, getStoredRole } from '@/utils/authStorage';
import DashboardNav from '@/components/DashboardNav';
import ThemeToggle from '@/components/ThemeToggle';

export default function DashboardShell({ title, subtitle, onRefresh, navItems = [], children }) {
  const router = useRouter();
  const role = getStoredRole();
  const workspaceLabel = role === 'candidate' ? 'candidate workspace' : role === 'employer' || role === 'admin' ? 'employer workspace' : 'dashboard';
  const publicHref = role === 'candidate' ? '/jobs' : '/employers';

  function handleLogout() {
    clearAuthStorage();
    router.push('/');
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="oq-shell rounded-[32px] p-5 sm:p-6">
          <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--text-muted)]">{workspaceLabel}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text)]">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-[var(--text-soft)]">{subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ThemeToggle />
              <Link className="oq-button-ghost" href={publicHref}>
                Public Site
              </Link>
              {onRefresh ? (
                <button
                  className="oq-button-secondary"
                  type="button"
                  onClick={onRefresh}
                >
                  Refresh
                </button>
              ) : null}
              <button
                className="oq-button-primary"
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
          <div className="pt-6">
            <DashboardNav items={navItems} />
            <div className="space-y-6">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
