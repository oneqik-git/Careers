'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import EmptyState from '@/components/EmptyState';
import JobSummaryCard from '@/components/JobSummaryCard';
import MessageBanner from '@/components/MessageBanner';
import ProtectedRoute from '@/components/ProtectedRoute';
import { fetchEmployerJobs } from '@/services/jobs';
import { clearAuthStorage } from '@/utils/authStorage';

const employerNavItems = [
  { label: 'Dashboard', href: '/employer/dashboard' },
  { label: 'Post Job', href: '/employer/jobs/new' },
  { label: 'Posted Jobs', href: '/employer/jobs' },
];

export default function EmployerJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadJobs() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchEmployerJobs();
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
    <ProtectedRoute allowedRoles={['employer', 'admin']}>
      <DashboardShell
        title="Posted Jobs"
        subtitle="Manage jobs from GET /api/jobs/employer."
        onRefresh={loadJobs}
        navItems={employerNavItems}
      >
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading posted jobs...</p>
        ) : error ? (
          <MessageBanner tone="error" message={error.message || 'Unable to load posted jobs.'} />
        ) : jobs.length ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobSummaryCard
                key={job.id}
                job={job}
                href={`/employer/jobs/applicants?jobId=${job.id}`}
                footer={
                  <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
                    <p>Total applications: {job.total_applications ?? 0}</p>
                    <p>Shortlisted: {job.shortlisted ?? 0}</p>
                    <p>Joined: {job.hired ?? 0}</p>
                  </div>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No posted jobs yet"
            description="Create a job first, then applicant tracking will appear here."
          />
        )}
      </DashboardShell>
    </ProtectedRoute>
  );
}
