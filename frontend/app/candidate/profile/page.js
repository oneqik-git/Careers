'use client';

import DashboardShell from '@/components/DashboardShell';
import EmptyState from '@/components/EmptyState';
import MessageBanner from '@/components/MessageBanner';
import PageHero from '@/components/PageHero';
import ProtectedRoute from '@/components/ProtectedRoute';
import SectionCard from '@/components/SectionCard';
import StatCard from '@/components/StatCard';
import { useCandidateProfile } from '@/hooks/useCandidateProfile';
import { candidateNavItems } from '@/utils/navigation';
import {
  formatCurrency,
  formatDateTime,
  formatExperienceMonths,
  formatStatus,
} from '@/utils/formatters';

function renderProfileMetric(label, value, helper) {
  return (
    <div className="rounded-[1.1rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
      <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[var(--text)]">{value}</p>
      {helper ? <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{helper}</p> : null}
    </div>
  );
}

export default function CandidateProfilePage() {
  const { data, error, isLoading, refetch } = useCandidateProfile();

  return (
    <ProtectedRoute allowedRoles={['candidate']}>
      <DashboardShell
        title="Candidate Profile"
        subtitle="A more structured profile surface built from seeded identity, experience, learning, and application context."
        onRefresh={refetch}
        navItems={candidateNavItems}
      >
        {isLoading ? (
          <p className="text-sm text-[var(--text-soft)]">Loading profile...</p>
        ) : error ? (
          <MessageBanner tone="error" message={error.message || 'Unable to load the candidate profile.'} />
        ) : !data ? (
          <EmptyState title="Profile unavailable" description="The candidate profile payload is not available right now." />
        ) : (
          <div className="space-y-6">
            <PageHero
              eyebrow="Profile"
              title={data.full_name}
              description={data.headline || data.summary}
              badges={[
                data.location,
                data.current_role ? `${data.current_role}${data.current_company ? ` at ${data.current_company}` : ''}` : null,
                data.open_to_work ? 'Open to work' : 'Not open to work',
              ].filter(Boolean)}
              aside={
                <div className="space-y-4">
                  <div className="rounded-[1.25rem] border border-[rgba(93,224,230,0.16)] bg-[rgba(93,224,230,0.08)] px-4 py-4">
                    <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Career Score</p>
                    <p className="mt-3 text-5xl font-semibold tracking-[-0.05em] text-[var(--text)]">{data.score?.total_score ?? '-'}</p>
                    <p className="mt-2 text-sm text-[var(--text-soft)]">{data.score?.band ? `Band: ${formatStatus(data.score.band)}` : 'Band unavailable'}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {renderProfileMetric('Experience', formatExperienceMonths(data.total_experience_months), 'Total recorded experience')}
                    {renderProfileMetric('Applications', data.application_summary?.total ?? 0, `${data.application_summary?.avg_match_score || '-'} avg match`)}
                  </div>
                </div>
              }
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Verified documents" value={data.profile_strength?.verified_documents ?? 0} helper="Used in identity and trust signals." tone="accent" />
              <StatCard label="Verified experiences" value={data.profile_strength?.verified_experiences ?? 0} helper="Employer-verified work history attached to the profile." />
              <StatCard label="Active learning" value={data.profile_strength?.active_learning_items ?? 0} helper="Modules still in progress." />
              <StatCard label="Community activity" value={(data.community_activity?.posts_count || 0) + (data.community_activity?.comments_count || 0)} helper="Posts and comments visible on the new community surface." />
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <SectionCard title="Identity Summary" description="The highest-signal identity, role-fit, and preference details sit together so the profile reads more like a product surface than a raw payload dump.">
                <div className="grid gap-4 sm:grid-cols-2">
                  {renderProfileMetric('Summary', data.summary || 'No summary added yet')}
                  {renderProfileMetric('Domains', data.domains?.join(', ') || 'No domains added')}
                  {renderProfileMetric('Preferred locations', data.preferred_locations?.join(', ') || 'Not specified')}
                  {renderProfileMetric('Expected salary', `${formatCurrency(data.expected_salary_min)} - ${formatCurrency(data.expected_salary_max)}`, `${data.notice_period_days || 0} day notice period`)}
                </div>
              </SectionCard>

              <SectionCard title="Score Context" description="Existing backend score pillars and profile support data are surfaced together for a clearer candidate readout.">
                <div className="space-y-3">
                  {renderProfileMetric('Skill impact', data.score?.skill_impact_pts ?? 0)}
                  {renderProfileMetric('Credibility', data.score?.credibility_pts ?? 0)}
                  {renderProfileMetric('Engagement', data.score?.engagement_pts ?? 0)}
                  {renderProfileMetric('Values', data.score?.values_pts ?? 0)}
                  {renderProfileMetric('Identity', data.score?.identity_pts ?? 0, data.score?.identity_cap_active ? 'Identity cap is still active.' : 'Identity is verified.')}
                </div>
              </SectionCard>
            </div>

            <SectionCard title="Work History" description="Seeded experience records now include descriptions, achievements, and employer-entered performance context so the profile does not feel hollow.">
              <div className="space-y-5">
                {data.experiences?.map((experience) => (
                  <article key={experience.id} className="rounded-[1.5rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(4,14,32,0.45)] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.72rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">{experience.company_name}</p>
                        <h2 className="mt-2 text-[1.2rem] font-medium tracking-[-0.04em] text-[var(--text)]">{experience.job_title}</h2>
                        <p className="mt-2 text-sm text-[var(--text-soft)]">{experience.department} · {experience.is_current ? 'Current role' : 'Past role'}</p>
                      </div>
                      <div className="rounded-full border border-[rgba(93,224,230,0.16)] px-3 py-2 text-xs uppercase tracking-[0.16em] text-[var(--secondary-1)]">
                        {experience.is_employer_verified ? 'Employer verified' : 'Candidate added'}
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-8 text-[var(--text-soft)]">{experience.description}</p>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Achievements</p>
                        <div className="mt-3 space-y-3">
                          {(experience.achievements || []).map((achievement) => (
                            <div key={achievement.id} className="rounded-[1rem] border border-[rgba(29,40,56,0.9)] px-4 py-3">
                              <p className="text-sm font-medium text-[var(--text)]">{achievement.title}</p>
                              <p className="mt-2 text-sm text-[var(--text-soft)]">{achievement.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Performance</p>
                        <div className="mt-3 space-y-3">
                          {(experience.performance || []).map((performance, index) => (
                            <div key={`${experience.id}-${index}`} className="rounded-[1rem] border border-[rgba(29,40,56,0.9)] px-4 py-3">
                              <p className="text-sm font-medium text-[var(--text)]">Target achievement {performance.target_pct}%</p>
                              <p className="mt-2 text-sm text-[var(--text-soft)]">Attendance {performance.attendance_pct}% · Employer rating {performance.employer_rating}/5</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </SectionCard>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <SectionCard title="Skills And Learning" description="Profile skills and learning progress now support the new Learn surface and make the candidate identity more believable.">
                <div className="grid gap-4 md:grid-cols-2">
                  {(data.skills_overview || []).map((skill) => (
                    <div key={skill.skill_name} className="rounded-[1.2rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                      <p className="text-sm font-medium text-[var(--text)]">{skill.skill_name}</p>
                      <p className="mt-2 text-sm text-[var(--text-soft)]">{skill.score}/{skill.max_score}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(skill.ai_tags || []).map((tag) => (
                          <span key={tag} className="oq-chip">{tag}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-4">
                  {(data.learning_journey || []).map((item) => (
                    <div key={item.id} className="rounded-[1.2rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[var(--text)]">{item.title}</p>
                          <p className="mt-1 text-sm text-[var(--text-soft)]">{item.domain}</p>
                        </div>
                        <span className="rounded-full border border-[rgba(93,224,230,0.16)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--secondary-1)]">
                          {formatStatus(item.status)} · {Math.round(Number(item.progress_pct || 0))}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <div className="space-y-6">
                <SectionCard title="Application Summary" description="The profile now carries candidate-facing application context instead of treating applications as a disconnected area.">
                  <div className="space-y-3">
                    {renderProfileMetric('Under review', data.application_summary?.under_review ?? 0)}
                    {renderProfileMetric('Shortlisted', data.application_summary?.shortlisted ?? 0)}
                    {renderProfileMetric('Interviews', (data.application_summary?.interview_scheduled || 0) + (data.application_summary?.interview_done || 0))}
                    {renderProfileMetric('Offers or joined', (data.application_summary?.offer_sent || 0) + (data.application_summary?.offer_accepted || 0) + (data.application_summary?.joined || 0))}
                  </div>
                </SectionCard>

                <SectionCard title="Recent Score History" description="Score events make the prototype feel active rather than static.">
                  <div className="space-y-3">
                    {(data.score_history || []).slice(0, 5).map((item) => (
                      <div key={item.id} className="rounded-[1rem] border border-[rgba(29,40,56,0.9)] px-4 py-3">
                        <p className="text-sm font-medium text-[var(--text)]">{formatStatus(item.event_type)}</p>
                        <p className="mt-1 text-sm text-[var(--text-soft)]">{item.note}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">{formatDateTime(item.created_at)}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>
        )}
      </DashboardShell>
    </ProtectedRoute>
  );
}
