'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ApplicationTimeline from '@/components/ApplicationTimeline';
import DashboardShell from '@/components/DashboardShell';
import EmptyState from '@/components/EmptyState';
import MessageBanner from '@/components/MessageBanner';
import PageHero from '@/components/PageHero';
import ProtectedRoute from '@/components/ProtectedRoute';
import { fetchApplicationHistory } from '@/services/jobs';
import { clearAuthStorage } from '@/utils/authStorage';
import { formatStatus } from '@/utils/formatters';
import { candidateNavItems } from '@/utils/navigation';

function CandidateApplicationHistoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicationId = searchParams.get('applicationId');
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
      const historyEntries = await fetchApplicationHistory(applicationId);
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

  return (
    <DashboardShell
      title="Application History"
      subtitle="Review the timeline of status changes for a single application in a clearer step-by-step view."
      onRefresh={loadHistory}
      navItems={candidateNavItems}
    >
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading history...</p>
      ) : error ? (
        <MessageBanner tone="error" message={error.message || 'Unable to load history.'} />
      ) : entries.length ? (
        <div className="space-y-6">
          <PageHero
            eyebrow="Application history"
            title="Status timeline"
            description="Each change is shown as a simple sequence so candidates can understand how the application progressed over time."
            badges={[
              `${entries.length} timeline event${entries.length === 1 ? '' : 's'}`,
              `Latest status: ${formatStatus(entries[entries.length - 1]?.to_status)}`,
            ]}
            actions={[
              { label: 'Back to applications', href: '/candidate/applications' },
              { label: 'Browse Jobs', href: '/jobs', variant: 'secondary' },
            ]}
          />
          <ApplicationTimeline entries={entries} />
        </div>
      ) : (
        <EmptyState
          title="No history entries"
          description="This application does not have any recorded timeline events yet."
          action={
            <Link
              className="inline-flex rounded-2xl bg-slate-950 px-4 py-2.5 text-sm text-white transition hover:bg-slate-800"
              href="/candidate/applications"
            >
              Back to applications
            </Link>
          }
        />
      )}
    </DashboardShell>
  );
}

export default function CandidateApplicationHistoryPage() {
  return (
    <ProtectedRoute allowedRoles={['candidate']}>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-slate-600">Loading history page...</div>}>
        <CandidateApplicationHistoryContent />
      </Suspense>
    </ProtectedRoute>
  );
}
