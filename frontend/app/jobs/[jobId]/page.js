'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MessageBanner from '@/components/MessageBanner';
import PageHero from '@/components/PageHero';
import PublicShell from '@/components/PublicShell';
import SectionCard from '@/components/SectionCard';
import { fetchJobDetail } from '@/services/jobs';
import { getStoredRole, getStoredToken } from '@/utils/authStorage';
import { formatExperienceRange, formatSalaryRange, formatStatus } from '@/utils/formatters';
import { markJobViewed } from '@/utils/jobViewState';

function renderSkillGroup(skills, emptyLabel) {
  if (!skills?.length) {
    return <p className="text-sm font-normal text-[var(--text-soft)]">{emptyLabel}</p>;
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

function stripTextFormatting(value) {
  return String(value || '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .trim();
}

function splitIntoPoints(value) {
  const cleanValue = stripTextFormatting(value);

  if (!cleanValue) {
    return [];
  }

  const lineItems = cleanValue
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*0-9.)\s]+/, '').trim())
    .filter(Boolean);

  if (lineItems.length > 1) {
    return lineItems;
  }

  return (cleanValue.match(/[^.!?]+[.!?]?/g) || [cleanValue])
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderPointList(value, emptyLabel) {
  const items = splitIntoPoints(value);

  if (!items.length) {
    return <p className="oq-detail-content mt-3 text-sm font-normal leading-7 text-[var(--text-soft)]">{emptyLabel}</p>;
  }

  return (
    <ul className="oq-detail-content oq-detail-list mt-3 space-y-2 text-sm font-normal leading-7 text-[var(--text-soft)]">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function PublicJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.jobId;
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadJob() {
      if (!jobId) {
        setError({ message: 'Missing opportunity ID.' });
        setIsLoading(false);
        return;
      }

      if (getStoredToken() && getStoredRole() === 'candidate') {
        router.replace(`/candidate/jobs/detail?jobId=${jobId}`);
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
  }, [jobId, router]);

  useEffect(() => {
    if (jobId) {
      markJobViewed(jobId);
    }
  }, [jobId]);

  return (
    <PublicShell>
      {isLoading ? (
        <p className="text-sm text-[var(--text-soft)]">Loading opportunity detail...</p>
      ) : error ? (
        <MessageBanner tone="error" message={error.message || 'Unable to load opportunity detail.'} />
      ) : !job ? (
        <MessageBanner tone="error" message="Opportunity not found." />
      ) : (
        <div className="oq-public-job-detail space-y-8">
          <PageHero
            eyebrow={job.company_name || 'Open role'}
            title={job.title}
            className="oq-public-job-detail-hero"
            badges={[
              job.department,
              job.location,
              job.work_mode ? formatStatus(job.work_mode) : null,
              formatExperienceRange(job.experience_min_years, job.experience_max_years),
            ].filter(Boolean)}
            actions={[
              { label: 'Back to Opportunities', href: '/jobs', variant: 'secondary' },
              { label: 'Apply', href: `/register?next=${encodeURIComponent(`/candidate/jobs/detail?jobId=${job.id}`)}` },
            ]}
            aside={(
              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/72">Compensation</p>
                  <p className="mt-2 text-2xl font-semibold">{formatSalaryRange(job.salary_min, job.salary_max, job.salary_disclosed)}</p>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-[1.2rem] border border-white/10 bg-white/8 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/70">Company score</p>
                    <p className="mt-2 text-sm text-white/84">{job.company_score ?? '-'}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/10 bg-white/8 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/70">Structured screening</p>
                    <p className="mt-2 text-sm text-white/84">{job.questions?.length ?? 0} question(s)</p>
                  </div>
                </div>
              </div>
            )}
          />

          <div className="oq-public-job-detail-grid grid gap-6">
            <div className="contents">
              <SectionCard className="oq-public-job-section oq-public-job-section-compact" title="Role overview" description="Enough context to decide whether the role is worth your time.">
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
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Description</p>
                  <p className="oq-detail-content mt-3 whitespace-pre-wrap text-sm font-normal leading-7 text-[var(--text-soft)]">
                    {stripTextFormatting(job.description) || 'No description provided.'}
                  </p>
                </div>
              </SectionCard>

              <SectionCard className="oq-public-job-section oq-public-job-section-wide" title="Responsibilities and benefits" description="What you're expected to do">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Responsibilities</p>
                    {renderPointList(job.responsibilities, 'No responsibilities provided.')}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Benefits</p>
                    {renderPointList(job.benefits, 'No benefits listed.')}
                  </div>
                </div>
              </SectionCard>

              <SectionCard className="oq-public-job-section oq-public-job-section-compact" title="Requirements and fit" description="Hope you got these, Coz we sure need it">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Required skills</p>
                    <div className="oq-detail-content mt-3">{renderSkillGroup(job.required_skills, 'No required skills listed.')}</div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Preferred skills</p>
                    <div className="oq-detail-content mt-3">{renderSkillGroup(job.preferred_skills, 'No preferred skills listed.')}</div>
                  </div>
                </div>
              </SectionCard>

            </div>
          </div>
        </div>
      )}
    </PublicShell>
  );
}
