'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import EmptyState from '@/components/EmptyState';
import JobSummaryCard from '@/components/JobSummaryCard';
import LoadingState from '@/components/LoadingState';
import MessageBanner from '@/components/MessageBanner';
import PageHero from '@/components/PageHero';
import ProtectedRoute from '@/components/ProtectedRoute';
import StatusBadge from '@/components/StatusBadge';
import { fetchEmployerJobs } from '@/services/jobs';
import { clearAuthStorage } from '@/utils/authStorage';
import {
  buildEmployerJobsSummary,
  formatPercentValue,
  getJobActivityLabel,
  getRecentActivityLabel,
} from '@/utils/employerHiring';
import { formatExperienceRange, formatRelativeTime } from '@/utils/formatters';
import { employerNavItems } from '@/utils/navigation';

function JobsSummaryTile({ label, value, helper }) {
  return (
    <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-4 shadow-[0_18px_28px_rgba(0,0,0,0.16)]">
      <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[var(--text)]">{value}</p>
      <p className="mt-2 text-sm text-[var(--text-soft)]">{helper}</p>
    </div>
  );
}

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

  const jobsSummary = useMemo(() => buildEmployerJobsSummary(jobs), [jobs]);
  const visibleJobs = useMemo(
    () => [...jobs].sort((left, right) => {
      const offerDelta = (right.offers_count || 0) - (left.offers_count || 0);
      if (offerDelta !== 0) {
        return offerDelta;
      }

      const interviewDelta = (right.interview_pipeline_count || 0) - (left.interview_pipeline_count || 0);
      if (interviewDelta !== 0) {
        return interviewDelta;
      }

      return (right.total_applications || 0) - (left.total_applications || 0);
    }),
    [jobs]
  );

  return (
    <ProtectedRoute allowedRoles={['employer', 'admin']}>
      <DashboardShell
        title="Posted Jobs"
        subtitle="Operate every role with clearer applicant volume, funnel activity, and direct paths into review."
        onRefresh={loadJobs}
        navItems={employerNavItems}
      >
        {isLoading ? (
          <LoadingState
            description="Loading job performance, funnel movement, and recent applicant activity."
            label="Employer jobs"
            title="Preparing your jobs view"
          />
        ) : error ? (
          <MessageBanner tone="error" message={error.message || 'Unable to load posted jobs.'} />
        ) : jobs.length ? (
          <div className="space-y-6">
            <PageHero
              eyebrow="Employer jobs"
              title="Role overview that supports decisions"
              description="Each role now shows not just posting metadata, but where the funnel is moving, which jobs need attention, and how quickly you can jump into candidate review."
              badges={[
                `${jobsSummary.openJobs} open role${jobsSummary.openJobs === 1 ? '' : 's'}`,
                `${jobsSummary.applicants} applicants`,
                `${jobsSummary.interviewPipeline} in interviews`,
                `${jobsSummary.offers} offers live`,
              ]}
              actions={[
                { label: 'Post Job', href: '/employer/jobs/new' },
                { label: 'Dashboard', href: '/employer/dashboard', variant: 'secondary' },
              ]}
            />

            <section className="rounded-[1.65rem] border border-[rgba(29,40,56,0.9)] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),transparent_100%),rgba(5,18,43,0.94)] p-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <JobsSummaryTile label="Open roles" value={jobsSummary.openJobs} helper="Posted jobs currently visible to candidates." />
                <JobsSummaryTile label="Applicants" value={jobsSummary.applicants} helper="Total inbound applications across roles." />
                <JobsSummaryTile label="New to review" value={jobsSummary.newApplicants} helper="Fresh applicants still waiting for first pass." />
                <JobsSummaryTile label="Under review" value={jobsSummary.underReview} helper="Candidates sitting with the hiring team." />
                <JobsSummaryTile label="On hold" value={jobsSummary.onHold} helper="Profiles paused pending team alignment." />
              </div>
            </section>

            <div className="space-y-4">
              <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--text-soft)]">
                  Showing <span className="font-medium text-[var(--text)]">{visibleJobs.length}</span> role{visibleJobs.length === 1 ? '' : 's'} in the employer workspace.
                </p>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Open a role to review applicants and full timeline context.</p>
              </div>
              {visibleJobs.map((job) => (
                <JobSummaryCard
                  key={job.id}
                  job={job}
                  href={`/employer/jobs/applicants?jobId=${job.id}`}
                  actionLabel="View applicants"
                  badge={<StatusBadge status={job.status} label={job.status === 'active' ? 'Open role' : undefined} />}
                  helper={getJobActivityLabel(job)}
                  metaChips={[
                    job.department,
                    job.job_function,
                    job.latest_activity_at ? `Latest activity ${formatRelativeTime(job.latest_activity_at)}` : 'No candidate movement yet',
                  ].filter(Boolean)}
                  stats={[
                    { label: 'Experience', value: formatExperienceRange(job.experience_min_years, job.experience_max_years) },
                    { label: 'Applicants', value: job.total_applications ?? 0 },
                    { label: 'Interviews', value: job.interview_pipeline_count ?? 0 },
                    { label: 'Offers', value: job.offers_count ?? 0 },
                  ]}
                  footer={(
                    <div className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Submitted</p>
                          <p className="mt-2 text-sm font-medium text-[var(--text)]">{job.submitted_count ?? 0}</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Under review</p>
                          <p className="mt-2 text-sm font-medium text-[var(--text)]">{job.under_review_count ?? 0}</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Shortlisted</p>
                          <p className="mt-2 text-sm font-medium text-[var(--text)]">{job.shortlisted ?? 0}</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Hired</p>
                          <p className="mt-2 text-sm font-medium text-[var(--text)]">{job.hired ?? 0}</p>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                        <div className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">Recent candidate movement</p>
                              <p className="mt-2 text-sm text-[var(--text-soft)]">Use these shortcuts to jump from the role view directly into the most recent application history.</p>
                            </div>
                            <Link className="oq-button-secondary" href={`/employer/jobs/applicants?jobId=${job.id}`}>
                              Open review queue
                            </Link>
                          </div>

                          {job.recent_activity?.length ? (
                            <div className="mt-4 space-y-3">
                              {job.recent_activity.map((activity) => (
                                <div key={activity.application_id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                                  <div>
                                    <p className="text-sm font-medium text-[var(--text)]">{activity.full_name}</p>
                                    <p className="mt-1 text-sm text-[var(--text-soft)]">{getRecentActivityLabel(activity)}</p>
                                  </div>
                                  <Link className="text-sm font-semibold text-[var(--brand-accent)]" href={`/employer/application-history?applicationId=${activity.application_id}`}>
                                    View history
                                  </Link>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-4 text-sm text-[var(--text-soft)]">No applications have moved through this role yet.</p>
                          )}
                        </div>

                        <div className="rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
                          <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">Decision snapshot</p>
                          <div className="mt-4 space-y-3 text-sm">
                            <div className="flex items-center justify-between gap-3 rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                              <span className="text-[var(--text-soft)]">Offer conversion lane</span>
                              <span className="font-medium text-[var(--text)]">{formatPercentValue(job.total_applications ? Math.round(((job.offers_count || 0) / job.total_applications) * 100) : null)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                              <span className="text-[var(--text-soft)]">Interview load</span>
                              <span className="font-medium text-[var(--text)]">{job.interview_pipeline_count || 0} active</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                              <span className="text-[var(--text-soft)]">Paused candidates</span>
                              <span className="font-medium text-[var(--text)]">{job.on_hold_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            eyebrow="Employer jobs"
            title="No posted jobs yet"
            description="Create a job first, then applicant tracking and hiring status updates will appear here."
            action={(
              <Link className="oq-button-primary" href="/employer/jobs/new">
                Post your first job
              </Link>
            )}
          />
        )}
      </DashboardShell>
    </ProtectedRoute>
  );
}
