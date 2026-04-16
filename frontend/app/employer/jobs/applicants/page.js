'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ApplicationPipeline from '@/components/ApplicationPipeline';
import DashboardShell from '@/components/DashboardShell';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import MessageBanner from '@/components/MessageBanner';
import PageHero from '@/components/PageHero';
import ProtectedRoute from '@/components/ProtectedRoute';
import SectionCard from '@/components/SectionCard';
import StatusBadge from '@/components/StatusBadge';
import { fetchJobApplications, fetchJobDetail, updateJobApplication } from '@/services/jobs';
import { clearAuthStorage } from '@/utils/authStorage';
import {
  employerStatusActions,
  formatPercentValue,
  getEmployerStatusAction,
  getNameInitials,
} from '@/utils/employerHiring';
import { employerNavItems } from '@/utils/navigation';
import {
  formatDateTime,
  formatExperienceMonths,
  formatRelativeTime,
  formatStatus,
} from '@/utils/formatters';

function renderAnswerValue(answer) {
  if (answer.answer_text) {
    return answer.answer_text;
  }

  if (answer.video_url) {
    return answer.video_url;
  }

  return 'No answer content provided.';
}

function MetricTile({ label, value, helper }) {
  return (
    <div className="rounded-[1.1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
      <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[var(--text)]">{value}</p>
      {helper ? <p className="mt-1 text-sm text-[var(--text-soft)]">{helper}</p> : null}
    </div>
  );
}

function ApplicantFilterTabs({ definitions, activeFilter, onChange }) {
  return (
    <div className="flex flex-wrap gap-3">
      {definitions.map((filter) => {
        const isActive = activeFilter === filter.key;

        return (
          <button
            key={filter.key}
            className={`oq-filter-pill ${isActive ? 'oq-filter-pill-active' : ''}`.trim()}
            onClick={() => onChange(filter.key)}
            type="button"
          >
            {filter.label} ({filter.count})
          </button>
        );
      })}
    </div>
  );
}

function getFilterDefinitions(applications) {
  const counts = {
    all: applications.length,
    review: applications.filter((application) => ['submitted', 'under_review', 'shortlisted', 'on_hold'].includes(application.status)).length,
    interviews: applications.filter((application) => ['interview_scheduled', 'interview_done'].includes(application.status)).length,
    offers: applications.filter((application) => ['offer_sent', 'offer_accepted'].includes(application.status)).length,
    final: applications.filter((application) => ['rejected', 'offer_declined', 'joined', 'withdrawn'].includes(application.status)).length,
  };

  return [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'review', label: 'Review', count: counts.review },
    { key: 'interviews', label: 'Interviews', count: counts.interviews },
    { key: 'offers', label: 'Offers', count: counts.offers },
    { key: 'final', label: 'Final', count: counts.final },
  ];
}

function getVisibleApplications(applications, activeFilter) {
  if (activeFilter === 'all') {
    return applications;
  }

  const groups = {
    review: ['submitted', 'under_review', 'shortlisted', 'on_hold'],
    interviews: ['interview_scheduled', 'interview_done'],
    offers: ['offer_sent', 'offer_accepted'],
    final: ['rejected', 'offer_declined', 'joined', 'withdrawn'],
  };

  return applications.filter((application) => groups[activeFilter]?.includes(application.status));
}

function getReviewPriorityScore(application) {
  return (
    (application.ai_match_score || 0) * 2
    + (application.current_career_score || application.career_score_at_apply || 0)
    + (application.status === 'submitted' ? 10 : 0)
    + (application.status === 'under_review' ? 8 : 0)
  );
}

function ApplicantsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get('jobId');
  const [applications, setApplications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState(null);
  const [feedbackById, setFeedbackById] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [jobDetails, setJobDetails] = useState(null);
  const [savingId, setSavingId] = useState(null);

  async function loadApplications() {
    if (!jobId) {
      setError({ message: 'Missing job ID.' });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [applicationsData, jobResponse] = await Promise.all([
        fetchJobApplications(jobId),
        fetchJobDetail(jobId),
      ]);
      const items = applicationsData || [];
      setApplications(items);
      setJobDetails(jobResponse?.data || null);
      setDrafts(
        Object.fromEntries(
          items.map((application) => [
            application.id,
            {
              status: application.status || 'under_review',
              employer_notes: application.employer_notes || '',
              rejection_reason: application.rejection_reason || '',
              hold_until: application.hold_until ? String(application.hold_until).slice(0, 10) : '',
              history_note: '',
            },
          ])
        )
      );
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, [jobId]);

  useEffect(() => {
    if (error?.code === 'AUTH_REQUIRED' || error?.code === 'TOKEN_INVALID' || error?.code === 'TOKEN_EXPIRED') {
      clearAuthStorage();
      router.replace('/employer/login');
    }
  }, [error, router]);

  function updateDraft(applicationId, field, value) {
    setDrafts((current) => ({
      ...current,
      [applicationId]: {
        ...current[applicationId],
        [field]: value,
      },
    }));
  }

  async function saveUpdate(application) {
    const draft = drafts[application.id];

    if (!draft?.status) {
      setFeedbackById((current) => ({
        ...current,
        [application.id]: { tone: 'error', message: 'Choose a status before saving.' },
      }));
      return;
    }

    if (draft.status === 'rejected' && !draft.rejection_reason.trim()) {
      setFeedbackById((current) => ({
        ...current,
        [application.id]: { tone: 'error', message: 'Add a rejection reason before closing the application.' },
      }));
      return;
    }

    if (draft.status === 'on_hold' && !draft.hold_until) {
      setFeedbackById((current) => ({
        ...current,
        [application.id]: { tone: 'error', message: 'Set a hold-until date so the pause is clear to the team.' },
      }));
      return;
    }

    setSavingId(application.id);
    setFeedbackById((current) => ({
      ...current,
      [application.id]: null,
    }));

    try {
      const response = await updateJobApplication(application.id, {
        status: draft.status,
        employer_notes: draft.employer_notes.trim(),
        rejection_reason: draft.status === 'rejected' ? draft.rejection_reason.trim() : null,
        hold_until: draft.status === 'on_hold' ? draft.hold_until : null,
        history_note: draft.history_note.trim() || null,
      });

      const selectedStatus = getEmployerStatusAction(draft.status);
      setFeedbackById((current) => ({
        ...current,
        [application.id]: {
          tone: 'success',
          message: response?.message || `${application.full_name} moved to ${selectedStatus?.label || formatStatus(draft.status)}.`,
        },
      }));
      await loadApplications();
    } catch (requestError) {
      setFeedbackById((current) => ({
        ...current,
        [application.id]: { tone: 'error', message: requestError.message || 'Unable to update application.' },
      }));
    } finally {
      setSavingId(null);
    }
  }

  const filterDefinitions = useMemo(() => getFilterDefinitions(applications), [applications]);
  const visibleApplications = useMemo(() => getVisibleApplications(applications, activeFilter), [activeFilter, applications]);
  const sortedApplications = useMemo(
    () => [...visibleApplications].sort((left, right) => getReviewPriorityScore(right) - getReviewPriorityScore(left)),
    [visibleApplications]
  );

  const reviewSummary = useMemo(() => ({
    applicants: applications.length,
    underReview: applications.filter((application) => ['submitted', 'under_review'].includes(application.status)).length,
    interviews: applications.filter((application) => ['interview_scheduled', 'interview_done'].includes(application.status)).length,
    offers: applications.filter((application) => ['offer_sent', 'offer_accepted'].includes(application.status)).length,
  }), [applications]);

  return (
    <DashboardShell
      title="Applicants"
      subtitle="Review candidates with enough context to move faster and leave a usable trail for the next hiring step."
      onRefresh={loadApplications}
      navItems={employerNavItems}
    >
      {isLoading ? (
        <LoadingState
          description="Loading the review queue, candidate summaries, and status actions for this role."
          label="Applicants"
          title="Preparing the review queue"
        />
      ) : error ? (
        <MessageBanner tone="error" message={error.message || 'Unable to load applicants.'} />
      ) : applications.length ? (
        <div className="space-y-6">
          <PageHero
            eyebrow="Applicants review"
            title={jobDetails?.title || 'Review candidates'}
            description="This view brings profile quality, prescreen evidence, status history, and employer actions together so the hiring team can make faster, cleaner decisions."
            badges={[
              jobDetails?.company_name,
              jobDetails?.location,
              jobDetails?.work_mode ? formatStatus(jobDetails.work_mode) : null,
              `${applications.length} applicant${applications.length === 1 ? '' : 's'}`,
            ].filter(Boolean)}
            actions={[
              { label: 'Back to jobs', href: '/employer/jobs', variant: 'secondary' },
              { label: 'Post Job', href: '/employer/jobs/new' },
            ]}
            aside={(
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-sky-100/80">Review queue</p>
                  <p className="mt-2 text-3xl font-semibold text-[var(--text)]">{reviewSummary.applicants}</p>
                  <p className="mt-2 text-sm text-[var(--secondary-1)]">Candidates visible for this role</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <MetricTile label="In review" value={reviewSummary.underReview} />
                  <MetricTile label="Interviews" value={reviewSummary.interviews} />
                  <MetricTile label="Offers" value={reviewSummary.offers} />
                </div>
              </div>
            )}
          />

          <section className="oq-toolbar-surface p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[0.76rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">Review slices</p>
                <p className="mt-2 text-sm text-[var(--text-soft)]">Filter the queue by hiring stage to keep the review surface fast and decision-oriented.</p>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-soft)]">
                  Showing <span className="font-medium text-[var(--text)]">{sortedApplications.length}</span> candidate{sortedApplications.length === 1 ? '' : 's'}
                  {activeFilter !== 'all' ? ` in ${filterDefinitions.find((item) => item.key === activeFilter)?.label || activeFilter}` : ''}.
                </p>
                <ApplicantFilterTabs definitions={filterDefinitions} activeFilter={activeFilter} onChange={setActiveFilter} />
              </div>
            </div>
          </section>

          {sortedApplications.length ? (
            <div className="space-y-5">
            {sortedApplications.map((application) => {
              const draft = drafts[application.id] || {};
              const selectedStatus = getEmployerStatusAction(draft.status);
              const scoreDelta =
                application.current_career_score !== null
                && application.current_career_score !== undefined
                && application.career_score_at_apply !== null
                && application.career_score_at_apply !== undefined
                  ? application.current_career_score - application.career_score_at_apply
                  : null;

              return (
                <SectionCard
                  key={application.id}
                  eyebrow="Candidate review"
                  title={application.full_name}
                  description={application.headline || 'Headline not added'}
                  action={(
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={application.status} />
                      <Link
                        className="inline-flex rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-soft)] transition hover:border-[rgba(93,224,230,0.22)] hover:text-[var(--text)]"
                        href={`/employer/application-history?applicationId=${application.id}`}
                      >
                        Full timeline
                      </Link>
                    </div>
                  )}
                >
                  <div className="space-y-5">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.15rem] border border-[rgba(93,224,230,0.22)] bg-[rgba(93,224,230,0.08)] text-lg font-semibold text-[var(--text)]">
                          {getNameInitials(application.full_name, 'C')}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[1.15rem] font-medium tracking-[-0.04em] text-[var(--text)]">{application.full_name}</p>
                            <StatusBadge status={application.status} />
                          </div>
                          <p className="mt-2 text-sm text-[var(--text-soft)]">
                            Applied {formatRelativeTime(application.applied_at)} | {application.location || 'Location not added'}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="oq-chip">{formatExperienceMonths(application.total_experience_months)}</span>
                            <span className="oq-chip">Applied to company {application.times_applied_to_us || 1} time(s)</span>
                            {application.other_roles_applied_list?.length ? <span className="oq-chip">Other roles: {application.other_roles_applied_list.join(', ')}</span> : null}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
                        <MetricTile
                          label="Match"
                          value={formatPercentValue(application.ai_match_score)}
                          helper={application.ai_summary ? 'Role-fit context available below.' : 'No extra match summary surfaced.'}
                        />
                        <MetricTile
                          label="Current score"
                          value={application.current_career_score ?? application.career_score_at_apply ?? '-'}
                          helper={scoreDelta !== null ? `${scoreDelta >= 0 ? '+' : ''}${scoreDelta} vs apply time` : 'No score delta available'}
                        />
                        <MetricTile
                          label="Offer reliability"
                          value={formatPercentValue(application.offer_reliability_pct)}
                          helper={`${application.no_show_count || 0} no-shows | ${application.ghosting_count || 0} ghosting flags`}
                        />
                        <MetricTile
                          label="Employer rating"
                          value={application.avg_employer_rating ? `${application.avg_employer_rating}/5` : '-'}
                          helper={application.reviewed_at ? `First reviewed ${formatDateTime(application.reviewed_at)}` : 'Not reviewed yet'}
                        />
                      </div>
                    </div>

                    <ApplicationPipeline status={application.status} />

                    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                      <div className="space-y-5">
                        <div className="grid gap-4 xl:grid-cols-2">
                          <div className="rounded-[1.4rem] border border-[rgba(93,224,230,0.18)] bg-[rgba(93,224,230,0.08)] px-5 py-5">
                            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-sky-100">Decision context</p>
                            <p className="mt-3 text-sm leading-7 text-[var(--text)]">
                              {application.ai_summary || 'No structured fit summary is exposed in the current payload for this candidate.'}
                            </p>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              <MetricTile label="Applied at" value={formatDateTime(application.applied_at)} />
                              <MetricTile label="Last status change" value={formatDateTime(application.status_updated_at)} />
                            </div>
                          </div>

                          <div className="rounded-[1.4rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-5 py-5">
                            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Cover note</p>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text)]">
                              {application.cover_note || 'No cover note was submitted with this application.'}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-[1.4rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-5 py-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Structured answer review</p>
                              <p className="mt-2 text-sm text-[var(--text-soft)]">
                                {application.prescreen_answers?.length
                                  ? `${application.prescreen_answers.length} submitted answer${application.prescreen_answers.length === 1 ? '' : 's'}`
                                  : 'No prescreen answers were submitted for this application.'}
                              </p>
                            </div>
                          </div>

                          {application.prescreen_answers?.length ? (
                            <div className="mt-4 space-y-4">
                              {application.prescreen_answers.map((answer, index) => (
                                <div key={`${application.id}-answer-${index}`} className="rounded-[1.2rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                                  <div className="flex flex-wrap gap-2">
                                    <span className="oq-chip">Question {answer.display_order || index + 1}</span>
                                    <span className="oq-chip">{formatStatus(answer.question_type || answer.answer_type || 'text')}</span>
                                    {answer.ai_score !== null && answer.ai_score !== undefined ? <span className="oq-chip">Answer score {answer.ai_score}%</span> : null}
                                    {answer.employer_viewed ? <span className="oq-chip">Reviewed</span> : null}
                                  </div>
                                  <p className="mt-4 text-sm font-medium text-[var(--text)]">{answer.question_text}</p>
                                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text-soft)]">{renderAnswerValue(answer)}</p>
                                  {answer.ai_feedback ? (
                                    <div className="mt-4 rounded-[1rem] border border-[rgba(93,224,230,0.18)] bg-[rgba(93,224,230,0.08)] px-4 py-3">
                                      <p className="text-[0.68rem] uppercase tracking-[0.16em] text-sky-100">Review context</p>
                                      <p className="mt-2 text-sm text-[var(--text)]">{answer.ai_feedback}</p>
                                    </div>
                                  ) : null}
                                  {answer.video_url ? (
                                    <a
                                      className="mt-4 inline-flex text-sm font-semibold text-[var(--brand-accent)]"
                                      href={answer.video_url}
                                      rel="noreferrer"
                                      target="_blank"
                                    >
                                      Open video response
                                    </a>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div className="rounded-[1.4rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Status actions</p>
                              <p className="mt-2 text-sm text-[var(--text-soft)]">Choose the next employer state, leave context, and keep the application trail readable.</p>
                            </div>
                            {selectedStatus ? (
                              <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${selectedStatus.toneClassName}`.trim()}>
                                {selectedStatus.label}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {employerStatusActions.map((action) => {
                              const isActive = draft.status === action.value;

                              return (
                                <button
                                  key={action.value}
                                  className={`rounded-[1.05rem] border px-4 py-3 text-left transition ${isActive ? action.toneClassName : 'border-[var(--border)] bg-[rgba(255,255,255,0.02)] text-[var(--text-soft)] hover:border-[rgba(93,224,230,0.22)] hover:text-[var(--text)]'}`.trim()}
                                  onClick={() => updateDraft(application.id, 'status', action.value)}
                                  type="button"
                                >
                                  <p className="text-sm font-semibold">{action.label}</p>
                                  <p className="mt-2 text-sm leading-6">{action.description}</p>
                                </button>
                              );
                            })}
                          </div>

                          {draft.status === 'on_hold' ? (
                            <div className="mt-4">
                              <label className="mb-2 block text-sm font-medium text-[var(--text)]" htmlFor={`hold-until-${application.id}`}>
                                Hold until
                              </label>
                              <input
                                id={`hold-until-${application.id}`}
                                className="oq-input"
                                onChange={(event) => updateDraft(application.id, 'hold_until', event.target.value)}
                                type="date"
                                value={draft.hold_until || ''}
                              />
                            </div>
                          ) : null}

                          {draft.status === 'rejected' ? (
                            <div className="mt-4">
                              <label className="mb-2 block text-sm font-medium text-[var(--text)]" htmlFor={`rejection-${application.id}`}>
                                Rejection reason
                              </label>
                              <textarea
                                id={`rejection-${application.id}`}
                                className="oq-textarea min-h-24"
                                onChange={(event) => updateDraft(application.id, 'rejection_reason', event.target.value)}
                                placeholder="Explain why the team is not proceeding."
                                value={draft.rejection_reason || ''}
                              />
                            </div>
                          ) : null}

                          <div className="mt-4">
                            <label className="mb-2 block text-sm font-medium text-[var(--text)]" htmlFor={`history-note-${application.id}`}>
                              Timeline note
                            </label>
                            <textarea
                              id={`history-note-${application.id}`}
                              className="oq-textarea min-h-24"
                              onChange={(event) => updateDraft(application.id, 'history_note', event.target.value)}
                              placeholder="Add the context you want future reviewers to see on the timeline."
                              value={draft.history_note || ''}
                            />
                          </div>

                          <div className="mt-4">
                            <label className="mb-2 block text-sm font-medium text-[var(--text)]" htmlFor={`notes-${application.id}`}>
                              Reviewer notes
                            </label>
                            <textarea
                              id={`notes-${application.id}`}
                              className="oq-textarea min-h-28"
                              onChange={(event) => updateDraft(application.id, 'employer_notes', event.target.value)}
                              placeholder="Capture panel context, follow-ups, or reasons for the next reviewer."
                              value={draft.employer_notes || ''}
                            />
                          </div>

                          <div className="mt-4 space-y-3">
                            <MessageBanner
                              tone={feedbackById[application.id]?.tone}
                              message={feedbackById[application.id]?.message}
                            />
                            <button
                              className="oq-button-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={savingId === application.id}
                              onClick={() => saveUpdate(application)}
                              type="button"
                            >
                              {savingId === application.id ? 'Saving...' : 'Save status update'}
                            </button>
                          </div>
                        </div>

                        <div className="rounded-[1.4rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Timeline preview</p>
                              <p className="mt-2 text-sm text-[var(--text-soft)]">Recent movement is visible inline, with full history one click away.</p>
                            </div>
                            <Link className="text-sm font-semibold text-[var(--brand-accent)]" href={`/employer/application-history?applicationId=${application.id}`}>
                              Open full history
                            </Link>
                          </div>

                          {application.history_preview?.length ? (
                            <div className="mt-4 space-y-3">
                              {application.history_preview.map((entry) => (
                                <div key={entry.id} className="rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm font-medium text-[var(--text)]">{formatStatus(entry.to_status)}</p>
                                      <StatusBadge status={entry.to_status} />
                                    </div>
                                    <p className="text-sm text-[var(--text-soft)]">{formatDateTime(entry.created_at)}</p>
                                  </div>
                                  <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{entry.note || 'No note recorded.'}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-4 text-sm text-[var(--text-soft)]">No status history is available yet beyond the initial submission.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              );
            })}
            </div>
          ) : (
            <EmptyState
              eyebrow="Review queue"
              title="No applicants in this slice"
              description="This role has applicants, but none currently match the selected stage filter. Switch back to All to review the full queue."
              action={<button className="oq-button-primary" onClick={() => setActiveFilter('all')} type="button">Show all applicants</button>}
              secondaryAction={<Link className="oq-button-ghost" href="/employer/jobs">Back to jobs</Link>}
            />
          )}
        </div>
      ) : (
        <EmptyState
          eyebrow="Applicants"
          title="No applicants yet"
          description="Applications will appear here once candidates start applying to this role."
          action={(
            <Link className="oq-button-primary" href="/employer/jobs">
              Back to posted jobs
            </Link>
          )}
        />
      )}
    </DashboardShell>
  );
}

export default function ApplicantsPage() {
  return (
    <ProtectedRoute allowedRoles={['employer', 'admin']}>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-slate-600">Loading applicants page...</div>}>
        <ApplicantsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
