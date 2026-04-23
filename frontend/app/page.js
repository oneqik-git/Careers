'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHero from '@/components/PageHero';
import PublicJobSearchStrip from '@/components/PublicJobSearchStrip';
import PublicShell from '@/components/PublicShell';
import { fetchJobs } from '@/services/jobs';
import { formatExperienceRange, formatSalaryRange, formatStatus } from '@/utils/formatters';

const trustPoints = [
  'Credibility over Resume',
  'Clear application progress',
  'Better visibility for the right roles',
];

const differenceCards = [
  {
    title: 'Everything in one place',
    description: 'Your progress, your profile, your opportunities - finally connected.',
  },
  {
    title: 'Show off what you bring',
    description: 'A Recorded proof of your skills & Capabilities.',
  },
  {
    title: 'Know Where You Stand',
    description: 'Complete clarity on your applications',
  },
];

const candidatePoints = [
  'Apply with answers, not just resumes',
  'Stand out without gaming the system',
  'Track what is happening after you apply',
  'Improve how you show up to employers',
];

const fallbackJobs = [
  {
    id: 'demo-front-end-engineer',
    title: 'Frontend Engineer',
    company_name: 'AtlasGrid Systems',
    industry: 'Enterprise Software',
    location: 'Hyderabad',
    work_mode: 'hybrid',
    department: 'Technology',
    job_function: 'Frontend',
    level: 'mid',
    salary_min: 1400000,
    salary_max: 2100000,
    salary_disclosed: true,
    experience_min_years: 3,
    experience_max_years: 6,
    openings: 2,
    company_score: 4.4,
    is_featured: true,
  },
  {
    id: 'demo-product-operations-specialist',
    title: 'Product Operations Specialist',
    company_name: 'Northstar Commerce',
    industry: 'Retail Technology',
    location: 'Bengaluru',
    work_mode: 'hybrid',
    department: 'Operations',
    job_function: 'Process Ops',
    level: 'mid',
    salary_min: 850000,
    salary_max: 1250000,
    salary_disclosed: true,
    experience_min_years: 2,
    experience_max_years: 5,
    openings: 2,
    company_score: 4.6,
    is_featured: true,
  },
  {
    id: 'demo-clinical-operations-analyst',
    title: 'Clinical Operations Analyst',
    company_name: 'Meridian HealthTech',
    industry: 'Health Technology',
    location: 'Chennai',
    work_mode: 'on_site',
    department: 'Operations',
    job_function: 'Clinical Operations',
    level: 'mid',
    salary_min: 800000,
    salary_max: 1200000,
    salary_disclosed: true,
    experience_min_years: 2,
    experience_max_years: 5,
    openings: 2,
    company_score: 4.7,
    is_featured: true,
  },
  {
    id: 'demo-customer-success-manager',
    title: 'Customer Success Manager',
    company_name: 'Northstar Commerce',
    industry: 'Retail Technology',
    location: 'Remote - India',
    work_mode: 'remote',
    department: 'Customer Success',
    job_function: 'Renewals',
    level: 'mid',
    salary_min: 900000,
    salary_max: 1350000,
    salary_disclosed: true,
    experience_min_years: 3,
    experience_max_years: 6,
    openings: 1,
    company_score: 4.6,
    is_featured: false,
  },
  {
    id: 'demo-product-designer',
    title: 'Product Designer',
    company_name: 'Meridian HealthTech',
    industry: 'Health Technology',
    location: 'Remote - India',
    work_mode: 'remote',
    department: 'Product',
    job_function: 'Product Design',
    level: 'mid',
    salary_min: 1300000,
    salary_max: 1900000,
    salary_disclosed: true,
    experience_min_years: 3,
    experience_max_years: 6,
    openings: 1,
    company_score: 4.7,
    is_featured: false,
  },
  {
    id: 'demo-growth-marketing-associate',
    title: 'Growth Marketing Associate',
    company_name: 'Northstar Commerce',
    industry: 'Retail Technology',
    location: 'Mumbai',
    work_mode: 'hybrid',
    department: 'Marketing',
    job_function: 'Growth',
    level: 'junior',
    salary_min: 650000,
    salary_max: 900000,
    salary_disclosed: true,
    experience_min_years: 1,
    experience_max_years: 3,
    openings: 1,
    company_score: 4.6,
    is_featured: false,
  },
  {
    id: 'demo-sales-executive',
    title: 'Sales Executive',
    company_name: 'VerveRetail Cloud',
    industry: 'Retail Technology',
    location: 'Mumbai',
    work_mode: 'hybrid',
    department: 'Sales & GTM',
    job_function: 'Inside Sales',
    level: 'junior',
    salary_min: 600000,
    salary_max: 900000,
    salary_disclosed: true,
    experience_min_years: 1,
    experience_max_years: 3,
    openings: 3,
    company_score: 4.3,
    is_featured: false,
  },
  {
    id: 'demo-business-development-manager',
    title: 'Business Development Manager',
    company_name: 'Northstar Commerce',
    industry: 'Retail Technology',
    location: 'Bengaluru',
    work_mode: 'hybrid',
    department: 'Sales & GTM',
    job_function: 'Business Development',
    level: 'mid',
    salary_min: 1200000,
    salary_max: 1800000,
    salary_disclosed: true,
    experience_min_years: 3,
    experience_max_years: 6,
    openings: 2,
    company_score: 4.6,
    is_featured: false,
  },
  {
    id: 'demo-hr-recruiter',
    title: 'HR Recruiter',
    company_name: 'PeoplePulse Labs',
    industry: 'HR Tech',
    location: 'Pune',
    work_mode: 'hybrid',
    department: 'Human Resources',
    job_function: 'Talent Acquisition',
    level: 'junior',
    salary_min: 500000,
    salary_max: 800000,
    salary_disclosed: true,
    experience_min_years: 1,
    experience_max_years: 3,
    openings: 2,
    company_score: 4.3,
    is_featured: false,
  },
  {
    id: 'demo-hr-operations-specialist',
    title: 'HR Operations Specialist',
    company_name: 'TrueNorth HR Cloud',
    industry: 'HR Tech',
    location: 'Bengaluru',
    work_mode: 'hybrid',
    department: 'Human Resources',
    job_function: 'HR Ops',
    level: 'mid',
    salary_min: 800000,
    salary_max: 1200000,
    salary_disclosed: true,
    experience_min_years: 2,
    experience_max_years: 5,
    openings: 1,
    company_score: 4.5,
    is_featured: false,
  },
  {
    id: 'demo-accounts-executive',
    title: 'Accounts Executive',
    company_name: 'LedgerLane Finance',
    industry: 'Fintech',
    location: 'Mumbai',
    work_mode: 'on_site',
    department: 'Finance',
    job_function: 'Accounting',
    level: 'junior',
    salary_min: 550000,
    salary_max: 850000,
    salary_disclosed: true,
    experience_min_years: 1,
    experience_max_years: 3,
    openings: 2,
    company_score: 4.7,
    is_featured: false,
  },
  {
    id: 'demo-customer-support-executive',
    title: 'Customer Support Executive',
    company_name: 'OrbitServe Global',
    industry: 'BPO / Operations',
    location: 'Jaipur',
    work_mode: 'on_site',
    department: 'BPO / Contact Centre',
    job_function: 'Inbound',
    level: 'entry',
    salary_min: 320000,
    salary_max: 500000,
    salary_disclosed: true,
    experience_min_years: 0,
    experience_max_years: 2,
    openings: 4,
    company_score: 4.0,
    is_featured: false,
  },
  {
    id: 'demo-software-engineer',
    title: 'Software Engineer',
    company_name: 'AptEdge Software',
    industry: 'SaaS',
    location: 'Pune',
    work_mode: 'hybrid',
    department: 'Technology',
    job_function: 'Product Engineering',
    level: 'junior',
    salary_min: 900000,
    salary_max: 1400000,
    salary_disclosed: true,
    experience_min_years: 0,
    experience_max_years: 2,
    openings: 2,
    company_score: 4.7,
    is_featured: false,
  },
];

const roleClusterDefinitions = [
  {
    key: 'sales-business-development',
    label: 'Sales & Business Development',
    tagline: 'For people who know how to open doors, build trust, and move conversations forward.',
    departments: ['Sales & GTM'],
    exampleRoles: ['Sales Executive', 'BDE', 'Business Development Manager', 'Sales Manager'],
    matchers: ['sales', 'business development', 'account executive', 'account manager', 'inside sales', 'partnership', 'revenue'],
  },
  {
    key: 'marketing-growth',
    label: 'Marketing & Growth',
    tagline: 'For those who can turn attention into action and ideas into results.',
    departments: ['Marketing'],
    exampleRoles: ['Growth Marketing Associate', 'Performance Marketing Manager', 'Content Strategist'],
    matchers: ['marketing', 'growth', 'brand', 'performance marketing', 'content', 'seo'],
  },
  {
    key: 'operations-support',
    label: 'Operations & Support',
    tagline: 'For people who keep things moving, organized, and under control.',
    departments: ['Operations'],
    exampleRoles: ['Operations Analyst', 'Operations Executive', 'Supply Chain Coordinator', 'Implementation Consultant'],
    matchers: ['operations', 'process ops', 'program management', 'supply chain', 'implementation', 'logistics'],
  },
  {
    key: 'customer-service',
    label: 'Customer Service',
    tagline: 'For people who know how to handle people without losing their soul.',
    departments: ['Customer Success', 'BPO / Contact Centre', 'BPO/Contact Centre'],
    exampleRoles: ['Customer Support Associate', 'Customer Success Manager', 'Team Lead - Customer Operations'],
    matchers: ['customer service', 'customer support', 'customer success', 'support executive', 'contact centre', 'call center', 'inbound', 'outbound'],
  },
  {
    key: 'hr-recruitment',
    label: 'HR & Recruitment',
    tagline: 'For those who understand people, process, and what makes a team work.',
    departments: ['Human Resources'],
    exampleRoles: ['HR Executive', 'HR Recruiter', 'Talent Acquisition Partner', 'HR Operations Specialist'],
    matchers: ['hr', 'human resources', 'recruit', 'talent acquisition', 'people operations', 'hr ops', 'hrbp'],
  },
  {
    key: 'finance-accounts',
    label: 'Finance & Accounts',
    tagline: 'For minds that like order, accuracy, and making numbers behave.',
    departments: ['Finance'],
    exampleRoles: ['Finance Analyst', 'Accounts Executive', 'FP&A Analyst', 'Finance Controller'],
    matchers: ['finance', 'accounts', 'accounting', 'audit', 'payroll', 'tax'],
  },
  {
    key: 'technology-product',
    label: 'Technology & Engineering',
    tagline: "For builders, problem-solvers, and people who'd rather fix the system than complain about it.",
    departments: ['Technology'],
    exampleRoles: ['Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer', 'QA Automation Engineer'],
    matchers: ['technology', 'engineer', 'developer', 'software', 'tech', 'qa', 'devops'],
  },
  {
    key: 'product-design',
    label: 'Product & Design',
    tagline: 'For people who turn customer problems, product thinking, and design judgment into usable experiences.',
    departments: ['Product'],
    exampleRoles: ['Product Manager', 'Associate Product Manager', 'Product Designer', 'Product Operations Specialist'],
    matchers: ['product', 'product management', 'product design', 'ux', 'design', 'product ops'],
  },
  {
    key: 'freshers-entry-roles',
    label: 'Freshers & Entry Roles',
    tagline: 'For those starting out and ready to be seen for potential, not just past experience.',
    levels: ['entry', 'junior'],
    exampleRoles: ['Graduate Trainee', 'Junior Associate', 'Sales Trainee', 'Support Associate'],
    matchers: ['fresher', 'entry', 'intern', 'graduate', 'junior', 'trainee'],
  },
];

function normalizeClusterText(value) {
  return String(value || '').trim().toLowerCase();
}

function jobMatchesCluster(job, definition) {
  const department = normalizeClusterText(job.department);
  const level = normalizeClusterText(job.level);
  const haystack = [
    job.department,
    job.job_function,
    job.sub_department,
    job.title,
    job.industry,
    job.level,
    job.seniority_label,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const hasDepartmentMatch = definition.departments?.some((item) => normalizeClusterText(item) === department);
  const hasLevelMatch = definition.levels?.some((item) => normalizeClusterText(item) === level);
  const hasKeywordMatch = definition.matchers.some((matcher) => haystack.includes(normalizeClusterText(matcher)));

  return Boolean(hasDepartmentMatch || hasLevelMatch || hasKeywordMatch);
}

function buildRoleClusters(jobs) {
  const groupedRoles = new Map(
    roleClusterDefinitions.map((definition) => [
      definition.key,
      {
        ...definition,
        opportunities: 0,
        roles: new Set(),
      },
    ]),
  );

  jobs.forEach((job) => {
    roleClusterDefinitions.forEach((definition) => {
      if (!jobMatchesCluster(job, definition)) {
        return;
      }

      const entry = groupedRoles.get(definition.key);
      entry.opportunities += Number(job.openings) > 0 ? Number(job.openings) : 1;

      if (job.title) {
        entry.roles.add(job.title);
      } else if (job.job_function) {
        entry.roles.add(job.job_function);
      }
    });
  });

  return roleClusterDefinitions.map((definition) => {
    const entry = groupedRoles.get(definition.key);
    const roleExamples = entry.roles.size ? Array.from(entry.roles) : definition.exampleRoles;
    const rolePreview = roleExamples.length > 2
      ? `${roleExamples.join(' | ')} | ..`
      : roleExamples.join(' | ');

    return {
      key: definition.key,
      label: definition.label,
      tagline: definition.tagline,
      opportunities: entry.opportunities,
      rolesCount: entry.roles.size,
      roleExamples,
      rolePreview,
    };
  });
}

function FeaturedJobCard({ job }) {
  const metadata = [
    job.location,
    job.work_mode ? formatStatus(job.work_mode) : null,
    formatExperienceRange(job.experience_min_years, job.experience_max_years),
  ].filter(Boolean);

  return (
    <Link className="grid-card-style-2 oq-home-job-stat-card group block" href={`/jobs/${job.id}`}>
      <div className="flex items-start justify-between gap-2.5">
        <div>
          <p className="text-[0.63rem] font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {job.company_name}
          </p>
          <h3 className="mt-2 text-[1.04rem] font-medium leading-tight tracking-[-0.035em] text-[var(--text)] transition-colors group-hover:text-[var(--brand-accent)]">
            {job.title}
          </h3>
        </div>
        <div className="oq-score-badge rounded-[12px] border border-[rgba(93,224,230,0.16)] bg-[rgba(93,224,230,0.05)] font-medium uppercase text-[var(--secondary-1)]">
          {job.company_score ? `Co. Score ${job.company_score}` : `${job.openings || 1} opening${job.openings === 1 ? '' : 's'}`}
        </div>
      </div>

      <p className="mt-2 text-[0.76rem] leading-5 text-[var(--text-soft)]">
        {[job.industry, job.level ? formatStatus(job.level) : null].filter(Boolean).join(' | ')}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {metadata.map((item) => (
          <span key={item} className="oq-chip">
            {item}
          </span>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="grid-stat-style-2">
          <p className="text-[0.58rem] uppercase tracking-[0.17em] text-[var(--text-muted)]">Salary</p>
          <p className="mt-1.5 text-[0.78rem] font-medium leading-5 text-[var(--text)]">
            {formatSalaryRange(job.salary_min, job.salary_max, job.salary_disclosed)}
          </p>
        </div>
        <div className="grid-stat-style-2">
          <p className="text-[0.58rem] uppercase tracking-[0.17em] text-[var(--text-muted)]">Department</p>
          <p className="mt-1.5 text-[0.78rem] font-medium leading-5 text-[var(--text)]">{job.department || 'General'}</p>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [heroQuery, setHeroQuery] = useState('');
  const [heroExperience, setHeroExperience] = useState('');
  const [heroArea, setHeroArea] = useState('');

  useEffect(() => {
    async function loadJobs() {
      try {
        const response = await fetchJobs({ limit: 100, sort: 'date' });
        setJobs(response?.data || []);
      } catch {
        setJobs([]);
      }
    }

    loadJobs();
  }, []);

  const publicJobs = jobs.length ? jobs : fallbackJobs;

  const featuredJobs = useMemo(() => {
    const featured = publicJobs.filter((job) => job.is_featured);
    const featuredIds = new Set(featured.map((job) => job.id));
    const remainingJobs = publicJobs.filter((job) => !featuredIds.has(job.id));
    return [...featured, ...remainingJobs].slice(0, 4);
  }, [publicJobs]);

  const roleClusters = useMemo(() => buildRoleClusters(publicJobs), [publicJobs]);

  function handleHeroSearch(event) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (heroQuery.trim()) {
      params.set('q', heroQuery.trim());
    }

    if (heroExperience) {
      params.set('exp', heroExperience);
    }

    if (heroArea.trim()) {
      params.set('location_query', heroArea.trim());
      params.set('area', heroArea.trim());
      params.set('radius_km', '5');
      params.set('include_remote', 'true');
    }

    router.push(params.toString() ? `/jobs?${params}` : '/jobs');
  }

  return (
    <PublicShell>
      <div className="space-y-12 lg:space-y-16">
        <PageHero
          titleAs="h1"
          align="center"
          layout="stacked"
          className="oq-home-hero"
          title={(
            <>
              <span className="block text-[var(--text)]">Not a JOB Portal</span>
              <span className="block text-[var(--primary-2)]">It&apos;s YOUR Career</span>
            </>
          )}
          description={(
            <>
              <span className="block font-medium text-[var(--white)]">Everything your career needs, Finally in ONE place!</span>
              <span className="block">Build your track record, stay visible, and move forward without the confusion of scattered platforms.</span>
            </>
          )}
          titleClassName="max-w-[14ch] !font-light"
          descriptionClassName="max-w-2xl"
        >
          <div className="mx-auto max-w-5xl shadow-safe-spacing-style-2">
            <PublicJobSearchStrip
              area={heroArea}
              buttonLabel="Search"
              className="oq-home-search-strip text-left"
              experience={heroExperience}
              onAreaChange={setHeroArea}
              onExperienceChange={setHeroExperience}
              onQueryChange={setHeroQuery}
              onSubmit={handleHeroSearch}
              query={heroQuery}
              tone="preset"
            />
          </div>
        </PageHero>

        <section className="oq-shell rounded-[22px] px-4 py-5 sm:px-6">
          <div className="grid gap-3 md:grid-cols-3">
            {trustPoints.map((point) => (
              <div key={point} className="flex items-center gap-3 rounded-[15px] border border-[var(--dark-1)] bg-[rgba(93,224,230,0.03)] px-4 py-4">
                <span className="oq-dot shrink-0" />
                <p className="text-sm font-light leading-7 text-[var(--paragraphs)]">{point}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="featured-split-style-2 career-featured-split-style-2 shadow-safe-spacing-style-2">
          <div className="oq-featured-copy-card">
            <p className="oq-kicker">Featured Opportunities</p>
            <h2 className="h1-style-2 mt-3">
              <span className="block">Popular</span>
              <span className="block">Searches</span>
            </h2>
            <p className="mt-5 max-w-xl text-[1rem] font-light leading-8 text-[var(--secondary-1)]">
              <span className="block">Roles that are active & relevant.</span>
              <span className="block">No endless scrolling through opportunities that</span>
              <span className="block">died three Tuesdays ago.</span>
            </p>
            <div className="mt-7 flex flex-col items-start gap-3">
              <Link className="btn-box-style-2" href="/jobs">
                See All Opportunities
              </Link>
            </div>
          </div>

          <div className="stats-grid-style-2">
            {featuredJobs.map((job) => (
              <FeaturedJobCard key={job.id} job={job} />
            ))}
          </div>
        </section>

        <section className="oq-card oq-home-section-clear rounded-[2.4rem] p-6 sm:p-8">
          <div className="flex flex-col gap-3">
            <p className="oq-kicker">Role Clusters</p>
            <h2 className="h1-style-2 oq-home-heading-balance oq-home-title-case">Start Where You Belong</h2>
            <p className="max-w-3xl text-[1rem] font-light leading-8 text-[var(--secondary-1)]">
              Browse roles by what you want to do. Not by how much patience you have left.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roleClusters.map((cluster) => (
              <Link
                key={cluster.key}
                className="oq-card-muted oq-role-cluster-card block rounded-[1.9rem] p-5 transition-transform hover:-translate-y-1"
                href={`/jobs?domain=${encodeURIComponent(cluster.label)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[1.04rem] font-medium leading-tight tracking-[-0.035em] text-[var(--text)]">{cluster.label}</h3>
                    <p className="mt-2 text-[0.76rem] font-medium leading-5 text-[var(--primary-2)]">
                      {cluster.opportunities === 1 ? '1 position open' : `${cluster.opportunities} positions open`}
                    </p>
                  </div>
                  <div className="rounded-full border border-[rgba(93,224,230,0.18)] bg-[rgba(93,224,230,0.08)] px-2.5 py-1 text-[0.58rem] font-medium uppercase tracking-[0.1em] text-[var(--primary-2)]">
                    Discover
                  </div>
                </div>
                <p className="role-example-line-style-2 mt-3 text-[0.76rem] font-light leading-5 text-[var(--secondary-1)]">
                  {cluster.rolePreview}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="oq-card rounded-[2.4rem] p-6 sm:p-8">
          <div className="max-w-3xl">
            <p className="oq-kicker">What is Careers?</p>
            <h2 className="h1-style-2 oq-home-heading-balance oq-home-title-case mt-3">
              <span className="block text-[var(--primary-3)]">It’s Everything Your Career,</span>
              <span className="block text-[var(--primary-3)]">Built on Proof.</span>
              <span className="block">Not Guesswork.</span>
            </h2>
            <p className="mt-5 text-[1rem] font-light leading-8 text-[var(--secondary-1)]">
              <span className="block">You’re Not Just Another Profile..You're a Presence to be Noticed</span>
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {differenceCards.map((card) => (
              <div key={card.title} className="oq-card-muted oq-inner-card-clear rounded-[1.9rem] p-5">
                <p className="text-xl font-medium tracking-[-0.04em] text-[var(--text)]">
                  {card.title}
                  <span className="text-[var(--primary-2)]">.</span>
                </p>
                <p className="mt-3 text-sm font-light leading-7 text-[var(--secondary-1)]">{card.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="oq-hero oq-home-section-clear rounded-[22px] p-6 sm:p-8 lg:p-10">
          <div className="oq-grid-overlay absolute inset-0 opacity-18" aria-hidden="true" />
          <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <p className="oq-kicker">WHY Careers?</p>
              <h2 className="h1-style-2 oq-home-heading-balance-wide oq-home-title-case mt-3 max-w-3xl">Because Right Now, You’re Doing Everything… and yet Nothing&apos;s Happening.</h2>
              <p className="mt-4 max-w-2xl text-[1rem] font-light leading-8 text-[var(--secondary-1)]">
                <span className="block">Ever Felt LOST in the crowd? You’re applying, trying, showing up,</span>
                <span className="block">but it feels like none of it matters.</span>
                <span className="block">Not because you’re not capable, but the right Company never even saw you.</span>
              </p>
              <div className="mt-6">
                <Link className="btn-box-style-2" href="/register">
                  Create Profile
                </Link>
              </div>
            </div>

            <div className="grid gap-3">
              {candidatePoints.map((point) => (
                <div key={point} className="rounded-[15px] border border-[var(--dark-1)] bg-[rgba(93,224,230,0.04)] px-4 py-4">
                  <div className="flex items-start gap-3">
                    <span className="oq-dot mt-2 shrink-0" />
                    <p className="text-sm font-light leading-7 text-[var(--paragraphs)]">{point}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
