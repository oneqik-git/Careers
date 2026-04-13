import Link from 'next/link';
import PageHero from '@/components/PageHero';
import PublicShell from '@/components/PublicShell';
import SectionCard from '@/components/SectionCard';

const employerPoints = [
  'Post roles without blending employer access into the candidate sign-in experience.',
  'Review applicants in protected workflows once candidates move past public browsing.',
  'Start with a work email so company identity is clearer from the first step.',
];

const hiringCards = [
  {
    title: 'Dedicated employer entry',
    description: 'The employer journey now starts from its own page instead of a shared role-tab auth pattern.',
  },
  {
    title: 'Work-email signup',
    description: 'Registration focuses on company-linked identity and blocks obvious personal email providers.',
  },
  {
    title: 'Protected hiring flows',
    description: 'Job posting, applicant review, and employer dashboards stay behind auth exactly where they belong.',
  },
];

export default function EmployersPage() {
  return (
    <PublicShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="For Employers"
          title="A cleaner front door for hiring teams."
          description="Create employer access with a work email, step into posting and applicant review faster, and keep your hiring workflow separate from the candidate journey."
          actions={[
            { label: 'Employer Sign In', href: '/employer/login' },
            { label: 'Create Employer Account', href: '/employer/register', variant: 'secondary' },
          ]}
          aside={(
            <div className="space-y-3">
              {employerPoints.map((point) => (
                <div key={point} className="rounded-[1.3rem] border border-white/10 bg-white/8 px-4 py-3">
                  <p className="text-sm leading-6 text-white/84">{point}</p>
                </div>
              ))}
            </div>
          )}
        />

        <SectionCard eyebrow="Why this route exists" title="Employers should not enter through a candidate-first sign-in">
          <div className="grid gap-4 md:grid-cols-3">
            {hiringCards.map((card) => (
              <div key={card.title} className="oq-card-muted rounded-[1.7rem] p-5">
                <p className="text-lg font-semibold tracking-tight text-[var(--text)]">{card.title}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{card.description}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Next step"
          title="Start with company identity, then move into hiring."
          description="This implementation keeps the existing employer dashboard and internal flows intact while giving the public product a better employer entry point."
          action={<Link className="oq-button-primary" href="/employer/register">Create Employer Account</Link>}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--surface-muted)] p-5">
              <p className="text-sm font-semibold text-[var(--text)]">Already have employer access?</p>
              <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">Use the employer sign-in page to reach posting, applicant review, and company-owned workflows.</p>
              <Link className="oq-link mt-4 inline-flex text-sm" href="/employer/login">Go to employer sign in</Link>
            </div>
            <div className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--surface-muted)] p-5">
              <p className="text-sm font-semibold text-[var(--text)]">Need the public candidate side?</p>
              <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">Job seekers can continue from the homepage, public jobs list, and lightweight candidate auth flow.</p>
              <Link className="oq-link mt-4 inline-flex text-sm" href="/">Go to Careers homepage</Link>
            </div>
          </div>
        </SectionCard>
      </div>
    </PublicShell>
  );
}
