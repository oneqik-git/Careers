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
  'Structured applications, not resume spam',
  'Clear application progress',
  'Better visibility for the right roles',
];

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

function HeroShowcase() {
  return (
    <div className="relative overflow-hidden rounded-[15px] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))] p-5 sm:p-6">
      <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(93,224,230,0.08),transparent)]" />

      <div className="relative space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[0.72rem] font-light uppercase tracking-[0.22em] text-[var(--primary-2)]">Career showcase</p>
          <span className="rounded-full border border-[rgba(93,224,230,0.16)] bg-[rgba(93,224,230,0.04)] px-3 py-1.5 text-[0.68rem] font-light uppercase tracking-[0.18em] text-[var(--secondary-1)]">
            Public preview
          </span>
        </div>

        <div className="rounded-[15px] border border-[var(--dark-1)] bg-[rgba(4,18,44,0.72)] p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="oq-chip">Hybrid</span>
            <span className="oq-chip">3-6 years</span>
            <span className="oq-chip">Structured apply</span>
          </div>
          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[0.72rem] font-light uppercase tracking-[0.2em] text-[var(--graytexts)]">AtlasGrid Systems</p>
              <h3 className="mt-3 text-[1.85rem] font-light tracking-[-0.05em] text-[var(--white)]">Frontend Engineer</h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--secondary-1)]">
                Discover the role in public, understand the fit, and move into a protected application flow only when you are ready.
              </p>
            </div>
            <div className="rounded-[14px] border border-[rgba(93,224,230,0.14)] bg-[rgba(93,224,230,0.05)] px-4 py-3">
              <p className="text-[0.68rem] font-light uppercase tracking-[0.2em] text-[var(--graytexts)]">Clarity</p>
              <p className="mt-2 text-sm text-[var(--white)]">Role details first. Protected action second.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 border-t border-[rgba(93,224,230,0.12)] pt-5 sm:grid-cols-3">
            {['Discover roles clearly', 'Stand out beyond your resume', 'Move forward with more context'].map((item) => (
              <p key={item} className="text-sm font-light leading-7 text-[var(--secondary-1)]">
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturedJobCard({ job }) {
  const metadata = [
    job.location,
    job.work_mode ? formatStatus(job.work_mode) : null,
    formatExperienceRange(job.experience_min_years, job.experience_max_years),
  ].filter(Boolean);

  return (
    <Link className="oq-card oq-public-job-card group block rounded-[1.8rem] p-5 sm:p-6" href={`/jobs/${job.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.24em] text-[var(--text-muted)]">
            {job.company_name}
          </p>
          <h3 className="mt-3 text-[1.75rem] font-medium tracking-[-0.05em] text-[var(--text)] transition-colors group-hover:text-[var(--brand-accent)]">
            {job.title}
          </h3>
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
        <div className="oq-public-job-panel rounded-[1.25rem] px-4 py-4">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">Salary</p>
          <p className="mt-2 text-sm font-medium text-[var(--text)]">
            {formatSalaryRange(job.salary_min, job.salary_max, job.salary_disclosed)}
          </p>
        </div>
        <div className="oq-public-job-panel rounded-[1.25rem] px-4 py-4">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">Department</p>
          <p className="mt-2 text-sm font-medium text-[var(--text)]">{job.department || 'General'}</p>
        </div>
      </div>
    </Link>
  );
}

function ProductPreviewStrip() {
  return (
    <section className="oq-card rounded-[2.4rem] p-6 sm:p-8">
      <div className="flex flex-col gap-3">
        <p className="oq-kicker">Product Preview</p>
        <h2 className="oq-section-title font-medium text-[var(--text)]">What the actual product experience is designed to show you</h2>
        <p className="max-w-3xl text-[1rem] font-light leading-8 text-[var(--secondary-1)]">
          This is a structured preview, not a live dashboard. It shows the kind of clarity the product layer is meant to surface once a candidate signs in.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-muted)] p-5 shadow-[var(--shadow-soft)]">
          <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--primary-2)]">Jobs preview</p>
          <div className="mt-4 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <p className="text-sm font-semibold text-[var(--text)]">Senior Account Executive</p>
            <p className="mt-1 text-sm text-[var(--text-soft)]">Northstar Commerce | Bengaluru | Hybrid</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="oq-chip">Structured apply</span>
              <span className="oq-chip">Hiring team notes</span>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-muted)] p-5 shadow-[var(--shadow-soft)]">
          <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--primary-2)]">Application pipeline</p>
          <div className="mt-5 flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(34,197,94,0.16)] text-[var(--success)]">1</span>
            <span className="h-px flex-1 bg-[var(--border-strong)]" />
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(245,158,11,0.18)] text-[var(--warning)]">2</span>
            <span className="h-px flex-1 bg-[var(--border)]" />
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)] text-[var(--text-muted)]">3</span>
          </div>
          <div className="mt-4 grid gap-3 text-sm text-[var(--text-soft)]">
            <div className="rounded-[1.3rem] border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3">Applied with structured answers</div>
            <div className="rounded-[1.3rem] border border-[rgba(245,158,11,0.24)] bg-[rgba(245,158,11,0.08)] px-4 py-3 text-[var(--text)]">Under review with timeline clarity</div>
            <div className="rounded-[1.3rem] border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3">What happened and what comes next</div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface-muted)] p-5 shadow-[var(--shadow-soft)]">
          <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--primary-2)]">Profile credibility</p>
          <div className="mt-4 rounded-[1.7rem] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(19,41,71,0.95),rgba(16,35,63,0.96))] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Candidate summary</p>
                <p className="mt-1 text-sm text-white/70">Skills, work history, achievements, and better role-fit context.</p>
              </div>
              <div className="rounded-full border border-white/12 bg-white/10 px-3 py-2 text-sm font-semibold text-white">742</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/84">Profile strength</span>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/84">Career history</span>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/84">Achievements</span>
            </div>
          </div>
        </div>
      </div>
    </section>
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
        <PageHero
          titleAs="h1"
          align="center"
          layout="stacked"
          className="oq-home-hero"
          eyebrow="Candidate-first discovery"
          title={(
            <>
              <span className="block text-[var(--text)]">Not a Job Portal,</span>
              <span className="block text-[var(--primary-2)]">It&apos;s YOUR Career</span>
            </>
          )}
          description="A stronger way to discover roles, stand out beyond your resume, and move forward with more clarity."
          titleClassName="max-w-[14ch] !font-light"
          descriptionClassName="max-w-2xl"
          aside={<HeroShowcase />}
          asideClassName="p-0"
        >
          <div className="mx-auto max-w-5xl space-y-4">
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
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link className="oq-button-secondary" href="/jobs">
                Browse Jobs
              </Link>
              <Link className="oq-button-ghost" href="/login">
                Login
              </Link>
            </div>
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

        <section className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="oq-kicker">Featured Jobs</p>
              <h2 className="oq-section-title mt-3 font-medium text-[var(--text)]">Based on your profile</h2>
              <p className="mt-3 max-w-2xl text-[1rem] font-light leading-8 text-[var(--secondary-1)]">Roles where you actually have a shot.</p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <Link className="oq-button-secondary" href="/jobs">
                See all jobs
              </Link>
              {usingFallback ? (
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--graytexts)]">
                  {error ? 'Showing seeded public preview while live jobs load.' : 'Showing seeded public preview.'}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {featuredJobs.map((job) => (
              <FeaturedJobCard key={job.id} job={job} />
            ))}
          </div>
        </section>

        <section className="oq-card rounded-[2.4rem] p-6 sm:p-8">
          <div className="flex flex-col gap-3">
            <p className="oq-kicker">Role Clusters</p>
            <h2 className="oq-section-title font-medium text-[var(--text)]">Explore what you do best</h2>
            <p className="max-w-3xl text-[1rem] font-light leading-8 text-[var(--secondary-1)]">
              Public discovery should feel directional and calm, not like a dense toolbar. Start with the area where your strongest signal already exists.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roleClusters.map((cluster) => (
              <Link
                key={cluster.label}
                className="oq-card-muted block rounded-[1.9rem] p-5 transition-transform hover:-translate-y-1"
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
                <p className="mt-4 text-sm font-light leading-7 text-[var(--secondary-1)]">
                  {cluster.sampleRoles.length ? cluster.sampleRoles.join(', ') : 'Explore open roles in this cluster.'}
                </p>
                <p className="mt-5 text-sm font-medium text-[var(--primary-2)]">Explore roles</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="oq-card rounded-[2.4rem] p-6 sm:p-8">
          <div className="max-w-3xl">
            <p className="oq-kicker">Why Careers Is Different</p>
            <h2 className="oq-section-title mt-3 font-medium text-[var(--text)]">Most people apply. Few get noticed.</h2>
            <p className="mt-3 text-[1rem] font-light leading-8 text-[var(--secondary-1)]">This is built to change that.</p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {differenceCards.map((card) => (
              <div key={card.title} className="oq-card-muted rounded-[1.9rem] p-5">
                <p className="text-xl font-medium tracking-[-0.04em] text-[var(--text)]">
                  {card.title}
                  <span className="text-[var(--primary-2)]">.</span>
                </p>
                <p className="mt-3 text-sm font-light leading-7 text-[var(--secondary-1)]">{card.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="oq-hero rounded-[22px] p-6 sm:p-8 lg:p-10">
          <div className="oq-grid-overlay absolute inset-0 opacity-18" aria-hidden="true" />
          <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <p className="oq-kicker">Candidate-first value</p>
              <h2 className="oq-section-title mt-3 max-w-xl font-medium text-[var(--text)]">Stop getting ignored. Start getting responses.</h2>
              <p className="mt-4 max-w-2xl text-[1rem] font-light leading-8 text-[var(--secondary-1)]">
                If you&apos;re serious about getting hired, your approach has to change. This gives you a better way to apply and move forward.
              </p>
              <div className="mt-6">
                <Link className="oq-button-primary" href="/register">
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

        <ProductPreviewStrip />

        <section className="oq-hero rounded-[22px] p-6 text-center sm:p-8 lg:p-10">
          <div className="oq-grid-overlay absolute inset-0 opacity-18" aria-hidden="true" />
          <div className="relative mx-auto max-w-3xl">
            <p className="oq-kicker">Final CTA</p>
            <h2 className="oq-section-title mt-3 font-medium text-[var(--text)]">Start where others stop.</h2>
            <p className="mt-4 text-[1rem] font-light leading-8 text-[var(--secondary-1)]">
              Browse with clarity first. Create a profile when you are ready to move into the product layer.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link className="oq-button-primary" href="/jobs">
                Browse Jobs
              </Link>
              <Link className="oq-button-secondary" href="/register">
                Create Profile
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
