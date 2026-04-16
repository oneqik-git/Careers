'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import LoadingState from '@/components/LoadingState';
import MessageBanner from '@/components/MessageBanner';
import PageHero from '@/components/PageHero';
import ProtectedRoute from '@/components/ProtectedRoute';
import SectionCard from '@/components/SectionCard';
import StatCard from '@/components/StatCard';
import { useCandidateProfile } from '@/hooks/useCandidateProfile';
import { clearAuthStorage } from '@/utils/authStorage';
import { candidateNavItems } from '@/utils/navigation';

export default function CandidateDashboardPage() {
  const router = useRouter();
  const { data, error, isLoading, refetch } = useCandidateProfile();
  const identityLabel = data?.current_role
    ? `${data.current_role}${data?.current_company ? ` at ${data.current_company}` : ''}`
    : data?.headline || 'Build your next move with a stronger profile.';

  useEffect(() => {
    if (error?.code === 'AUTH_REQUIRED' || error?.code === 'TOKEN_INVALID' || error?.code === 'TOKEN_EXPIRED') {
      clearAuthStorage();
      router.replace('/login');
    }
  }, [error, router]);

  return (
    <ProtectedRoute allowedRoles={['candidate']}>
      <DashboardShell
        title="Candidate Dashboard"
        subtitle="Use one workspace to review your profile, continue job discovery, and stay on top of active applications."
        onRefresh={refetch}
        navItems={candidateNavItems}
      >
        {isLoading ? (
          <LoadingState
            description="Pulling your profile snapshot, score, and workspace shortcuts."
            label="Candidate workspace"
            title="Loading your dashboard"
          />
        ) : error ? (
          <MessageBanner tone="error" message={error.message || 'Unable to load candidate dashboard.'} />
        ) : (
          <div className="space-y-6">
            <PageHero
              eyebrow="Candidate workspace"
              title={data?.full_name || 'Your profile'}
              description={identityLabel}
              badges={[
                data?.headline,
                data?.location,
                data?.open_to_work ? 'Open to work' : 'Not marked open to work',
              ].filter(Boolean)}
              actions={[
                { label: 'View Profile', href: '/candidate/profile' },
                { label: 'Applications', href: '/candidate/applications', variant: 'secondary' },
              ]}
              aside={
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-sky-100/80">Career Score</p>
                  <p className="mt-3 text-5xl font-semibold">{data?.score?.total_score ?? '-'}</p>
                  <p className="mt-2 text-sm text-[var(--secondary-1)]">
                    {data?.score?.band ? `Current band: ${data.score.band}` : 'Band not available yet'}
                  </p>
                </div>
              }
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Professional headline"
                value={data?.headline || data?.current_role || '-'}
                helper="Shown across the prototype as your quick identity snapshot."
                tone="accent"
              />
              <StatCard
                label="Current role"
                value={data?.current_role || '-'}
                helper={data?.current_company || 'Current company not added'}
              />
              <StatCard
                label="Work history"
                value={data?.experiences?.length ?? 0}
                helper="Experience records currently attached to your profile."
              />
              <StatCard
                label="Completed certifications"
                value={data?.certifications?.length ?? 0}
                helper="Completed course records available for employers to review."
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <SectionCard title="Profile snapshot" description="The most useful identity details are surfaced first so you can sanity-check what employers will recognize fastest.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="oq-detail-panel">
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Location</p>
                    <p className="mt-2 text-sm text-[var(--text)]">{data?.location || 'Not added yet'}</p>
                  </div>
                  <div className="oq-detail-panel">
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Preferred salary</p>
                    <p className="mt-2 text-sm text-[var(--text)]">
                      {data?.expected_salary_min || data?.expected_salary_max
                        ? `${data?.expected_salary_min || '-'} to ${data?.expected_salary_max || '-'}`
                        : 'Not shared yet'}
                    </p>
                  </div>
                  <div className="oq-detail-panel">
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Domains</p>
                    <p className="mt-2 text-sm text-[var(--text)]">
                      {data?.domains?.length ? data.domains.join(', ') : 'No domains added'}
                    </p>
                  </div>
                  <div className="oq-detail-panel">
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Notice period</p>
                    <p className="mt-2 text-sm text-[var(--text)]">
                      {data?.notice_period_days ? `${data.notice_period_days} days` : 'Not shared yet'}
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Main actions" description="The core candidate loop stays simple: keep the profile sharp, find the next role, and monitor movement in one place.">
                <div className="space-y-3">
                  <Link
                    className="flex items-center justify-between rounded-2xl border border-[rgba(93,224,230,0.22)] bg-[rgba(93,224,230,0.08)] px-4 py-3 text-sm font-medium text-[var(--text)] transition hover:-translate-y-0.5"
                    href="/candidate/profile"
                  >
                    <span>View Profile</span>
                    <span>Identity summary</span>
                  </Link>
                  <Link
                    className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm font-medium text-[var(--text)] transition hover:border-[rgba(93,224,230,0.22)] hover:bg-[rgba(93,224,230,0.06)]"
                    href="/candidate/applications"
                  >
                    <span>Applications</span>
                    <span>Track updates</span>
                  </Link>
                  <Link
                    className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm font-medium text-[var(--text)] transition hover:border-[rgba(93,224,230,0.22)] hover:bg-[rgba(93,224,230,0.06)]"
                    href="/jobs"
                  >
                    <span>Browse Jobs</span>
                    <span>Find the next fit</span>
                  </Link>
                  <Link
                    className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm font-medium text-[var(--text)] transition hover:border-[rgba(93,224,230,0.22)] hover:bg-[rgba(93,224,230,0.06)]"
                    href="/learn"
                  >
                    <span>Learn</span>
                    <span>Progress view</span>
                  </Link>
                </div>
              </SectionCard>
            </div>
          </div>
        )}
      </DashboardShell>
    </ProtectedRoute>
  );
}
