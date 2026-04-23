import Link from 'next/link';
import PageHero from '@/components/PageHero';
import PublicShell from '@/components/PublicShell';
import SectionCard from '@/components/SectionCard';

const howItWorks = [
  'Browse roles publicly without being forced into sign-in first.',
  'Create a candidate profile when you want to apply with stronger context.',
  'Move into a clearer application workflow once the role is worth pursuing.',
];

const oneQikPoints = [
  'OneQik brings a premium, business-like brand language to the public surface.',
  'Careers uses that visual system while staying candidate-first in structure.',
  'The product layer stays separate so discovery does not turn into a dashboard too early.',
];

export default function AboutPage() {
  return (
    <PublicShell>
      <div className="space-y-12 lg:space-y-16">
        <PageHero
          titleAs="h1"
          align="center"
          layout="stacked"
          eyebrow="About Careers"
          title="A candidate-first hiring system with a public face and a real product layer behind it."
          description="Careers by OneQik is designed to keep discovery open, applications more structured, and hiring progress easier to understand once you sign in."
          titleClassName="max-w-[16ch]"
          descriptionClassName="max-w-3xl"
          actions={[
            { label: 'Browse Opportunities', href: '/jobs' },
            { label: 'For Employers', href: '/employers', variant: 'secondary' },
          ]}
          aside={(
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-[15px] border border-[var(--dark-1)] bg-[rgba(4,18,44,0.56)] px-4 py-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--primary-2)]">Public website layer</p>
                <p className="mt-2 text-sm font-light leading-7 text-[var(--secondary-1)]">Brand, browsing, trust, and candidate-first storytelling.</p>
              </div>
              <div className="rounded-[15px] border border-[var(--dark-1)] bg-[rgba(4,18,44,0.56)] px-4 py-4">
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--primary-2)]">Product layer</p>
                <p className="mt-2 text-sm font-light leading-7 text-[var(--secondary-1)]">Opportunities, applications, progress tracking, and protected workflows after login.</p>
              </div>
            </div>
          )}
          asideClassName="p-0"
        />

        <section id="how-it-works" className="scroll-mt-24">
          <SectionCard eyebrow="How It Works" title="A better split between discovery and workflow">
            <div className="grid gap-4 md:grid-cols-3">
              {howItWorks.map((item, index) => (
                <div key={item} className="oq-card-muted rounded-[1.9rem] p-5">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Step {index + 1}</p>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{item}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </section>

        <section id="oneqik" className="scroll-mt-24">
          <SectionCard eyebrow="OneQik" title="The visual language comes from OneQik. The experience is tuned for careers.">
            <div className="grid gap-4 md:grid-cols-3">
              {oneQikPoints.map((item) => (
                <div key={item} className="oq-card-muted rounded-[1.9rem] p-5">
                  <p className="text-sm leading-7 text-[var(--text-soft)]">{item}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </section>

        <section id="community" className="scroll-mt-24">
          <SectionCard eyebrow="Community" title="Public reading now, deeper interaction later">
            <p className="max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
              Community is planned as a public-browse, login-to-interact module for career and hiring discussions. The Phase 1 pass keeps that intention visible without overbuilding backend behavior early.
            </p>
          </SectionCard>
        </section>

        <section id="services" className="scroll-mt-24">
          <SectionCard eyebrow="Services" title="The current rebuild is structured, not random">
            <p className="max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
              This pass focuses on the public website layer first: homepage rhythm, OneQik-aligned visual tokens, candidate-first messaging, and a separate employer entry route. The deeper product interactions follow in later phases.
            </p>
          </SectionCard>
        </section>

        <section id="privacy" className="scroll-mt-24">
          <SectionCard eyebrow="Legal" title="Privacy">
            <p className="max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
              Placeholder legal copy only. Final privacy language still needs reviewed production content.
            </p>
          </SectionCard>
        </section>

        <section id="terms" className="scroll-mt-24">
          <SectionCard title="Terms">
            <p className="max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
              Placeholder legal copy only. Final terms content should be supplied by the product and legal teams before launch.
            </p>
            <div className="mt-6">
              <Link className="oq-button-primary" href="/jobs">
                Browse Opportunities
              </Link>
            </div>
          </SectionCard>
        </section>
      </div>
    </PublicShell>
  );
}
