import Link from 'next/link';
import PageHero from '@/components/PageHero';
import PublicShell from '@/components/PublicShell';
import SectionCard from '@/components/SectionCard';

const howItWorks = [
  'Browse roles publicly and understand the opportunity before you sign in.',
  'Create a candidate profile when you want to apply with more than just a resume.',
  'Track progress through a clearer employer-side process once your application is in.',
];

const companyPoints = [
  'OneQik focuses on practical products for work, hiring, and career progress.',
  'Careers is the candidate-first hiring layer in that brand family.',
  'The current implementation keeps public browsing open while protected workflow stays intact.',
];

export default function AboutPage() {
  return (
    <PublicShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="About Careers"
          title="A hiring experience that treats people like more than a PDF."
          description="Careers by OneQik is built around stronger candidate signal, clearer employer process, and a public-first browsing layer that feels like a real product."
          actions={[
            { label: 'Browse Jobs', href: '/jobs' },
            { label: 'For Employers', href: '/employers', variant: 'secondary' },
          ]}
        />

        <SectionCard eyebrow="How it works" title="A cleaner path from discovery to decision" className="scroll-mt-24" >
          <div id="how-it-works" className="grid gap-4 md:grid-cols-3">
            {howItWorks.map((item, index) => (
              <div key={item} className="oq-card-muted rounded-[1.7rem] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Step {index + 1}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{item}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <section id="oneqik" className="scroll-mt-24">
          <SectionCard eyebrow="OneQik" title="Part of the OneQik brand family">
            <div className="grid gap-4 md:grid-cols-3">
              {companyPoints.map((item) => (
                <div key={item} className="oq-card-muted rounded-[1.7rem] p-5">
                  <p className="text-sm leading-7 text-[var(--text-soft)]">{item}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </section>

        <section id="community" className="scroll-mt-24">
          <SectionCard eyebrow="Community" title="Built for people trying to move forward">
            <p className="max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
              Careers is aimed at job seekers who want a better way to present themselves and employers who want more signal than resume volume. The current demo pass stays practical and product-focused rather than expanding into extra features.
            </p>
          </SectionCard>
        </section>

        <section id="services" className="scroll-mt-24">
          <SectionCard eyebrow="Services" title="Structured hiring without changing the architecture">
            <p className="max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
              This pass keeps existing candidate and employer workflows intact, sharpens the public experience, and gives employers a dedicated entry flow without redesigning the system underneath.
            </p>
          </SectionCard>
        </section>

        <section id="privacy" className="scroll-mt-24">
          <SectionCard eyebrow="Legal" title="Privacy">
            <p className="max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
              Demo copy only. Privacy and policy language should be replaced with final reviewed legal content before production use.
            </p>
          </SectionCard>
        </section>

        <section id="terms" className="scroll-mt-24">
          <SectionCard title="Terms">
            <p className="max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
              Demo copy only. Terms should be supplied by the product and legal teams before launch.
            </p>
            <div className="mt-5">
              <Link className="oq-button-primary" href="/jobs">Browse Jobs</Link>
            </div>
          </SectionCard>
        </section>
      </div>
    </PublicShell>
  );
}
