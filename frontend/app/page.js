'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import EmptyState from '@/components/EmptyState';
import JobSummaryCard from '@/components/JobSummaryCard';
import MessageBanner from '@/components/MessageBanner';
import PageHero from '@/components/PageHero';
import PublicShell from '@/components/PublicShell';
import SectionCard from '@/components/SectionCard';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { fetchJobs } from '@/services/jobs';
import { formatExperienceRange } from '@/utils/formatters';

const trustPoints = [
  'Structured applications, not resume spam',
  'Clear application progress',
  'Better visibility for the right roles',
];

const differenceCards = [
  {
    title: 'Apply with context',
    description: 'Show more than a resume so your applications land with actual substance.',
  },
  {
    title: 'Get real visibility',
    description: 'Be seen for roles where your profile and answers make sense together.',
  },
  {
    title: 'Know where you stand',
    description: 'No more guessing after you apply. The process should feel clearer from the start.',
  },
];

const jobSeekerPoints = [
  'Apply with answers, not just resumes',
  'Stand out without gaming the system',
  'Track what’s happening after you apply',
  'Improve how you show up to employers',
];

function buildRoleClusters(jobs) {
  const counts = new Map();

  jobs.forEach((job) => {
    const key = job.department || 'General';
    const entry = counts.get(key) || { label: key, count: 0, sampleRoles: [] };
    entry.count += 1;

    if (job.title && entry.sampleRoles.length < 3 && !entry.sampleRoles.includes(job.title)) {
      entry.sampleRoles.push(job.title);
    }

    counts.set(key, entry);
  });

  return Array.from(counts.values()).sort((left, right) => right.count - left.count).slice(0, 4);
}

export default function HomePage() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchJobs({ limit: 12, sort: 'date' });
        setJobs(response?.data || []);
      } catch (requestError) {
        setError(requestError);
      } finally {
        setIsLoading(false);
      }
    }

    loadJobs();
  }, []);

  const featuredJobs = useMemo(() => {
    const featured = jobs.filter((job) => job.is_featured);
    return (featured.length ? featured : jobs).slice(0, 3);
  }, [jobs]);

  const roleClusters = useMemo(() => buildRoleClusters(jobs), [jobs]);

  return (
    <PublicShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="Careers by OneQik"
          title={<span className="oq-text-gradient">Not another job portal. It’s YOUR career.</span>}
          description="You’re better than your resume. Prove it. Careers is built for people who want stronger applications, clearer progress, and a better shot at the right roles."
          badges={['Candidate-first experience', 'Structured applications', 'Clear progress after you apply']}
          actions={[
            { label: 'Browse Jobs', href: '/jobs' },
            { label: 'Create Profile', href: '/register', variant: 'secondary' },
          ]}
          aside={(
            <div className="space-y-5">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/72">Why this feels different</p>
                <p className="mt-3 text-2xl font-semibold text-white">Built to help serious candidates get noticed.</p>
              </div>
              <div className="space-y-3">
                {trustPoints.map((point) => (
                  <div key={point} className="flex items-start gap-3 rounded-[1.3rem] border border-white/10 bg-white/8 px-4 py-3">
                    <span className="oq-dot mt-2 shrink-0" />
                    <p className="text-sm leading-6 text-white/82">{point}</p>
                  </div>
                ))}
              </div>
              <Link className="text-sm font-semibold text-white/78 transition-colors hover:text-white" href="/employers">
                Hiring team? Explore the employer side.
              </Link>
            </div>
          )}
        >
          <div className="mt-2 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Open roles"
              value={isLoading ? '...' : jobs.length || '0'}
              helper="Enough variety to browse publicly before you commit."
              tone="dark"
            />
            <StatCard
              label="Profile-first fit"
              value="Higher signal"
              helper="Applications are meant to carry context, not just attachments."
              tone="accent"
            />
            <StatCard
              label="Employer path"
              value="Separate entry"
              helper="Employer access has its own landing page and focused auth flow."
            />
          </div>
        </PageHero>

        <section className="grid gap-4 md:grid-cols-3">
          {trustPoints.map((point) => (
            <div key={point} className="oq-card-muted rounded-[1.8rem] px-5 py-5">
              <p className="text-sm font-semibold leading-6 text-[var(--text)]">{point}</p>
            </div>
          ))}
        </section>

        <SectionCard
          eyebrow="Featured Jobs"
          title="Based on your profile"
          description="Roles where you actually have a shot."
          action={<Link className="oq-button-secondary" href="/jobs">See all jobs</Link>}
        >
          {error ? (
            <MessageBanner tone="error" message={error.message || 'Unable to load featured jobs.'} />
          ) : isLoading ? (
            <p className="text-sm text-[var(--text-soft)]">Loading featured roles...</p>
          ) : featuredJobs.length ? (
            <div className="space-y-4">
              {featuredJobs.map((job) => (
                <JobSummaryCard
                  key={job.id}
                  actionLabel="View role"
                  badge={<StatusBadge status={job.status || 'active'} />}
                  footer={<p className="text-sm text-[var(--text-soft)]">Browse publicly now, then sign in only when you’re ready to apply.</p>}
                  helper={[job.company_name, job.industry].filter(Boolean).join(' | ')}
                  href={`/jobs/${job.id}`}
                  job={job}
                  stats={[
                    { label: 'Experience', value: formatExperienceRange(job.experience_min_years, job.experience_max_years) },
                    { label: 'Company score', value: job.company_score ?? '-' },
                    { label: 'Openings', value: job.openings ?? '-' },
                  ]}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No featured roles yet"
              description="Run the demo seed to populate the homepage with realistic public jobs."
              action={<Link className="oq-button-primary" href="/jobs">Browse jobs</Link>}
            />
          )}
        </SectionCard>

        <SectionCard
          eyebrow="Role Clusters"
          title="Explore what you do best"
          description="Start with the area where your strengths are clearest, then drill into the specific roles that match."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {roleClusters.map((cluster) => (
              <Link
                key={cluster.label}
                className="oq-card-muted rounded-[1.7rem] p-5 transition-transform hover:-translate-y-1"
                href={`/jobs?domain=${encodeURIComponent(cluster.label)}`}
              >
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">{cluster.label}</p>
                <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{cluster.count}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                  {cluster.sampleRoles.length ? cluster.sampleRoles.join(', ') : 'Open roles in this area'}
                </p>
                <p className="mt-5 text-sm font-semibold text-[var(--brand-accent)]">Explore roles</p>
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Why Careers"
          title="Most people apply. Few get noticed."
          description="This is built to change that."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {differenceCards.map((card) => (
              <div key={card.title} className="oq-card-muted rounded-[1.7rem] p-5">
                <p className="text-lg font-semibold tracking-tight text-[var(--text)]">{card.title}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{card.description}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <SectionCard
            eyebrow="For Job Seekers"
            title="Stop getting ignored. Start getting responses."
            description="If you're serious about getting hired, your approach has to change. This gives you a better way to apply and move forward."
            action={<Link className="oq-button-primary" href="/register">Create Profile</Link>}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {jobSeekerPoints.map((point) => (
                <div key={point} className="rounded-[1.4rem] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4">
                  <div className="flex items-start gap-3">
                    <span className="oq-dot mt-2 shrink-0" />
                    <p className="text-sm leading-6 text-[var(--text-soft)]">{point}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <PageHero
            eyebrow="Employer Entry"
            title="Hiring deserves its own focused workspace."
            description="Employers get a dedicated entry page, work-email registration, and a cleaner route into posting and reviewing roles."
            actions={[
              { label: 'For Employers', href: '/employers' },
              { label: 'Employer Sign In', href: '/employer/login', variant: 'secondary' },
            ]}
            aside={(
              <div className="space-y-4">
                <div className="rounded-[1.3rem] border border-white/12 bg-white/8 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/70">Separate employer path</p>
                  <p className="mt-2 text-sm leading-6 text-white/84">No combined role tabs. Employer access is framed around hiring from the start.</p>
                </div>
                <div className="rounded-[1.3rem] border border-white/12 bg-white/8 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/70">Work email first</p>
                  <p className="mt-2 text-sm leading-6 text-white/84">Registration starts with company identity instead of personal email patterns.</p>
                </div>
              </div>
            )}
          />
        </section>

        <PageHero
          eyebrow="Start now"
          title="Start where others stop."
          description="Browse the right roles first. Build a stronger profile when you’re ready. Move through the process with more clarity."
          actions={[
            { label: 'Browse Jobs', href: '/jobs' },
            { label: 'Create Profile', href: '/register', variant: 'secondary' },
          ]}
        />
      </div>
    </PublicShell>
  );
}
