'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import EmptyState from '@/components/EmptyState';
import JobSummaryCard from '@/components/JobSummaryCard';
import MessageBanner from '@/components/MessageBanner';
import PageHero from '@/components/PageHero';
import ProtectedRoute from '@/components/ProtectedRoute';
import StatusBadge from '@/components/StatusBadge';
import { fetchEmployerJobs } from '@/services/jobs';
import { clearAuthStorage } from '@/utils/authStorage';
import { formatExperienceRange } from '@/utils/formatters';
import { employerNavItems } from '@/utils/navigation';

export default function EmployerJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadJobs() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchEmployerJobs();
      setJobs(response?.data || []);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (error?.code === 'AUTH_REQUIRED' || error?.code === 'TOKEN_INVALID' || error?.code === 'TOKEN_EXPIRED') {
      clearAuthStorage();
      router.replace('/employer/login');
    }
  }, [error, router]);

  return (
    <ProtectedRoute allowedRoles={['employer', 'admin']}>
      <DashboardShell
        title="Posted Jobs"
        subtitle="See each role with clearer hiring volume, status, and direct access to applicants."
        onRefresh={loadJobs}
        navItems={employerNavItems}
      >
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading posted jobs...</p>
        ) : error ? (
          <MessageBanner tone="error" message={error.message || 'Unable to load posted jobs.'} />
        ) : jobs.length ? (
          <div className="space-y-6">
            <PageHero
              eyebrow="Employer jobs"
              title="Manage posted roles"
              description="Each role card brings the applicant funnel closer to the surface so employers can move from job overview to candidate review with less friction."
              badges={[
                `${jobs.length} posted role${jobs.length === 1 ? '' : 's'}`,
                `${jobs.reduce((sum, job) => sum + (job.total_applications ?? 0), 0)} total applications`,
              ]}
              actions={[
                { label: 'Post Job', href: '/employer/jobs/new' },
                { label: 'Dashboard', href: '/employer/dashboard', variant: 'secondary' },
              ]}
            />

            <div className="space-y-4">
              {jobs.map((job) => (
                <JobSummaryCard
                  key={job.id}
                  job={job}
                  href={`/employer/jobs/applicants?jobId=${job.id}`}
                  actionLabel="View applicants"
                  badge={<StatusBadge status={job.status} />}
                  helper={[job.department, job.job_function].filter(Boolean).join(' | ')}
                  stats={[
                    { label: 'Experience', value: formatExperienceRange(job.experience_min_years, job.experience_max_years) },
                    { label: 'Applications', value: job.total_applications ?? 0 },
                    { label: 'Shortlisted', value: job.shortlisted ?? 0 },
                  ]}
                  footer={
                    <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">Applicants: {job.total_applications ?? 0}</div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">Shortlisted: {job.shortlisted ?? 0}</div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">Joined: {job.hired ?? 0}</div>
                    </div>
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No posted jobs yet"
            description="Create a job first, then applicant tracking and hiring status updates will appear here."
            action={
              <Link
                className="inline-flex rounded-2xl bg-slate-950 px-4 py-2.5 text-sm text-white transition hover:bg-slate-800"
                href="/employer/jobs/new"
              >
                Post your first job
              </Link>
            }
          />
        )}
      </DashboardShell>
    </ProtectedRoute>
  );
}
