'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PublicJobSearchStrip from '@/components/PublicJobSearchStrip';
import PublicShell from '@/components/PublicShell';
import { fetchJobs } from '@/services/jobs';
import { formatExperienceRange, formatSalaryRange, formatStatus } from '@/utils/formatters';

const differenceCards = [
  {
    title: 'Apply with context',
    description: 'Show more than a resume.',
  },
  {
    title: 'Get real visibility',
    description: 'Be seen for the right roles.',
  },
  {
    title: 'Know where you stand',
    description: 'No more guessing after applying.',
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

  return Array.from(counts.values()).sort((left, right) => right.count - left.count).slice(0, 6);
}

function FeaturedJobCard({ job }) {
  const metadata = [
    job.location,
    job.work_mode ? formatStatus(job.work_mode) : null,
    formatExperienceRange(job.experience_min_years, job.experience_max_years),
  ].filter(Boolean);

  return (
    <Link className="grid-card block h-full" href={`/jobs/${job.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.24em] text-[var(--text-muted)]">
            {job.company_name}
          </p>
          <h3 className="h2-style mt-3 text-[var(--text)]">{job.title}</h3>
        </div>
        <div className="rounded-full border border-[rgba(93,224,230,0.16)] bg-[rgba(93,224,230,0.05)] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-[var(--secondary-1)]">
          {job.company_score ? `Co. Score ${job.company_score}` : `${job.openings || 1} opening${job.openings === 1 ? '' : 's'}`}
        </div>
      </div>

      <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
        {[job.industry, job.level ? formatStatus(job.level) : null].filter(Boolean).join(' | ')}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {metadata.map((item) => (
          <span key={item} className="oq-chip">
            {item}
          </span>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[15px] bg-[rgba(4,18,44,0.34)] px-4 py-4">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">Salary</p>
          <p className="mt-2 text-sm font-medium text-[var(--text)]">
            {formatSalaryRange(job.salary_min, job.salary_max, job.salary_disclosed)}
          </p>
        </div>
        <div className="rounded-[15px] bg-[rgba(4,18,44,0.34)] px-4 py-4">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">Department</p>
          <p className="mt-2 text-sm font-medium text-[var(--text)]">{job.department || 'General'}</p>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [heroQuery, setHeroQuery] = useState('');
  const [heroExperience, setHeroExperience] = useState('');
  const [heroArea, setHeroArea] = useState('');

  useEffect(() => {
    async function loadJobs() {
      try {
        const response = await fetchJobs({ limit: 18, sort: 'date' });
        setJobs(response?.data || []);
      } catch (requestError) {
        setError(requestError);
      }
    }

    loadJobs();
  }, []);

  const publicJobs = jobs.length ? jobs : fallbackJobs;
  const usingFallback = !jobs.length;

  const featuredJobs = useMemo(() => {
    const featured = publicJobs.filter((job) => job.is_featured);
    return (featured.length ? featured : publicJobs).slice(0, 4);
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
      params.set('area', heroArea.trim());
    }

    router.push(params.toString() ? `/jobs?${params}` : '/jobs');
  }

  return (
    <PublicShell>
      <div className="space-y-12 lg:space-y-16">
        <section className="hero-panel-clean relative overflow-hidden rounded-[24px] px-6 py-12 sm:px-8 lg:px-12">
          <div className="oq-grid-overlay absolute inset-0 opacity-18" aria-hidden="true" />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(93,224,230,0.08),transparent_20%),radial-gradient(circle_at_82%_24%,rgba(49,131,255,0.12),transparent_22%)]"
          />

          <div className="relative mx-auto max-w-5xl text-center">
            <p className="oq-kicker">Candidate-first discovery</p>
            <h1 className="h1-style mt-4 text-[var(--text)] sm:text-[3.4rem]">
              <span className="block">Not a Job Portal,</span>
              <span className="block text-[var(--primary-2)]">It&apos;s YOUR Career</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[1rem] font-light leading-8 text-[var(--secondary-1)]">
              A stronger way to discover roles, stand out beyond your resume, and move forward with more clarity.
            </p>

            <div className="mx-auto mt-10 max-w-5xl">
              <PublicJobSearchStrip
                area={heroArea}
                buttonLabel="Search Jobs"
                className="text-left"
                experience={heroExperience}
                onAreaChange={setHeroArea}
                onExperienceChange={setHeroExperience}
                onQueryChange={setHeroQuery}
                onSubmit={handleHeroSearch}
                query={heroQuery}
              />
            </div>
          </div>
        </section>

        <section className="lg:grid lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start lg:gap-10">
          <div className="max-w-xl">
            <p className="oq-kicker">Featured Jobs</p>
            <h2 className="h1-style mt-3 text-[var(--text)]">Based on your profile</h2>
            <p className="mt-4 text-[1rem] font-light leading-8 text-[var(--secondary-1)]">
              Roles where you actually have a shot.
            </p>
            <div className="mt-6">
              <Link className="btn-box" href="/jobs">
                See All Jobs
              </Link>
            </div>
            {usingFallback ? (
              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--graytexts)]">
                {error ? 'Showing seeded public preview while live jobs load.' : 'Showing seeded public preview.'}
              </p>
            ) : null}
          </div>

          <div className="grid-container mt-8 sm:grid-cols-2 lg:mt-0">
            {featuredJobs.map((job) => (
              <FeaturedJobCard key={job.id} job={job} />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="max-w-3xl">
            <p className="oq-kicker">Role Clusters</p>
            <h2 className="h1-style mt-3 text-[var(--text)]">Explore what you do best</h2>
            <p className="mt-4 text-[1rem] font-light leading-8 text-[var(--secondary-1)]">
              Public discovery should feel directional and calm, not like a dense toolbar. Start with the area where your strongest signal already exists.
            </p>
          </div>

          <div className="grid-container md:grid-cols-2 xl:grid-cols-3">
            {roleClusters.map((cluster) => (
              <Link
                key={cluster.label}
                className="grid-card block h-full"
                href={`/jobs?domain=${encodeURIComponent(cluster.label)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--text-muted)]">{cluster.label}</p>
                    <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--text)]">{cluster.count}</p>
                  </div>
                  <div className="rounded-full border border-[rgba(93,224,230,0.18)] bg-[rgba(93,224,230,0.08)] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-[var(--primary-2)]">
                    Discovery
                  </div>
                </div>
                <p className="mt-5 text-sm font-light leading-7 text-[var(--secondary-1)]">
                  {cluster.sampleRoles.length ? cluster.sampleRoles.join(', ') : 'Explore open roles in this cluster.'}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="max-w-3xl">
            <p className="oq-kicker">Why Careers Is Different</p>
            <h2 className="h1-style mt-3 text-[var(--text)]">Most people apply. Few get noticed.</h2>
            <p className="mt-4 text-[1rem] font-light leading-8 text-[var(--secondary-1)]">This is built to change that.</p>
          </div>

          <div className="grid-container md:grid-cols-3">
            {differenceCards.map((card) => (
              <div key={card.title} className="grid-card h-full">
                <p className="h2-style text-[var(--text)]">
                  {card.title}
                  <span className="text-[var(--primary-2)]">.</span>
                </p>
                <p className="mt-4 text-sm font-light leading-7 text-[var(--secondary-1)]">{card.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="hero-panel-clean relative overflow-hidden rounded-[24px] px-6 py-8 sm:px-8 lg:px-10">
          <div className="oq-grid-overlay absolute inset-0 opacity-18" aria-hidden="true" />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(93,224,230,0.08),transparent_20%),radial-gradient(circle_at_82%_24%,rgba(49,131,255,0.12),transparent_22%)]"
          />

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
            <div>
              <p className="oq-kicker">Candidate-first value</p>
              <h2 className="h1-style mt-3 max-w-xl text-[var(--text)]">Stop getting ignored. Start getting responses.</h2>
              <p className="mt-4 max-w-2xl text-[1rem] font-light leading-8 text-[var(--secondary-1)]">
                If you&apos;re serious about getting hired, your approach has to change. This gives you a better way to apply and move forward.
              </p>
              <div className="mt-6">
                <Link className="btn-box" href="/register">
                  Create Profile
                </Link>
              </div>
            </div>

            <div className="grid-container">
              {candidatePoints.map((point) => (
                <div key={point} className="grid-card">
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
