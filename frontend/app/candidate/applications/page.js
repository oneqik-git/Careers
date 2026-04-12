'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import EmptyState from '@/components/EmptyState';
import MessageBanner from '@/components/MessageBanner';
import ProtectedRoute from '@/components/ProtectedRoute';
import SectionCard from '@/components/SectionCard';
import { fetchMyApplications } from '@/services/jobs';
import { clearAuthStorage } from '@/utils/authStorage';
import { formatDateTime, formatSalaryRange, formatStatus } from '@/utils/formatters';

const candidateNavItems = [
  { label: 'Dashboard', href: '/candidate/dashboard' },
  { label: 'Browse Jobs', href: '/candidate/jobs' },
  { label: 'My Applications', href: '/candidate/applications' },
];

export default function CandidateApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadApplications() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchMyApplications();
      setApplications(response?.data || []);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    if (error?.code === 'AUTH_REQUIRED' || error?.code === 'TOKEN_INVALID' || error?.code === 'TOKEN_EXPIRED') {
      clearAuthStorage();
      router.replace('/login');
    }
  }, [error, router]);

  return (
    <ProtectedRoute allowedRoles={['candidate']}>
      <DashboardShell
        title="My Applications"
        subtitle="Track statuses from GET /api/jobs/my/applications."
        onRefresh={loadApplications}
        navItems={candidateNavItems}
      >
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading applications...</p>
        ) : error ? (
          <MessageBanner tone="error" message={error.message || 'Unable to load applications.'} />
        ) : applications.length ? (
          <div className="space-y-4">
            {applications.map((application) => (
              <SectionCard
                key={application.id}
                title={application.title}
                description={`${application.company_name} | Applied ${formatDateTime(application.applied_at)}`}
                action={
                  <Link
                    className="inline-flex rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    href={`/candidate/application-history?applicationId=${application.id}`}
                  >
                    View history
                  </Link>
                }
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Status</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{formatStatus(application.status)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Salary</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {formatSalaryRange(application.salary_min, application.salary_max, application.salary_disclosed)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Career Score At Apply</p>
                    <p className="mt-2 text-sm text-slate-700">{application.career_score_at_apply ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Last Updated</p>
                    <p className="mt-2 text-sm text-slate-700">{formatDateTime(application.status_updated_at)}</p>
                  </div>
                </div>
              </SectionCard>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No applications yet"
            description="Apply to a job to see status tracking and history here."
          />
        )}
      </DashboardShell>
    </ProtectedRoute>
  );
}
