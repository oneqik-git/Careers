'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import MessageBanner from '@/components/MessageBanner';
import PublicShell from '@/components/PublicShell';
import SectionCard from '@/components/SectionCard';
import {
  createCommunityAnswer,
  createCommunityPost,
  createCommunityQuestion,
  createCommunityTargetComment,
  fetchCommunityFeed,
  submitCommunityPollVote,
  toggleCommunityReaction,
} from '@/services/community';
import { getStoredRole, getStoredUser } from '@/utils/authStorage';
import { formatDateTime, formatStatus } from '@/utils/formatters';

const emptyComposer = {
  title: '',
  details: '',
  body: '',
  topics: '',
  questionId: '',
  supporting_link: '',
};

const privacyIdentityLabels = [
  'Verified Recruiter · Identity Hidden · SaaS',
  'Anonymous Candidate · Sales · 2 yrs',
  'Hiring Manager · Role Visible · Product',
  'Career Member · 3 yrs exp · BPO',
  'Employer Representative · Role Visible',
];

function getPrivacyIdentityLabel(item = {}) {
  const existingLabel = String(item.author_label || '').trim();

  if (/anonymous|verified|identity hidden|career member|hiring manager|employer representative/i.test(existingLabel)) {
    return existingLabel;
  }

  const id = String(item.id || existingLabel || item.created_at || 'career-member');
  const score = id.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return privacyIdentityLabels[score % privacyIdentityLabels.length];
}

function formatVoteTotal(count) {
  const total = Number(count) || 0;

  if (total >= 3000) {
    return `${(total / 1000).toFixed(1).replace(/\.0$/, '')}k Votes`;
  }

  return `${total} Votes`;
}

function LoginMark({ user }) {
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'OQ';

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(93,224,230,0.24)] bg-[rgba(93,224,230,0.08)] text-xs font-semibold text-[var(--text)]">
      {initials}
    </div>
  );
}

function IconGlyph({ type }) {
  const glyphs = {
    ask: '?',
    answer: '/',
    post: '+',
    upvote: '^',
    comment: '#',
  };

  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-md border border-[rgba(93,224,230,0.22)] text-xs text-[var(--brand-accent)]">
      {glyphs[type] || '+'}
    </span>
  );
}

function CommentThread({ comments = [] }) {
  if (!comments.length) return null;

  return (
    <div className="space-y-2.5">
      {comments.map((comment) => (
        <div key={comment.id} className="rounded-[0.85rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.03)] px-3 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--text)]">{getPrivacyIdentityLabel(comment)}</p>
          <p className="mt-1.5 text-xs leading-6 text-[var(--text-soft)]">{comment.content}</p>
          <p className="mt-2 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">{formatDateTime(comment.created_at)}</p>
          {comment.replies?.length ? (
            <div className="mt-3 border-l border-[rgba(93,224,230,0.14)] pl-3">
              <CommentThread comments={comment.replies} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function CommunityComposer({ onOpen, viewer }) {
  return (
    <div className="rounded-[16px] border border-[rgba(29,40,56,0.9)] bg-[rgba(9,12,17,0.56)] p-3 shadow-[0_18px_34px_rgba(0,0,0,0.2)]">
      <div className="flex items-center gap-2.5">
        <LoginMark user={viewer.user} />
        <button
          className="min-h-9 flex-1 rounded-full border border-[rgba(93,224,230,0.16)] bg-[rgba(255,255,255,0.03)] px-3.5 text-left text-sm text-[var(--text-muted)] transition hover:border-[rgba(93,224,230,0.3)] hover:text-[var(--text)]"
          onClick={() => onOpen('post')}
          type="button"
        >
          Need suggestions, have questions, or workplace situations? Share it here.
        </button>
      </div>

      <div className="mt-2.5 grid grid-cols-3 divide-x divide-[rgba(93,224,230,0.12)]">
        {[
          ['ask', 'Ask Question'],
          ['answer', 'Share Insight'],
          ['post', 'Start Discussion'],
        ].map(([mode, label]) => (
          <button
            key={mode}
            className="flex min-h-8 items-center justify-center gap-1.5 px-2 text-xs font-semibold text-[var(--text-soft)] transition hover:text-[var(--text)]"
            onClick={() => onOpen(mode)}
            type="button"
          >
            <IconGlyph type={mode} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ComposerModal({ mode, form, questions, onChange, onClose, onSubmit, isSubmitting }) {
  if (!mode) return null;

  const title = mode === 'ask' ? 'Ask a career question' : mode === 'answer' ? 'Share Insight' : 'Start Discussion';
  const submitLabel = mode === 'ask' ? 'Ask Question' : mode === 'answer' ? 'Share Insight' : 'Start Discussion';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <div className="w-full max-w-2xl rounded-[22px] border border-[rgba(93,224,230,0.18)] bg-[rgba(5,18,43,0.98)] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.46)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="oq-kicker">Career Discussion Engine</p>
            <h2 className="mt-2 text-2xl font-medium text-[var(--text)]">{title}</h2>
          </div>
          <button className="oq-button-ghost !px-3 !py-2" onClick={onClose} type="button">Close</button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {mode === 'ask' ? (
            <>
              <input
                className="oq-input"
                name="title"
                onChange={onChange}
                placeholder="Ask a career, hiring, or workplace question"
                value={form.title}
              />
              <textarea
                className="oq-textarea min-h-32"
                name="details"
                onChange={onChange}
                placeholder="Add context, constraints, role type, or decision points"
                value={form.details}
              />
              <input className="oq-input" name="topics" onChange={onChange} placeholder="Career topics, separated by commas" value={form.topics} />
            </>
          ) : null}

          {mode === 'answer' ? (
            <>
              <select className="oq-select" name="questionId" onChange={onChange} value={form.questionId}>
                <option value="">Select a career question</option>
                {questions.map((question) => (
                  <option key={question.id} value={question.id}>{question.title}</option>
                ))}
              </select>
              <textarea
                className="oq-textarea min-h-40"
                name="body"
                onChange={onChange}
                placeholder="Share a practical insight, context, or decision framework"
                value={form.body}
              />
              <input className="oq-input" name="supporting_link" onChange={onChange} placeholder="Supporting link, optional" value={form.supporting_link} />
            </>
          ) : null}

          {mode === 'post' ? (
            <>
              <input className="oq-input" name="title" onChange={onChange} placeholder="Discussion title, optional" value={form.title} />
              <textarea
                className="oq-textarea min-h-40"
                name="body"
                onChange={onChange}
                placeholder="Share a career situation, hiring observation, job-market context, or decision point"
                value={form.body}
              />
              <input className="oq-input" name="topics" onChange={onChange} placeholder="Career topics, separated by commas" value={form.topics} />
            </>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button className="oq-button-secondary" onClick={onClose} type="button">Cancel</button>
            <button className="oq-button-primary" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Sharing...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CommunityCard({
  item,
  viewer,
  commentDraft,
  onCommentChange,
  onCommentSubmit,
  onReaction,
  onPollVote,
  onAnswer,
}) {
  const isQuestion = item.content_type === 'question';
  const isAnswer = item.content_type === 'answer';
  const isPoll = item.content_type === 'poll' || item.post_type === 'poll';
  const targetType = item.target_type || (isAnswer ? 'answer' : 'post');
  const title = isAnswer ? item.question_title || item.title : item.title;
  const identityLabel = getPrivacyIdentityLabel(item);
  const cardTypeLabel = isPoll ? 'Public Opinion Poll' : isAnswer ? 'Insight' : isQuestion ? 'Career Question' : 'Career Discussion';
  const engagementLabel = item.comment_count > 0 ? `${item.comment_count} Engagements` : 'Nothing yet. Got something?';
  const pollVoteTotal = (item.poll_options || []).reduce((total, option) => total + (Number(option.vote_count) || 0), 0);
  const activityLabel = isPoll ? formatVoteTotal(pollVoteTotal) : null;

  return (
    <article className="rounded-[16px] border border-[rgba(29,40,56,0.9)] bg-[rgba(4,14,32,0.58)] p-4 shadow-[inset_-4px_-1px_8px_-5px_rgba(93,224,230,0.3),inset_6px_3px_10px_5px_rgba(0,0,0,0.3)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.65rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {cardTypeLabel} | {identityLabel}
          </p>
          {title ? (
            <h2 className="mt-1.5 text-[1.05rem] font-medium leading-snug text-[var(--text)]">
              {isAnswer ? `Insight on: ${title}` : title}
            </h2>
          ) : null}
        </div>
        {activityLabel ? (
          <div className="rounded-full border border-[rgba(93,224,230,0.16)] px-2.5 py-1.5 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--secondary-1)]">
            {activityLabel}
          </div>
        ) : null}
      </div>

      {isPoll ? (
        <div className="mt-3 inline-flex rounded-full border border-[rgba(93,224,230,0.18)] bg-[rgba(93,224,230,0.07)] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--brand-accent)]">
          Public Opinion Poll
        </div>
      ) : null}

      <p className="mt-3 text-[0.86rem] leading-6 text-[var(--text-soft)]">{item.body || item.content}</p>

      {item.domain_tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.domain_tags.map((tag) => <span key={tag} className="oq-chip !px-2.5 !py-1.5 !text-[0.65rem]">{tag}</span>)}
        </div>
      ) : null}

      {isPoll && item.poll_options?.length ? (
        <div className="mt-4 grid gap-2">
          {item.poll_options.map((option) => (
            <button
              key={option.id}
              className={`rounded-[0.85rem] border px-3 py-2 text-left text-xs transition ${item.viewer_poll_option_id === option.id ? 'border-[rgba(93,224,230,0.28)] bg-[rgba(93,224,230,0.12)] text-white' : 'border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.03)] text-[var(--text-soft)] hover:border-[rgba(93,224,230,0.18)] hover:text-white'}`.trim()}
              onClick={() => onPollVote(item.id, option.id)}
              type="button"
            >
              <div className="flex items-center justify-between gap-4">
                <span>{option.option_text}</span>
                <span className="text-[0.65rem] uppercase tracking-[0.14em]">{option.vote_count} votes</span>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-[var(--text-soft)]">
        <button className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-[rgba(29,40,56,0.9)] px-2.5 py-1 text-[0.72rem] font-medium text-[var(--text-soft)] transition hover:border-[rgba(93,224,230,0.22)] hover:text-white" onClick={() => onReaction(targetType, item.id)} type="button">
          <span className="text-[0.68rem] text-[var(--brand-accent)]">^</span> Useful | {item.upvote_count || 0}
        </button>
        {isQuestion ? (
          <button className="oq-button-ghost !rounded-full !px-3 !py-1.5 !text-xs" onClick={() => onAnswer(item.id)} type="button">
            <IconGlyph type="answer" /> Share Insight
          </button>
        ) : null}
        <span>{engagementLabel}</span>
        <span>{formatDateTime(item.created_at)}</span>
      </div>

      {isQuestion && item.answers?.length ? (
        <div className="mt-4 space-y-2.5 border-t border-[rgba(93,224,230,0.12)] pt-4">
          {item.answers.slice(0, 2).map((answer) => (
            <div key={answer.id} className="rounded-[0.85rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.03)] p-3">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--text)]">{getPrivacyIdentityLabel(answer)}</p>
              <p className="mt-1.5 text-xs leading-6 text-[var(--text-soft)]">{answer.body}</p>
              <p className="mt-2 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">{answer.upvote_count || 0} useful</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-2 flex items-center gap-5">
        <textarea
          className="oq-textarea min-h-8 min-w-0 flex-1 resize-none rounded-full px-3 py-1.5 text-xs leading-5"
          onChange={(event) => onCommentChange(item.id, event.target.value)}
          placeholder={viewer.role ? 'Add to the discussion' : 'Sign in to discuss'}
          rows={1}
          value={commentDraft || ''}
        />
        <button className="oq-button-secondary min-h-8 shrink-0 !rounded-full !px-3 !py-1.5 !text-xs" onClick={() => onCommentSubmit(targetType, item.id)} type="button">
          <IconGlyph type="comment" /> Engage
        </button>
      </div>

      {item.comments?.length ? (
        <div className="mt-4 border-t border-[rgba(93,224,230,0.12)] pt-4">
          <CommentThread comments={item.comments} />
        </div>
      ) : null}
    </article>
  );
}

export default function CommunityPage() {
  const router = useRouter();
  const [feed, setFeed] = useState({ posts: [], questions: [], topics: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState({ tone: 'info', message: '' });
  const [commentDrafts, setCommentDrafts] = useState({});
  const [viewer, setViewer] = useState({ role: null, user: null });
  const [composerMode, setComposerMode] = useState(null);
  const [composerForm, setComposerForm] = useState(emptyComposer);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = useMemo(() => {
    const byId = new Map();
    [...(feed.questions || []), ...(feed.posts || []).filter((item) => item.content_type === 'question')]
      .forEach((question) => byId.set(question.id, question));
    return Array.from(byId.values());
  }, [feed]);

  async function loadFeed() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCommunityFeed();
      setFeed(data || { posts: [], questions: [], topics: [] });
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setViewer({ role: getStoredRole(), user: getStoredUser() });
    loadFeed();
  }, []);

  function redirectToLogin() {
    router.push('/community?auth=login&next=/community');
  }

  function requireAuth() {
    if (viewer.role) return true;
    redirectToLogin();
    return false;
  }

  function openComposer(mode, questionId = '') {
    if (!requireAuth()) return;
    setComposerForm({ ...emptyComposer, questionId });
    setComposerMode(mode);
  }

  function handleComposerChange(event) {
    const { name, value } = event.target;
    setComposerForm((current) => ({ ...current, [name]: value }));
  }

  async function handleComposerSubmit(event) {
    event.preventDefault();
    if (!requireAuth()) return;

    setIsSubmitting(true);
    setNotice({ tone: 'info', message: '' });

    try {
      if (composerMode === 'ask') {
        if (composerForm.title.trim().length < 10) {
          throw new Error('Question must be at least 10 characters long.');
        }
        await createCommunityQuestion({
          title: composerForm.title,
          details: composerForm.details,
          topics: composerForm.topics,
          visibility: 'public',
        });
        setNotice({ tone: 'success', message: 'Career question added to the discussion board.' });
      }

      if (composerMode === 'post') {
        if (!composerForm.body.trim()) {
          throw new Error('Add a career situation or hiring observation before starting the discussion.');
        }
        await createCommunityPost({
          title: composerForm.title,
          body: composerForm.body,
          topics: composerForm.topics,
        });
        setNotice({ tone: 'success', message: 'Career discussion started.' });
      }

      if (composerMode === 'answer') {
        if (!composerForm.questionId) {
          throw new Error('Select a career question to add insight to.');
        }
        if (!composerForm.body.trim()) {
          throw new Error('Share an insight before submitting.');
        }
        await createCommunityAnswer(composerForm.questionId, {
          body: composerForm.body,
          supporting_link: composerForm.supporting_link || undefined,
        });
        setNotice({ tone: 'success', message: 'Insight added to the discussion.' });
      }

      setComposerMode(null);
      setComposerForm(emptyComposer);
      await loadFeed();
    } catch (requestError) {
      setNotice({ tone: 'error', message: requestError.message || 'Unable to share this right now.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReaction(targetType, targetId) {
    if (!requireAuth()) return;

    try {
      const result = await toggleCommunityReaction(targetType, targetId);
      setFeed((current) => ({
        ...current,
        posts: current.posts.map((item) => (
          item.id === targetId
            ? { ...item, viewer_has_upvoted: result.viewer_has_upvoted, upvote_count: result.upvote_count }
            : item
        )),
      }));
    } catch (requestError) {
      setNotice({ tone: 'error', message: requestError.message || 'Unable to mark this as useful right now.' });
    }
  }

  async function handleComment(targetType, targetId) {
    const content = String(commentDrafts[targetId] || '').trim();
    if (!content) {
      setNotice({ tone: 'warning', message: 'Add to the discussion before submitting.' });
      return;
    }
    if (!requireAuth()) return;

    try {
      await createCommunityTargetComment(targetType, targetId, { content });
      setCommentDrafts((current) => ({ ...current, [targetId]: '' }));
      setNotice({ tone: 'success', message: 'Contribution added to the discussion.' });
      await loadFeed();
    } catch (requestError) {
      setNotice({ tone: 'error', message: requestError.message || 'Unable to add the engagement right now.' });
    }
  }

  async function handlePollVote(postId, optionId) {
    if (!requireAuth()) return;

    try {
      const result = await submitCommunityPollVote(postId, { option_id: optionId });
      setFeed((current) => ({
        ...current,
        posts: current.posts.map((post) => (
          post.id === postId
            ? { ...post, viewer_poll_option_id: result.viewer_poll_option_id, poll_options: result.poll_options }
            : post
        )),
      }));
      setNotice({ tone: 'success', message: 'Your vote has been recorded.' });
    } catch (requestError) {
      setNotice({ tone: 'error', message: requestError.message || 'Unable to register the vote right now.' });
    }
  }

  return (
    <PublicShell>
      <div className="space-y-5">
        {notice.message ? <MessageBanner tone={notice.tone} message={notice.message} /> : null}
        {error ? <MessageBanner tone="error" message={error.message || 'Unable to load career discussions.'} /> : null}

        <ComposerModal
          form={composerForm}
          isSubmitting={isSubmitting}
          mode={composerMode}
          onChange={handleComposerChange}
          onClose={() => setComposerMode(null)}
          onSubmit={handleComposerSubmit}
          questions={questions}
        />

        <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,760px)]">
          <div className="space-y-5 xl:sticky xl:top-[6.3rem] xl:h-max">
            <SectionCard className="oq-card-no-hover !p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text)]">Topics</h2>
              {feed.topics.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {feed.topics.map((topic) => (
                    <span key={topic.tag || topic.name} className="oq-chip cursor-pointer !px-2.5 !py-1.5 !text-[0.65rem] transition-transform hover:scale-105">{topic.tag || topic.name} | {topic.count}</span>
                  ))}
                </div>
              ) : (
                <EmptyState align="left" eyebrow="Topics" title="No active topics yet" description="Topic counts will appear here once career discussions include tagged topics." />
              )}
            </SectionCard>
          </div>

          <div className="space-y-4">
            <CommunityComposer onOpen={openComposer} viewer={viewer} />

            {isLoading ? (
              <SectionCard>
                <LoadingState compact description="Loading career questions, insights, discussions, and polls." label="Community discussion" title="Loading career discussions" />
              </SectionCard>
            ) : feed.posts.length ? (
              <div className="space-y-4">
                {feed.posts.map((item) => (
                  <CommunityCard
                    key={`${item.content_type}-${item.id}`}
                    commentDraft={commentDrafts[item.id]}
                    item={item}
                    onAnswer={(questionId) => openComposer('answer', questionId)}
                    onCommentChange={(itemId, value) => setCommentDrafts((current) => ({ ...current, [itemId]: value }))}
                    onCommentSubmit={handleComment}
                    onPollVote={handlePollVote}
                    onReaction={handleReaction}
                    viewer={viewer}
                  />
                ))}
              </div>
            ) : (
              <SectionCard>
                <EmptyState
                  eyebrow="Career discussions"
                  title="No career discussions yet"
                  description="Career questions, practical insights, public-opinion polls, and useful discussions will appear here."
                  action={!viewer.role ? <Link className="oq-button-primary" href="?auth=login&next=/community">Candidate Login</Link> : null}
                />
              </SectionCard>
            )}
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
