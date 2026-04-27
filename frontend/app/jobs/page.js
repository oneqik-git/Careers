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
import { getApplicationStatusMeta, getJobsVisualState, isActiveApplication } from '@/utils/applicationStatus';
import { clearAuthStorage, getStoredRole, getStoredToken, getStoredUser } from '@/utils/authStorage';
import { getViewedJobs, markJobViewed } from '@/utils/jobViewState';
import { parseSearchIntent } from '@/utils/searchIntent';

const AUTH_ERROR_CODES = ['AUTH_REQUIRED', 'TOKEN_INVALID', 'TOKEN_EXPIRED'];

const WORK_MODE_OPTIONS = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'on_site', label: 'On-site' },
];

const EXPERIENCE_OPTIONS = [
  { value: '0-1', label: '0-1', min: 0, max: 1 },
  { value: '1-3', label: '1-3', min: 1, max: 3 },
  { value: '3-5', label: '3-5', min: 3, max: 5 },
  { value: '5-10', label: '5-10', min: 5, max: 10 },
  { value: '10+', label: '10+', min: 10, max: Number.POSITIVE_INFINITY },
];

const ROLE_FOCUS_OPTIONS = [
  { value: 'Sales & GTM', label: 'Sales & GTM', apiValue: 'Sales & GTM' },
  { value: 'Product', label: 'Product', apiValue: 'Product' },
  { value: 'Tech', label: 'Tech', apiValue: 'Technology' },
  { value: 'Operations', label: 'Operations', apiValue: 'Operations' },
  { value: 'Marketing', label: 'Marketing', apiValue: 'Marketing' },
  { value: 'Finance', label: 'Finance', apiValue: 'Finance' },
  { value: 'HR', label: 'HR', apiValue: 'Human Resources' },
];

const OPPORTUNITY_TYPE_OPTIONS = [
  { value: 'full_time', label: 'Full-time', matches: ['full_time'] },
  { value: 'part_time', label: 'Part-time', matches: ['part_time'] },
  { value: 'internship', label: 'Internship', matches: ['internship'] },
  { value: 'contract', label: 'Contract', matches: ['contract'] },
  { value: 'project_based', label: 'Project-based', matches: ['project_based', 'freelance'] },
];

const COMPENSATION_OPTIONS = [
  { value: 'upto-8', label: 'Up to 8L', min: 0, max: 800000 },
  { value: '8-15', label: '8L-15L', min: 800000, max: 1500000 },
  { value: '15-25', label: '15L-25L', min: 1500000, max: 2500000 },
  { value: '25-plus', label: '25L+', min: 2500000, max: Number.POSITIVE_INFINITY },
];

const CREDIBILITY_OPTIONS = [
  { value: 'high_response', label: 'High Response Rate' },
  { value: 'verified_employer', label: 'Verified Employer' },
  { value: 'fast_hiring', label: 'Fast Hiring' },
  { value: 'high_company_score', label: 'High Co. Score' },
];

const MOMENTUM_OPTIONS = [
  { value: 'actively_hiring', label: 'Actively Hiring' },
  { value: 'recently_opened', label: 'Recently Opened' },
  { value: 'low_competition', label: 'Low Competition' },
];

function createDefaultFilters() {
  return {
    compensation: null,
    credibility: [],
    experience: null,
    momentum: [],
    opportunityTypes: [],
    roleFocus: [],
    workModes: [],
  };
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getOptionLabel(options, value) {
  return options.find((option) => option.value === value)?.label || value;
}

function toggleValue(values, value) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function normalizeWorkMode(value) {
  const normalized = String(value || '').toLowerCase().replace(/[\s-]+/g, '_');
  return normalized === 'onsite' ? 'on_site' : normalized;
}

function normalizeEmploymentType(value) {
  return String(value || '').toLowerCase().replace(/[\s-]+/g, '_');
}

function parseExperienceFilter(value) {
  if (!value) {
    return null;
  }

  const exactMatch = EXPERIENCE_OPTIONS.find((option) => option.value === value);

  if (exactMatch) {
    return exactMatch.value;
  }

  if (value === '6+') {
    return '5-10';
  }

  const [rawMin, rawMax] = String(value).split('-');
  const min = Number(rawMin);
  const max = Number(rawMax);

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return null;
  }

  return EXPERIENCE_OPTIONS.find((option) => min >= option.min && max <= option.max)?.value || null;
}

function getExperienceOption(value) {
  return EXPERIENCE_OPTIONS.find((option) => option.value === value) || null;
}

function getRoleFocus(job) {
  const value = `${job.department || ''} ${job.job_function || ''} ${job.title || ''}`.toLowerCase();

  if (value.includes('sales') || value.includes('gtm') || value.includes('business development')) {
    return 'Sales & GTM';
  }

  if (value.includes('tech') || value.includes('technology') || value.includes('engineering') || value.includes('engineer') || value.includes('developer') || value.includes('devops') || value.includes('data') || value.includes('security')) {
    return 'Tech';
  }

  if (value.includes('human resources') || value.includes('talent') || value.includes('recruit') || value.includes('people') || value.includes('hr')) {
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

  if (value.includes('operations') || value.includes('ops') || value.includes('supply chain') || value.includes('customer success') || value.includes('bpo') || value.includes('support')) {
    return 'Operations';
  }

  return 'Operations';
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

  return query.toLowerCase().split(/\s+/).every((term) => haystack.includes(term));
}

function matchesLocation(job, locationQuery) {
  if (!locationQuery) {
    return true;
  }

  const haystack = [
    job.location,
    job.location_formatted,
    job.location_city,
    job.location_state,
    job.location_country,
    job.location_info?.formatted,
    job.location_info?.city,
    job.location_info?.state,
    job.location_info?.country,
    job.work_mode === 'remote' ? 'remote' : null,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(locationQuery.toLowerCase());
}

function matchesExperience(job, experienceValue) {
  const filter = getExperienceOption(experienceValue);

  if (!filter) {
    return true;
  }

  const jobMin = Number(job.experience_min_years ?? 0);
  const jobMaxValue = job.experience_max_years;
  const jobMax = jobMaxValue === null || jobMaxValue === undefined ? Number.POSITIVE_INFINITY : Number(jobMaxValue);

  if (!Number.isFinite(jobMin) && jobMax !== Number.POSITIVE_INFINITY) {
    return true;
  }

  return jobMin <= filter.max && jobMax >= filter.min;
}

function matchesCompensation(job, compensationValue) {
  const filter = COMPENSATION_OPTIONS.find((option) => option.value === compensationValue);

  if (!filter || job.salary_disclosed === false) {
    return true;
  }

  const salaryMin = Number(job.salary_min ?? 0);
  const salaryMax = job.salary_max === null || job.salary_max === undefined ? Number.POSITIVE_INFINITY : Number(job.salary_max);

  return salaryMin <= filter.max && salaryMax >= filter.min;
}

function matchesSelectedSignals(selectedValues, options, job, predicateMap) {
  if (!selectedValues.length) {
    return true;
  }

  return selectedValues.some((value) => options.some((option) => option.value === value) && predicateMap[value]?.(job));
}

function isRecentlyOpened(job) {
  if (!job.created_at) {
    return false;
  }

  const createdAt = new Date(job.created_at);

  if (Number.isNaN(createdAt.getTime())) {
    return false;
  }

  const ageDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return ageDays <= 14;
}

function matchesFilters(job, filters) {
  const workMode = normalizeWorkMode(job.work_mode);
  const opportunityType = normalizeEmploymentType(job.employment_type);
  const roleFocusMatch = !filters.roleFocus.length || filters.roleFocus.includes(getRoleFocus(job));
  const workModeMatch = !filters.workModes.length || filters.workModes.includes(workMode);
  const typeMatch = !filters.opportunityTypes.length || filters.opportunityTypes.some((type) => {
    const option = OPPORTUNITY_TYPE_OPTIONS.find((item) => item.value === type);
    return option?.matches.includes(opportunityType);
  });
  const credibilityMatch = matchesSelectedSignals(filters.credibility, CREDIBILITY_OPTIONS, job, {
    high_response: (item) => Number(item.response_rate_pct ?? 0) >= 80,
    verified_employer: (item) => Boolean(item.verified_company),
    fast_hiring: (item) => Number(item.tat_hours ?? 999) <= 48,
    high_company_score: (item) => Number(item.company_score ?? 0) >= 4,
  });
  const momentumMatch = matchesSelectedSignals(filters.momentum, MOMENTUM_OPTIONS, job, {
    actively_hiring: (item) => Number(item.openings ?? 0) > 0,
    recently_opened: isRecentlyOpened,
    low_competition: (item) => Number(item.applications_count ?? 0) <= Math.max(5, Number(item.openings ?? 1) * 3),
  });

  return (
    roleFocusMatch
    && workModeMatch
    && typeMatch
    && matchesExperience(job, filters.experience)
    && matchesCompensation(job, filters.compensation)
    && credibilityMatch
    && momentumMatch
  );
}

function buildSearchRequestParams({ filters, locationQuery, searchText }) {
  const params = {};
  const trimmedSearch = String(searchText || '').trim();
  const trimmedLocation = String(locationQuery || '').trim();
  const experienceOption = getExperienceOption(filters.experience);
  const compensationOption = COMPENSATION_OPTIONS.find((option) => option.value === filters.compensation);

  if (trimmedSearch) {
    params.q = trimmedSearch;
  }

  if (filters.roleFocus.length === 1) {
    params.domain = ROLE_FOCUS_OPTIONS.find((option) => option.value === filters.roleFocus[0])?.apiValue;
  }

  if (filters.workModes.length === 1) {
    params.work_mode = filters.workModes[0];
  }

  if (experienceOption && experienceOption.max !== Number.POSITIVE_INFINITY) {
    params.experience_max = experienceOption.max;
  }

  if (compensationOption) {
    if (compensationOption.min) {
      params.salary_min = compensationOption.min;
    }

    if (compensationOption.max !== Number.POSITIVE_INFINITY) {
      params.salary_max = compensationOption.max;
    }
  }

  if (trimmedLocation) {
    params.location_query = trimmedLocation;
    params.radius_km = '5';
    params.include_remote = 'true';
  }

  return params;
}

function applyIntentToFilters(filters, intent) {
  return {
    ...filters,
    experience: intent.experienceRange || filters.experience,
    opportunityTypes: unique([...filters.opportunityTypes, ...intent.opportunityTypes]),
    roleFocus: unique([...filters.roleFocus, ...intent.roleFocus]),
    workModes: unique([...filters.workModes, ...intent.workModes]),
  };
}

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

async function loadJobsWithFallback(setJobs, setError, setViewer, viewerSnapshot, searchParams = {}) {
  try {
    const response = await fetchJobs({
      sort: 'date',
      limit: 100,
      ...searchParams,
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
        limit: 100,
        ...searchParams,
      });

      setJobs(retryResponse?.data || []);
      setError(null);
      return;
    }

    setError(requestError);
  }
}

function FilterSection({ children, title }) {
  return (
    <details className="border-t border-[rgba(93,224,230,0.12)] pt-4 first:border-t-0 first:pt-0">
      <summary className="inline-block cursor-pointer list-none transition hover:scale-[1.03] [&::-webkit-details-marker]:hidden">
        <h2 className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{title}</h2>
      </summary>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </details>
  );
}

function FilterButton({ active, children, onClick }) {
  return (
    <button
      className={`rounded-[0.8rem] border px-3 py-2 text-left text-xs font-medium transition hover:scale-[1.03] ${active ? 'border-[rgba(93,224,230,0.38)] bg-[rgba(93,224,230,0.12)] text-white' : 'border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.025)] text-[var(--text-soft)] hover:border-[rgba(93,224,230,0.24)] hover:text-white'}`.trim()}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export default function PublicJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchText, setSearchText] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [filters, setFilters] = useState(createDefaultFilters);
  const [searchRequestParams, setSearchRequestParams] = useState(null);
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
    const locationValue = (params.get('location_query') || params.get('area') || '').trim();
    const q = (params.get('q') || '').trim();
    const intent = parseSearchIntent(q);
    const nextFilters = applyIntentToFilters(createDefaultFilters(), intent);
    const domain = params.get('domain');
    const workMode = normalizeWorkMode(params.get('work_mode'));
    const experience = parseExperienceFilter(params.get('exp') || params.get('experience'));

    if (domain) {
      const roleFocus = ROLE_FOCUS_OPTIONS.find((option) => [option.value, option.apiValue].includes(domain))?.value;

      if (roleFocus) {
        nextFilters.roleFocus = unique([...nextFilters.roleFocus, roleFocus]);
      }
    }

    if (WORK_MODE_OPTIONS.some((option) => option.value === workMode)) {
      nextFilters.workModes = unique([...nextFilters.workModes, workMode]);
    }

    if (experience) {
      nextFilters.experience = experience;
    }

    const nextLocation = intent.locations[0] || locationValue;
    const nextSearchText = intent.cleanedQuery || q;

    setQuery(q);
    setSearchText(nextSearchText);
    setLocationQuery(nextLocation);
    setFilters(nextFilters);
    setSearchRequestParams(buildSearchRequestParams({
      filters: nextFilters,
      locationQuery: nextLocation,
      searchText: nextSearchText,
    }));
  }, []);

  useEffect(() => {
    let isActive = true;

    async function hydrateJobsPage() {
      if (searchRequestParams === null) {
        return;
      }

      const viewerSnapshot = readViewerSnapshot();

      if (!isActive) {
        return;
      }

      setViewer(viewerSnapshot);
      setViewedJobs(getViewedJobs());
      setIsLoading(true);

      try {
        await loadJobsWithFallback(setJobs, setError, setViewer, viewerSnapshot, searchRequestParams);
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
  }, [searchRequestParams]);

  const viewedJobIds = useMemo(() => new Set(viewedJobs), [viewedJobs]);

  const visibleJobs = useMemo(() => {
    return jobs.filter((job) => {
      return (
        matchesQuery(job, searchText.trim())
        && matchesLocation(job, locationQuery.trim())
        && matchesFilters(job, filters)
      );
    });
  }, [filters, jobs, locationQuery, searchText]);

  const jobsWithState = useMemo(() => {
    return visibleJobs.map((job) => {
      const visualState = getVisualJobState(job, viewer.isCandidate, viewedJobIds);

      return {
        ...job,
        roleFocus: getRoleFocus(job),
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
        ? `${reviewCount} opportunit${reviewCount === 1 ? 'y' : 'ies'} in motion`
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

  function setListFilter(key, value) {
    setFilters((current) => ({
      ...current,
      [key]: toggleValue(current[key], value),
    }));
  }

  function updateSearchRequest(nextFilters = filters, nextLocation = locationQuery, nextSearchText = searchText) {
    setSearchRequestParams(buildSearchRequestParams({
      filters: nextFilters,
      locationQuery: nextLocation,
      searchText: nextSearchText,
    }));
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    const intent = parseSearchIntent(query);
    const nextFilters = applyIntentToFilters(filters, intent);
    const nextLocation = intent.locations[0] || locationQuery;
    const nextSearchText = intent.cleanedQuery || query.trim();

    setFilters(nextFilters);
    setLocationQuery(nextLocation);
    setSearchText(nextSearchText);
    updateSearchRequest(nextFilters, nextLocation, nextSearchText);
  }

  function clearFilters() {
    const nextFilters = createDefaultFilters();
    setQuery('');
    setSearchText('');
    setLocationQuery('');
    setFilters(nextFilters);
    setSearchRequestParams({});
  }

  function handleCardOpen(jobId) {
    markJobViewed(jobId);
    setViewedJobs((current) => (current.includes(jobId) ? current : [...current, jobId]));
  }

  const activeChips = [
    searchText ? {
      key: 'search',
      label: `Search: ${searchText}`,
      onRemove: () => {
        setQuery('');
        setSearchText('');
        updateSearchRequest(filters, locationQuery, '');
      },
    } : null,
    locationQuery ? {
      key: 'location',
      label: `Location: ${locationQuery}`,
      onRemove: () => {
        setLocationQuery('');
        updateSearchRequest(filters, '', searchText);
      },
    } : null,
    ...filters.workModes.map((value) => ({
      key: `work-${value}`,
      label: getOptionLabel(WORK_MODE_OPTIONS, value),
      onRemove: () => setFilters((current) => ({ ...current, workModes: current.workModes.filter((item) => item !== value) })),
    })),
    ...(filters.experience ? [{
      key: 'experience',
      label: `${getOptionLabel(EXPERIENCE_OPTIONS, filters.experience)} yrs`,
      onRemove: () => setFilters((current) => ({ ...current, experience: null })),
    }] : []),
    ...filters.roleFocus.map((value) => ({
      key: `focus-${value}`,
      label: getOptionLabel(ROLE_FOCUS_OPTIONS, value),
      onRemove: () => setFilters((current) => ({ ...current, roleFocus: current.roleFocus.filter((item) => item !== value) })),
    })),
    ...filters.opportunityTypes.map((value) => ({
      key: `type-${value}`,
      label: getOptionLabel(OPPORTUNITY_TYPE_OPTIONS, value),
      onRemove: () => setFilters((current) => ({ ...current, opportunityTypes: current.opportunityTypes.filter((item) => item !== value) })),
    })),
    ...(filters.compensation ? [{
      key: 'compensation',
      label: getOptionLabel(COMPENSATION_OPTIONS, filters.compensation),
      onRemove: () => setFilters((current) => ({ ...current, compensation: null })),
    }] : []),
    ...filters.credibility.map((value) => ({
      key: `credibility-${value}`,
      label: getOptionLabel(CREDIBILITY_OPTIONS, value),
      onRemove: () => setFilters((current) => ({ ...current, credibility: current.credibility.filter((item) => item !== value) })),
    })),
    ...filters.momentum.map((value) => ({
      key: `momentum-${value}`,
      label: getOptionLabel(MOMENTUM_OPTIONS, value),
      onRemove: () => setFilters((current) => ({ ...current, momentum: current.momentum.filter((item) => item !== value) })),
    })),
  ].filter(Boolean);
  const opportunityCountLabel = jobsWithState.length > 100 ? '100+' : String(jobsWithState.length);

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
                <p className="text-[0.78rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">Candidate opportunities</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h1 className="text-[1.7rem] font-medium tracking-[-0.05em] text-[var(--text)]">
                    {`Good morning, ${getFirstName(viewer.user)}`}
                  </h1>
                  <span className="rounded-full border border-[rgba(249,115,22,0.22)] bg-[rgba(249,115,22,0.12)] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-orange-200">
                    Career Score {candidateContext?.score ?? '-'}
                  </span>
                </div>
                <p className="mt-3 text-sm text-[var(--text-soft)]">
                  {candidateContext ? `${candidateContext.strongMatches} strong matches available | ${candidateContext.activityMessage}` : 'Your opportunities feed becomes trackable once you sign in as a candidate.'}
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

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
          <aside className="big-box-shadow h-max rounded-[1.3rem] border border-[rgba(29,40,56,0.9)] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),transparent_100%),rgba(6,18,43,0.9)] p-4 pb-5 lg:sticky lg:top-[6.3rem] lg:max-h-[calc(100vh-7.6rem)] lg:overflow-y-auto">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text)]">Filters</h2>
              <button className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-accent)] transition hover:text-white" onClick={clearFilters} type="button">
                Reset
              </button>
            </div>

            <div className="mt-5 space-y-5 pb-5">
              <FilterSection title="Work Mode">
                {WORK_MODE_OPTIONS.map((option) => (
                  <FilterButton key={option.value} active={filters.workModes.includes(option.value)} onClick={() => setListFilter('workModes', option.value)}>
                    {option.label}
                  </FilterButton>
                ))}
              </FilterSection>

              <FilterSection title="Experience">
                {EXPERIENCE_OPTIONS.map((option) => (
                  <FilterButton key={option.value} active={filters.experience === option.value} onClick={() => setFilters((current) => ({ ...current, experience: current.experience === option.value ? null : option.value }))}>
                    {option.label}
                  </FilterButton>
                ))}
              </FilterSection>

              <FilterSection title="Role Focus">
                {ROLE_FOCUS_OPTIONS.map((option) => (
                  <FilterButton key={option.value} active={filters.roleFocus.includes(option.value)} onClick={() => setListFilter('roleFocus', option.value)}>
                    {option.label}
                  </FilterButton>
                ))}
              </FilterSection>

              <FilterSection title="Opportunity Type">
                {OPPORTUNITY_TYPE_OPTIONS.map((option) => (
                  <FilterButton key={option.value} active={filters.opportunityTypes.includes(option.value)} onClick={() => setListFilter('opportunityTypes', option.value)}>
                    {option.label}
                  </FilterButton>
                ))}
              </FilterSection>

              <FilterSection title="Compensation">
                {COMPENSATION_OPTIONS.map((option) => (
                  <FilterButton key={option.value} active={filters.compensation === option.value} onClick={() => setFilters((current) => ({ ...current, compensation: current.compensation === option.value ? null : option.value }))}>
                    {option.label}
                  </FilterButton>
                ))}
              </FilterSection>

              <FilterSection title="Location">
                <input
                  className="oq-input min-h-[44px]"
                  onBlur={() => updateSearchRequest(filters, locationQuery, searchText)}
                  onChange={(event) => setLocationQuery(event.target.value)}
                  placeholder="City, area, remote"
                  value={locationQuery}
                />
              </FilterSection>

              <FilterSection title="Company Credibility">
                {CREDIBILITY_OPTIONS.map((option) => (
                  <FilterButton key={option.value} active={filters.credibility.includes(option.value)} onClick={() => setListFilter('credibility', option.value)}>
                    {option.label}
                  </FilterButton>
                ))}
              </FilterSection>

              <FilterSection title="Hiring Momentum">
                {MOMENTUM_OPTIONS.map((option) => (
                  <FilterButton key={option.value} active={filters.momentum.includes(option.value)} onClick={() => setListFilter('momentum', option.value)}>
                    {option.label}
                  </FilterButton>
                ))}
              </FilterSection>
            </div>
          </aside>

          <div className="min-w-0 space-y-5">
            <section className="oq-home-search-strip sticky top-[5.25rem] z-20 !p-0 lg:top-[6.3rem]">
              <form className="flex w-full flex-col gap-3" onSubmit={handleSearchSubmit}>
                <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_156px] sm:items-center">
                  <input
                    className="home-search-input-style-2 min-h-[52px] flex-1"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by role, intent, experience, location..."
                    type="search"
                    value={query}
                  />
                  <button className="home-search-button-style-2 shrink-0 sm:!ml-0 sm:!min-w-0" type="submit">
                    Search
                  </button>
                </div>

                {activeChips.length ? (
                  <div className="flex flex-wrap gap-2">
                    {activeChips.map((chip) => (
                      <button
                        key={chip.key}
                        className="inline-flex items-center gap-2 rounded-full border border-[rgba(93,224,230,0.2)] bg-[rgba(93,224,230,0.08)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition hover:border-[rgba(93,224,230,0.38)]"
                        onClick={chip.onRemove}
                        type="button"
                      >
                        <span>{chip.label}</span>
                        <span aria-hidden="true" className="text-[var(--text-muted)]">x</span>
                      </button>
                    ))}
                    <button className="rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-accent)] transition hover:text-white" onClick={clearFilters} type="button">
                      Clear
                    </button>
                  </div>
                ) : null}
              </form>
            </section>

            {error ? (
              <MessageBanner tone="error" message={error.message || 'Unable to load opportunities.'} />
            ) : isLoading ? (
              <LoadingState
                description="Pulling the latest opportunities, filters, and application context."
                label="Opportunities"
                title="Loading available opportunities"
              />
            ) : jobsWithState.length ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-[var(--text-soft)]">
                    <span className="font-medium text-[var(--text)]">{opportunityCountLabel}</span> opportunities to explore from
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {viewer.isCandidate ? 'Cards open the candidate opportunity view with apply and tracker context.' : 'Sign in to unlock match scoring and application insights'}
                  </p>
                </div>

                <div className="grid items-stretch gap-[22px] xl:grid-cols-2">
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
              <SectionCard title="No opportunities found" description="Try a broader search or reset filters to widen the current results.">
                <EmptyState
                  eyebrow="Current filters"
                  title="Nothing matched this direction"
                  description="The current search and filter combination did not return any opportunities."
                  action={(
                    <button
                      className="oq-button-primary"
                      onClick={clearFilters}
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
        </div>
      </div>
    </PublicShell>
  );
}
