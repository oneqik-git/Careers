'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useEffect } from 'react';

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
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function loadJobs() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchJobs({ limit: 8, sort: 'date' });
        setJobs(response?.data || []);
      } catch (requestError) {
        setError(requestError);
      } finally {
        setIsLoading(false);
      }
    }

    loadJobs();
  }, []);

  const featuredJobs = useMemo(() => jobs.slice(0, 3), [jobs]);
  const roleClusters = useMemo(() => buildRoleClusters(jobs), [jobs]);

  function handleSearchSubmit(event) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    router.push(trimmedQuery ? `/jobs?q=${encodeURIComponent(trimmedQuery)}` : '/jobs');
  }

  return (
    <PublicShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="Public careers layer"
          title="Discover trusted roles before you sign in."
          description="OQ Career now opens with public job discovery, brand-led storytelling, and protected actions only when candidates or employers move into meaningful workflow steps."
          badges={['Public jobs browsing', 'Protected apply and hiring actions', 'OneQik brand-aligned experience']}
          actions={[
            { label: 'Browse jobs', href: '/jobs' },
            { label: 'Employer sign up', href: '/register?role=employer', variant: 'secondary' },
          ]}
          aside={(
            <form className="space-y-3" onSubmit={handleSearchSubmit}>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/72">Search roles</p>
                <p className="mt-2 text-sm text-white/82">Start with a title, team, or location and move straight into the public jobs layer.</p>
              </div>
              <input
                className="oq-input border-white/10 bg-white/12 text-white placeholder:text-white/58"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search product, sales, engineering..."
                value={query}
              />
              <button className="oq-button-primary w-full" type="submit">
                Search careers
              </button>
            </form>
          )}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Active roles"
            value={isLoading ? '...' : jobs.length}
            helper="Public visitors can browse open roles without authentication."
            tone="accent"
          />
          <StatCard
            label="Role clusters"
            value={roleClusters.length}
            helper="Category-led browsing creates a more public product feel than a dashboard landing."
          />
          <StatCard
            label="Protected actions"
            value="Apply and manage"
            helper="Meaningful steps stay behind auth for candidate and employer workflows."
            tone="dark"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="For job seekers"
            description="Browse roles publicly, then move into candidate-only application and tracking once you are ready to take action."
            action={<Link className="oq-button-primary" href="/register?role=candidate">Create candidate account</Link>}
          >
            <div className="space-y-4 text-sm text-[var(--text-soft)]">
              <p>Open roles, public job details, and credibility context are visible before sign-in.</p>
              <p>Applying, application history, and candidate dashboards remain protected and tied to a real session.</p>
            </div>
          </SectionCard>

          <SectionCard
            title="For employers"
            description="Create company-linked access for protected hiring workflows while the public layer carries brand, trust, and discovery."
            action={<Link className="oq-button-secondary" href="/register?role=employer">Start employer setup</Link>}
          >
            <div className="space-y-4 text-sm text-[var(--text-soft)]">
              <p>Posting jobs, reviewing applicants, and updating statuses stay behind employer authentication.</p>
              <p>The public homepage and jobs layer now create a cleaner top-of-funnel entry for your hiring brand.</p>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Featured jobs"
          description="A public careers product needs clear open-role highlights close to the top of the experience."
          action={<Link className="oq-button-secondary" href="/jobs">See all jobs</Link>}
        >
          {error ? (
            <MessageBanner tone="error" message={error.message || 'Unable to load featured jobs.'} />
          ) : isLoading ? (
            <p className="text-sm text-[var(--text-soft)]">Loading featured jobs...</p>
          ) : featuredJobs.length ? (
            <div className="space-y-4">
              {featuredJobs.map((job) => (
                <JobSummaryCard
                  key={job.id}
                  actionLabel="Open role"
                  badge={<StatusBadge status={job.status || 'active'} />}
                  footer={<p className="text-sm text-[var(--text-soft)]">Protected apply starts after sign-in or candidate registration.</p>}
                  helper={[job.company_name, job.industry].filter(Boolean).join(' | ')}
                  href={`/jobs/${job.id}`}
                  job={job}
                  stats={[
                    { label: 'Experience', value: formatExperienceRange(job.experience_min_years, job.experience_max_years) },
                    { label: 'Company score', value: job.company_score ?? '-' },
                  ]}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No featured roles yet"
              description="Once jobs are live, the public homepage can spotlight them here."
              action={<Link className="oq-button-primary" href="/jobs">Open jobs page</Link>}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Role clusters"
          description="Simple department clusters make the public layer feel navigable even before adding deeper search or taxonomy work."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {roleClusters.map((cluster) => (
              <div key={cluster.label} className="oq-card-muted rounded-[26px] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">{cluster.label}</p>
                <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{cluster.count}</p>
                <p className="mt-2 text-sm text-[var(--text-soft)]">
                  {cluster.sampleRoles.length ? cluster.sampleRoles.join(', ') : 'Open roles in this cluster'}
                </p>
                <Link className="mt-4 inline-flex text-sm font-semibold text-[var(--brand-accent)]" href={`/jobs?domain=${encodeURIComponent(cluster.label)}`}>
                  Explore cluster
                </Link>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <SectionCard
            title="Why OQ Career feels different"
            description="The public layer should explain the product clearly before users decide whether to create an account."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="oq-card-muted rounded-[24px] p-5">
                <p className="text-sm font-semibold text-[var(--text)]">Public-first discovery</p>
                <p className="mt-2 text-sm text-[var(--text-soft)]">Visitors can browse roles and understand the product before any authentication wall appears.</p>
              </div>
              <div className="oq-card-muted rounded-[24px] p-5">
                <p className="text-sm font-semibold text-[var(--text)]">Credibility framing</p>
                <p className="mt-2 text-sm text-[var(--text-soft)]">Career Score and company context communicate trust, follow-through, and signal quality.</p>
              </div>
              <div className="oq-card-muted rounded-[24px] p-5">
                <p className="text-sm font-semibold text-[var(--text)]">Protected meaningful actions</p>
                <p className="mt-2 text-sm text-[var(--text-soft)]">Applying, posting, and applicant management remain tied to protected candidate and employer sessions.</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Career Score explainer"
            description="A lightweight public explanation creates context without exposing private scoring internals."
          >
            <div className="space-y-4">
              <div className="rounded-[24px] border border-[rgba(245,138,31,0.28)] bg-[rgba(245,138,31,0.12)] p-4">
                <p className="text-sm font-semibold text-[var(--text)]">What it signals</p>
                <p className="mt-2 text-sm text-[var(--text-soft)]">A structured credibility signal across skill, accountability, engagement, values, and identity verification.</p>
              </div>
              <div className="oq-card-muted rounded-[24px] p-4">
                <p className="text-sm font-semibold text-[var(--text)]">Why it matters</p>
                <p className="mt-2 text-sm text-[var(--text-soft)]">Candidates get a stronger signal of trust, and employers get more context than a resume alone can provide.</p>
              </div>
              <div className="oq-card-muted rounded-[24px] p-4">
                <p className="text-sm font-semibold text-[var(--text)]">When it becomes interactive</p>
                <p className="mt-2 text-sm text-[var(--text-soft)]">Detailed score workflows stay inside protected candidate and employer experiences.</p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </PublicShell>
  );
}
