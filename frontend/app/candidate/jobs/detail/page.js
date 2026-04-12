'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import MessageBanner from '@/components/MessageBanner';
import ProtectedRoute from '@/components/ProtectedRoute';
import SectionCard from '@/components/SectionCard';
import { applyToJob, fetchJobDetail } from '@/services/jobs';
import { clearAuthStorage } from '@/utils/authStorage';
import { formatSalaryRange } from '@/utils/formatters';

const candidateNavItems = [
  { label: 'Dashboard', href: '/candidate/dashboard' },
  { label: 'Browse Jobs', href: '/candidate/jobs' },
  { label: 'My Applications', href: '/candidate/applications' },
];

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
      setAnswers(
        Object.fromEntries((nextJob?.questions || []).map((question) => [question.id, '']))
      );
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
      const response = await applyToJob(jobId, {
        cover_note: coverNote.trim() || null,
        answers: (job?.questions || [])
          .filter((question) => answers[question.id]?.trim())
          .map((question) => ({
            question_id: question.id,
            answer_text: answers[question.id].trim(),
          })),
      });

      setSuccessMessage(`Application submitted. Application ID: ${response?.data?.application_id}`);
    } catch (requestError) {
      setSubmitError(requestError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardShell
      title="Job Detail"
      subtitle="View role details and submit a text-based application."
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
          <SectionCard title={job.title} description={job.company_name}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Location</p>
                <p className="mt-2 text-sm text-slate-800">{job.location || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Salary</p>
                <p className="mt-2 text-sm text-slate-800">
                  {formatSalaryRange(job.salary_min, job.salary_max, job.salary_disclosed)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Department</p>
                <p className="mt-2 text-sm text-slate-800">{job.department || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Work Mode</p>
                <p className="mt-2 text-sm text-slate-800">{job.work_mode || 'Not specified'}</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Description</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{job.description || 'No description provided.'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Responsibilities</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{job.responsibilities || 'No responsibilities provided.'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Benefits</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{job.benefits || 'No benefits listed.'}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Apply to this job"
            description="This form submits POST /api/jobs/{jobId}/apply using text answers."
          >
            <form className="space-y-4" onSubmit={handleApply}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="cover-note">
                  Cover note
                </label>
                <textarea
                  id="cover-note"
                  className="min-h-28 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
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
                    onChange={(event) => handleAnswerChange(question.id, event.target.value)}
                    placeholder="Enter your answer"
                    value={answers[question.id] || ''}
                  />
                </div>
              ))}

              <div className="space-y-3">
                <MessageBanner tone="success" message={successMessage} />
                <MessageBanner tone="error" message={submitError?.message} />
                <button
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit application'}
                </button>
              </div>
            </form>
          </SectionCard>
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
