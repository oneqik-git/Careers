'use client';

import { useRouter } from 'next/navigation';
import { clearAuthStorage, getStoredRole } from '@/utils/authStorage';
import DashboardNav from '@/components/DashboardNav';

export default function DashboardShell({ title, subtitle, onRefresh, navItems = [], children }) {
  const router = useRouter();

  function handleLogout() {
    clearAuthStorage();
    router.push('/login');
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_56px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{getStoredRole() || 'dashboard'}</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h1>
              <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
            </div>
            <div className="flex gap-3">
              <button
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                type="button"
                onClick={onRefresh}
                disabled={!onRefresh}
              >
                Refresh
              </button>
              <button
                className="rounded-2xl bg-slate-950 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
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
