'use client';

import { useEffect, useMemo, useState } from 'react';
import EmptyState from '@/components/EmptyState';
import JobsProductCard from '@/components/JobsProductCard';
import MessageBanner from '@/components/MessageBanner';
import PublicShell from '@/components/PublicShell';
import SectionCard from '@/components/SectionCard';
import { fetchJobs } from '@/services/jobs';
import { clearAuthStorage, getStoredRole, getStoredToken, getStoredUser } from '@/utils/authStorage';
import { formatStatus } from '@/utils/formatters';
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
    if (['offer_sent', 'offer_accepted', 'joined'].includes(appliedStatus)) {
      return {
        state: 'offer',
        label: formatStatus(job.applied_status),
      };
    }

    if (appliedStatus === 'submitted') {
      return {
        state: 'applied',
        label: 'Applied',
      };
    }

    return {
      state: 'in_review',
      label: formatStatus(job.applied_status),
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

  const candidateStats = useMemo(() => {
    if (!viewer.isCandidate) {
      return null;
    }

    const allJobsWithState = jobs.map((job) => getVisualJobState(job, true, viewedJobIds));
    const appliedCount = allJobsWithState.filter((item) => item.state === 'applied').length;
    const reviewCount = allJobsWithState.filter((item) => item.state === 'in_review').length;
    const offerCount = allJobsWithState.filter((item) => item.state === 'offer').length;
    const score = jobs.find((job) => job.candidate_career_score !== null && job.candidate_career_score !== undefined)?.candidate_career_score ?? '-';

    return [
      { label: 'Applied', value: appliedCount },
      { label: 'In Review', value: reviewCount },
      { label: 'Offers', value: offerCount },
      { label: 'Score', value: score },
    ];
  }, [jobs, viewedJobIds, viewer.isCandidate]);

  function handleCardOpen(jobId) {
    markJobViewed(jobId);
    setViewedJobs((current) => (current.includes(jobId) ? current : [...current, jobId]));
  }

  return (
    <PublicShell>
      <div className="space-y-6">
        {viewer.isCandidate ? (
          <section className="oq-shell rounded-[1.65rem] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[0.78rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">Jobs workspace</p>
                <h1 className="mt-2 text-[1.7rem] font-medium tracking-[-0.05em] text-[var(--text)]">
                  {`Good morning, ${getFirstName(viewer.user)}`}
                </h1>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {candidateStats?.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[1.15rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.03)] px-4 py-3 shadow-[0_18px_28px_rgba(0,0,0,0.16)]"
                  >
                    <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">{stat.label}</p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[var(--text)]">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="sticky top-[5.4rem] z-10 rounded-[1.55rem] border border-[rgba(29,40,56,0.9)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_100%),rgba(5,18,43,0.95)] p-4 shadow-[0_18px_34px_rgba(0,0,0,0.2)] backdrop-blur sm:p-5 lg:top-[6.3rem]">
          <div className="space-y-3">
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
                      className={`oq-jobs-tab ${isActive ? 'oq-jobs-tab-active' : ''}`.trim()}
                      onClick={() => setActiveCategory(pill)}
                      type="button"
                    >
                      <span>{pill}</span>
                      <span className="text-[var(--graytexts)]">({count})</span>
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
          <p className="px-1 text-sm text-[var(--text-soft)]">Loading jobs...</p>
        ) : jobsWithState.length ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--text-soft)]">
                Showing <span className="font-medium text-[var(--text)]">{jobsWithState.length}</span> role{jobsWithState.length === 1 ? '' : 's'}
                {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}.
              </p>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {viewer.isCandidate ? 'Match % and application state are visible.' : 'Sign in as a candidate to unlock Match % and application state.'}
              </p>
            </div>

            <div className="grid gap-4">
              {jobsWithState.map((job) => (
                <JobsProductCard
                  key={job.id}
                  href={`/jobs/${job.id}`}
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
              title="Nothing matched this filter set"
              description="The current search and category combination did not return any roles."
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
            />
          </SectionCard>
        )}
      </div>
    </PublicShell>
  );
}
