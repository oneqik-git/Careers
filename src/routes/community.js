const express = require('express');
const { body, param } = require('express-validator');
const { v4: uuid } = require('uuid');
const { query, queryOne, transaction } = require('../../config/database');
const { auth, optionalAuth } = require('../middleware/auth');
const {
  asyncHandler,
  handleValidationErrors,
  sendError,
  sendSuccess,
} = require('../utils/api');
const { parseJsonArray } = require('../utils/normalize');

const router = express.Router();

const POST_TARGET_TYPES = new Set(['post', 'question', 'poll']);
const REACTION_TARGET_TYPES = new Set(['post', 'question', 'poll', 'answer', 'comment']);
const POST_TYPES_FOR_DISPLAY = new Set(['blog', 'story', 'tip', 'post']);

function getAuthorLabel(row) {
  if (row.is_anonymous) {
    return row.alias || (row.author_role === 'employer' ? 'Hiring team member' : 'Career community member');
  }

  if (row.author_role === 'employer') {
    const designation = row.employer_designation ? `, ${row.employer_designation}` : '';
    const company = row.company_name ? ` at ${row.company_name}` : '';
    return `${row.employer_name || 'Employer'}${designation}${company}`;
  }

  const experienceYears = row.total_experience_months
    ? ` - ${Math.max(1, Math.round(row.total_experience_months / 12))} yrs`
    : '';
  const role = row.current_role ? ` - ${row.current_role}` : '';
  return `${row.candidate_name || 'Candidate'}${role}${experienceYears}`;
}

function getCommunityAuthorRole(user) {
  if (user?.role === 'candidate' || user?.role === 'employer') {
    return user.role;
  }

  return null;
}

function toSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
}

function normalizeTags(value) {
  const raw = Array.isArray(value)
    ? value
    : String(value || '')
      .split(',')
      .map((tag) => tag.trim());

  const seen = new Set();
  return raw
    .map((tag) => String(tag || '').trim())
    .filter(Boolean)
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

function normalizePostType(postType) {
  return POST_TYPES_FOR_DISPLAY.has(postType) ? 'post' : postType;
}

function normalizeTargetType(targetType) {
  if (targetType === 'question' || targetType === 'poll') {
    return 'post';
  }

  return targetType;
}

function nestComments(commentRows) {
  const commentMap = new Map();
  const roots = [];

  commentRows.forEach((comment) => {
    const normalized = {
      ...comment,
      target_type: comment.answer_id ? 'answer' : 'post',
      replies: [],
      author_label: getAuthorLabel(comment),
    };
    commentMap.set(comment.id, normalized);
  });

  commentRows.forEach((comment) => {
    const normalized = commentMap.get(comment.id);
    if (comment.parent_comment_id && commentMap.has(comment.parent_comment_id)) {
      commentMap.get(comment.parent_comment_id).replies.push(normalized);
      return;
    }

    roots.push(normalized);
  });

  return roots;
}

async function syncPostTopics(conn, postId, tags) {
  if (!tags.length) {
    return;
  }

  for (const name of tags) {
    const slug = toSlug(name);
    if (!slug) {
      continue;
    }

    await conn.execute(
      `INSERT INTO community_topics (id, name, slug)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [uuid(), name, slug]
    );

    const [topicRows] = await conn.execute('SELECT id FROM community_topics WHERE slug = ?', [slug]);
    const topicId = topicRows[0]?.id;
    if (!topicId) {
      continue;
    }

    await conn.execute(
      `INSERT IGNORE INTO community_post_topics (post_id, topic_id)
       VALUES (?, ?)`,
      [postId, topicId]
    );
  }
}

async function getPostTarget(targetId) {
  return queryOne(
    `SELECT id, post_type, upvote_count, comment_count
     FROM community_posts
     WHERE id = ? AND status = 'approved'`,
    [targetId]
  );
}

async function getAnswerTarget(targetId) {
  return queryOne(
    `SELECT ca.id, ca.question_id, ca.upvote_count, ca.comment_count
     FROM community_answers ca
     INNER JOIN community_posts cp ON cp.id = ca.question_id
     WHERE ca.id = ?
       AND ca.status = 'approved'
       AND cp.status = 'approved'`,
    [targetId]
  );
}

async function getCommentTarget(targetId) {
  return queryOne(
    `SELECT id, post_id, answer_id, upvote_count
     FROM community_comments
     WHERE id = ? AND status = 'approved'`,
    [targetId]
  );
}

function validatePostTargetType(targetType, post) {
  if (!post) {
    return false;
  }

  if (targetType === 'post') {
    return true;
  }

  return post.post_type === targetType;
}

async function buildFeed(req) {
  const filters = [];
  const params = [];

  if (req.query.type) {
    if (req.query.type === 'post') {
      filters.push("cp.post_type IN ('post','blog','story','tip')");
    } else {
      filters.push('cp.post_type = ?');
      params.push(req.query.type);
    }
  }

  if (req.query.tag) {
    filters.push('JSON_CONTAINS(cp.domain_tags, ?)');
    params.push(JSON.stringify(req.query.tag));
  }

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 24, 1), 60);
  const postLimit = limit;
  const answerLimit = limit;

  const posts = await query(
    `SELECT cp.*,
      COALESCE(answer_counts.answer_count, 0) AS answer_count,
      c.full_name AS candidate_name,
      c.\`current_role\` AS \`current_role\`,
      c.total_experience_months,
      e.full_name AS employer_name,
      e.designation AS employer_designation,
      co.name AS company_name
     FROM community_posts cp
     LEFT JOIN (
       SELECT question_id, COUNT(*) AS answer_count
       FROM community_answers
       WHERE status = 'approved'
       GROUP BY question_id
     ) answer_counts ON answer_counts.question_id = cp.id
     LEFT JOIN candidates c
       ON cp.author_role = 'candidate' AND c.user_id = cp.author_id
     LEFT JOIN employers e
       ON cp.author_role = 'employer' AND e.user_id = cp.author_id
     LEFT JOIN companies co
       ON e.company_id = co.id
     WHERE cp.status = 'approved'
     ${filters.length ? `AND ${filters.join(' AND ')}` : ''}
     ORDER BY cp.created_at DESC
     LIMIT ${postLimit}`,
    params
  );

  const answers = await query(
    `SELECT ca.*,
      cp.title AS question_title,
      cp.content AS question_body,
      cp.domain_tags AS question_domain_tags,
      c.full_name AS candidate_name,
      c.\`current_role\` AS \`current_role\`,
      c.total_experience_months,
      e.full_name AS employer_name,
      e.designation AS employer_designation,
      co.name AS company_name
     FROM community_answers ca
     INNER JOIN community_posts cp
       ON cp.id = ca.question_id AND cp.status = 'approved'
     LEFT JOIN candidates c
       ON ca.author_role = 'candidate' AND c.user_id = ca.author_id
     LEFT JOIN employers e
       ON ca.author_role = 'employer' AND e.user_id = ca.author_id
     LEFT JOIN companies co
       ON e.company_id = co.id
     WHERE ca.status = 'approved'
     ORDER BY ca.created_at DESC
     LIMIT ${answerLimit}`
  );

  const postIds = posts.map((post) => post.id);
  const questionIds = posts.filter((post) => post.post_type === 'question').map((post) => post.id);
  const answerIds = answers.map((answer) => answer.id);
  const userId = req.user?.id || null;

  const questionAnswerRows = questionIds.length
    ? await query(
      `SELECT ca.*,
        c.full_name AS candidate_name,
        c.\`current_role\` AS \`current_role\`,
        c.total_experience_months,
        e.full_name AS employer_name,
        e.designation AS employer_designation,
        co.name AS company_name
       FROM community_answers ca
       LEFT JOIN candidates c
         ON ca.author_role = 'candidate' AND c.user_id = ca.author_id
       LEFT JOIN employers e
         ON ca.author_role = 'employer' AND e.user_id = ca.author_id
       LEFT JOIN companies co
         ON e.company_id = co.id
       WHERE ca.status = 'approved'
         AND ca.question_id IN (${questionIds.map(() => '?').join(',')})
       ORDER BY ca.created_at ASC`,
      questionIds
    )
    : [];

  questionAnswerRows.forEach((answer) => {
    if (!answerIds.includes(answer.id)) {
      answerIds.push(answer.id);
    }
  });

  const [postCommentRows, answerCommentRows, pollOptions, viewerPostVotes, viewerPollVotes, viewerReactions, topicRows] = await Promise.all([
    postIds.length
      ? query(
        `SELECT cc.*,
          c.full_name AS candidate_name,
          c.\`current_role\` AS \`current_role\`,
          c.total_experience_months,
          e.full_name AS employer_name,
          e.designation AS employer_designation,
          co.name AS company_name
         FROM community_comments cc
         LEFT JOIN candidates c
           ON cc.author_role = 'candidate' AND c.user_id = cc.author_id
         LEFT JOIN employers e
           ON cc.author_role = 'employer' AND e.user_id = cc.author_id
         LEFT JOIN companies co
           ON e.company_id = co.id
         WHERE cc.status = 'approved'
           AND cc.answer_id IS NULL
           AND cc.post_id IN (${postIds.map(() => '?').join(',')})
         ORDER BY cc.created_at ASC`,
        postIds
      )
      : Promise.resolve([]),
    answerIds.length
      ? query(
        `SELECT cc.*,
          c.full_name AS candidate_name,
          c.\`current_role\` AS \`current_role\`,
          c.total_experience_months,
          e.full_name AS employer_name,
          e.designation AS employer_designation,
          co.name AS company_name
         FROM community_comments cc
         LEFT JOIN candidates c
           ON cc.author_role = 'candidate' AND c.user_id = cc.author_id
         LEFT JOIN employers e
           ON cc.author_role = 'employer' AND e.user_id = cc.author_id
         LEFT JOIN companies co
           ON e.company_id = co.id
         WHERE cc.status = 'approved'
           AND cc.answer_id IN (${answerIds.map(() => '?').join(',')})
         ORDER BY cc.created_at ASC`,
        answerIds
      )
      : Promise.resolve([]),
    postIds.length
      ? query(
        `SELECT * FROM community_poll_options
         WHERE post_id IN (${postIds.map(() => '?').join(',')})
         ORDER BY post_id ASC, display_order ASC`,
        postIds
      )
      : Promise.resolve([]),
    userId && postIds.length
      ? query(
        `SELECT post_id
         FROM community_post_votes
         WHERE user_id = ? AND post_id IN (${postIds.map(() => '?').join(',')})`,
        [userId, ...postIds]
      )
      : Promise.resolve([]),
    userId && postIds.length
      ? query(
        `SELECT post_id, option_id
         FROM community_poll_votes
         WHERE user_id = ? AND post_id IN (${postIds.map(() => '?').join(',')})`,
        [userId, ...postIds]
      )
      : Promise.resolve([]),
    userId && (postIds.length || answerIds.length)
      ? query(
        `SELECT target_type, target_id
         FROM community_reactions
         WHERE user_id = ?
           AND reaction_type = 'upvote'
           AND (
            ${postIds.length ? `(target_type = 'post' AND target_id IN (${postIds.map(() => '?').join(',')}))` : 'FALSE'}
            ${postIds.length && answerIds.length ? ' OR ' : ''}
            ${answerIds.length ? `(target_type = 'answer' AND target_id IN (${answerIds.map(() => '?').join(',')}))` : 'FALSE'}
           )`,
        [userId, ...postIds, ...answerIds]
      )
      : Promise.resolve([]),
    postIds.length
      ? query(
        `SELECT cpt.post_id, ct.name
         FROM community_post_topics cpt
         INNER JOIN community_topics ct ON ct.id = cpt.topic_id
         WHERE cpt.post_id IN (${postIds.map(() => '?').join(',')})`,
        postIds
      )
      : Promise.resolve([]),
  ]);

  const commentsByPostId = postCommentRows.reduce((accumulator, comment) => {
    if (!accumulator[comment.post_id]) {
      accumulator[comment.post_id] = [];
    }
    accumulator[comment.post_id].push(comment);
    return accumulator;
  }, {});

  const commentsByAnswerId = answerCommentRows.reduce((accumulator, comment) => {
    if (!accumulator[comment.answer_id]) {
      accumulator[comment.answer_id] = [];
    }
    accumulator[comment.answer_id].push(comment);
    return accumulator;
  }, {});

  const pollOptionsByPostId = pollOptions.reduce((accumulator, option) => {
    if (!accumulator[option.post_id]) {
      accumulator[option.post_id] = [];
    }
    accumulator[option.post_id].push(option);
    return accumulator;
  }, {});

  const topicsByPostId = topicRows.reduce((accumulator, topic) => {
    if (!accumulator[topic.post_id]) {
      accumulator[topic.post_id] = [];
    }
    accumulator[topic.post_id].push(topic.name);
    return accumulator;
  }, {});

  const viewerVoteSet = new Set(viewerPostVotes.map((vote) => `post:${vote.post_id}`));
  viewerReactions.forEach((reaction) => viewerVoteSet.add(`${reaction.target_type}:${reaction.target_id}`));
  const viewerPollMap = new Map(viewerPollVotes.map((vote) => [vote.post_id, vote.option_id]));

  const answersByQuestionId = questionAnswerRows.reduce((accumulator, answer) => {
    if (!accumulator[answer.question_id]) {
      accumulator[answer.question_id] = [];
    }
    accumulator[answer.question_id].push({
      ...answer,
      content_type: 'answer',
      target_type: 'answer',
      author_label: getAuthorLabel(answer),
      body: answer.body,
      content: answer.body,
      viewer_has_upvoted: viewerVoteSet.has(`answer:${answer.id}`),
      comments: nestComments(commentsByAnswerId[answer.id] || []),
    });
    return accumulator;
  }, {});

  const tagCounts = new Map();
  const postItems = posts.map((post) => {
    const parsedTags = [...new Set([...parseJsonArray(post.domain_tags), ...(topicsByPostId[post.id] || [])])];
    parsedTags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1));

    return {
      ...post,
      content_type: normalizePostType(post.post_type),
      target_type: 'post',
      body: post.content,
      domain_tags: parsedTags,
      author_label: getAuthorLabel(post),
      viewer_has_upvoted: viewerVoteSet.has(`post:${post.id}`),
      viewer_poll_option_id: viewerPollMap.get(post.id) || null,
      comments: nestComments(commentsByPostId[post.id] || []),
      answers: answersByQuestionId[post.id] || [],
      poll_options: (pollOptionsByPostId[post.id] || []).map((option) => ({
        ...option,
        is_selected_by_viewer: viewerPollMap.get(post.id) === option.id,
      })),
    };
  });

  const answerItems = answers.map((answer) => {
    const parsedTags = parseJsonArray(answer.question_domain_tags);
    parsedTags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1));

    return {
      ...answer,
      content_type: 'answer',
      post_type: 'answer',
      target_type: 'answer',
      title: answer.question_title,
      body: answer.body,
      content: answer.body,
      domain_tags: parsedTags,
      author_label: getAuthorLabel(answer),
      viewer_has_upvoted: viewerVoteSet.has(`answer:${answer.id}`),
      comments: nestComments(commentsByAnswerId[answer.id] || []),
    };
  });

  const items = [...postItems, ...answerItems]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, limit);

  return {
    posts: items,
    questions: postItems.filter((post) => post.content_type === 'question'),
    topics: Array.from(tagCounts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 12)
      .map(([tag, count]) => ({ tag, name: tag, count })),
  };
}

router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const data = await buildFeed(req);

  return sendSuccess(res, {
    data,
    meta: {
      count: data.posts.length,
      viewer_role: req.user?.role || 'public',
    },
  });
}));

router.post('/questions', auth, [
  body('title').trim().isLength({ min: 10 }).withMessage('question must be at least 10 characters long'),
  body('details').optional({ nullable: true }).isString(),
  body('topics').optional({ nullable: true }),
], asyncHandler(async (req, res) => {
  if (handleValidationErrors(req, res)) {
    return;
  }

  const authorRole = getCommunityAuthorRole(req.user);
  if (!authorRole) {
    return sendError(res, { status: 403, code: 'COMMUNITY_ROLE_REQUIRED', message: 'Community posting requires a candidate or employer account' });
  }

  const title = req.body.title.trim();
  const details = String(req.body.details || '').trim();
  const tags = normalizeTags(req.body.topics || req.body.tags);
  const postId = uuid();

  await transaction(async (conn) => {
    await conn.execute(
      `INSERT INTO community_posts
        (id, author_id, author_role, post_type, title, content, domain_tags, is_anonymous, alias, status)
       VALUES (?, ?, ?, 'question', ?, ?, ?, 0, NULL, 'approved')`,
      [postId, req.user.id, authorRole, title, details || title, JSON.stringify(tags)]
    );
    await syncPostTopics(conn, postId, tags);
  });

  const post = await queryOne('SELECT * FROM community_posts WHERE id = ?', [postId]);
  return sendSuccess(res, { status: 201, data: post });
}));

router.post('/posts', auth, [
  body('body').trim().isLength({ min: 2 }).withMessage('post body is required'),
  body('title').optional({ nullable: true }).isString(),
  body('topics').optional({ nullable: true }),
], asyncHandler(async (req, res) => {
  if (handleValidationErrors(req, res)) {
    return;
  }

  const authorRole = getCommunityAuthorRole(req.user);
  if (!authorRole) {
    return sendError(res, { status: 403, code: 'COMMUNITY_ROLE_REQUIRED', message: 'Community posting requires a candidate or employer account' });
  }

  const title = String(req.body.title || '').trim() || null;
  const content = req.body.body.trim();
  const tags = normalizeTags(req.body.topics || req.body.tags);
  const postId = uuid();

  await transaction(async (conn) => {
    await conn.execute(
      `INSERT INTO community_posts
        (id, author_id, author_role, post_type, title, content, domain_tags, is_anonymous, alias, status)
       VALUES (?, ?, ?, 'post', ?, ?, ?, 0, NULL, 'approved')`,
      [postId, req.user.id, authorRole, title, content, JSON.stringify(tags)]
    );
    await syncPostTopics(conn, postId, tags);
  });

  const post = await queryOne('SELECT * FROM community_posts WHERE id = ?', [postId]);
  return sendSuccess(res, { status: 201, data: post });
}));

router.post('/questions/:questionId/answers', auth, [
  param('questionId').notEmpty().withMessage('questionId is required'),
  body('body').trim().isLength({ min: 2 }).withMessage('answer body is required'),
  body('supporting_link').optional({ nullable: true }).isURL().withMessage('supporting_link must be a valid URL'),
], asyncHandler(async (req, res) => {
  if (handleValidationErrors(req, res)) {
    return;
  }

  const authorRole = getCommunityAuthorRole(req.user);
  if (!authorRole) {
    return sendError(res, { status: 403, code: 'COMMUNITY_ROLE_REQUIRED', message: 'Community answering requires a candidate or employer account' });
  }

  const question = await queryOne(
    "SELECT id FROM community_posts WHERE id = ? AND post_type = 'question' AND status = 'approved'",
    [req.params.questionId]
  );
  if (!question) {
    return sendError(res, { status: 404, code: 'COMMUNITY_QUESTION_NOT_FOUND', message: 'Community question not found' });
  }

  const answerId = uuid();
  await query(
    `INSERT INTO community_answers
      (id, question_id, author_id, author_role, body, supporting_link, status)
     VALUES (?, ?, ?, ?, ?, ?, 'approved')`,
    [answerId, question.id, req.user.id, authorRole, req.body.body.trim(), req.body.supporting_link || null]
  );

  const answer = await queryOne('SELECT * FROM community_answers WHERE id = ?', [answerId]);
  return sendSuccess(res, { status: 201, data: answer });
}));

async function toggleReaction({ targetType, targetId, userId }) {
  const normalizedTargetType = normalizeTargetType(targetType);
  let target;
  let updateSql;
  let countSql;

  if (POST_TARGET_TYPES.has(targetType)) {
    target = await getPostTarget(targetId);
    if (!validatePostTargetType(targetType, target)) {
      return null;
    }
    updateSql = 'UPDATE community_posts SET upvote_count = GREATEST(0, upvote_count + ?) WHERE id = ?';
    countSql = 'SELECT upvote_count FROM community_posts WHERE id = ?';
  } else if (targetType === 'answer') {
    target = await getAnswerTarget(targetId);
    updateSql = 'UPDATE community_answers SET upvote_count = GREATEST(0, upvote_count + ?) WHERE id = ?';
    countSql = 'SELECT upvote_count FROM community_answers WHERE id = ?';
  } else if (targetType === 'comment') {
    target = await getCommentTarget(targetId);
    updateSql = 'UPDATE community_comments SET upvote_count = GREATEST(0, upvote_count + ?) WHERE id = ?';
    countSql = 'SELECT upvote_count FROM community_comments WHERE id = ?';
  }

  if (!target) {
    return null;
  }

  const existingReaction = await queryOne(
    `SELECT id FROM community_reactions
     WHERE target_type = ? AND target_id = ? AND user_id = ? AND reaction_type = 'upvote'`,
    [normalizedTargetType, targetId, userId]
  );

  let viewerHasUpvoted = true;
  await transaction(async (conn) => {
    if (existingReaction) {
      await conn.execute('DELETE FROM community_reactions WHERE id = ?', [existingReaction.id]);
      await conn.execute(updateSql, [-1, targetId]);
      viewerHasUpvoted = false;
      return;
    }

    await conn.execute(
      `INSERT INTO community_reactions (id, target_type, target_id, user_id, reaction_type)
       VALUES (?, ?, ?, ?, 'upvote')`,
      [uuid(), normalizedTargetType, targetId, userId]
    );
    await conn.execute(updateSql, [1, targetId]);
  });

  const nextTarget = await queryOne(countSql, [targetId]);
  return {
    target_type: normalizedTargetType,
    target_id: targetId,
    post_id: normalizedTargetType === 'post' ? targetId : undefined,
    viewer_has_upvoted: viewerHasUpvoted,
    upvote_count: nextTarget?.upvote_count || 0,
  };
}

router.post('/:targetType/:targetId/reactions', auth, [
  param('targetType').custom((value) => REACTION_TARGET_TYPES.has(value)).withMessage('targetType must be post, question, poll, answer, or comment'),
  param('targetId').notEmpty().withMessage('targetId is required'),
], asyncHandler(async (req, res) => {
  if (handleValidationErrors(req, res)) {
    return;
  }

  const result = await toggleReaction({
    targetType: req.params.targetType,
    targetId: req.params.targetId,
    userId: req.user.id,
  });

  if (!result) {
    return sendError(res, { status: 404, code: 'COMMUNITY_TARGET_NOT_FOUND', message: 'Community target not found' });
  }

  return sendSuccess(res, { data: result });
}));

router.post('/:postId/upvote', auth, asyncHandler(async (req, res) => {
  const result = await toggleReaction({
    targetType: 'post',
    targetId: req.params.postId,
    userId: req.user.id,
  });

  if (!result) {
    return sendError(res, { status: 404, code: 'COMMUNITY_POST_NOT_FOUND', message: 'Community post not found' });
  }

  return sendSuccess(res, { data: result });
}));

async function createComment({ targetType, targetId, user, content, parentCommentId }) {
  const authorRole = getCommunityAuthorRole(user);
  if (!authorRole) {
    return { error: { status: 403, code: 'COMMUNITY_ROLE_REQUIRED', message: 'Community commenting requires a candidate or employer account' } };
  }

  let postId = null;
  let answerId = null;
  let updateSql = null;
  let target = null;

  if (POST_TARGET_TYPES.has(targetType)) {
    target = await getPostTarget(targetId);
    if (!validatePostTargetType(targetType, target)) {
      target = null;
    }
    postId = target?.id || null;
    updateSql = 'UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = ?';
  } else if (targetType === 'answer') {
    target = await getAnswerTarget(targetId);
    answerId = target?.id || null;
    updateSql = 'UPDATE community_answers SET comment_count = comment_count + 1 WHERE id = ?';
  }

  if (!target) {
    return { error: { status: 404, code: 'COMMUNITY_TARGET_NOT_FOUND', message: 'Community target not found' } };
  }

  if (parentCommentId) {
    const parent = await queryOne(
      `SELECT id FROM community_comments
       WHERE id = ?
         AND ${answerId ? 'answer_id = ?' : 'post_id = ?'}`,
      [parentCommentId, answerId || postId]
    );

    if (!parent) {
      return { error: { status: 400, code: 'COMMUNITY_PARENT_COMMENT_INVALID', message: 'Parent comment does not belong to this target' } };
    }
  }

  const commentId = uuid();
  await transaction(async (conn) => {
    await conn.execute(
      `INSERT INTO community_comments
        (id, post_id, answer_id, author_id, author_role, parent_comment_id, content, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')`,
      [commentId, postId, answerId, user.id, authorRole, parentCommentId || null, content]
    );
    await conn.execute(updateSql, [answerId || postId]);
  });

  return {
    data: {
      comment_id: commentId,
      target_type: normalizeTargetType(targetType),
      target_id: answerId || postId,
      post_id: postId,
      answer_id: answerId,
    },
  };
}

router.post('/:targetType/:targetId/comments', auth, [
  param('targetType').custom((value) => POST_TARGET_TYPES.has(value) || value === 'answer').withMessage('targetType must be post, question, poll, or answer'),
  param('targetId').notEmpty().withMessage('targetId is required'),
  body('content').trim().isLength({ min: 2 }).withMessage('content must be at least 2 characters long'),
], asyncHandler(async (req, res) => {
  if (handleValidationErrors(req, res)) {
    return;
  }

  const result = await createComment({
    targetType: req.params.targetType,
    targetId: req.params.targetId,
    user: req.user,
    content: req.body.content.trim(),
    parentCommentId: req.body.parent_comment_id || null,
  });

  if (result.error) {
    return sendError(res, result.error);
  }

  return sendSuccess(res, { status: 201, data: result.data });
}));

router.post('/:postId/comments', auth, [
  body('content').trim().isLength({ min: 2 }).withMessage('content must be at least 2 characters long'),
], asyncHandler(async (req, res) => {
  if (handleValidationErrors(req, res)) {
    return;
  }

  const result = await createComment({
    targetType: 'post',
    targetId: req.params.postId,
    user: req.user,
    content: req.body.content.trim(),
    parentCommentId: req.body.parent_comment_id || null,
  });

  if (result.error) {
    return sendError(res, result.error);
  }

  return sendSuccess(res, { status: 201, data: result.data });
}));

router.post('/:postId/poll-vote', auth, [
  body('option_id').notEmpty().withMessage('option_id is required'),
], asyncHandler(async (req, res) => {
  if (handleValidationErrors(req, res)) {
    return;
  }

  const post = await queryOne(
    "SELECT id, post_type FROM community_posts WHERE id = ? AND status = 'approved'",
    [req.params.postId]
  );

  if (!post || post.post_type !== 'poll') {
    return sendError(res, {
      status: 404,
      code: 'COMMUNITY_POLL_NOT_FOUND',
      message: 'Community poll not found',
    });
  }

  const option = await queryOne(
    'SELECT id FROM community_poll_options WHERE id = ? AND post_id = ?',
    [req.body.option_id, post.id]
  );

  if (!option) {
    return sendError(res, {
      status: 400,
      code: 'COMMUNITY_POLL_OPTION_INVALID',
      message: 'Poll option does not belong to this poll',
    });
  }

  const existingVote = await queryOne(
    'SELECT id, option_id FROM community_poll_votes WHERE post_id = ? AND user_id = ?',
    [post.id, req.user.id]
  );

  if (existingVote?.option_id === option.id) {
    const options = await query(
      'SELECT id, option_text, vote_count, display_order FROM community_poll_options WHERE post_id = ? ORDER BY display_order',
      [post.id]
    );

    return sendSuccess(res, {
      data: {
        post_id: post.id,
        viewer_poll_option_id: option.id,
        poll_options: options,
      },
    });
  }

  await transaction(async (conn) => {
    if (existingVote) {
      await conn.execute('UPDATE community_poll_options SET vote_count = GREATEST(0, vote_count - 1) WHERE id = ?', [existingVote.option_id]);
      await conn.execute('UPDATE community_poll_votes SET option_id = ?, created_at = NOW() WHERE id = ?', [option.id, existingVote.id]);
    } else {
      await conn.execute(
        'INSERT INTO community_poll_votes (id, post_id, option_id, user_id) VALUES (?, ?, ?, ?)',
        [uuid(), post.id, option.id, req.user.id]
      );
    }

    await conn.execute('UPDATE community_poll_options SET vote_count = vote_count + 1 WHERE id = ?', [option.id]);
  });

  const options = await query(
    'SELECT id, option_text, vote_count, display_order FROM community_poll_options WHERE post_id = ? ORDER BY display_order',
    [post.id]
  );

  return sendSuccess(res, {
    data: {
      post_id: post.id,
      viewer_poll_option_id: option.id,
      poll_options: options,
    },
  });
}));

module.exports = router;
