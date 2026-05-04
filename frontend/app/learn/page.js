'use client';

import { useEffect, useMemo, useState } from 'react';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import MessageBanner from '@/components/MessageBanner';
import PageHero from '@/components/PageHero';
import PublicShell from '@/components/PublicShell';
import SectionCard from '@/components/SectionCard';
import { fetchLearnOverview } from '@/services/learn';
import { getStoredRole, getStoredUser } from '@/utils/authStorage';
import { formatStatus } from '@/utils/formatters';

function ProgressBadge({ progress }) {
  if (!progress) {
    return <span className="rounded-full border border-[rgba(29,40,56,0.9)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Preview</span>;
  }

  return (
    <span className="rounded-full border border-[rgba(93,224,230,0.16)] bg-[rgba(93,224,230,0.08)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--secondary-1)]">
      {formatStatus(progress.status)} | {Math.round(Number(progress.progress_pct || 0))}%
    </span>
  );
}

export default function LearnPage() {
  const [data, setData] = useState({ categories: [], modules: [], featured_modules: [], viewer_progress: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewer, setViewer] = useState({ role: null, user: null });

  useEffect(() => {
    setViewer({
      role: getStoredRole(),
      user: getStoredUser(),
    });

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchLearnOverview();
        setData(response || { categories: [], modules: [], featured_modules: [], viewer_progress: null });
      } catch (requestError) {
        setError(requestError);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  const totalLessonCount = useMemo(() => data.modules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0), [data.modules]);
  const heroActions = viewer.role === 'candidate'
    ? [{ label: 'Candidate Workspace', href: '/candidate/dashboard' }, { label: 'Profile', href: '/candidate/profile', variant: 'secondary' }]
    : [{ label: 'Candidate Login', href: '?auth=login' }, { label: 'Browse Opportunities', href: '/jobs', variant: 'secondary' }];

  return (
    <PublicShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="Learn"
          title="Practical learning with visible progress"
          description="The Learn surface keeps public discovery open, then adds progress states for signed-in candidates where the current data already supports them."
          badges={[
            `${data.categories.length} categories`,
            `${data.modules.length} modules`,
            `${totalLessonCount} lesson previews`,
            viewer.user?.full_name ? `Signed in as ${viewer.user.full_name}` : 'Public browse mode',
          ]}
          actions={heroActions}
          aside={
            <div className="space-y-4">
              <div className="rounded-[1.25rem] border border-[rgba(93,224,230,0.16)] bg-[rgba(93,224,230,0.08)] px-4 py-4">
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">Viewer state</p>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--text)]">
                  {viewer.role === 'candidate' && data.viewer_progress ? `${data.viewer_progress.enrolled} enrolled` : 'Public browse'}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">
                  {viewer.role === 'candidate' && data.viewer_progress
                    ? `${data.viewer_progress.in_progress} in progress | ${data.viewer_progress.completed} completed`
                    : 'Anyone can explore learning categories before signing in.'}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">Themes</p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">Communication, interview readiness, sales execution, business acumen, profile optimization, and leadership basics.</p>
              </div>
            </div>
          }
        />

        {error ? <MessageBanner tone="error" message={error.message || 'Unable to load Learn overview.'} /> : null}

        <SectionCard title="Categories" description="Learning categories are grouped so the public experience feels intentional before any sign-in wall appears.">
          {isLoading ? (
            <LoadingState
              compact
              description="Loading learning categories and module counts."
              label="Learn"
              title="Loading categories"
            />
          ) : data.categories.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.categories.map((category) => (
                <article key={category.id} className="rounded-[1.5rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(4,14,32,0.5)] p-5">
                  <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">{category.module_count} modules | {category.lesson_count} lessons</p>
                  <h2 className="mt-2 text-[1.35rem] font-medium tracking-[-0.04em] text-[var(--text)]">{category.name}</h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{category.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(category.themes || []).map((theme) => (
                      <span key={theme} className="oq-chip">{theme}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              eyebrow="Categories"
              title="No learning categories yet"
              description="Learning categories will appear here once the content catalog is available."
            />
          )}
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <SectionCard title="Modules" description="Each module includes lesson previews for public visitors and progress states for signed-in candidates.">
            {isLoading ? (
              <LoadingState
                compact
                description="Loading modules, lessons, and candidate progress where available."
                label="Modules"
                title="Preparing learning modules"
              />
            ) : data.modules.length ? (
              <div className="space-y-5">
                {data.modules.map((module) => (
                  <article key={module.id} className="rounded-[1.6rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(4,14,32,0.5)] p-5 shadow-[0_18px_32px_rgba(0,0,0,0.16)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">{module.domain} | {module.sub_domain}</p>
                        <h2 className="mt-2 text-[1.35rem] font-medium tracking-[-0.04em] text-[var(--text)]">{module.title}</h2>
                      </div>
                      <ProgressBadge progress={module.progress} />
                    </div>

                    <p className="mt-4 text-sm leading-8 text-[var(--text-soft)]">{module.description}</p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="oq-detail-panel">
                        <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Level</p>
                        <p className="mt-2 text-sm text-[var(--text)]">{formatStatus(module.level)}</p>
                      </div>
                      <div className="oq-detail-panel">
                        <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Duration</p>
                        <p className="mt-2 text-sm text-[var(--text)]">{module.duration_mins} mins</p>
                      </div>
                      <div className="oq-detail-panel">
                        <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">Reward</p>
                        <p className="mt-2 text-sm text-[var(--text)]">{module.score_pts_reward} score pts</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {module.lessons?.map((lesson) => (
                        <div key={lesson.id} className="rounded-[1.1rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-[var(--text)]">{lesson.title}</p>
                              <p className="mt-1 text-sm text-[var(--text-soft)]">{lesson.description}</p>
                            </div>
                            <div className="text-right text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                              <p>{lesson.duration_mins} mins</p>
                              <p className="mt-1">{lesson.is_preview ? 'Preview' : formatStatus(lesson.content_type)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                eyebrow="Modules"
                title="No modules available yet"
                description="Learning modules will appear here once the seeded catalog is available."
              />
            )}
          </SectionCard>

          <div className="space-y-6">
            <SectionCard title="Featured Modules" description="Higher-visibility modules with stronger score and XP rewards.">
              {data.featured_modules.length ? (
                <div className="space-y-3">
                  {data.featured_modules.map((module) => (
                    <div key={module.id} className="rounded-[1.1rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                      <p className="text-sm font-medium text-[var(--text)]">{module.title}</p>
                      <p className="mt-1 text-sm text-[var(--text-soft)]">{module.domain}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">{module.score_pts_reward} pts | {module.xp_reward} XP</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  align="left"
                  eyebrow="Featured"
                  title="No featured modules yet"
                  description="Featured learning paths will appear here once they are available."
                />
              )}
            </SectionCard>

            <SectionCard title="Progress Logic" description="Public browsing stays open while candidates get progress-oriented states where the current data supports them.">
              <div className="space-y-3 text-sm leading-7 text-[var(--text-soft)]">
                <p>Public visitors can browse categories, modules, and lesson previews without signing in.</p>
                <p>Signed-in candidates see enrollment, in-progress, and completed states pulled from seeded learning data.</p>
                <p>Learning progress also reinforces the richer candidate profile and Career Score story across the product.</p>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
