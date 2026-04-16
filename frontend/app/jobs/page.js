'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import EmptyState from '@/components/EmptyState';
import JobsProductCard from '@/components/JobsProductCard';
import LoadingState from '@/components/LoadingState';
import MessageBanner from '@/components/MessageBanner';
import PublicShell from '@/components/PublicShell';
import SectionCard from '@/components/SectionCard';
import ThemeToggle from '@/components/ThemeToggle';
import { fetchJobs } from '@/services/jobs';
import { clearAuthStorage, getStoredRole, getStoredToken, getStoredUser } from '@/utils/authStorage';
import { getApplicationStatusMeta, getJobsVisualState, isActiveApplication } from '@/utils/applicationStatus';
import { getViewedJobs, markJobViewed } from '@/utils/jobViewState';

const CATEGORY_PILLS = ['All', 'Sales', 'Tech', 'HR', 'Finance', 'Marketing', 'Product', 'BPO', 'Ops'];
const AUTH_ERROR_CODES = ['AUTH_REQUIRED', 'TOKEN_INVALID', 'TOKEN_EXPIRED'];

function readViewerSnapshot() {
  const hasToken = Boolean(getStoredToken());
  const role = getStoredRole();
  const user = getStoredUser();

  return {
    hasToken,
    role,
    user,
    isCandidate: hasToken && role === 'candidate',
  };
}

function getFirstName(user) {
  const name = String(user?.full_name || '').trim();
  return name ? name.split(/\s+/)[0] : 'Candidate';
}

function getCategory(job) {
  const value = `${job.department || ''} ${job.job_function || ''}`.toLowerCase();

  if (value.includes('sales') || value.includes('gtm') || value.includes('business development')) {
    return 'Sales';
  }

  if (value.includes('tech') || value.includes('technology') || value.includes('engineering') || value.includes('devops') || value.includes('data') || value.includes('security')) {
    return 'Tech';
  }

  if (value.includes('human resources') || value.includes('talent') || value.includes('people') || value.includes('hr')) {
    return 'HR';
  }

  if (value.includes('finance') || value.includes('accounting') || value.includes('audit') || value.includes('fp&a')) {
    return 'Finance';
  }

  if (value.includes('marketing') || value.includes('growth') || value.includes('brand')) {
    return 'Marketing';
  }

  if (value.includes('product') || value.includes('ux')) {
    return 'Product';
  }

  if (value.includes('bpo') || value.includes('contact centre') || value.includes('contact center') || value.includes('support')) {
    return 'BPO';
  }

  if (value.includes('operations') || value.includes('ops') || value.includes('supply chain') || value.includes('customer success')) {
    return 'Ops';
  }

  return 'All';
}

function matchesQuery(job, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    job.title,
    job.company_name,
    job.location,
    job.department,
    job.job_function,
    job.level,
    ...(job.required_skills || []),
    ...(job.preferred_skills || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function getVisualJobState(job, isCandidate, viewedJobIds) {
  const appliedStatus = String(job.applied_status || '').toLowerCase();

  if (isCandidate && appliedStatus) {
    return {
      state: getJobsVisualState(appliedStatus),
      label: getApplicationStatusMeta(appliedStatus).badgeLabel,
    };
  }

  if (viewedJobIds.has(job.id)) {
    return {
      state: 'viewed',
      label: 'Viewed',
    };
  }

  return {
    state: 'default',
    label: '',
  };
}

function calculateMatchPercent(job) {
  const candidateScore = Number(job.candidate_career_score ?? 0);
  const companyScore = Number(job.company_score ?? 0);
  const skillsBonus = Math.min(18, ((job.required_skills || []).length * 3) + (job.preferred_skills || []).length);
  const scoreBase = candidateScore ? Math.round(candidateScore / 6) : 52;
  const companyBonus = Math.min(12, Math.round(companyScore / 8));

  return Math.max(54, Math.min(98, scoreBase + skillsBonus + companyBonus));
}

async function loadJobsWithFallback(setJobs, setError, setViewer, viewerSnapshot) {
  try {
    const response = await fetchJobs({
      sort: 'date',
      limit: 80,
    });
    setJobs(response?.data || []);
    setError(null);
  } catch (requestError) {
    if (viewerSnapshot.isCandidate && AUTH_ERROR_CODES.includes(requestError?.code)) {
      clearAuthStorage();
      const publicSnapshot = readViewerSnapshot();
      setViewer(publicSnapshot);

      const retryResponse = await fetchJobs({
        sort: 'date',
        limit: 80,
      });

      setJobs(retryResponse?.data || []);
      setError(null);
      return;
    }

    setError(requestError);
  }
}

export default function PublicJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewer, setViewer] = useState({
    hasToken: false,
    role: null,
    user: null,
    isCandidate: false,
  });
  const [viewedJobs, setViewedJobs] = useState([]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const queryParts = [
      params.get('q'),
      params.get('area'),
      params.get('exp'),
    ].filter(Boolean);
    const nextCategory = params.get('domain');

    setQuery(queryParts.join(' ').trim());
    setActiveCategory(CATEGORY_PILLS.includes(nextCategory) ? nextCategory : 'All');
  }, []);

  useEffect(() => {
    let isActive = true;

    async function hydrateJobsPage() {
      const viewerSnapshot = readViewerSnapshot();

      if (!isActive) {
        return;
      }

      setViewer(viewerSnapshot);
      setViewedJobs(getViewedJobs());
      setIsLoading(true);

      try {
        await loadJobsWithFallback(setJobs, setError, setViewer, viewerSnapshot);
      } catch (requestError) {
        if (isActive) {
          setError(requestError);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    hydrateJobsPage();

    return () => {
      isActive = false;
    };
  }, []);

  const viewedJobIds = useMemo(() => new Set(viewedJobs), [viewedJobs]);

  const categoryCounts = useMemo(() => {
    const counts = new Map(CATEGORY_PILLS.map((pill) => [pill, 0]));

    jobs.forEach((job) => {
      const category = getCategory(job);
      counts.set(category, (counts.get(category) || 0) + 1);
    });

    counts.set('All', jobs.length);
    return counts;
  }, [jobs]);

  const visibleJobs = useMemo(() => {
    return jobs.filter((job) => {
      const queryMatch = matchesQuery(job, query.trim());
      const categoryMatch = activeCategory === 'All' || getCategory(job) === activeCategory;
      return queryMatch && categoryMatch;
    });
  }, [activeCategory, jobs, query]);

  const jobsWithState = useMemo(() => {
    return visibleJobs.map((job) => {
      const visualState = getVisualJobState(job, viewer.isCandidate, viewedJobIds);

      return {
        ...job,
        category: getCategory(job),
        visualState,
        matchPercent: viewer.isCandidate ? calculateMatchPercent(job) : null,
      };
    });
  }, [viewedJobIds, viewer.isCandidate, visibleJobs]);

  const candidateContext = useMemo(() => {
    if (!viewer.isCandidate) {
      return null;
    }

    const totalApplications = jobs.filter((job) => job.applied_status).length;
    const reviewCount = jobs.filter((job) => {
      const status = String(job.applied_status || '').toLowerCase();
      return Boolean(status) && isActiveApplication(status) && status !== 'submitted';
    }).length;
    const offerCount = jobs.filter((job) => ['offer_sent', 'offer_accepted', 'joined'].includes(String(job.applied_status || '').toLowerCase())).length;
    const strongMatches = jobs
      .filter((job) => !job.applied_status)
      .map((job) => calculateMatchPercent(job))
      .filter((score) => score >= 80).length;
    const score = jobs.find((job) => job.candidate_career_score !== null && job.candidate_career_score !== undefined)?.candidate_career_score ?? '-';
    const activityMessage = offerCount
      ? `${offerCount} offer${offerCount === 1 ? '' : 's'} waiting`
      : reviewCount
        ? `${reviewCount} role${reviewCount === 1 ? '' : 's'} in motion`
        : 'No active applications yet';

    return {
      score,
      strongMatches,
      activityMessage,
      stats: [
        { label: 'Applied', value: totalApplications },
        { label: 'In Review', value: reviewCount },
        { label: 'Offers', value: offerCount },
        { label: 'Score', value: score },
      ],
    };
  }, [jobs, viewer.isCandidate]);

  function handleCardOpen(jobId) {
    markJobViewed(jobId);
    setViewedJobs((current) => (current.includes(jobId) ? current : [...current, jobId]));
  }

  return (
    <PublicShell
      utilityContent={viewer.isCandidate ? (
        <>
          <ThemeToggle className="shrink-0" tone="public" />
          <Link className="oq-nav-utility-link" href="/candidate/applications">
            My Applications
          </Link>
          <Link className="oq-nav-cta oq-nav-cta-secondary" href="/candidate/dashboard">
            Candidate Workspace
          </Link>
        </>
      ) : null}
    >
      <div className="space-y-6">
        {viewer.isCandidate ? (
          <section className="oq-shell rounded-[1.75rem] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex-1">
                <p className="text-[0.78rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">Candidate jobs</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h1 className="text-[1.7rem] font-medium tracking-[-0.05em] text-[var(--text)]">
                    {`Good morning, ${getFirstName(viewer.user)}`}
                  </h1>
                  <span className="rounded-full border border-[rgba(249,115,22,0.22)] bg-[rgba(249,115,22,0.12)] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-orange-200">
                    Career Score {candidateContext?.score ?? '-'}
                  </span>
                </div>
                <p className="mt-3 text-sm text-[var(--text-soft)]">
                  {candidateContext ? `${candidateContext.strongMatches} strong matches available | ${candidateContext.activityMessage}` : 'Your jobs feed becomes trackable once you sign in as a candidate.'}
                </p>
              </div>

              <div className="flex items-center gap-4 self-start xl:self-center">
                <div className="flex h-[88px] w-[88px] shrink-0 flex-col items-center justify-center rounded-full border border-[rgba(249,115,22,0.22)] bg-[radial-gradient(circle_at_30%_30%,rgba(249,115,22,0.16),transparent_58%),rgba(255,255,255,0.03)] shadow-[0_18px_28px_rgba(0,0,0,0.16)]">
                  <span className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">Score</span>
                  <span className="mt-1 text-xl font-semibold text-orange-200">{candidateContext?.score ?? '-'}</span>
                </div>
                <Link className="oq-button-secondary" href="/candidate/applications">
                  Open Tracker
                </Link>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {candidateContext?.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[1.15rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.03)] px-4 py-3 shadow-[0_18px_28px_rgba(0,0,0,0.16)]"
                >
                  <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">{stat.label}</p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[var(--text)]">{stat.value}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="sticky top-[5.4rem] z-10 rounded-[1.55rem] border border-[rgba(29,40,56,0.9)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_100%),rgba(5,18,43,0.95)] p-4 shadow-[0_18px_34px_rgba(0,0,0,0.2)] backdrop-blur sm:p-5 lg:top-[6.3rem]">
          <div className="space-y-4">
            {viewer.isCandidate ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[0.74rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">Browse by domain</p>
                  <p className="mt-1 text-sm text-[var(--text-soft)]">Match score, company score, and application state stay visible on every role card.</p>
                </div>
                <Link className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-accent)] transition hover:text-white" href="/candidate/applications">
                  Open Applications
                </Link>
              </div>
            ) : null}

            <input
              className="oq-input w-full"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search roles, companies, skills..."
              type="search"
              value={query}
            />

            <div className="-mx-1 overflow-x-auto px-1 pb-1">
              <div className="flex w-max gap-3 pr-3">
                {CATEGORY_PILLS.map((pill) => {
                  const isActive = activeCategory === pill;
                  const count = categoryCounts.get(pill) || 0;

                  return (
                    <button
                      key={pill}
                      className={viewer.isCandidate
                        ? `flex min-w-[92px] flex-col items-start rounded-[1.15rem] border px-4 py-3 text-left shadow-[0_14px_28px_rgba(0,0,0,0.16)] transition ${isActive ? 'border-[rgba(93,224,230,0.28)] bg-[linear-gradient(90deg,rgba(55,162,206,0.14)_0%,rgba(93,224,230,0.18)_100%),rgba(6,18,43,0.94)]' : 'border-[rgba(29,40,56,0.88)] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),transparent_100%),rgba(6,18,43,0.92)] hover:border-[rgba(93,224,230,0.22)] hover:text-white'}`
                        : `oq-jobs-tab ${isActive ? 'oq-jobs-tab-active' : ''}`.trim()}
                      onClick={() => setActiveCategory(pill)}
                      type="button"
                    >
                      {viewer.isCandidate ? (
                        <>
                          <span className={`text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${isActive ? 'text-white' : 'text-[var(--text-muted)]'}`.trim()}>{pill}</span>
                          <span className={`mt-2 text-lg font-semibold tracking-[-0.03em] ${isActive ? 'text-white' : 'text-[var(--text)]'}`.trim()}>{count}</span>
                        </>
                      ) : (
                        <>
                          <span>{pill}</span>
                          <span className="text-[var(--graytexts)]">({count})</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <MessageBanner tone="error" message={error.message || 'Unable to load jobs.'} />
        ) : isLoading ? (
          <LoadingState
            description="Pulling the latest roles, filters, and application context."
            label="Jobs"
            title="Loading available roles"
          />
        ) : jobsWithState.length ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--text-soft)]">
                Showing <span className="font-medium text-[var(--text)]">{jobsWithState.length}</span> role{jobsWithState.length === 1 ? '' : 's'}
                {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}.
              </p>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {viewer.isCandidate ? 'Cards open the candidate role view with apply and tracker context.' : 'Sign in as a candidate to unlock match scoring and application state.'}
              </p>
            </div>

            <div className="grid gap-4">
              {jobsWithState.map((job) => (
                <JobsProductCard
                  key={job.id}
                  href={viewer.isCandidate ? `/candidate/jobs/detail?jobId=${job.id}` : `/jobs/${job.id}`}
                  job={job}
                  matchPercent={job.matchPercent}
                  onOpen={() => handleCardOpen(job.id)}
                  showApplicationState={viewer.isCandidate}
                  showMatch={viewer.isCandidate}
                  state={job.visualState.state}
                  stateLabel={job.visualState.label}
                />
              ))}
            </div>
          </div>
        ) : (
          <SectionCard title="No jobs found" description="Try a broader search or switch back to All to widen the current results.">
            <EmptyState
              eyebrow="Current filters"
              title="Nothing matched this filter set"
              description="The current search and category combination did not return any roles. Clear the filters to get back to the full jobs view."
              action={(
                <button
                  className="oq-button-primary"
                  onClick={() => {
                    setQuery('');
                    setActiveCategory('All');
                  }}
                  type="button"
                >
                  Clear filters
                </button>
              )}
              secondaryAction={<Link className="oq-button-ghost" href="/">Back to home</Link>}
            />
          </SectionCard>
        )}
      </div>
    </PublicShell>
  );
}
