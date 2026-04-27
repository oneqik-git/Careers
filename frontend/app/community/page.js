'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import EmptyState from '@/components/EmptyState';
import LoadingState from '@/components/LoadingState';
import MessageBanner from '@/components/MessageBanner';
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
  const [notice, setNotice] = useState({ tone: 'info', message: '' });
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

  async function handleUpvote(postId) {
    if (!viewer.role) {
      setNotice({ tone: 'info', message: 'Sign in as a candidate or employer to upvote and join the discussion.' });
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
      setNotice({ tone: 'success', message: result.viewer_has_upvoted ? 'Upvote added to the thread.' : 'Upvote removed from the thread.' });
    } catch (requestError) {
      setNotice({ tone: 'error', message: requestError.message || 'Unable to register your upvote right now.' });
    }
  }

  async function handleComment(postId) {
    const content = String(commentDrafts[postId] || '').trim();
    if (!content) {
      setNotice({ tone: 'warning', message: 'Write a comment before posting it.' });
      return;
    }

    if (!viewer.role) {
      setNotice({ tone: 'info', message: 'Sign in as a candidate or employer to add comments.' });
      return;
    }

    try {
      await createCommunityComment(postId, { content });
      setCommentDrafts((current) => ({ ...current, [postId]: '' }));
      setNotice({ tone: 'success', message: 'Comment added to the discussion.' });
      await loadFeed();
    } catch (requestError) {
      setNotice({ tone: 'error', message: requestError.message || 'Unable to add the comment right now.' });
    }
  }

  async function handlePollVote(postId, optionId) {
    if (!viewer.role) {
      setNotice({ tone: 'info', message: 'Sign in as a candidate or employer to vote in community polls.' });
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
      setNotice({ tone: 'success', message: 'Your vote has been recorded.' });
    } catch (requestError) {
      setNotice({ tone: 'error', message: requestError.message || 'Unable to register the vote right now.' });
    }
  }

  return (
    <PublicShell>
      <div className="space-y-8">
        {notice.message ? <MessageBanner tone={notice.tone} message={notice.message} /> : null}
        {error ? <MessageBanner tone="error" message={error.message || 'Unable to load community feed.'} /> : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <SectionCard
            title="Community Feed"
            description="A mix of posts, questions, polls, and practical notes so the feed feels useful from the first visit."
          >
            {isLoading ? (
              <LoadingState
                compact
                description="Loading posts, poll state, and comment threads."
                label="Community"
                title="Loading the feed"
              />
            ) : feed.posts.length ? (
              <div className="space-y-5">
                {feed.posts.map((post) => (
                  <article key={post.id} className="rounded-[1.6rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(4,14,32,0.5)] p-5 shadow-[0_18px_32px_rgba(0,0,0,0.16)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">{formatStatus(post.post_type)} | {post.author_label}</p>
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
                        {post.viewer_has_upvoted ? 'Upvoted' : 'Upvote'} | {post.upvote_count}
                      </button>
                      <span>{post.comment_count} comments</span>
                      <span>{formatDateTime(post.created_at)}</span>
                    </div>

                    <div className="mt-5 space-y-4">
                      <textarea
                        className="oq-textarea min-h-24"
                        onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))}
                        placeholder={viewer.role ? 'Add a thoughtful comment' : 'Sign in to comment'}
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
            ) : (
              <EmptyState
                eyebrow="Community feed"
                title="No posts are visible yet"
                description="Once the community feed has content, stories, questions, and polls will appear here."
                action={!viewer.role ? <Link className="oq-button-primary" href="/login">Candidate Login</Link> : null}
              />
            )}
          </SectionCard>

          <div className="space-y-6">
            <SectionCard title="Topics" description="Realistic themes help visitors understand what kind of discussion already exists.">
              {feed.topics.length ? (
                <div className="flex flex-wrap gap-2">
                  {feed.topics.map((topic) => (
                    <span key={topic.tag} className="oq-chip">{topic.tag} | {topic.count}</span>
                  ))}
                </div>
              ) : (
                <EmptyState
                  align="left"
                  eyebrow="Topics"
                  title="No active topics yet"
                  description="Topic counts will appear here once the community feed includes tagged posts."
                />
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
