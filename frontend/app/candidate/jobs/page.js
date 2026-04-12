'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import EmptyState from '@/components/EmptyState';
import JobSummaryCard from '@/components/JobSummaryCard';
import MessageBanner from '@/components/MessageBanner';
import ProtectedRoute from '@/components/ProtectedRoute';
import { fetchJobs } from '@/services/jobs';
import { clearAuthStorage } from '@/utils/authStorage';

const candidateNavItems = [
  { label: 'Dashboard', href: '/candidate/dashboard' },
  { label: 'Browse Jobs', href: '/candidate/jobs' },
  { label: 'My Applications', href: '/candidate/applications' },
];

export default function CandidateJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadJobs() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchJobs();
      setJobs(response?.data || []);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (error?.code === 'AUTH_REQUIRED' || error?.code === 'TOKEN_INVALID' || error?.code === 'TOKEN_EXPIRED') {
      clearAuthStorage();
      router.replace('/login');
    }
  }, [error, router]);

  return (
    <ProtectedRoute allowedRoles={['candidate']}>
      <DashboardShell
        title="Jobs"
        subtitle="Browse active jobs from GET /api/jobs."
        onRefresh={loadJobs}
        navItems={candidateNavItems}
      >
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading jobs...</p>
        ) : error ? (
          <MessageBanner tone="error" message={error.message || 'Unable to load jobs.'} />
        ) : jobs.length ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobSummaryCard
                key={job.id}
                job={job}
                href={`/candidate/jobs/detail?jobId=${job.id}`}
                footer={
                  job.applied_status ? (
                    <p className="text-sm text-slate-600">Already applied: {job.applied_status}</p>
                  ) : (
                    <p className="text-sm text-slate-600">Open for applications.</p>
                  )
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No jobs found"
            description="No active jobs matched the current account access."
          />
        )}
      </DashboardShell>
    </ProtectedRoute>
  );
}
