'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ApplicationTimeline from '@/components/ApplicationTimeline';
import DashboardShell from '@/components/DashboardShell';
import EmptyState from '@/components/EmptyState';
import MessageBanner from '@/components/MessageBanner';
import ProtectedRoute from '@/components/ProtectedRoute';
import { fetchApplicationHistory } from '@/services/jobs';
import { clearAuthStorage } from '@/utils/authStorage';

const candidateNavItems = [
  { label: 'Dashboard', href: '/candidate/dashboard' },
  { label: 'Browse Jobs', href: '/candidate/jobs' },
  { label: 'My Applications', href: '/candidate/applications' },
];

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
      const response = await fetchApplicationHistory(applicationId);
      setEntries(response?.data || []);
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
      subtitle="Timeline entries from GET /api/jobs/applications/{applicationId}/history."
      onRefresh={loadHistory}
      navItems={candidateNavItems}
    >
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading history...</p>
      ) : error ? (
        <MessageBanner tone="error" message={error.message || 'Unable to load history.'} />
      ) : entries.length ? (
        <ApplicationTimeline entries={entries} />
      ) : (
        <EmptyState
          title="No history entries"
          description="This application does not have any recorded timeline events yet."
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
