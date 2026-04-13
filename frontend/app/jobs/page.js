'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import JobSummaryCard from '@/components/JobSummaryCard';
import MessageBanner from '@/components/MessageBanner';
import PageHero from '@/components/PageHero';
import PublicShell from '@/components/PublicShell';
import SectionCard from '@/components/SectionCard';
import StatusBadge from '@/components/StatusBadge';
import { fetchJobs } from '@/services/jobs';
import { formatExperienceRange, formatStatus } from '@/utils/formatters';

function PublicJobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const activeDomain = searchParams.get('domain') || '';

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    async function loadJobs() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchJobs({
          q: searchParams.get('q') || undefined,
          domain: searchParams.get('domain') || undefined,
          sort: 'date',
          limit: 24,
        });
        setJobs(response?.data || []);
      } catch (requestError) {
        setError(requestError);
      } finally {
        setIsLoading(false);
      }
    }

    loadJobs();
  }, [searchParams]);

  const categories = useMemo(() => {
    const counts = new Map();

    jobs.forEach((job) => {
      const key = job.department || 'General';
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .map(([label, count]) => ({ label, count }));
  }, [jobs]);

  function updateFilters(nextQuery, nextDomain) {
    const params = new URLSearchParams();

    if (nextQuery) {
      params.set('q', nextQuery);
    }

    if (nextDomain) {
      params.set('domain', nextDomain);
    }

    router.push(params.toString() ? `/jobs?${params}` : '/jobs');
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    updateFilters(query.trim(), activeDomain);
  }

  return (
    <PublicShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="Open roles"
          title="Explore roles that are easier to take seriously."
          description="Browse publicly, narrow by area, and move into sign-in only when you want to apply. The front door stays open. The workflow stays protected."
          badges={[
            activeDomain ? `Cluster: ${activeDomain}` : 'All departments',
            `${jobs.length} visible role${jobs.length === 1 ? '' : 's'}`,
          ]}
          actions={[
            { label: 'Create Profile', href: '/register' },
            { label: 'Employer Entry', href: '/employers', variant: 'secondary' },
          ]}
          aside={(
            <form className="space-y-4" onSubmit={handleSearchSubmit}>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/72">Find your next role</p>
                <p className="mt-2 text-sm leading-6 text-white/82">Search by title, team, or keyword and move straight into the public job layer.</p>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/84">Search jobs</span>
                <input
                  className="oq-input border-white/12 bg-white/10 text-white placeholder:text-white/58"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Product, sales, support, operations..."
                  value={query}
                />
              </label>
              <button className="oq-button-primary w-full" type="submit">
                Update search
              </button>
            </form>
          )}
        />

        {categories.length ? (
          <div className="flex flex-wrap gap-2">
            <button
              className={`oq-nav-pill ${!activeDomain ? 'oq-nav-pill-active' : ''}`.trim()}
              onClick={() => updateFilters(query.trim(), '')}
              type="button"
            >
              All roles
            </button>
            {categories.map((category) => (
              <button
                key={category.label}
                className={`oq-nav-pill ${activeDomain === category.label ? 'oq-nav-pill-active' : ''}`.trim()}
                onClick={() => updateFilters(query.trim(), category.label)}
                type="button"
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>
        ) : null}

        {error ? (
          <MessageBanner tone="error" message={error.message || 'Unable to load jobs.'} />
        ) : isLoading ? (
          <p className="text-sm text-[var(--text-soft)]">Loading public jobs...</p>
        ) : jobs.length ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobSummaryCard
                key={job.id}
                actionLabel="Open role"
                badge={job.applied_status ? <StatusBadge status={job.applied_status} label={`Applied: ${formatStatus(job.applied_status)}`} /> : <StatusBadge status={job.status || 'active'} />}
                footer={(
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-[var(--text-soft)]">
                      Browse openly now. Candidate-only apply starts from the role page.
                    </p>
                    <Link className="oq-link text-sm" href={`/jobs/${job.id}`}>
                      Review full role
                    </Link>
                  </div>
                )}
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
          <SectionCard title="No jobs found" description="Try a broader search or switch back to all departments.">
            <EmptyState
              title="Nothing matched yet"
              description="The current filters did not return any public jobs."
              action={<button className="oq-button-primary" onClick={() => updateFilters('', '')} type="button">Clear filters</button>}
            />
          </SectionCard>
        )}
      </div>
    </PublicShell>
  );
}

export default function PublicJobsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-[var(--text-soft)]">Loading jobs...</div>}>
      <PublicJobsContent />
    </Suspense>
  );
}
