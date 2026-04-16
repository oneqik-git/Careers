'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ApplicationPipeline from '@/components/ApplicationPipeline';
import DashboardShell from '@/components/DashboardShell';
import EmptyState from '@/components/EmptyState';
import MessageBanner from '@/components/MessageBanner';
import ProtectedRoute from '@/components/ProtectedRoute';
import StatusBadge from '@/components/StatusBadge';
import { fetchMyApplications } from '@/services/jobs';
import { clearAuthStorage } from '@/utils/authStorage';
import {
  getApplicationFeedback,
  getApplicationFilterDefinitions,
  getApplicationFilterKey,
  getApplicationStatusMeta,
  isActiveApplication,
} from '@/utils/applicationStatus';
import { candidateNavItems } from '@/utils/navigation';
import {
  formatDateTime,
  formatExperienceRange,
  formatRelativeTime,
  formatSalaryRange,
  formatStatus,
} from '@/utils/formatters';

function getCompanyInitials(companyName) {
  const parts = String(companyName || 'Company')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return (parts.join(' ').match(/\b\w/g) || ['C']).join('').slice(0, 2).toUpperCase();
}

function renderMetric(label, value) {
  return (
    <div className="rounded-[1.15rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.03)] px-4 py-3 shadow-[0_14px_24px_rgba(0,0,0,0.14)]">
      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[var(--text)]">{value}</p>
    </div>
  );
}

function getVisibleApplications(applications, activeFilter) {
  if (activeFilter === 'all') {
    return applications;
  }

  return applications.filter((application) => getApplicationFilterKey(application.status) === activeFilter);
}

export default function CandidateApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
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

  const filterDefinitions = useMemo(() => getApplicationFilterDefinitions(applications), [applications]);
  const visibleApplications = useMemo(() => getVisibleApplications(applications, activeFilter), [activeFilter, applications]);

  const trackerSummary = useMemo(() => {
    const activeCount = applications.filter((application) => isActiveApplication(application.status)).length;
    const offerCount = applications.filter((application) => getApplicationFilterKey(application.status) === 'offer').length;
    const holdCount = applications.filter((application) => String(application.status || '').toLowerCase() === 'on_hold').length;
    const finalCount = applications.filter((application) => ['rejected', 'offer_declined', 'withdrawn', 'joined'].includes(String(application.status || '').toLowerCase())).length;

    return [
      { label: 'Active', value: activeCount },
      { label: 'Offers', value: offerCount },
      { label: 'On Hold', value: holdCount },
      { label: 'Finalized', value: finalCount },
    ];
  }, [applications]);

  return (
    <ProtectedRoute allowedRoles={['candidate']}>
      <DashboardShell
        title="My Applications"
        subtitle="Track every application as a real process, not a flat list."
        onRefresh={loadApplications}
        navItems={candidateNavItems}
      >
        {isLoading ? (
          <p className="text-sm text-[var(--text-soft)]">Loading applications...</p>
        ) : error ? (
          <MessageBanner tone="error" message={error.message || 'Unable to load applications.'} />
        ) : applications.length ? (
          <div className="space-y-6">
            <section className="oq-shell rounded-[1.85rem] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-[0.76rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">Applied flow</p>
                  <h2 className="mt-2 text-[1.9rem] font-medium tracking-[-0.05em] text-[var(--text)]">Your application tracker</h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
                    Open cards show live status progress, employer feedback when it exists, and what the current state means without forcing you into a detail view first.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link className="oq-button-secondary" href="/jobs">
                    Browse Jobs
                  </Link>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {trackerSummary.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[1.15rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.03)] px-4 py-3 shadow-[0_18px_28px_rgba(0,0,0,0.16)]"
                  >
                    <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">{stat.label}</p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[var(--text)]">{stat.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[1.65rem] border border-[rgba(29,40,56,0.9)] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),transparent_100%),rgba(5,18,43,0.94)] p-4 shadow-[0_18px_34px_rgba(0,0,0,0.18)]">
              <div className="flex flex-wrap gap-3">
                {filterDefinitions.map((filter) => {
                  const isActive = activeFilter === filter.key;

                  return (
                    <button
                      key={filter.key}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em] transition ${isActive ? 'border-[rgba(93,224,230,0.28)] bg-[rgba(93,224,230,0.14)] text-white' : 'border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.03)] text-[var(--text-soft)] hover:border-[rgba(93,224,230,0.22)] hover:text-white'}`.trim()}
                      onClick={() => setActiveFilter(filter.key)}
                      type="button"
                    >
                      {filter.label} ({filter.count})
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="space-y-4">
              {visibleApplications.map((application) => {
                const meta = getApplicationStatusMeta(application.status);
                const feedback = getApplicationFeedback(application);
                const appliedAtLabel = application.applied_at ? formatRelativeTime(application.applied_at) : '-';
                const contextChips = [
                  application.location,
                  application.work_mode ? formatStatus(application.work_mode) : null,
                  formatExperienceRange(application.experience_min_years, application.experience_max_years),
                ].filter(Boolean);

                return (
                  <Link
                    key={application.id}
                    className="block"
                    href={`/candidate/application-history?applicationId=${application.id}`}
                  >
                    <article className={`rounded-[1.85rem] border p-5 shadow-[0_22px_40px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 ${meta.cardClassName}`.trim()}>
                      <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex min-w-0 gap-4">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border text-sm font-semibold tracking-[0.08em] ${meta.badgeClassName}`.trim()}>
                              {getCompanyInitials(application.company_name)}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-[1.2rem] font-medium tracking-[-0.04em] text-[var(--text)]">
                                  {application.title}
                                </h3>
                                <StatusBadge status={application.status} />
                              </div>
                              <p className="mt-1 text-sm text-[var(--text-soft)]">
                                {application.company_name} - Applied {appliedAtLabel}
                              </p>

                              {contextChips.length ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {contextChips.map((chip) => (
                                    <span key={chip} className="oq-chip">
                                      {chip}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[260px]">
                            {renderMetric('Career Score', application.career_score_at_apply ?? '-')}
                            {renderMetric('AI Match', application.ai_match_score !== null && application.ai_match_score !== undefined ? `${application.ai_match_score}%` : '-')}
                          </div>
                        </div>

                        <ApplicationPipeline status={application.status} />

                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                          <div className={`rounded-[1.2rem] border px-4 py-4 ${meta.panelClassName}`.trim()}>
                            <p className={`text-[0.72rem] font-semibold uppercase tracking-[0.18em] ${meta.accentClassName}`.trim()}>
                              {feedback.title}
                            </p>
                            <p className="mt-3 text-sm leading-7 text-[var(--text)]">{feedback.summary}</p>
                            <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{feedback.detail}</p>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            {renderMetric('Last Updated', formatDateTime(application.status_updated_at))}
                            {renderMetric('Company History', application.total_apps_to_company > 1 ? `${application.total_apps_to_company} applications with this company` : 'First application with this company')}
                            {renderMetric('Response Target', application.tat_hours ? `${application.tat_hours} hrs` : 'Not set')}
                            {renderMetric('Current View', application.tat_hours ? (application.tat_breach ? 'Past target window' : 'Within target window') : 'No target published')}
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No applications yet"
            description="Apply to a role to unlock the application tracker and status pipeline here."
            action={
              <Link className="oq-button-primary" href="/jobs">
                Browse jobs
              </Link>
            }
          />
        )}
      </DashboardShell>
    </ProtectedRoute>
  );
}
