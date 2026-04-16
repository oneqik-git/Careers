'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import MessageBanner from '@/components/MessageBanner';
import PageHero from '@/components/PageHero';
import PublicShell from '@/components/PublicShell';
import SectionCard from '@/components/SectionCard';
import {
  createCommunityComment,
  fetchCommunityFeed,
  submitCommunityPollVote,
  toggleCommunityUpvote,
} from '@/services/community';
import { getStoredRole, getStoredUser } from '@/utils/authStorage';
import { formatDateTime, formatStatus } from '@/utils/formatters';

function CommentThread({ comments = [] }) {
  if (!comments.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className="rounded-[1.2rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
          <p className="text-sm font-medium text-[var(--text)]">{comment.author_label}</p>
          <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{comment.content}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">{formatDateTime(comment.created_at)}</p>

          {comment.replies?.length ? (
            <div className="mt-4 border-l border-[rgba(93,224,230,0.14)] pl-4">
              <CommentThread comments={comment.replies} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function CommunityPage() {
  const [feed, setFeed] = useState({ posts: [], topics: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  const [commentDrafts, setCommentDrafts] = useState({});
  const [viewer, setViewer] = useState({ role: null, user: null });

  async function loadFeed() {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchCommunityFeed();
      setFeed(data || { posts: [], topics: [] });
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setViewer({
      role: getStoredRole(),
      user: getStoredUser(),
    });
    loadFeed();
  }, []);

  const postMix = useMemo(() => {
    return feed.posts.reduce((accumulator, post) => {
      accumulator[post.post_type] = (accumulator[post.post_type] || 0) + 1;
      return accumulator;
    }, {});
  }, [feed.posts]);

  async function handleUpvote(postId) {
    if (!viewer.role) {
      setNotice('Login as a candidate or employer to upvote and join the discussion.');
      return;
    }

    try {
      const result = await toggleCommunityUpvote(postId);
      setFeed((current) => ({
        ...current,
        posts: current.posts.map((post) => (
          post.id === postId
            ? { ...post, viewer_has_upvoted: result.viewer_has_upvoted, upvote_count: result.upvote_count }
            : post
        )),
      }));
      setNotice('');
    } catch (requestError) {
      setNotice(requestError.message || 'Unable to register your upvote right now.');
    }
  }

  async function handleComment(postId) {
    const content = String(commentDrafts[postId] || '').trim();
    if (!content) {
      return;
    }

    if (!viewer.role) {
      setNotice('Login as a candidate or employer to add comments.');
      return;
    }

    try {
      await createCommunityComment(postId, { content });
      setCommentDrafts((current) => ({ ...current, [postId]: '' }));
      setNotice('');
      await loadFeed();
    } catch (requestError) {
      setNotice(requestError.message || 'Unable to add the comment right now.');
    }
  }

  async function handlePollVote(postId, optionId) {
    if (!viewer.role) {
      setNotice('Login as a candidate or employer to vote in community polls.');
      return;
    }

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
      setNotice('');
    } catch (requestError) {
      setNotice(requestError.message || 'Unable to register the vote right now.');
    }
  }

  return (
    <PublicShell>
      <div className="space-y-8">
        <PageHero
          eyebrow="Community"
          title="Career conversations that already feel alive"
          description="Public visitors can browse the feed, questions, and polls. Logged-in candidates and employers can upvote, comment, and take part in the product conversation."
          badges={[
            `${feed.posts.length} seeded posts`,
            `${feed.topics.length} active topics`,
            viewer.user?.full_name ? `Signed in as ${viewer.user.full_name}` : 'Public browsing enabled',
          ]}
          actions={viewer.role ? [{ label: 'Go to Profile', href: viewer.role === 'candidate' ? '/candidate/profile' : '/employer/dashboard' }] : [{ label: 'Candidate Login', href: '/login' }, { label: 'Employer Login', href: '/employer/login', variant: 'secondary' }]}
          aside={
            <div className="space-y-4">
              <div className="rounded-[1.2rem] border border-[rgba(93,224,230,0.16)] bg-[rgba(93,224,230,0.06)] px-4 py-4">
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">Feed mix</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {['story', 'question', 'poll', 'tip'].map((type) => (
                    <div key={type}>
                      <p className="text-sm font-medium text-[var(--text)]">{formatStatus(type)}</p>
                      <p className="mt-1 text-sm text-[var(--text-soft)]">{postMix[type] || 0}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[1.2rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">Public behavior</p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">Browsing is open. Interaction moves from passive reading into visible product activity only after login.</p>
              </div>
            </div>
          }
        />

        {notice ? <MessageBanner tone="info" message={notice} /> : null}
        {error ? <MessageBanner tone="error" message={error.message || 'Unable to load community feed.'} /> : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <SectionCard
            title="Community Feed"
            description="A mix of posts, questions, polls, and practical notes so the feed is useful on first load instead of looking like an empty shell."
          >
            {isLoading ? (
              <p className="text-sm text-[var(--text-soft)]">Loading community feed...</p>
            ) : (
              <div className="space-y-5">
                {feed.posts.map((post) => (
                  <article key={post.id} className="rounded-[1.6rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(4,14,32,0.5)] p-5 shadow-[0_18px_32px_rgba(0,0,0,0.16)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">{formatStatus(post.post_type)} · {post.author_label}</p>
                        <h2 className="mt-2 text-[1.45rem] font-medium tracking-[-0.04em] text-[var(--text)]">{post.title}</h2>
                      </div>
                      <div className="rounded-full border border-[rgba(93,224,230,0.16)] px-3 py-2 text-xs uppercase tracking-[0.16em] text-[var(--secondary-1)]">
                        {post.view_count} views
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-8 text-[var(--text-soft)]">{post.content}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {(post.domain_tags || []).map((tag) => (
                        <span key={tag} className="oq-chip">{tag}</span>
                      ))}
                    </div>

                    {post.post_type === 'poll' && post.poll_options?.length ? (
                      <div className="mt-5 grid gap-3">
                        {post.poll_options.map((option) => (
                          <button
                            key={option.id}
                            className={`rounded-[1.1rem] border px-4 py-3 text-left text-sm transition ${post.viewer_poll_option_id === option.id ? 'border-[rgba(93,224,230,0.28)] bg-[rgba(93,224,230,0.12)] text-white' : 'border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.03)] text-[var(--text-soft)] hover:border-[rgba(93,224,230,0.18)] hover:text-white'}`.trim()}
                            onClick={() => handlePollVote(post.id, option.id)}
                            type="button"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <span>{option.option_text}</span>
                              <span className="text-xs uppercase tracking-[0.16em]">{option.vote_count} votes</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[var(--text-soft)]">
                      <button className="rounded-full border border-[rgba(29,40,56,0.9)] px-4 py-2 transition hover:border-[rgba(93,224,230,0.22)] hover:text-white" onClick={() => handleUpvote(post.id)} type="button">
                        {post.viewer_has_upvoted ? 'Upvoted' : 'Upvote'} · {post.upvote_count}
                      </button>
                      <span>{post.comment_count} comments</span>
                      <span>{formatDateTime(post.created_at)}</span>
                    </div>

                    <div className="mt-5 space-y-4">
                      <textarea
                        className="min-h-24 w-full rounded-[1.1rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[rgba(93,224,230,0.26)]"
                        onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))}
                        placeholder={viewer.role ? 'Add a thoughtful comment' : 'Login to add a comment'}
                        value={commentDrafts[post.id] || ''}
                      />
                      <button className="oq-button-secondary" onClick={() => handleComment(post.id)} type="button">
                        Add Comment
                      </button>
                    </div>

                    {post.comments?.length ? (
                      <div className="mt-5 border-t border-[rgba(93,224,230,0.12)] pt-5">
                        <CommentThread comments={post.comments} />
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </SectionCard>

          <div className="space-y-6">
            <SectionCard title="Topics" description="The feed is seeded with realistic themes so exploration feels guided from the start.">
              <div className="flex flex-wrap gap-2">
                {feed.topics.map((topic) => (
                  <span key={topic.tag} className="oq-chip">{topic.tag} · {topic.count}</span>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Interaction" description="Public readers can browse. Logged-in users turn the feed into visible activity.">
              <div className="space-y-3 text-sm leading-7 text-[var(--text-soft)]">
                <p>Upvotes, comments, and poll participation are enabled for signed-in candidates and employers.</p>
                <p>The seeded feed includes nested replies so conversation threads do not look empty on first load.</p>
                {!viewer.role ? (
                  <p>
                    <Link className="oq-link" href="/login">Candidate login</Link> or <Link className="oq-link" href="/employer/login">employer login</Link> unlocks interaction.
                  </p>
                ) : null}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
