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
import { fetchJobs } from '@/services/jobs';
import { clearAuthStorage } from '@/utils/authStorage';
import { formatExperienceRange, formatStatus } from '@/utils/formatters';
import { candidateNavItems } from '@/utils/navigation';

export default function CandidateJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadJobs() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchJobs();
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
      router.replace('/login');
    }
  }, [error, router]);

  return (
    <ProtectedRoute allowedRoles={['candidate']}>
      <DashboardShell
        title="Jobs"
        subtitle="Browse active openings with clearer company, salary, experience, and application context."
        onRefresh={loadJobs}
        navItems={candidateNavItems}
      >
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading jobs...</p>
        ) : error ? (
          <MessageBanner tone="error" message={error.message || 'Unable to load jobs.'} />
        ) : jobs.length ? (
          <div className="space-y-6">
            <PageHero
              eyebrow="Candidate jobs"
              title="Find roles that fit your profile"
              description="These are active jobs you can already access from the current account. Cards highlight the details candidates usually scan first before opening the full job view."
              badges={[`${jobs.length} active role${jobs.length === 1 ? '' : 's'}`]}
              actions={[
                { label: 'Dashboard', href: '/candidate/dashboard', variant: 'secondary' },
                { label: 'My Applications', href: '/candidate/applications' },
              ]}
              aside={
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-sky-100/80">Quick note</p>
                  <p className="mt-3 text-lg font-semibold">Open the detail page before applying.</p>
                  <p className="mt-2 text-sm text-slate-200">
                    The apply section, prescreen questions, and fuller role breakdown live there.
                  </p>
                </div>
              }
            />

            <div className="space-y-4">
              {jobs.map((job) => (
                <JobSummaryCard
                  key={job.id}
                  job={job}
                  href={`/candidate/jobs/detail?jobId=${job.id}`}
                  actionLabel="Review role"
                  badge={
                    job.applied_status ? (
                      <StatusBadge status={job.applied_status} label={`Applied: ${formatStatus(job.applied_status)}`} />
                    ) : null
                  }
                  helper={[job.company_name, job.industry].filter(Boolean).join(' | ')}
                  stats={[
                    { label: 'Experience', value: formatExperienceRange(job.experience_min_years, job.experience_max_years) },
                    { label: 'Your score', value: job.candidate_career_score ?? '-' },
                    { label: 'Company score', value: job.company_score ?? '-' },
                  ]}
                  footer={
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-wrap gap-2">
                        {(job.required_skills || []).slice(0, 4).map((skill) => (
                          <span key={skill} className="rounded-full bg-sky-50 px-3 py-1.5 text-sm text-sky-700">
                            {skill}
                          </span>
                        ))}
                        {!job.required_skills?.length ? (
                          <span className="text-sm text-slate-500">Required skills are not listed yet.</span>
                        ) : null}
                      </div>
                      <p className="text-sm text-slate-600">
                        {job.applied_status ? 'You already applied to this role.' : 'Open for applications.'}
                      </p>
                    </div>
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No jobs found"
            description="No active jobs matched the current account access right now. Refresh later or return to the dashboard."
            action={
              <Link
                className="inline-flex rounded-2xl bg-slate-950 px-4 py-2.5 text-sm text-white transition hover:bg-slate-800"
                href="/candidate/dashboard"
              >
                Back to dashboard
              </Link>
            }
          />
        )}
      </DashboardShell>
    </ProtectedRoute>
  );
}
