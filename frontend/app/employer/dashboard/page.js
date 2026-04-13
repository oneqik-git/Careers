'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import MessageBanner from '@/components/MessageBanner';
import PageHero from '@/components/PageHero';
import ProtectedRoute from '@/components/ProtectedRoute';
import SectionCard from '@/components/SectionCard';
import StatCard from '@/components/StatCard';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { clearAuthStorage } from '@/utils/authStorage';
import { employerNavItems } from '@/utils/navigation';

export default function EmployerDashboardPage() {
  const router = useRouter();
  const { data, error, isLoading, refetch } = useCompanyProfile();
  const employerIdentity = data?.employer?.designation
    ? `${data.employer.designation}${data?.employer?.department ? ` | ${data.employer.department}` : ''}`
    : 'Manage your hiring workflow from one place.';

  useEffect(() => {
    if (error?.code === 'AUTH_REQUIRED' || error?.code === 'TOKEN_INVALID' || error?.code === 'TOKEN_EXPIRED') {
      clearAuthStorage();
      router.replace('/employer/login');
    }
  }, [error, router]);

  return (
    <ProtectedRoute allowedRoles={['employer', 'admin']}>
      <DashboardShell
        title="Employer Dashboard"
        subtitle="See your company identity clearly, then jump into posting roles and reviewing applicants."
        onRefresh={refetch}
        navItems={employerNavItems}
      >
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading company profile...</p>
        ) : error ? (
          <MessageBanner tone="error" message={error.message || 'Unable to load employer dashboard.'} />
        ) : (
          <div className="space-y-6">
            <PageHero
              eyebrow="Employer workspace"
              title={data?.company?.name || 'Your company'}
              description={employerIdentity}
              badges={[
                data?.employer?.full_name,
                data?.company?.headquarters,
                data?.employer?.is_admin ? 'Company admin' : 'Hiring team member',
              ].filter(Boolean)}
              actions={[
                { label: 'Post Job', href: '/employer/jobs/new' },
                { label: 'View Jobs', href: '/employer/jobs', variant: 'secondary' },
              ]}
              aside={
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-sky-100/80">Employer identity</p>
                  <p className="mt-3 text-2xl font-semibold">{data?.employer?.full_name || '-'}</p>
                  <p className="mt-2 text-sm text-slate-200">{employerIdentity}</p>
                </div>
              }
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Company"
                value={data?.company?.name || '-'}
                helper={data?.company?.slug ? `Slug: ${data.company.slug}` : 'Company slug not available'}
                tone="accent"
              />
              <StatCard
                label="Employer"
                value={data?.employer?.full_name || '-'}
                helper={data?.employer?.designation || 'Designation not added'}
              />
              <StatCard
                label="Department"
                value={data?.employer?.department || '-'}
                helper="Used to anchor hiring ownership in the prototype."
              />
              <StatCard
                label="HQ"
                value={data?.company?.headquarters || '-'}
                helper={data?.company?.website_url || 'Website not added'}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <SectionCard title="Main actions" description="The employer flow stays focused: post roles, then move into applicant review without extra navigation steps.">
                <div className="space-y-3">
                  <Link
                    className="flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                    href="/employer/jobs/new"
                  >
                    <span>Post Job</span>
                    <span>Create a role</span>
                  </Link>
                  <Link
                    className="flex items-center justify-between rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    href="/employer/jobs"
                  >
                    <span>View Jobs</span>
                    <span>See applicants</span>
                  </Link>
                </div>
              </SectionCard>

              <SectionCard title="Company snapshot" description="A few key company and employer details are surfaced here so the workspace feels anchored to the right hiring identity.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Company slug</p>
                    <p className="mt-2 text-sm text-slate-800">{data?.company?.slug || 'Not available'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Website</p>
                    <p className="mt-2 text-sm text-slate-800">{data?.company?.website_url || 'Not added'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Funding stage</p>
                    <p className="mt-2 text-sm text-slate-800">{data?.company?.funding_stage || 'Not added'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Employer access</p>
                    <p className="mt-2 text-sm text-slate-800">
                      {data?.employer?.is_admin ? 'Admin privileges enabled' : 'Standard employer access'}
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        )}
      </DashboardShell>
    </ProtectedRoute>
  );
}
