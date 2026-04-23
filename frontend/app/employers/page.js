import Link from 'next/link';
import PageHero from '@/components/PageHero';
import PublicShell from '@/components/PublicShell';
import SectionCard from '@/components/SectionCard';

const employerPoints = [
  'Separate employer entry from the candidate journey.',
  'Start with work-email-first company identity.',
  'Move into protected hiring workflows after sign-in.',
];

const hiringCards = [
  {
    title: 'Dedicated employer route',
    description: 'Hiring teams should not have to enter through candidate-first messaging or shared role tabs.',
  },
  {
    title: 'Operational messaging',
    description: 'The employer side should feel more focused on hiring clarity, workflow, and company identity.',
  },
  {
    title: 'Protected workflow',
    description: 'Posting roles, reviewing applicants, and managing pipeline activity stay inside employer-owned routes.',
  },
];

export default function EmployersPage() {
  return (
    <PublicShell>
      <div className="space-y-12 lg:space-y-16">
        <PageHero
          titleAs="h1"
          align="center"
          layout="stacked"
          eyebrow="For Employers"
          title="A separate front door for hiring teams."
          description="Employers get a more operational public entry, work-email-first account setup, and a cleaner path into protected hiring workflows."
          titleClassName="max-w-[14ch]"
          descriptionClassName="max-w-3xl"
          actions={[
            { label: 'Employer Sign In', href: '/employer/login' },
            { label: 'Create Employer Account', href: '/employer/register', variant: 'secondary' },
          ]}
          aside={(
            <div className="grid gap-3 md:grid-cols-3">
              {employerPoints.map((point) => (
                <div key={point} className="rounded-[15px] border border-[var(--dark-1)] bg-[rgba(4,18,44,0.56)] px-4 py-4">
                  <p className="text-sm font-light leading-7 text-[var(--secondary-1)]">{point}</p>
                </div>
              ))}
            </div>
          )}
          asideClassName="p-0"
        />

        <SectionCard eyebrow="Employer Entry" title="Why this route exists">
          <div className="grid gap-4 md:grid-cols-3">
            {hiringCards.map((card) => (
              <div key={card.title} className="oq-card-muted rounded-[1.9rem] p-5">
                <p className="text-xl font-semibold tracking-[-0.03em] text-[var(--text)]">{card.title}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{card.description}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <section className="oq-card rounded-[2.4rem] p-6 sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <p className="oq-kicker">Work Email First</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text)]">Employer identity should start with the company, not a personal inbox.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-[var(--text-soft)]">
                This page intentionally pushes employers into their own sign-in and registration routes, where company identity and hiring ownership are clearer from the first step.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link className="oq-button-primary" href="/employer/register">
                  Create Employer Account
                </Link>
                <Link className="oq-button-secondary" href="/employer/login">
                  Employer Sign In
                </Link>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[1.7rem] border border-[var(--border)] bg-[var(--surface-muted)] p-5">
                <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">Account rule</p>
                <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">Use a company-linked work email wherever possible. Personal mailbox validation stays part of the employer auth flow.</p>
              </div>
              <div className="rounded-[1.7rem] border border-[var(--border)] bg-[var(--surface-muted)] p-5">
                <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">Candidate side</p>
                <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">Candidates still browse publicly from the homepage and opportunities route without mixing the two entry modes together.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
