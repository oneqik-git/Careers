const express = require('express');
const { body } = require('express-validator');
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
    ? ` · ${Math.max(1, Math.round(row.total_experience_months / 12))} yrs`
    : '';
  const role = row.current_role ? ` · ${row.current_role}` : '';
  return `${row.candidate_name || 'Candidate'}${role}${experienceYears}`;
}

function nestComments(commentRows) {
  const commentMap = new Map();
  const roots = [];

  commentRows.forEach((comment) => {
    const normalized = {
      ...comment,
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

async function buildFeed(req) {
  const filters = [];
  const params = [];

  if (req.query.type) {
    filters.push('cp.post_type = ?');
    params.push(req.query.type);
  }

  if (req.query.tag) {
    filters.push('JSON_CONTAINS(cp.domain_tags, ?)');
    params.push(JSON.stringify(req.query.tag));
  }

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 24, 1), 60);

  const posts = await query(
    `SELECT cp.*,
      c.full_name AS candidate_name,
      c.\`current_role\` AS current_role,
      c.total_experience_months,
      e.full_name AS employer_name,
      e.designation AS employer_designation,
      co.name AS company_name
     FROM community_posts cp
     LEFT JOIN candidates c
       ON cp.author_role = 'candidate' AND c.user_id = cp.author_id
     LEFT JOIN employers e
       ON cp.author_role = 'employer' AND e.user_id = cp.author_id
     LEFT JOIN companies co
       ON e.company_id = co.id
     WHERE cp.status = 'approved'
     ${filters.length ? `AND ${filters.join(' AND ')}` : ''}
     ORDER BY cp.created_at DESC
     LIMIT ${limit}`,
    params
  );

  const postIds = posts.map((post) => post.id);
  const userId = req.user?.id || null;

  const [commentRows, pollOptions, viewerVotes, viewerPollVotes] = postIds.length
    ? await Promise.all([
      query(
        `SELECT cc.*,
          c.full_name AS candidate_name,
          c.\`current_role\` AS current_role,
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
           AND cc.post_id IN (${postIds.map(() => '?').join(',')})
         ORDER BY cc.created_at ASC`,
        postIds
      ),
      query(
        `SELECT * FROM community_poll_options
         WHERE post_id IN (${postIds.map(() => '?').join(',')})
         ORDER BY post_id ASC, display_order ASC`,
        postIds
      ),
      userId
        ? query(
          `SELECT post_id
           FROM community_post_votes
           WHERE user_id = ? AND post_id IN (${postIds.map(() => '?').join(',')})`,
          [userId, ...postIds]
        )
        : Promise.resolve([]),
      userId
        ? query(
          `SELECT post_id, option_id
           FROM community_poll_votes
           WHERE user_id = ? AND post_id IN (${postIds.map(() => '?').join(',')})`,
          [userId, ...postIds]
        )
        : Promise.resolve([]),
    ])
    : [[], [], [], []];

  const commentsByPostId = commentRows.reduce((accumulator, comment) => {
    if (!accumulator[comment.post_id]) {
      accumulator[comment.post_id] = [];
    }

    accumulator[comment.post_id].push(comment);
    return accumulator;
  }, {});

  const pollOptionsByPostId = pollOptions.reduce((accumulator, option) => {
    if (!accumulator[option.post_id]) {
      accumulator[option.post_id] = [];
    }

    accumulator[option.post_id].push(option);
    return accumulator;
  }, {});

  const viewerVoteSet = new Set(viewerVotes.map((vote) => vote.post_id));
  const viewerPollMap = new Map(viewerPollVotes.map((vote) => [vote.post_id, vote.option_id]));

  const tags = new Map();
  const items = posts.map((post) => {
    const parsedTags = parseJsonArray(post.domain_tags);
    parsedTags.forEach((tag) => tags.set(tag, (tags.get(tag) || 0) + 1));

    return {
      ...post,
      domain_tags: parsedTags,
      author_label: getAuthorLabel(post),
      viewer_has_upvoted: viewerVoteSet.has(post.id),
      viewer_poll_option_id: viewerPollMap.get(post.id) || null,
      comments: nestComments(commentsByPostId[post.id] || []),
      poll_options: (pollOptionsByPostId[post.id] || []).map((option) => ({
        ...option,
        is_selected_by_viewer: viewerPollMap.get(post.id) === option.id,
      })),
    };
  });

  return {
    posts: items,
    topics: Array.from(tags.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 12)
      .map(([tag, count]) => ({ tag, count })),
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

router.post('/:postId/upvote', auth, asyncHandler(async (req, res) => {
  const post = await queryOne(
    'SELECT id, upvote_count FROM community_posts WHERE id = ? AND status = \'approved\'',
    [req.params.postId]
  );

  if (!post) {
    return sendError(res, {
      status: 404,
      code: 'COMMUNITY_POST_NOT_FOUND',
      message: 'Community post not found',
    });
  }

  const existingVote = await queryOne(
    'SELECT id FROM community_post_votes WHERE post_id = ? AND user_id = ? AND vote_type = \'upvote\'',
    [post.id, req.user.id]
  );

  if (existingVote) {
    await transaction(async (conn) => {
      await conn.execute('DELETE FROM community_post_votes WHERE id = ?', [existingVote.id]);
      await conn.execute(
        'UPDATE community_posts SET upvote_count = GREATEST(0, upvote_count - 1) WHERE id = ?',
        [post.id]
      );
    });

    const nextPost = await queryOne('SELECT upvote_count FROM community_posts WHERE id = ?', [post.id]);
    return sendSuccess(res, {
      data: {
        post_id: post.id,
        viewer_has_upvoted: false,
        upvote_count: nextPost?.upvote_count || 0,
      },
    });
  }

  await transaction(async (conn) => {
    await conn.execute(
      'INSERT INTO community_post_votes (id, post_id, user_id, vote_type) VALUES (?, ?, ?, \'upvote\')',
      [uuid(), post.id, req.user.id]
    );
    await conn.execute(
      'UPDATE community_posts SET upvote_count = upvote_count + 1 WHERE id = ?',
      [post.id]
    );
  });

  const nextPost = await queryOne('SELECT upvote_count FROM community_posts WHERE id = ?', [post.id]);
  return sendSuccess(res, {
    data: {
      post_id: post.id,
      viewer_has_upvoted: true,
      upvote_count: nextPost?.upvote_count || 0,
    },
  });
}));

router.post('/:postId/comments', auth, [
  body('content').isLength({ min: 2 }).withMessage('content must be at least 2 characters long'),
], asyncHandler(async (req, res) => {
  if (handleValidationErrors(req, res)) {
    return;
  }

  const post = await queryOne(
    'SELECT id FROM community_posts WHERE id = ? AND status = \'approved\'',
    [req.params.postId]
  );

  if (!post) {
    return sendError(res, {
      status: 404,
      code: 'COMMUNITY_POST_NOT_FOUND',
      message: 'Community post not found',
    });
  }

  const parentCommentId = req.body.parent_comment_id || null;
  if (parentCommentId) {
    const parent = await queryOne(
      'SELECT id FROM community_comments WHERE id = ? AND post_id = ?',
      [parentCommentId, post.id]
    );

    if (!parent) {
      return sendError(res, {
        status: 400,
        code: 'COMMUNITY_PARENT_COMMENT_INVALID',
        message: 'Parent comment does not belong to this post',
      });
    }
  }

  const commentId = uuid();
  await transaction(async (conn) => {
    await conn.execute(
      `INSERT INTO community_comments
        (id, post_id, author_id, author_role, parent_comment_id, content, status)
       VALUES (?, ?, ?, ?, ?, ?, 'approved')`,
      [commentId, post.id, req.user.id, req.user.role, parentCommentId, req.body.content.trim()]
    );
    await conn.execute(
      'UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = ?',
      [post.id]
    );
  });

  return sendSuccess(res, {
    status: 201,
    data: {
      comment_id: commentId,
      post_id: post.id,
    },
  });
}));

router.post('/:postId/poll-vote', auth, [
  body('option_id').notEmpty().withMessage('option_id is required'),
], asyncHandler(async (req, res) => {
  if (handleValidationErrors(req, res)) {
    return;
  }

  const post = await queryOne(
    'SELECT id, post_type FROM community_posts WHERE id = ? AND status = \'approved\'',
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
