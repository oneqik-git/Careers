'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import LoadingState from '@/components/LoadingState';
import MessageBanner from '@/components/MessageBanner';
import PageHero from '@/components/PageHero';
import ProtectedRoute from '@/components/ProtectedRoute';
import SectionCard from '@/components/SectionCard';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { fetchEmployerJobs } from '@/services/jobs';
import { clearAuthStorage } from '@/utils/authStorage';
import {
  buildEmployerDashboardStats,
  formatCompanyScale,
  getJobActivityLabel,
  getNameInitials,
  getRecentActivityLabel,
} from '@/utils/employerHiring';
import { formatRelativeTime } from '@/utils/formatters';
import { employerNavItems } from '@/utils/navigation';

function QuickActionCard({ href, label, description, meta, toneClassName }) {
  return (
    <Link
      className={`rounded-[1.6rem] border p-5 transition hover:-translate-y-0.5 ${toneClassName}`.trim()}
      href={href}
    >
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{meta}</p>
      <h3 className="mt-3 text-xl font-medium tracking-[-0.04em] text-[var(--text)]">{label}</h3>
      <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{description}</p>
    </Link>
  );
}

export default function EmployerDashboardPage() {
  const router = useRouter();
  const { data, error, isLoading, refetch } = useCompanyProfile();
  const [jobs, setJobs] = useState([]);
  const [jobsError, setJobsError] = useState(null);
  const [isJobsLoading, setIsJobsLoading] = useState(true);

  async function loadHiringData() {
    setIsJobsLoading(true);
    setJobsError(null);

    try {
      const response = await fetchEmployerJobs();
      setJobs(response?.data || []);
    } catch (requestError) {
      setJobsError(requestError);
    } finally {
      setIsJobsLoading(false);
    }
  }

  function refreshAll() {
    refetch();
    loadHiringData();
  }

  useEffect(() => {
    loadHiringData();
  }, []);

  useEffect(() => {
    const authError = error || jobsError;

    if (authError?.code === 'AUTH_REQUIRED' || authError?.code === 'TOKEN_INVALID' || authError?.code === 'TOKEN_EXPIRED') {
      clearAuthStorage();
      router.replace('/employer/login');
    }
  }, [error, jobsError, router]);

  const hiringStats = useMemo(() => buildEmployerDashboardStats(jobs), [jobs]);
  const priorityJobs = useMemo(
    () => [...jobs]
      .sort((left, right) => {
        const activityDelta = (right.total_applications || 0) - (left.total_applications || 0);
        if (activityDelta !== 0) {
          return activityDelta;
        }

        return new Date(right.latest_activity_at || 0).getTime() - new Date(left.latest_activity_at || 0).getTime();
      })
      .slice(0, 4),
    [jobs]
  );

  const company = data?.company;
  const employer = data?.employer;
  const companyIdentity = [
    company?.industry,
    company?.headquarters,
    company?.funding_stage ? company.funding_stage.replaceAll('_', ' ') : null,
  ].filter(Boolean).join(' | ');

  return (
    <ProtectedRoute allowedRoles={['employer', 'admin']}>
      <DashboardShell
        title="Employer Dashboard"
        subtitle="Run hiring from one workspace with company context, funnel visibility, and direct review actions."
        onRefresh={refreshAll}
        navItems={employerNavItems}
      >
        {isLoading || isJobsLoading ? (
          <LoadingState
            description="Loading company context, hiring metrics, and the roles that need attention now."
            label="Employer workspace"
            title="Preparing your dashboard"
          />
        ) : error || jobsError ? (
          <MessageBanner tone="error" message={error?.message || jobsError?.message || 'Unable to load employer dashboard.'} />
        ) : (
          <div className="space-y-6">
            <PageHero
              eyebrow="Hiring control center"
              title={company?.name || 'Your company'}
              description={employer?.designation
                ? `${employer.designation}${employer?.department ? ` in ${employer.department}` : ''} is set up to move from open roles into candidate review without leaving the employer workspace.`
                : 'Manage active roles, applicant flow, and next decisions from one place.'}
              badges={[
                companyIdentity,
                company?.website_url,
                employer?.is_admin ? 'Company admin access' : 'Hiring workspace access',
              ].filter(Boolean)}
              actions={[
                { label: 'Post Job', href: '/employer/jobs/new' },
                { label: 'Review Applicants', href: priorityJobs[0] ? `/employer/jobs/applicants?jobId=${priorityJobs[0].id}` : '/employer/jobs', variant: 'secondary' },
              ]}
              aside={
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] border border-[rgba(93,224,230,0.22)] bg-[rgba(93,224,230,0.08)] text-lg font-semibold text-[var(--text)]">
                      {getNameInitials(company?.name)}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-sky-100/80">Company identity</p>
                      <p className="mt-2 text-xl font-semibold text-[var(--text)]">{company?.name || 'Your company'}</p>
                      <p className="mt-2 text-sm text-[var(--secondary-1)]">{company?.description || 'Company description not added yet.'}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                      <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">Hiring owner</p>
                      <p className="mt-2 text-sm font-medium text-[var(--text)]">{employer?.full_name || '-'}</p>
                      <p className="mt-1 text-sm text-[var(--text-soft)]">{employer?.department || 'Department not added'}</p>
                    </div>
                    <div className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                      <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">Company scale</p>
                      <p className="mt-2 text-sm font-medium text-[var(--text)]">
                        {formatCompanyScale(company?.employee_count_min, company?.employee_count_max)}
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-soft)]">{company?.founded_year ? `Founded ${company.founded_year}` : 'Founding year not added'}</p>
                    </div>
                  </div>
                </div>
              }
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard label="Open jobs" value={hiringStats.openJobs} helper="Roles currently live for candidates." tone="dark" />
              <StatCard label="Applicants" value={hiringStats.applicants} helper="All applications across posted roles." />
              <StatCard label="Under review" value={hiringStats.underReview} helper="Candidates waiting on recruiter decisions." />
              <StatCard label="Interview pipeline" value={hiringStats.interviewPipeline} helper="Profiles in scheduled or completed interview stages." />
              <StatCard label="Offers" value={hiringStats.offers} helper="Applications already in the offer stage." />
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <SectionCard
                eyebrow="Quick actions"
                title="Move the hiring work forward"
                description="Jump straight into the actions employers need most here: create a role, inspect jobs, and review live applicants."
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <QuickActionCard
                    href="/employer/jobs/new"
                    label="Post Job"
                    meta="Create role"
                    description="Open a new role with prescreen questions and role context."
                    toneClassName="border-[rgba(93,224,230,0.2)] bg-[rgba(93,224,230,0.08)]"
                  />
                  <QuickActionCard
                    href="/employer/jobs"
                    label="View Jobs"
                    meta="Operate list"
                    description="See applicant volume, funnel movement, and recent hiring activity by role."
                    toneClassName="border-[rgba(148,163,184,0.22)] bg-[rgba(255,255,255,0.03)]"
                  />
                  <QuickActionCard
                    href={priorityJobs[0] ? `/employer/jobs/applicants?jobId=${priorityJobs[0].id}` : '/employer/jobs'}
                    label="Review Applicants"
                    meta="Decision flow"
                    description="Open the busiest active role and move candidates through review faster."
                    toneClassName="border-[rgba(34,197,94,0.22)] bg-[rgba(22,163,74,0.08)]"
                  />
                </div>
              </SectionCard>

              <SectionCard
                eyebrow="Company snapshot"
                title="Employer identity and operating context"
                description="The employer workspace stays anchored to the actual company profile so hiring decisions do not feel detached from the business."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.15rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                    <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">Website</p>
                    <p className="mt-2 text-sm font-medium text-[var(--text)]">{company?.website_url || 'Not added'}</p>
                  </div>
                  <div className="rounded-[1.15rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                    <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">Headquarters</p>
                    <p className="mt-2 text-sm font-medium text-[var(--text)]">{company?.headquarters || 'Not added'}</p>
                  </div>
                  <div className="rounded-[1.15rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                    <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">Funding stage</p>
                    <p className="mt-2 text-sm font-medium text-[var(--text)]">{company?.funding_stage ? company.funding_stage.replaceAll('_', ' ') : 'Not added'}</p>
                  </div>
                  <div className="rounded-[1.15rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                    <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">Hiring access</p>
                    <p className="mt-2 text-sm font-medium text-[var(--text)]">{employer?.is_admin ? 'Admin permissions enabled' : 'Standard employer permissions'}</p>
                  </div>
                </div>
              </SectionCard>
            </div>

            <SectionCard
              eyebrow="Hiring attention"
              title="Roles needing visibility now"
              description="These roles float to the top based on applicant volume and recent movement so the dashboard feels like a working queue, not a static profile screen."
            >
              {priorityJobs.length ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {priorityJobs.map((job) => {
                    const latestActivity = job.recent_activity?.[0] || null;

                    return (
                      <div key={job.id} className="rounded-[1.5rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-medium tracking-[-0.04em] text-[var(--text)]">{job.title}</h3>
                              <StatusBadge status={job.status} label={job.status === 'active' ? 'Open role' : undefined} />
                            </div>
                            <p className="mt-2 text-sm text-[var(--text-soft)]">{getJobActivityLabel(job)}</p>
                          </div>
                          <Link className="oq-button-secondary" href={`/employer/jobs/applicants?jobId=${job.id}`}>
                            Review
                          </Link>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-[1.1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
                            <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Applicants</p>
                            <p className="mt-2 text-sm font-medium text-[var(--text)]">{job.total_applications || 0}</p>
                          </div>
                          <div className="rounded-[1.1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
                            <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Interviews</p>
                            <p className="mt-2 text-sm font-medium text-[var(--text)]">{job.interview_pipeline_count || 0}</p>
                          </div>
                          <div className="rounded-[1.1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
                            <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Latest activity</p>
                            <p className="mt-2 text-sm font-medium text-[var(--text)]">
                              {latestActivity ? formatRelativeTime(latestActivity.status_updated_at || latestActivity.applied_at) : 'No movement'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-[1.15rem] border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
                          <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">Recent movement</p>
                          <p className="mt-2 text-sm text-[var(--text)]">{getRecentActivityLabel(latestActivity)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <MessageBanner message="Post a role to start building the employer hiring workspace." />
              )}
            </SectionCard>
          </div>
        )}
      </DashboardShell>
    </ProtectedRoute>
  );
}
