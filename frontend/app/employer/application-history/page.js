'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ApplicationTimeline from '@/components/ApplicationTimeline';
import DashboardShell from '@/components/DashboardShell';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import MessageBanner from '@/components/MessageBanner';
import PageHero from '@/components/PageHero';
import ProtectedRoute from '@/components/ProtectedRoute';
import { fetchApplicationHistory } from '@/services/jobs';
import { clearAuthStorage } from '@/utils/authStorage';
import { formatStatus } from '@/utils/formatters';
import { employerNavItems } from '@/utils/navigation';

function EmployerApplicationHistoryContent() {
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
      router.replace('/employer/login');
    }
  }, [error, router]);

  return (
    <DashboardShell
      title="Application History"
      subtitle="Review the full status change history for a candidate application."
      onRefresh={loadHistory}
      navItems={employerNavItems}
    >
      {isLoading ? (
        <LoadingState
          description="Loading the full employer-side application timeline."
          label="Employer history"
          title="Preparing this timeline"
        />
      ) : error ? (
        <MessageBanner tone="error" message={error.message || 'Unable to load history.'} />
      ) : entries.length ? (
        <div className="space-y-6">
          <PageHero
            eyebrow="Employer timeline"
            title="Application history"
            description="Each timeline step stays readable at a glance so the hiring team can reconstruct the applicant journey quickly."
            badges={[
              `${entries.length} timeline event${entries.length === 1 ? '' : 's'}`,
              `Latest status: ${formatStatus(entries[entries.length - 1]?.to_status)}`,
            ]}
            actions={[
              { label: 'Jobs', href: '/employer/jobs' },
              { label: 'Dashboard', href: '/employer/dashboard', variant: 'secondary' },
            ]}
          />
          <ApplicationTimeline entries={entries} />
        </div>
      ) : (
        <EmptyState
          eyebrow="Employer history"
          title="No history entries"
          description="This application does not have any recorded timeline events yet."
          action={
            <Link className="oq-button-primary" href="/employer/jobs">
              Back to jobs
            </Link>
          }
        />
      )}
    </DashboardShell>
  );
}

export default function EmployerApplicationHistoryPage() {
  return (
    <ProtectedRoute allowedRoles={['employer', 'admin']}>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-slate-600">Loading history page...</div>}>
        <EmployerApplicationHistoryContent />
      </Suspense>
    </ProtectedRoute>
  );
}
