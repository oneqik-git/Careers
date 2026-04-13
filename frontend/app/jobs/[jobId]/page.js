'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MessageBanner from '@/components/MessageBanner';
import PageHero from '@/components/PageHero';
import PublicApplyAction from '@/components/PublicApplyAction';
import PublicShell from '@/components/PublicShell';
import SectionCard from '@/components/SectionCard';
import { fetchJobDetail } from '@/services/jobs';
import { formatExperienceRange, formatSalaryRange, formatStatus } from '@/utils/formatters';

function renderSkillGroup(skills, emptyLabel) {
  if (!skills?.length) {
    return <p className="text-sm text-[var(--text-soft)]">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span key={skill} className="oq-chip">
          {skill}
        </span>
      ))}
    </div>
  );
}

export default function PublicJobDetailPage() {
  const params = useParams();
  const jobId = params?.jobId;
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadJob() {
      if (!jobId) {
        setError({ message: 'Missing job ID.' });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchJobDetail(jobId);
        setJob(response?.data || null);
      } catch (requestError) {
        setError(requestError);
      } finally {
        setIsLoading(false);
      }
    }

    loadJob();
  }, [jobId]);

  return (
    <PublicShell>
      {isLoading ? (
        <p className="text-sm text-[var(--text-soft)]">Loading public job detail...</p>
      ) : error ? (
        <MessageBanner tone="error" message={error.message || 'Unable to load job detail.'} />
      ) : !job ? (
        <MessageBanner tone="error" message="Job not found." />
      ) : (
        <div className="space-y-8">
          <PageHero
            eyebrow={job.company_name || 'Public role'}
            title={job.title}
            description="Role detail is publicly visible. Applying and candidate-specific workflow steps stay protected."
            badges={[
              job.department,
              job.location,
              job.work_mode ? formatStatus(job.work_mode) : null,
              formatExperienceRange(job.experience_min_years, job.experience_max_years),
            ].filter(Boolean)}
            actions={[
              { label: 'Back to jobs', href: '/jobs', variant: 'secondary' },
              { label: 'Candidate sign in', href: `/login?next=${encodeURIComponent(`/candidate/jobs/detail?jobId=${job.id}`)}` },
            ]}
            aside={(
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/72">Compensation</p>
                  <p className="mt-2 text-2xl font-semibold">{formatSalaryRange(job.salary_min, job.salary_max, job.salary_disclosed)}</p>
                </div>
                <div className="grid gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/72">Company score</p>
                    <p className="mt-1 text-sm text-white/86">{job.company_score ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/72">Prescreening</p>
                    <p className="mt-1 text-sm text-white/86">{job.questions?.length ?? 0} question(s)</p>
                  </div>
                </div>
              </div>
            )}
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <SectionCard title="Role overview" description="Public detail stays informative while keeping protected workflow steps separate.">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Department</p>
                    <p className="mt-2 text-sm text-[var(--text)]">{job.department || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Level</p>
                    <p className="mt-2 text-sm text-[var(--text)]">{job.level || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Work mode</p>
                    <p className="mt-2 text-sm text-[var(--text)]">{job.work_mode ? formatStatus(job.work_mode) : 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Education</p>
                    <p className="mt-2 text-sm text-[var(--text)]">{job.education_requirement || 'Not specified'}</p>
                  </div>
                </div>
                <div className="mt-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Description</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text-soft)]">
                    {job.description || 'No description provided.'}
                  </p>
                </div>
              </SectionCard>

              <SectionCard title="Responsibilities and benefits" description="The public page explains the role clearly before any sign-in wall appears.">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Responsibilities</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text-soft)]">
                      {job.responsibilities || 'No responsibilities provided.'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Benefits</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text-soft)]">
                      {job.benefits || 'No benefits listed.'}
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Requirements and fit" description="Public viewers can assess fit before moving into protected candidate actions.">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Required skills</p>
                    <div className="mt-3">{renderSkillGroup(job.required_skills, 'No required skills listed.')}</div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Preferred skills</p>
                    <div className="mt-3">{renderSkillGroup(job.preferred_skills, 'No preferred skills listed.')}</div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Prescreen preview" description="Questions are visible, but submitting answers still requires protected candidate access.">
                {(job.questions || []).length ? (
                  <div className="space-y-3">
                    {job.questions.map((question, index) => (
                      <div key={question.id} className="oq-card-muted rounded-[24px] p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="oq-chip">Question {index + 1}</span>
                          <span className="oq-chip">{formatStatus(question.question_type || 'text')}</span>
                          {question.is_required ? <span className="oq-chip">Required</span> : null}
                        </div>
                        <p className="mt-3 text-sm text-[var(--text)]">{question.question_text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-soft)]">No prescreen questions were added for this role.</p>
                )}
              </SectionCard>
            </div>

            <div className="space-y-6">
              <SectionCard
                title="Apply to this role"
                description="Protected candidate workflow starts here. Anonymous visitors are redirected into sign in or registration."
              >
                <div className="space-y-4">
                  <p className="text-sm text-[var(--text-soft)]">
                    Public browsing stays open, but applications, candidate dashboards, and application histories remain protected.
                  </p>
                  <PublicApplyAction jobId={job.id} />
                  <Link className="oq-button-ghost w-full" href="/register?role=employer">
                    Hiring team? Create employer access
                  </Link>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      )}
    </PublicShell>
  );
}
