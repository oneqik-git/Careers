'use client';

import { useRouter } from 'next/navigation';
import { clearAuthStorage, getStoredRole } from '@/utils/authStorage';
import DashboardNav from '@/components/DashboardNav';
import ThemeToggle from '@/components/ThemeToggle';

export default function DashboardShell({ title, subtitle, onRefresh, navItems = [], children }) {
  const router = useRouter();

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
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--text-muted)]">{getStoredRole() || 'dashboard'}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text)]">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-[var(--text-soft)]">{subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ThemeToggle />
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
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
