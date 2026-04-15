'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import MessageBanner from '@/components/MessageBanner';
import PageHero from '@/components/PageHero';
import ProtectedRoute from '@/components/ProtectedRoute';
import SectionCard from '@/components/SectionCard';
import { applyToJob, fetchJobDetail } from '@/services/jobs';
import { clearAuthStorage } from '@/utils/authStorage';
import { formatExperienceRange, formatSalaryRange, formatStatus } from '@/utils/formatters';
import { markJobViewed } from '@/utils/jobViewState';
import { candidateNavItems } from '@/utils/navigation';

function renderSkillGroup(skills, emptyLabel) {
  if (!skills?.length) {
    return <p className="text-sm text-slate-600">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span key={skill} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700">
          {skill}
        </span>
      ))}
    </div>
  );
}

function CandidateJobDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get('jobId');
  const [job, setJob] = useState(null);
  const [coverNote, setCoverNote] = useState('');
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentApplication = job?.current_application || null;
  const hasApplied = Boolean(currentApplication?.id);

  async function loadJob() {
    if (!jobId) {
      setError({ message: 'Missing job ID.' });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchJobDetail(jobId);
      const nextJob = response?.data || null;
      setJob(nextJob);
      setAnswers((current) => {
        const nextAnswers = Object.fromEntries((nextJob?.questions || []).map((question) => [question.id, current[question.id] || '']));
        return nextAnswers;
      });
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadJob();
  }, [jobId]);

  useEffect(() => {
    if (jobId) {
      markJobViewed(jobId);
    }
  }, [jobId]);

  useEffect(() => {
    const authCodes = ['AUTH_REQUIRED', 'TOKEN_INVALID', 'TOKEN_EXPIRED'];

    if (authCodes.includes(error?.code) || authCodes.includes(submitError?.code)) {
      clearAuthStorage();
      router.replace('/login');
    }
  }, [error, submitError, router]);

  function handleAnswerChange(questionId, value) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }));
  }

  async function handleApply(event) {
    event.preventDefault();
    setSubmitError(null);
    setSuccessMessage('');

    if (hasApplied) {
      setSubmitError({
        message: 'You have already applied to this role. Open My Applications to track the current status.',
      });
      return;
    }

    const requiredQuestion = (job?.questions || []).find(
      (question) => question.is_required && !answers[question.id]?.trim()
    );

    if (requiredQuestion) {
      setSubmitError({
        message: 'Please answer all required prescreening questions before submitting.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const application = await applyToJob(jobId, {
        cover_note: coverNote.trim() || null,
        answers: (job?.questions || [])
          .filter((question) => answers[question.id]?.trim())
          .map((question) => ({
            question_id: question.id,
            answer_text: answers[question.id].trim(),
          })),
      });

      setSuccessMessage(`Application submitted successfully. Current status: ${formatStatus(application?.status || 'submitted')}.`);
      setJob((current) => current ? ({
        ...current,
        current_application: {
          id: application?.application_id,
          status: application?.status || 'submitted',
          applied_at: new Date().toISOString(),
        },
      }) : current);
    } catch (requestError) {
      setSubmitError(requestError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardShell
      title="Job Detail"
      subtitle="Review the job clearly before applying, including responsibilities, requirements, and prescreen prompts."
      onRefresh={loadJob}
      navItems={candidateNavItems}
    >
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading job...</p>
      ) : error ? (
        <MessageBanner tone="error" message={error.message || 'Unable to load this job.'} />
      ) : !job ? (
        <MessageBanner tone="error" message="Job not found." />
      ) : (
        <div className="space-y-6">
          <PageHero
            eyebrow={job.company_name || 'Job opening'}
            title={job.title}
            description="Review the role details below before you submit your application. The apply form stays separate so the decision content remains easy to scan."
            badges={[
              job.department,
              job.location,
              job.work_mode ? formatStatus(job.work_mode) : null,
              formatExperienceRange(job.experience_min_years, job.experience_max_years),
            ].filter(Boolean)}
            actions={[
              { label: 'Back to jobs', href: '/jobs', variant: 'secondary' },
              { label: 'My Applications', href: '/candidate/applications' },
            ]}
            aside={
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-sky-100/80">Salary</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {formatSalaryRange(job.salary_min, job.salary_max, job.salary_disclosed)}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-sky-100/80">Company score</p>
                    <p className="mt-1 text-sm text-slate-100">{job.company_score ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-sky-100/80">Prescreening</p>
                    <p className="mt-1 text-sm text-slate-100">{job.questions?.length ?? 0} question(s)</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-sky-100/80">Your status</p>
                    <p className="mt-1 text-sm text-slate-100">
                      {hasApplied ? formatStatus(currentApplication.status) : 'Not applied yet'}
                    </p>
                  </div>
                </div>
              </div>
            }
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <SectionCard title="Role overview" description="The essentials come first so you can assess fit before reading every detail.">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Department</p>
                    <p className="mt-2 text-sm text-slate-800">{job.department || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Level</p>
                    <p className="mt-2 text-sm text-slate-800">{job.level || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Work mode</p>
                    <p className="mt-2 text-sm text-slate-800">{job.work_mode ? formatStatus(job.work_mode) : 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Education</p>
                    <p className="mt-2 text-sm text-slate-800">{job.education_requirement || 'Not specified'}</p>
                  </div>
                </div>
                <div className="mt-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Description</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {job.description || 'No description provided.'}
                  </p>
                </div>
              </SectionCard>

              <SectionCard title="Responsibilities and benefits" description="Separate sections make the role expectations and offer details easier to compare.">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Responsibilities</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {job.responsibilities || 'No responsibilities provided.'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Benefits</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {job.benefits || 'No benefits listed.'}
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Requirements and fit" description="Required and preferred details are separated so candidates can judge fit without over-reading.">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Required skills</p>
                    <div className="mt-3">{renderSkillGroup(job.required_skills, 'No required skills listed.')}</div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Preferred skills</p>
                    <div className="mt-3">{renderSkillGroup(job.preferred_skills, 'No preferred skills listed.')}</div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Prescreen questions" description="This preview lets you prepare your responses before you start filling the form.">
                {(job.questions || []).length ? (
                  <div className="space-y-3">
                    {job.questions.map((question, index) => (
                      <div key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Question {index + 1}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            {formatStatus(question.question_type || 'text')}
                          </span>
                          {question.is_required ? (
                            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
                              Required
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-3 text-sm text-slate-700">{question.question_text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">No prescreen questions were added for this role.</p>
                )}
              </SectionCard>
            </div>

            <div className="space-y-6">
              <SectionCard
                title="Apply to this role"
                description={hasApplied
                  ? 'You already applied to this role. Review the current status below or open My Applications for the full tracker.'
                  : 'The current prototype uses text responses for the cover note and all prescreen prompts.'}
              >
                <form className="space-y-4" onSubmit={handleApply}>
                  {hasApplied ? (
                    <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4">
                      <p className="text-sm font-semibold text-emerald-700">Already applied</p>
                      <p className="mt-2 text-sm text-emerald-700">
                        Current application status: {formatStatus(currentApplication.status)}.
                      </p>
                      <p className="mt-2 text-sm text-emerald-700">
                        {currentApplication.applied_at ? `Applied ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(currentApplication.applied_at))}.` : 'Your application is already on file.'}
                      </p>
                    </div>
                  ) : null}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="cover-note">
                      Cover note
                    </label>
                    <textarea
                      id="cover-note"
                      className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                      disabled={hasApplied}
                      onChange={(event) => setCoverNote(event.target.value)}
                      placeholder="Optional note to the employer"
                      value={coverNote}
                    />
                  </div>

                  {(job.questions || []).map((question, index) => (
                    <div key={question.id}>
                      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor={question.id}>
                        {index + 1}. {question.question_text}
                        {question.is_required ? ' *' : ''}
                      </label>
                      <textarea
                        id={question.id}
                        className="min-h-24 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                        disabled={hasApplied}
                        onChange={(event) => handleAnswerChange(question.id, event.target.value)}
                        placeholder="Enter your answer"
                        value={answers[question.id] || ''}
                      />
                    </div>
                  ))}

                  <div className="space-y-3">
                    <MessageBanner tone="success" message={successMessage} />
                    <MessageBanner tone="error" message={submitError?.message} />
                    {successMessage ? (
                      <Link
                        className="inline-flex rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                        href="/candidate/applications"
                      >
                        View my applications
                      </Link>
                    ) : null}
                    <button
                      className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isSubmitting || hasApplied}
                      type="submit"
                    >
                      {hasApplied ? 'Already applied' : isSubmitting ? 'Submitting...' : 'Submit application'}
                    </button>
                    {hasApplied ? (
                      <Link
                        className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                        href="/candidate/applications"
                      >
                        Go to My Applications
                      </Link>
                    ) : null}
                  </div>
                </form>
              </SectionCard>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default function CandidateJobDetailPage() {
  return (
    <ProtectedRoute allowedRoles={['candidate']}>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-slate-600">Loading job page...</div>}>
        <CandidateJobDetailContent />
      </Suspense>
    </ProtectedRoute>
  );
}
