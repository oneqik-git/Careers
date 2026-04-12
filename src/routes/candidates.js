const express = require('express');
const { query, queryOne } = require('../../config/database');
const { auth, requireCandidate, requireEmployer } = require('../middleware/auth');
const { calculateAndSave, ensureCareerScore } = require('../services/careerScore');
const { v4: uuid } = require('uuid');
const { asyncHandler, buildPaginationMeta, getPagination, sendError, sendSuccess } = require('../utils/api');
const {
  normalizeCandidate,
  normalizeCareerScore,
  normalizeWorkExperience,
  parseJsonArray,
  splitCsv,
} = require('../utils/normalize');

const router = express.Router();

// GET /api/candidates/me
router.get('/me', auth, requireCandidate, asyncHandler(async (req, res) => {
  const candidate = await queryOne('SELECT * FROM candidates WHERE user_id = ?', [req.user.id]);

  if (!candidate) {
    return sendError(res, {
      status: 404,
      code: 'CANDIDATE_NOT_FOUND',
      message: 'Candidate profile not found',
    });
  }

  const [score, experiences, documents, certs, scoreHistory] = await Promise.all([
    ensureCareerScore(candidate.id),
    query(`SELECT we.*,
      (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', a.id, 'title', a.title, 'description', a.description,
        'is_employer_verified', a.is_employer_verified, 'verified_at', a.verified_at, 'is_editable', a.is_editable))
       FROM achievements a WHERE a.experience_id = we.id) as achievements,
      (SELECT JSON_ARRAYAGG(JSON_OBJECT('period_start', pr.period_start, 'target_pct', pr.target_pct,
        'attendance_pct', pr.attendance_pct, 'employer_rating', pr.employer_rating))
       FROM performance_records pr WHERE pr.experience_id = we.id) as performance
      FROM work_experiences we WHERE we.candidate_id = ? ORDER BY we.start_date DESC`,
      [candidate.id]),
    query('SELECT * FROM digilocker_documents WHERE candidate_id = ? ORDER BY created_at DESC', [candidate.id]),
    query('SELECT * FROM course_enrollments ce JOIN courses c ON ce.course_id = c.id WHERE ce.candidate_id = ? AND ce.status = "completed"', [candidate.id]),
    query('SELECT * FROM score_events WHERE candidate_id = ? ORDER BY created_at DESC LIMIT 10', [candidate.id]),
  ]);

  return sendSuccess(res, {
    data: {
      ...normalizeCandidate(candidate),
      score: normalizeCareerScore(score),
      experiences: experiences.map(normalizeWorkExperience),
      documents,
      certifications: certs,
      score_history: scoreHistory,
    },
  });
}));

// PATCH /api/candidates/me
router.patch('/me', auth, requireCandidate, asyncHandler(async (req, res) => {
  const candidate = await queryOne('SELECT id FROM candidates WHERE user_id = ?', [req.user.id]);

  if (!candidate) {
    return sendError(res, {
      status: 404,
      code: 'CANDIDATE_NOT_FOUND',
      message: 'Candidate profile not found',
    });
  }

  const allowed = [
    'full_name', 'headline', 'summary', 'location', 'city', 'state',
    'current_role', 'current_company', 'domains', 'preferred_locations',
    'expected_salary_min', 'expected_salary_max', 'notice_period_days', 'open_to_work',
  ];

  const updates = [];
  const params = [];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates.push(`${key} = ?`);
      params.push(Array.isArray(req.body[key]) ? JSON.stringify(req.body[key]) : req.body[key]);
    }
  }

  if (!updates.length) {
    return sendError(res, {
      status: 400,
      code: 'NO_PROFILE_CHANGES',
      message: 'Nothing to update',
    });
  }

  params.push(candidate.id);
  await query(`UPDATE candidates SET ${updates.join(', ')} WHERE id = ?`, params);

  const score = await calculateAndSave(candidate.id);

  return sendSuccess(res, {
    data: {
      candidate_id: candidate.id,
      score: normalizeCareerScore(score),
    },
  });
}));

// POST /api/candidates/me/experience
router.post('/me/experience', auth, requireCandidate, asyncHandler(async (req, res) => {
  const candidate = await queryOne('SELECT id FROM candidates WHERE user_id = ?', [req.user.id]);

  if (!candidate) {
    return sendError(res, {
      status: 404,
      code: 'CANDIDATE_NOT_FOUND',
      message: 'Candidate profile not found',
    });
  }

  const { company_name, job_title, department, start_date, end_date, is_current, description } = req.body;

  if (!company_name || !job_title || !start_date) {
    return sendError(res, {
      status: 400,
      code: 'EXPERIENCE_FIELDS_REQUIRED',
      message: 'company_name, job_title, and start_date are required',
    });
  }

  const expId = uuid();
  await query(
    `INSERT INTO work_experiences (id, candidate_id, company_name, job_title, department, start_date, end_date, is_current, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [expId, candidate.id, company_name, job_title, department || null, start_date,
      end_date || null, is_current || false, description || null]
  );

  return sendSuccess(res, {
    status: 201,
    data: { experience_id: expId },
    legacy: { experience_id: expId },
  });
}));

// POST /api/candidates/me/experience/:expId/achievement
router.post('/me/experience/:expId/achievement', auth, requireCandidate, asyncHandler(async (req, res) => {
  const candidate = await queryOne('SELECT id FROM candidates WHERE user_id = ?', [req.user.id]);

  if (!candidate) {
    return sendError(res, {
      status: 404,
      code: 'CANDIDATE_NOT_FOUND',
      message: 'Candidate profile not found',
    });
  }

  const exp = await queryOne('SELECT id FROM work_experiences WHERE id = ? AND candidate_id = ?', [req.params.expId, candidate.id]);
  if (!exp) {
    return sendError(res, {
      status: 404,
      code: 'EXPERIENCE_NOT_FOUND',
      message: 'Work experience not found',
    });
  }

  if (!req.body.title || String(req.body.title).trim().length < 2) {
    return sendError(res, {
      status: 400,
      code: 'ACHIEVEMENT_TITLE_REQUIRED',
      message: 'Achievement title is required',
    });
  }

  const achId = uuid();
  await query(
    'INSERT INTO achievements (id, experience_id, candidate_id, title, description) VALUES (?, ?, ?, ?, ?)',
    [achId, req.params.expId, candidate.id, req.body.title, req.body.description || null]
  );

  return sendSuccess(res, {
    status: 201,
    message: 'Achievement added. You can request employer verification.',
    data: {
      achievement_id: achId,
      experience_id: req.params.expId,
    },
    legacy: { achievement_id: achId },
  });
}));

// POST /api/candidates/me/experience/:expId/request-verification
router.post('/me/experience/:expId/request-verification', auth, requireCandidate, asyncHandler(async (req, res) => {
  const candidate = await queryOne('SELECT id, full_name FROM candidates WHERE user_id = ?', [req.user.id]);

  if (!candidate) {
    return sendError(res, {
      status: 404,
      code: 'CANDIDATE_NOT_FOUND',
      message: 'Candidate profile not found',
    });
  }

  const exp = await queryOne(
    'SELECT we.*, c.id as company_id FROM work_experiences we LEFT JOIN companies c ON we.company_id = c.id WHERE we.id = ? AND we.candidate_id = ?',
    [req.params.expId, candidate.id]
  );

  if (!exp) {
    return sendError(res, {
      status: 404,
      code: 'EXPERIENCE_NOT_FOUND',
      message: 'Work experience not found',
    });
  }

  if (!exp.company_id) {
    return sendError(res, {
      status: 400,
      code: 'COMPANY_NOT_LINKED',
      message: 'Company not on Careers yet. Share the platform with them first.',
    });
  }

  const empAdmin = await queryOne('SELECT user_id FROM employers WHERE company_id = ? AND is_admin = 1', [exp.company_id]);
  if (empAdmin) {
    await query(
      `INSERT INTO notifications (id, user_id, type, title, body, reference_id, reference_type)
       VALUES (?, ?, 'verification_request', ?, ?, ?, 'work_experience')`,
      [uuid(), empAdmin.user_id,
        `${candidate.full_name} requested experience verification`,
        `${candidate.full_name} is requesting verification for their role at your company`,
        req.params.expId]
    );
  }

  return sendSuccess(res, {
    message: 'Verification request sent to employer',
    data: { experience_id: req.params.expId },
  });
}));

// GET /api/candidates/search
router.get('/search', auth, requireEmployer, asyncHandler(async (req, res) => {
  const { q, domain, min_score, max_score, career_stage, location, experience_min, experience_max } = req.query;
  const { page, limit, offset } = getPagination(req.query);

  let sql = `SELECT c.id, c.full_name, c.headline, c.current_role, c.location, c.total_experience_months,
    c.domains, c.career_stage, c.open_to_work,
    cs.total_score, cs.band, cs.offer_reliability_pct
    FROM candidates c
    LEFT JOIN career_scores cs ON c.id = cs.candidate_id
    WHERE c.open_to_work = 1`;
  const params = [];

  if (q) {
    sql += ' AND (c.full_name LIKE ? OR c.headline LIKE ? OR c.current_role LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (domain) {
    sql += ' AND JSON_CONTAINS(c.domains, ?)';
    params.push(JSON.stringify(domain));
  }
  if (min_score) {
    sql += ' AND cs.total_score >= ?';
    params.push(min_score);
  }
  if (max_score) {
    sql += ' AND cs.total_score <= ?';
    params.push(max_score);
  }
  if (career_stage) {
    sql += ' AND c.career_stage = ?';
    params.push(career_stage);
  }
  if (location) {
    sql += ' AND c.city LIKE ?';
    params.push(`%${location}%`);
  }
  if (experience_min) {
    sql += ' AND c.total_experience_months >= ?';
    params.push(experience_min * 12);
  }
  if (experience_max) {
    sql += ' AND c.total_experience_months <= ?';
    params.push(experience_max * 12);
  }

  sql += ` ORDER BY cs.total_score DESC LIMIT ${limit} OFFSET ${offset}`;

  const results = await query(sql, params);
  const items = results.map(normalizeCandidate);

  return sendSuccess(res, {
    data: items,
    meta: buildPaginationMeta({ page, limit, count: items.length }),
    legacy: { page, limit },
  });
}));

// GET /api/candidates/:id
router.get('/:id', auth, requireEmployer, asyncHandler(async (req, res) => {
  const candidateExists = await queryOne('SELECT id FROM candidates WHERE id = ?', [req.params.id]);
  if (!candidateExists) {
    return sendError(res, {
      status: 404,
      code: 'CANDIDATE_NOT_FOUND',
      message: 'Candidate profile not found',
    });
  }

  await ensureCareerScore(req.params.id);

  const candidate = await queryOne(
    `SELECT c.id, c.full_name, c.headline, c.location, c.current_role, c.current_company,
     c.total_experience_months, c.domains, c.career_stage, c.generation,
     cs.total_score, cs.band, cs.offer_reliability_pct, cs.no_show_count, cs.ghosting_count, cs.avg_employer_rating
     FROM candidates c
     LEFT JOIN career_scores cs ON c.id = cs.candidate_id
     WHERE c.id = ?`,
    [req.params.id]
  );

  const [experiences, skillScores, employer] = await Promise.all([
    query(
      `SELECT company_name, job_title, department, start_date, end_date, is_current, is_employer_verified,
       (SELECT JSON_ARRAYAGG(JSON_OBJECT('title', a.title, 'is_employer_verified', a.is_employer_verified))
        FROM achievements a WHERE a.experience_id = we.id AND a.is_employer_verified = 1) as verified_achievements,
       (SELECT AVG(target_pct) FROM performance_records WHERE experience_id = we.id) as avg_target_pct
       FROM work_experiences we WHERE candidate_id = ? ORDER BY start_date DESC`,
      [req.params.id]
    ),
    query('SELECT * FROM skill_assessments WHERE candidate_id = ? ORDER BY score DESC LIMIT 5', [req.params.id]),
    queryOne('SELECT company_id FROM employers WHERE user_id = ?', [req.user.id]),
  ]);

  if (!employer) {
    return sendError(res, {
      status: 404,
      code: 'EMPLOYER_NOT_FOUND',
      message: 'Employer profile not found',
    });
  }

  const appsToUs = await queryOne(
    `SELECT COUNT(*) as count, GROUP_CONCAT(jp.title SEPARATOR ', ') as roles
     FROM job_applications ja JOIN job_postings jp ON ja.job_id = jp.id
     WHERE ja.candidate_id = ? AND jp.company_id = ?`,
    [req.params.id, employer.company_id]
  );

  return sendSuccess(res, {
    data: {
      ...normalizeCandidate(candidate),
      experiences: experiences.map((experience) => ({
        ...experience,
        verified_achievements: parseJsonArray(experience.verified_achievements),
      })),
      skill_scores: skillScores,
      applications_to_this_company: {
        ...appsToUs,
        role_titles: splitCsv(appsToUs?.roles),
      },
    },
  });
}));

module.exports = router;
