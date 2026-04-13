'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import EmptyState from '@/components/EmptyState';
import MessageBanner from '@/components/MessageBanner';
import PageHero from '@/components/PageHero';
import ProtectedRoute from '@/components/ProtectedRoute';
import SectionCard from '@/components/SectionCard';
import StatusBadge from '@/components/StatusBadge';
import { fetchJobApplications, fetchJobDetail, updateJobApplication } from '@/services/jobs';
import { clearAuthStorage } from '@/utils/authStorage';
import { employerNavItems } from '@/utils/navigation';
import { formatDateTime, formatExperienceMonths, formatStatus } from '@/utils/formatters';

const statusOptions = [
  'under_review',
  'shortlisted',
  'relevancy_test',
  'interview_scheduled',
  'interview_done',
  'on_hold',
  'offer_sent',
  'offer_accepted',
  'offer_declined',
  'joined',
  'rejected',
  'withdrawn',
];

function renderAnswerValue(answer) {
  if (answer.answer_text) {
    return answer.answer_text;
  }

  if (answer.video_url) {
    return answer.video_url;
  }

  return 'No answer content provided.';
}

function ApplicantsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get('jobId');
  const [applications, setApplications] = useState([]);
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

  async function saveUpdate(applicationId) {
    const draft = drafts[applicationId];

    if (!draft?.status) {
      setFeedbackById((current) => ({
        ...current,
        [applicationId]: { tone: 'error', message: 'Please choose a status before saving.' },
      }));
      return;
    }

    setSavingId(applicationId);
    setFeedbackById((current) => ({
      ...current,
      [applicationId]: null,
    }));

    try {
      await updateJobApplication(applicationId, {
        status: draft.status,
        employer_notes: draft.employer_notes?.trim() || '',
      });
      setFeedbackById((current) => ({
        ...current,
        [applicationId]: { tone: 'success', message: 'Application updated successfully.' },
      }));
      await loadApplications();
    } catch (requestError) {
      setFeedbackById((current) => ({
        ...current,
        [applicationId]: { tone: 'error', message: requestError.message || 'Unable to update application.' },
      }));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <DashboardShell
      title="Applicants"
      subtitle="Review candidates from GET /api/jobs/{jobId}/applications and update status inline."
      onRefresh={loadApplications}
      navItems={employerNavItems}
    >
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading applicants...</p>
      ) : error ? (
        <MessageBanner tone="error" message={error.message || 'Unable to load applicants.'} />
      ) : applications.length ? (
        <div className="space-y-6">
          <PageHero
            eyebrow="Applicants"
            title={jobDetails?.title || 'Review candidates'}
            description="Candidate cards surface identity, score, history access, and status editing together so employers can move through reviews with less page scanning."
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
            aside={
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-sky-100/80">Hiring progress</p>
                  <p className="mt-2 text-3xl font-semibold">{applications.length}</p>
                  <p className="mt-2 text-sm text-slate-200">Applicants in this view</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-sky-100/80">Shortlisted</p>
                    <p className="mt-1 text-sm text-slate-100">
                      {applications.filter((item) => item.status === 'shortlisted').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-sky-100/80">Interviewing</p>
                    <p className="mt-1 text-sm text-slate-100">
                      {applications.filter((item) => ['interview_scheduled', 'interview_done'].includes(item.status)).length}
                    </p>
                  </div>
                </div>
              </div>
            }
          />

          <div className="space-y-4">
            {applications.map((application) => (
              <SectionCard
                key={application.id}
                title={application.full_name}
                description={`${application.headline || 'Headline not added'} | Applied ${formatDateTime(application.applied_at)}`}
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={application.status} />
                    <Link
                      className="inline-flex rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                      href={`/employer/application-history?applicationId=${application.id}`}
                    >
                      View history
                    </Link>
                  </div>
                }
              >
                <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Current status</p>
                        <p className="mt-2 text-sm font-medium text-slate-900">{formatStatus(application.status)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Career score</p>
                        <p className="mt-2 text-sm text-slate-700">
                          {application.current_career_score ?? application.career_score_at_apply ?? '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">AI match</p>
                        <p className="mt-2 text-sm text-slate-700">{application.ai_match_score ?? '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Location</p>
                        <p className="mt-2 text-sm text-slate-700">{application.location || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Experience</p>
                        <p className="mt-2 text-sm text-slate-700">
                          {formatExperienceMonths(application.total_experience_months)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Applied to us</p>
                        <p className="mt-2 text-sm text-slate-700">{application.times_applied_to_us ?? 1} time(s)</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      {application.other_roles_applied_list?.length
                        ? `Also applied to: ${application.other_roles_applied_list.join(', ')}`
                        : 'No other applications to your company are shown for this candidate.'}
                    </div>

                    {application.cover_note ? (
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Cover note</p>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{application.cover_note}</p>
                      </div>
                    ) : null}

                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Prescreen answers</p>
                          <p className="mt-2 text-sm text-slate-600">
                            {application.prescreen_answers?.length
                              ? `${application.prescreen_answers.length} submitted response${application.prescreen_answers.length === 1 ? '' : 's'}`
                              : 'No prescreen answers were submitted for this application.'}
                          </p>
                        </div>
                      </div>

                      {application.prescreen_answers?.length ? (
                        <div className="mt-4 space-y-3">
                          {application.prescreen_answers.map((answer, index) => (
                            <div key={`${application.id}-answer-${index}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                                  Question {answer.display_order || index + 1}
                                </span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                                  {formatStatus(answer.question_type || answer.answer_type || 'text')}
                                </span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                                  {formatStatus(answer.answer_type || 'text')} answer
                                </span>
                              </div>
                              <p className="mt-3 text-sm font-medium text-slate-900">{answer.question_text}</p>
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{renderAnswerValue(answer)}</p>
                              {answer.video_url ? (
                                <a
                                  className="mt-3 inline-flex text-sm font-semibold text-[var(--brand-accent)]"
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

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor={`status-${application.id}`}>
                        Update status
                      </label>
                      <select
                        id={`status-${application.id}`}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                        onChange={(event) => updateDraft(application.id, 'status', event.target.value)}
                        value={drafts[application.id]?.status || application.status}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {formatStatus(status)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor={`notes-${application.id}`}>
                        Employer notes
                      </label>
                      <textarea
                        id={`notes-${application.id}`}
                        className="min-h-24 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                        onChange={(event) => updateDraft(application.id, 'employer_notes', event.target.value)}
                        placeholder="Add context for the next reviewer or interview step"
                        value={drafts[application.id]?.employer_notes || ''}
                      />
                    </div>
                    <div className="mt-4 space-y-3">
                      <MessageBanner
                        tone={feedbackById[application.id]?.tone}
                        message={feedbackById[application.id]?.message}
                      />
                      <button
                        className="w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-sm text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={savingId === application.id}
                        onClick={() => saveUpdate(application.id)}
                        type="button"
                      >
                        {savingId === application.id ? 'Saving...' : 'Save update'}
                      </button>
                    </div>
                  </div>
                </div>
              </SectionCard>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title="No applicants yet"
          description="Applications will appear here once candidates start applying to this role."
          action={
            <Link
              className="inline-flex rounded-2xl bg-slate-950 px-4 py-2.5 text-sm text-white transition hover:bg-slate-800"
              href="/employer/jobs"
            >
              Back to posted jobs
            </Link>
          }
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
