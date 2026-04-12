'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { clearAuthStorage } from '@/utils/authStorage';

const employerNavItems = [
  { label: 'Dashboard', href: '/employer/dashboard' },
  { label: 'Post Job', href: '/employer/jobs/new' },
  { label: 'Posted Jobs', href: '/employer/jobs' },
];

export default function EmployerDashboardPage() {
  const router = useRouter();
  const { data, error, isLoading, refetch } = useCompanyProfile();

  useEffect(() => {
    if (error?.code === 'AUTH_REQUIRED' || error?.code === 'TOKEN_INVALID' || error?.code === 'TOKEN_EXPIRED') {
      clearAuthStorage();
      router.replace('/login');
    }
  }, [error, router]);

  return (
    <ProtectedRoute allowedRoles={['employer', 'admin']}>
      <DashboardShell
        title="Employer Dashboard"
        subtitle="Connected to GET /api/companies/me"
        onRefresh={refetch}
        navItems={employerNavItems}
      >
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading company profile...</p>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error.message || 'Unable to load employer dashboard.'}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Company Name</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{data?.company?.name || '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Employer Name</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{data?.employer?.full_name || '-'}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-900">Employer prototype flow</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  className="rounded-2xl bg-slate-950 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
                  href="/employer/jobs/new"
                >
                  Post a job
                </Link>
                <Link
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  href="/employer/jobs"
                >
                  Manage posted jobs
                </Link>
              </div>
            </div>
          </div>
        )}
      </DashboardShell>
    </ProtectedRoute>
  );
}
