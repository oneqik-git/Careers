'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import DashboardShell from '@/components/DashboardShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useCandidateProfile } from '@/hooks/useCandidateProfile';
import { clearAuthStorage } from '@/utils/authStorage';
import { useRouter } from 'next/navigation';

const candidateNavItems = [
  { label: 'Dashboard', href: '/candidate/dashboard' },
  { label: 'Browse Jobs', href: '/candidate/jobs' },
  { label: 'My Applications', href: '/candidate/applications' },
];

export default function CandidateDashboardPage() {
  const router = useRouter();
  const { data, error, isLoading, refetch } = useCandidateProfile();

  useEffect(() => {
    if (error?.code === 'AUTH_REQUIRED' || error?.code === 'TOKEN_INVALID' || error?.code === 'TOKEN_EXPIRED') {
      clearAuthStorage();
      router.replace('/login');
    }
  }, [error, router]);

  return (
    <ProtectedRoute allowedRoles={['candidate']}>
      <DashboardShell
        title="Candidate Dashboard"
        subtitle="Connected to GET /api/candidates/me"
        onRefresh={refetch}
        navItems={candidateNavItems}
      >
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading profile...</p>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error.message || 'Unable to load candidate dashboard.'}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Name</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{data?.full_name || '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Career Score</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{data?.score?.total_score ?? '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Headline</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{data?.headline || '-'}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-900">Candidate prototype flow</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  className="rounded-2xl bg-slate-950 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
                  href="/candidate/jobs"
                >
                  Browse jobs
                </Link>
                <Link
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  href="/candidate/applications"
                >
                  View applications
                </Link>
              </div>
            </div>
          </div>
        )}
      </DashboardShell>
    </ProtectedRoute>
  );
}
