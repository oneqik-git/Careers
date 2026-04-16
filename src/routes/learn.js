const express = require('express');
const { query, queryOne } = require('../../config/database');
const { optionalAuth } = require('../middleware/auth');
const { asyncHandler, sendSuccess } = require('../utils/api');

const router = express.Router();

function groupByCategory(courses) {
  const categories = new Map();

  courses.forEach((course) => {
    if (!categories.has(course.domain)) {
      categories.set(course.domain, {
        id: course.domain.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: course.domain,
        description: course.category_description,
        module_count: 0,
        lesson_count: 0,
        total_duration_mins: 0,
        themes: new Set(),
      });
    }

    const category = categories.get(course.domain);
    category.module_count += 1;
    category.lesson_count += course.lesson_count || 0;
    category.total_duration_mins += course.duration_mins || 0;

    if (course.sub_domain) {
      category.themes.add(course.sub_domain);
    }
  });

  return Array.from(categories.values()).map((category) => ({
    ...category,
    themes: Array.from(category.themes).slice(0, 6),
  }));
}

router.get('/overview', optionalAuth, asyncHandler(async (req, res) => {
  let candidateId = null;
  if (req.user?.role === 'candidate') {
    const candidate = await queryOne('SELECT id FROM candidates WHERE user_id = ?', [req.user.id]);
    candidateId = candidate?.id || null;
  }

  const courses = await query(
    `SELECT c.*,
      CASE c.domain
        WHEN 'Communication' THEN 'Sharpen how you speak, write, and handle difficult conversations in hiring and at work.'
        WHEN 'Interview Readiness' THEN 'Turn preparation into repeatable interview performance with structured stories and follow-through.'
        WHEN 'Sales Execution' THEN 'Improve pipeline discipline, discovery depth, and revenue conversation quality.'
        WHEN 'Business Acumen' THEN 'Build the judgment to understand teams, goals, metrics, and commercial trade-offs.'
        WHEN 'Profile Optimization' THEN 'Present your experience, strengths, and evidence with more clarity and credibility.'
        WHEN 'Leadership Basics' THEN 'Learn the operating habits that make early managers and team leads dependable.'
        ELSE 'Structured learning built for practical career progress.'
      END AS category_description,
      (SELECT COUNT(*) FROM course_modules cm WHERE cm.course_id = c.id) AS lesson_count
     FROM courses c
     WHERE c.status = 'published'
     ORDER BY c.domain ASC, c.level ASC, c.created_at DESC`
  );

  const courseIds = courses.map((course) => course.id);
  const [lessons, enrollments] = courseIds.length
    ? await Promise.all([
      query(
        `SELECT *
         FROM course_modules
         WHERE course_id IN (${courseIds.map(() => '?').join(',')})
         ORDER BY course_id ASC, display_order ASC`,
        courseIds
      ),
      candidateId
        ? query(
          `SELECT *
           FROM course_enrollments
           WHERE candidate_id = ? AND course_id IN (${courseIds.map(() => '?').join(',')})`,
          [candidateId, ...courseIds]
        )
        : Promise.resolve([]),
    ])
    : [[], []];

  const lessonsByCourseId = lessons.reduce((accumulator, lesson) => {
    if (!accumulator[lesson.course_id]) {
      accumulator[lesson.course_id] = [];
    }

    accumulator[lesson.course_id].push(lesson);
    return accumulator;
  }, {});

  const enrollmentByCourseId = Object.fromEntries(enrollments.map((enrollment) => [enrollment.course_id, enrollment]));

  const modules = courses.map((course) => ({
    ...course,
    lessons: (lessonsByCourseId[course.id] || []).map((lesson, index) => ({
      ...lesson,
      is_preview: index < 2,
    })),
    progress: enrollmentByCourseId[course.id] || null,
  }));

  const categories = groupByCategory(courses);
  const featuredModules = [...modules]
    .sort((left, right) => {
      const leftScore = (left.score_pts_reward || 0) + (left.xp_reward || 0);
      const rightScore = (right.score_pts_reward || 0) + (right.xp_reward || 0);
      return rightScore - leftScore;
    })
    .slice(0, 6);

  const viewerProgress = enrollments.length
    ? {
      enrolled: enrollments.length,
      in_progress: enrollments.filter((item) => item.status === 'in_progress').length,
      completed: enrollments.filter((item) => item.status === 'completed').length,
      total_score_pts_earned: enrollments.reduce((sum, item) => sum + Number(item.score_pts_earned || 0), 0),
      total_xp_earned: enrollments.reduce((sum, item) => sum + Number(item.xp_earned || 0), 0),
    }
    : null;

  return sendSuccess(res, {
    data: {
      categories,
      modules,
      featured_modules: featuredModules,
      viewer_progress: viewerProgress,
    },
    meta: {
      count: modules.length,
      viewer_role: req.user?.role || 'public',
    },
  });
}));

module.exports = router;
