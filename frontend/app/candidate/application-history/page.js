'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ApplicationPipeline from '@/components/ApplicationPipeline';
import ApplicationTimeline from '@/components/ApplicationTimeline';
import DashboardShell from '@/components/DashboardShell';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import MessageBanner from '@/components/MessageBanner';
import ProtectedRoute from '@/components/ProtectedRoute';
import SectionCard from '@/components/SectionCard';
import { fetchApplicationHistory, fetchMyApplications } from '@/services/jobs';
import { clearAuthStorage } from '@/utils/authStorage';
import { candidateNavItems } from '@/utils/navigation';
import { getApplicationFeedback, getApplicationStatusMeta } from '@/utils/applicationStatus';
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

function CandidateApplicationHistoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicationId = searchParams.get('applicationId');
  const [application, setApplication] = useState(null);
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadHistory() {
    if (!applicationId) {
      setError({ message: 'Missing application ID.' });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [applicationsData, historyEntries] = await Promise.all([
        fetchMyApplications(),
        fetchApplicationHistory(applicationId),
      ]);

      const currentApplication = (applicationsData || []).find((item) => item.id === applicationId) || null;

      if (!currentApplication) {
        setError({ message: 'Application not found in your account.' });
        setEntries(historyEntries || []);
        setApplication(null);
        return;
      }

      setApplication(currentApplication);
      setEntries(historyEntries || []);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, [applicationId]);

  useEffect(() => {
    if (error?.code === 'AUTH_REQUIRED' || error?.code === 'TOKEN_INVALID' || error?.code === 'TOKEN_EXPIRED') {
      clearAuthStorage();
      router.replace('/login');
    }
  }, [error, router]);

  const currentStatus = application?.status || entries[entries.length - 1]?.to_status || null;
  const statusMeta = useMemo(() => getApplicationStatusMeta(currentStatus), [currentStatus]);
  const feedback = useMemo(() => getApplicationFeedback(application || {}, entries), [application, entries]);
  const latestTimelineEntry = entries[entries.length - 1] || null;
  const contextChips = [
    application?.location,
    application?.work_mode ? formatStatus(application.work_mode) : null,
    application ? formatExperienceRange(application.experience_min_years, application.experience_max_years) : null,
  ].filter(Boolean);

  return (
    <DashboardShell
      title="Application History"
      subtitle="A clearer read on what happened, where this application stands, and what the current state means."
      onRefresh={loadHistory}
      navItems={candidateNavItems}
    >
      {isLoading ? (
        <LoadingState
          description="Loading the current status, full timeline, and tracker context."
          label="Application history"
          title="Preparing this timeline"
        />
      ) : error ? (
        <MessageBanner tone="error" message={error.message || 'Unable to load history.'} />
      ) : !application ? (
        <EmptyState
          title="Application unavailable"
          description="The requested application could not be found in your current account."
          action={
            <Link className="oq-button-primary" href="/candidate/applications">
              Back to applications
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          <section className={`rounded-[2rem] border p-6 shadow-[0_24px_42px_rgba(0,0,0,0.18)] ${statusMeta.cardClassName}`.trim()}>
            <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_340px]">
              <div>
                <Link
                  className="inline-flex items-center text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] transition hover:text-white"
                  href="/candidate/applications"
                >
                  Back to Applications
                </Link>

                <div className="mt-4 flex min-w-0 gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border text-sm font-semibold tracking-[0.08em] ${statusMeta.badgeClassName}`.trim()}>
                    {getCompanyInitials(application.company_name)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[1.8rem] font-medium tracking-[-0.05em] text-[var(--text)]">
                        {application.title}
                      </h2>
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusMeta.badgeClassName}`.trim()}>
                        {statusMeta.badgeLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-soft)]">
                      {application.company_name} | Applied {formatRelativeTime(application.applied_at)}
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

                <div className={`mt-5 rounded-[1.3rem] border px-4 py-4 ${statusMeta.panelClassName}`.trim()}>
                  <p className={`text-[0.72rem] font-semibold uppercase tracking-[0.18em] ${statusMeta.accentClassName}`.trim()}>
                    {feedback.title}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--text)]">{feedback.summary}</p>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{feedback.detail}</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(4,14,32,0.42)] p-4 shadow-[0_18px_32px_rgba(0,0,0,0.16)]">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Current pipeline</p>
                <ApplicationPipeline className="mt-5" status={currentStatus} />

                <div className="mt-5 grid gap-3">
                  {renderMetric('Salary', formatSalaryRange(application.salary_min, application.salary_max, application.salary_disclosed))}
                  {renderMetric('Career Score at Apply', application.career_score_at_apply ?? '-')}
                  {renderMetric('AI Match', application.ai_match_score !== null && application.ai_match_score !== undefined ? `${application.ai_match_score}%` : '-')}
                  {renderMetric('Last Updated', formatDateTime(application.status_updated_at))}
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <SectionCard
              className="px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7"
              description="Every recorded status change for this application, in order."
              title="What Happened"
            >
              {entries.length ? (
                <ApplicationTimeline entries={entries} />
              ) : (
                <EmptyState
                  title="No timeline yet"
                  description="This application does not have any recorded history entries beyond its current state."
                />
              )}
            </SectionCard>

            <div className="space-y-6">
              <SectionCard
                className="px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7"
                description="The current state translated into plain language."
                title="What It Means"
              >
                <div className="space-y-4">
                  <div className={`rounded-[1.2rem] border px-4 py-4 ${statusMeta.panelClassName}`.trim()}>
                    <p className={`text-[0.72rem] font-semibold uppercase tracking-[0.18em] ${statusMeta.accentClassName}`.trim()}>
                      Current readout
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--text)]">{feedback.summary}</p>
                  </div>

                  <div className="rounded-[1.2rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">What happens next</p>
                    <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{feedback.detail}</p>
                  </div>

                  <div className="rounded-[1.2rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Latest recorded change</p>
                    <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
                      {latestTimelineEntry
                        ? `${formatStatus(latestTimelineEntry.to_status)} on ${formatDateTime(latestTimelineEntry.created_at)}${latestTimelineEntry.note ? ` | ${latestTimelineEntry.note}` : ''}.`
                        : 'No status-history note has been recorded yet.'}
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                className="px-5 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7"
                description="A few details are still outside the current API payload, so this view stays focused on what is dependable now."
                title="Current View Limits"
              >
                <div className="space-y-3 text-sm leading-7 text-[var(--text-soft)]">
                  <p>Offer amount, offer expiry, and joining specifics are not exposed in the current application API payload.</p>
                  <p>Employer review events such as recruiter views are not recorded as structured candidate history yet.</p>
                  <p>Candidate-visible prescreen answers are not returned by the current history endpoint, so this page focuses on status movement and feedback instead.</p>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default function CandidateApplicationHistoryPage() {
  return (
    <ProtectedRoute allowedRoles={['candidate']}>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-[var(--text-soft)]">Loading history page...</div>}>
        <CandidateApplicationHistoryContent />
      </Suspense>
    </ProtectedRoute>
  );
}
