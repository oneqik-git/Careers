'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import EmptyState from '@/components/EmptyState';
import MessageBanner from '@/components/MessageBanner';
import PageHero from '@/components/PageHero';
import ProtectedRoute from '@/components/ProtectedRoute';
import SectionCard from '@/components/SectionCard';
import StatusBadge from '@/components/StatusBadge';
import { fetchMyApplications } from '@/services/jobs';
import { clearAuthStorage } from '@/utils/authStorage';
import { candidateNavItems } from '@/utils/navigation';
import { formatDateTime, formatSalaryRange, formatStatus } from '@/utils/formatters';

export default function CandidateApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadApplications() {
    setIsLoading(true);
    setError(null);

    try {
      const applicationsData = await fetchMyApplications();
      setApplications(applicationsData || []);
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
        subtitle="Track every application with clearer status visibility, timeline access, and account context."
        onRefresh={loadApplications}
        navItems={candidateNavItems}
      >
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading applications...</p>
        ) : error ? (
          <MessageBanner tone="error" message={error.message || 'Unable to load applications.'} />
        ) : applications.length ? (
          <div className="space-y-6">
            <PageHero
              eyebrow="Application tracker"
              title="Your application activity"
              description="Statuses and last-updated moments are surfaced first, with each card linking directly to its timeline so candidates do not have to hunt for history."
              badges={[
                `${applications.length} total application${applications.length === 1 ? '' : 's'}`,
                `${applications.filter((item) => !['joined', 'rejected', 'withdrawn', 'offer_declined'].includes(item.status)).length} active`,
                `${applications.filter((item) => ['offer_sent', 'offer_accepted', 'joined'].includes(item.status)).length} offer or join outcomes`,
              ]}
              actions={[
                { label: 'Browse Jobs', href: '/candidate/jobs' },
                { label: 'Dashboard', href: '/candidate/dashboard', variant: 'secondary' },
              ]}
            />

            <div className="space-y-4">
              {applications.map((application) => (
                <SectionCard
                  key={application.id}
                  title={application.title}
                  description={`${application.company_name} | Applied ${formatDateTime(application.applied_at)}`}
                  action={
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={application.status} />
                      <Link
                        className="inline-flex rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                        href={`/candidate/application-history?applicationId=${application.id}`}
                      >
                        View history
                      </Link>
                    </div>
                  }
                >
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">AI Match</p>
                      <p className="mt-2 text-sm text-slate-700">{application.ai_match_score ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Last Updated</p>
                      <p className="mt-2 text-sm text-slate-700">{formatDateTime(application.status_updated_at)}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {application.total_apps_to_company > 1
                      ? `You have ${application.total_apps_to_company} applications with ${application.company_name}.`
                      : 'This is currently your only application with this company.'}
                  </div>
                </SectionCard>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No applications yet"
            description="Apply to a job to start tracking statuses and timeline updates here."
            action={
              <Link
                className="inline-flex rounded-2xl bg-slate-950 px-4 py-2.5 text-sm text-white transition hover:bg-slate-800"
                href="/candidate/jobs"
              >
                Browse jobs
              </Link>
            }
          />
        )}
      </DashboardShell>
    </ProtectedRoute>
  );
}
