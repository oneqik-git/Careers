'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import EmptyState from '@/components/EmptyState';
import MessageBanner from '@/components/MessageBanner';
import ProtectedRoute from '@/components/ProtectedRoute';
import SectionCard from '@/components/SectionCard';
import { fetchJobApplications, updateJobApplication } from '@/services/jobs';
import { clearAuthStorage } from '@/utils/authStorage';
import { formatDateTime, formatStatus } from '@/utils/formatters';

const employerNavItems = [
  { label: 'Dashboard', href: '/employer/dashboard' },
  { label: 'Post Job', href: '/employer/jobs/new' },
  { label: 'Posted Jobs', href: '/employer/jobs' },
];

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

function ApplicantsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get('jobId');
  const [applications, setApplications] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState(null);
  const [feedbackById, setFeedbackById] = useState({});
  const [isLoading, setIsLoading] = useState(true);
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
      const response = await fetchJobApplications(jobId);
      const items = response?.data || [];
      setApplications(items);
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
      router.replace('/login');
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
        <div className="space-y-4">
          {applications.map((application) => (
            <SectionCard
              key={application.id}
              title={application.full_name}
              description={`Applied ${formatDateTime(application.applied_at)}`}
              action={
                <Link
                  className="inline-flex rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  href={`/employer/application-history?applicationId=${application.id}`}
                >
                  View history
                </Link>
              }
            >
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="grid gap-4 sm:grid-cols-2">
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
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">AI match score</p>
                    <p className="mt-2 text-sm text-slate-700">{application.ai_match_score ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Headline</p>
                    <p className="mt-2 text-sm text-slate-700">{application.headline || '-'}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
                      value={drafts[application.id]?.employer_notes || ''}
                    />
                  </div>
                  <div className="mt-4 space-y-3">
                    <MessageBanner
                      tone={feedbackById[application.id]?.tone}
                      message={feedbackById[application.id]?.message}
                    />
                    <button
                      className="rounded-2xl bg-slate-950 px-4 py-2 text-sm text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
      ) : (
        <EmptyState
          title="No applicants yet"
          description="Applications will appear here once candidates start applying."
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
