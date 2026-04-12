const express = require('express');
const { body } = require('express-validator');
const { query, queryOne, transaction } = require('../../config/database');
const { auth, requireCandidate, requireEmployer } = require('../middleware/auth');
const { calculateAndSave, ensureCareerScore } = require('../services/careerScore');
const { v4: uuid } = require('uuid');
const {
  asyncHandler,
  buildPaginationMeta,
  getPagination,
  handleValidationErrors,
  sendError,
  sendSuccess,
} = require('../utils/api');
const { normalizeJob, splitCsv } = require('../utils/normalize');

const router = express.Router();

function normalizeAnswerType(questionType, answer) {
  if (questionType === 'video') {
    return answer.video_url ? 'video' : 'text';
  }

  return 'text';
}

// GET /api/jobs/form-meta
router.get('/form-meta', auth, requireEmployer, asyncHandler(async (req, res) => {
  const { department } = req.query;
  const domainMap = {
    'Sales & GTM': {
      functions: ['Inside Sales', 'Enterprise Sales', 'Channel Sales', 'Pre-Sales', 'Sales Ops', 'Customer Success', 'BD'],
      levels: ['Sales Trainee', 'BDE', 'Sr BDE', 'Team Lead', 'Manager', 'Sr Manager', 'AVP', 'VP', 'CRO'],
    },
    Technology: {
      functions: ['Frontend', 'Backend', 'Full-Stack', 'DevOps', 'Data Engineering', 'ML/AI', 'QA', 'Product Engineering', 'Security'],
      levels: ['Trainee', 'Analyst L1', 'Analyst L2', 'SDE I', 'SDE II', 'SDE III', 'Staff Eng', 'Principal', 'Architect', 'VP Eng', 'CTO'],
    },
    Product: {
      functions: ['Product Management', 'Product Design', 'UX Research', 'Product Analytics', 'Product Ops'],
      levels: ['APM', 'PM', 'Sr PM', 'Group PM', 'Director PM', 'VP Product', 'CPO'],
    },
    Marketing: {
      functions: ['Performance Marketing', 'Brand', 'Content', 'SEO/SEM', 'Social Media', 'Events', 'Growth', 'PR'],
      levels: ['Intern', 'Analyst', 'Sr Analyst', 'Manager', 'Sr Manager', 'Head', 'Director', 'VP', 'CMO'],
    },
    'Human Resources': {
      functions: ['Talent Acquisition', 'HRBP', 'L&D', 'Compensation & Benefits', 'HR Ops', 'Culture'],
      levels: ['HR Associate', 'HR Executive', 'Sr HR Executive', 'Manager', 'Sr Manager', 'HRBP Lead', 'Head HR', 'CHRO'],
    },
    Finance: {
      functions: ['FP&A', 'Accounting', 'Tax', 'Audit', 'Treasury', 'Investor Relations'],
      levels: ['Analyst', 'Sr Analyst', 'Associate', 'Manager', 'Sr Manager', 'Controller', 'Director', 'VP Finance', 'CFO'],
    },
    Operations: {
      functions: ['Process Ops', 'Quality', 'Logistics', 'Supply Chain', 'Customer Ops', 'Workforce Mgmt'],
      levels: ['Executive', 'Sr Executive', 'Team Lead', 'Asst Manager', 'Manager', 'Sr Manager', 'AVP', 'VP Ops', 'COO'],
    },
    'Customer Success': {
      functions: ['Onboarding', 'Renewals', 'Implementation', 'Support', 'CS Ops'],
      levels: ['Associate', 'Executive', 'Sr Executive', 'Manager', 'Sr Manager', 'Director CS', 'VP CS'],
    },
    'Legal & Compliance': {
      functions: ['Legal', 'Compliance', 'Risk', 'IP', 'Contracts'],
      levels: ['Analyst', 'Sr Analyst', 'Associate', 'Manager', 'Sr Counsel', 'Head Legal', 'CLO'],
    },
    'BPO/Contact Centre': {
      functions: ['Inbound', 'Outbound', 'Blended', 'Chat Support', 'Email Support', 'Quality Analyst', 'Training'],
      levels: ['Agent', 'Sr Agent', 'Team Lead', 'Asst Manager', 'Manager', 'Sr Manager', 'AVP', 'VP Ops'],
    },
  };

  if (department && domainMap[department]) {
    return sendSuccess(res, { data: domainMap[department] });
  }

  return sendSuccess(res, {
    data: { departments: Object.keys(domainMap) },
  });
}));

// POST /api/jobs
router.post('/', auth, requireEmployer, [
  body('title').isLength({ min: 3 }).withMessage('title must be at least 3 characters long'),
  body('department').notEmpty().withMessage('department is required'),
  body('description').isLength({ min: 50 }).withMessage('description must be at least 50 characters long'),
], asyncHandler(async (req, res) => {
  if (handleValidationErrors(req, res)) {
    return;
  }

  const employer = await queryOne('SELECT id, company_id FROM employers WHERE user_id = ?', [req.user.id]);
  if (!employer) {
    return sendError(res, {
      status: 404,
      code: 'EMPLOYER_NOT_FOUND',
      message: 'Employer profile not found',
    });
  }

  const {
    title, department, sub_department, job_function, level, seniority_label,
    employment_type, work_mode, location, salary_min, salary_max,
    salary_disclosed, experience_min_years, experience_max_years,
    min_career_score, required_skills, preferred_skills, education_requirement,
    description, responsibilities, benefits, openings, tat_hours,
    prescreening_questions = [],
  } = req.body;

  if (!Array.isArray(prescreening_questions)) {
    return sendError(res, {
      status: 400,
      code: 'PRESCREENING_QUESTIONS_INVALID',
      message: 'prescreening_questions must be an array',
    });
  }

  const invalidQuestion = prescreening_questions.find((question) =>
    !question?.question_text || String(question.question_text).trim().length < 3
  );
  if (invalidQuestion) {
    return sendError(res, {
      status: 400,
      code: 'PRESCREENING_QUESTION_INVALID',
      message: 'Each prescreening question must include question_text',
    });
  }

  try {
    const jobId = uuid();
    await transaction(async (conn) => {
      await conn.execute(
        `INSERT INTO job_postings
          (id, company_id, employer_id, title, department, sub_department, job_function, level,
           seniority_label, employment_type, work_mode, location, salary_min, salary_max,
           salary_disclosed, experience_min_years, experience_max_years, min_career_score,
           required_skills, preferred_skills, education_requirement, description,
           responsibilities, benefits, openings, tat_hours)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [jobId, employer.company_id, employer.id, title, department, sub_department || null,
          job_function || null, level || null, seniority_label || null,
          employment_type || 'full_time', work_mode || 'on_site', location || null,
          salary_min || null, salary_max || null, salary_disclosed !== false,
          experience_min_years || 0, experience_max_years || null,
          min_career_score || 0,
          JSON.stringify(required_skills || []), JSON.stringify(preferred_skills || []),
          education_requirement || 'any', description,
          responsibilities || null, benefits || null, openings || 1, tat_hours || 48]
      );

      for (let i = 0; i < prescreening_questions.length; i += 1) {
        const question = prescreening_questions[i];
        await conn.execute(
          `INSERT INTO prescreening_questions
            (id, job_id, question_text, question_type, is_required, max_duration_s, ideal_answer, display_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [uuid(), jobId, question.question_text, question.question_type || 'video',
            question.is_required !== false, question.max_duration_s || 90,
            question.ideal_answer || null, i + 1]
        );
      }
    });

    return sendSuccess(res, {
      status: 201,
      data: {
        job_id: jobId,
        prescreening_question_count: prescreening_questions.length,
      },
      legacy: { job_id: jobId },
    });
  } catch (err) {
    console.error(err);
    return sendError(res, {
      status: 500,
      code: 'JOB_CREATE_FAILED',
      message: 'Failed to create job posting',
    });
  }
}));

// GET /api/jobs/employer
router.get('/employer', auth, requireEmployer, asyncHandler(async (req, res) => {
  const employer = await queryOne('SELECT id, company_id FROM employers WHERE user_id = ?', [req.user.id]);
  if (!employer) {
    return sendError(res, {
      status: 404,
      code: 'EMPLOYER_NOT_FOUND',
      message: 'Employer profile not found',
    });
  }

  const { status, department } = req.query;
  const { page, limit, offset } = getPagination(req.query);

  let sql = `SELECT jp.*,
    (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = jp.id) as total_applications,
    (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = jp.id AND ja.status = 'shortlisted') as shortlisted,
    (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = jp.id AND ja.status = 'joined') as hired
    FROM job_postings jp WHERE jp.company_id = ?`;
  const params = [employer.company_id];

  if (status) {
    sql += ' AND jp.status = ?';
    params.push(status);
  }
  if (department) {
    sql += ' AND jp.department = ?';
    params.push(department);
  }
  sql += ` ORDER BY jp.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

  const jobs = await query(sql, params);
  const items = jobs.map(normalizeJob);

  return sendSuccess(res, {
    data: items,
    meta: buildPaginationMeta({ page, limit, count: items.length }),
    legacy: { page, limit },
  });
}));

// GET /api/jobs/:id
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const job = await queryOne(
    `SELECT jp.*, c.name as company_name, c.logo_url, c.industry,
     cs.total_score as company_score, cs.process_fairness, cs.employee_experience
     FROM job_postings jp
     JOIN companies c ON jp.company_id = c.id
     LEFT JOIN company_scores cs ON c.id = cs.company_id
     WHERE jp.id = ?`,
    [req.params.id]
  );

  if (!job) {
    return sendError(res, {
      status: 404,
      code: 'JOB_NOT_FOUND',
      message: 'Job not found',
    });
  }

  const questions = await query(
    'SELECT id, question_text, question_type, is_required, max_duration_s, display_order FROM prescreening_questions WHERE job_id = ? ORDER BY display_order',
    [req.params.id]
  );

  if (req.user.role === 'employer') {
    const employer = await queryOne('SELECT company_id FROM employers WHERE user_id = ?', [req.user.id]);
    if (employer?.company_id === job.company_id) {
      const fullQuestions = await query(
        'SELECT * FROM prescreening_questions WHERE job_id = ? ORDER BY display_order',
        [req.params.id]
      );

      return sendSuccess(res, {
        data: {
          ...normalizeJob(job),
          questions: fullQuestions,
        },
      });
    }
  }

  return sendSuccess(res, {
    data: {
      ...normalizeJob(job),
      questions,
    },
  });
}));

// PATCH /api/jobs/:id
router.patch('/:id', auth, requireEmployer, asyncHandler(async (req, res) => {
  const employer = await queryOne('SELECT company_id FROM employers WHERE user_id = ?', [req.user.id]);
  if (!employer) {
    return sendError(res, {
      status: 404,
      code: 'EMPLOYER_NOT_FOUND',
      message: 'Employer profile not found',
    });
  }

  const job = await queryOne('SELECT id, company_id FROM job_postings WHERE id = ?', [req.params.id]);
  if (!job || job.company_id !== employer.company_id) {
    return sendError(res, {
      status: 403,
      code: 'JOB_FORBIDDEN',
      message: 'Not your job posting',
    });
  }

  const allowed = ['title', 'status', 'closed_reason', 'openings', 'salary_min', 'salary_max', 'work_mode', 'location', 'description', 'is_featured'];
  const updates = [];
  const params = [];
  const updatedFields = [];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates.push(`${key} = ?`);
      params.push(req.body[key]);
      updatedFields.push(key);

      if (key === 'status' && req.body[key] === 'closed') {
        updates.push('closed_at = NOW()');
      }
    }
  }

  if (!updates.length) {
    return sendError(res, {
      status: 400,
      code: 'JOB_UPDATE_EMPTY',
      message: 'No valid fields to update',
    });
  }

  params.push(req.params.id);
  await query(`UPDATE job_postings SET ${updates.join(', ')} WHERE id = ?`, params);

  return sendSuccess(res, {
    data: {
      job_id: req.params.id,
      updated_fields: updatedFields,
    },
  });
}));

// GET /api/jobs
router.get('/', auth, asyncHandler(async (req, res) => {
  const {
    q, domain, level, work_mode, salary_min, salary_max,
    experience_max, location, sort = 'match',
  } = req.query;
  const { page, limit, offset } = getPagination(req.query);

  let candidateId = null;
  let careerScore = 0;

  if (req.user.role === 'candidate') {
    const candidate = await queryOne('SELECT id FROM candidates WHERE user_id = ?', [req.user.id]);
    if (candidate) {
      candidateId = candidate.id;
      const score = await ensureCareerScore(candidate.id);
      careerScore = score?.total_score || 300;
    }
  }

  let sql = `SELECT jp.id, jp.title, jp.department, jp.job_function, jp.level,
    jp.work_mode, jp.location, jp.salary_min, jp.salary_max, jp.salary_disclosed,
    jp.experience_min_years, jp.experience_max_years, jp.openings, jp.applications_count,
    jp.created_at, jp.tat_hours, jp.required_skills, jp.preferred_skills,
    c.name as company_name, c.logo_url, c.industry, c.employee_count_min, c.employee_count_max,
    cs.total_score as company_score,
    ? as candidate_career_score
    FROM job_postings jp
    JOIN companies c ON jp.company_id = c.id
    LEFT JOIN company_scores cs ON c.id = cs.company_id
    WHERE jp.status = 'active'
    AND (? = 0 OR jp.min_career_score <= ?)`;

  const params = [careerScore, careerScore, careerScore];

  if (q) {
    sql += ' AND (MATCH(jp.title, jp.description, jp.responsibilities) AGAINST(? IN BOOLEAN MODE) OR jp.title LIKE ?)';
    params.push(`${q}*`, `%${q}%`);
  }
  if (domain) {
    sql += ' AND jp.department = ?';
    params.push(domain);
  }
  if (level) {
    sql += ' AND jp.level = ?';
    params.push(level);
  }
  if (work_mode) {
    sql += ' AND jp.work_mode = ?';
    params.push(work_mode);
  }
  if (salary_min) {
    sql += ' AND (jp.salary_max >= ? OR jp.salary_disclosed = 0)';
    params.push(salary_min);
  }
  if (salary_max) {
    sql += ' AND (jp.salary_min <= ? OR jp.salary_disclosed = 0)';
    params.push(salary_max);
  }
  if (experience_max) {
    sql += ' AND jp.experience_min_years <= ?';
    params.push(experience_max);
  }
  if (location) {
    sql += ' AND jp.location LIKE ?';
    params.push(`%${location}%`);
  }

  sql += sort === 'date'
    ? ' ORDER BY jp.created_at DESC'
    : ' ORDER BY cs.total_score DESC, jp.created_at DESC';
  sql += ` LIMIT ${limit} OFFSET ${offset}`;

  const jobs = await query(sql, params);
  const items = jobs.map(normalizeJob);

  if (candidateId && items.length) {
    const jobIds = items.map((job) => job.id);
    const applied = await query(
      `SELECT job_id, status FROM job_applications WHERE candidate_id = ? AND job_id IN (${jobIds.map(() => '?').join(',')})`,
      [candidateId, ...jobIds]
    );
    const appliedMap = Object.fromEntries(applied.map((application) => [application.job_id, application.status]));

    items.forEach((jobItem) => {
      jobItem.applied_status = appliedMap[jobItem.id] || null;
    });
  }

  return sendSuccess(res, {
    data: items,
    meta: buildPaginationMeta({ page, limit, count: items.length, sort }),
    legacy: { page, limit },
  });
}));

// POST /api/jobs/:id/apply
router.post('/:id/apply', auth, requireCandidate, asyncHandler(async (req, res) => {
  const candidate = await queryOne('SELECT id FROM candidates WHERE user_id = ?', [req.user.id]);
  if (!candidate) {
    return sendError(res, {
      status: 404,
      code: 'CANDIDATE_NOT_FOUND',
      message: 'Candidate profile not found',
    });
  }

  const job = await queryOne('SELECT id, company_id, status, min_career_score FROM job_postings WHERE id = ?', [req.params.id]);
  if (!job || job.status !== 'active') {
    return sendError(res, {
      status: 400,
      code: 'JOB_NOT_ACTIVE',
      message: 'Job is not active',
    });
  }

  const scoreRow = await ensureCareerScore(candidate.id);
  if (scoreRow && scoreRow.total_score < job.min_career_score) {
    return sendError(res, {
      status: 400,
      code: 'SCORE_GATE',
      message: `This role requires a Career Score of ${job.min_career_score}. Your score is ${scoreRow.total_score}.`,
    });
  }

  const existing = await queryOne(
    'SELECT id FROM job_applications WHERE job_id = ? AND candidate_id = ?',
    [job.id, candidate.id]
  );
  if (existing) {
    return sendError(res, {
      status: 409,
      code: 'ALREADY_APPLIED',
      message: 'Already applied',
    });
  }

  const { cover_note, answers = [] } = req.body;
  if (!Array.isArray(answers)) {
    return sendError(res, {
      status: 400,
      code: 'ANSWERS_INVALID',
      message: 'answers must be an array',
    });
  }

  const questions = await query(
    'SELECT id, question_type, is_required FROM prescreening_questions WHERE job_id = ? ORDER BY display_order',
    [job.id]
  );
  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const seenQuestionIds = new Set();

  for (const answer of answers) {
    if (!questionMap.has(answer.question_id)) {
      return sendError(res, {
        status: 400,
        code: 'PRESCREEN_QUESTION_MISMATCH',
        message: 'One or more answers do not match this job\'s pre-screen questions',
      });
    }

    if (seenQuestionIds.has(answer.question_id)) {
      return sendError(res, {
        status: 400,
        code: 'PRESCREEN_DUPLICATE_ANSWER',
        message: 'Duplicate answers for the same pre-screen question are not allowed',
      });
    }

    const question = questionMap.get(answer.question_id);
    const hasContent = Boolean(answer.video_url || (typeof answer.answer_text === 'string' && answer.answer_text.trim()));

    if (!hasContent) {
      return sendError(res, {
        status: 400,
        code: 'PRESCREEN_ANSWER_REQUIRED',
        message: 'Each pre-screen answer must include answer_text or video_url',
      });
    }

    if (question.question_type === 'video' && !answer.video_url && !answer.answer_text) {
      return sendError(res, {
        status: 400,
        code: 'VIDEO_ANSWER_REQUIRED',
        message: 'Video questions require a response payload',
      });
    }

    seenQuestionIds.add(answer.question_id);
  }

  const missingRequiredQuestion = questions.find((question) => question.is_required && !seenQuestionIds.has(question.id));
  if (missingRequiredQuestion) {
    return sendError(res, {
      status: 400,
      code: 'PRESCREEN_REQUIRED_MISSING',
      message: 'All required pre-screen questions must be answered',
    });
  }

  try {
    const appId = uuid();
    await transaction(async (conn) => {
      await conn.execute(
        `INSERT INTO job_applications
          (id, job_id, candidate_id, company_id, cover_note, career_score_at_apply, status)
         VALUES (?, ?, ?, ?, ?, ?, 'submitted')`,
        [appId, job.id, candidate.id, job.company_id, cover_note || null, scoreRow?.total_score || 300]
      );

      for (const answer of answers) {
        const question = questionMap.get(answer.question_id);
        await conn.execute(
          `INSERT INTO prescreening_answers (id, application_id, question_id, answer_type, answer_text, video_url)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [uuid(), appId, answer.question_id, normalizeAnswerType(question.question_type, answer),
            answer.answer_text || null, answer.video_url || null]
        );
      }

      await conn.execute(
        'UPDATE job_postings SET applications_count = applications_count + 1 WHERE id = ?',
        [job.id]
      );

      await conn.execute(
        `INSERT INTO application_status_history (id, application_id, from_status, to_status, note, changed_by)
         VALUES (?, ?, NULL, 'submitted', 'Application submitted', ?)`,
        [uuid(), appId, req.user.id]
      );
    });

    const employerAdmin = await queryOne('SELECT user_id FROM employers WHERE company_id = ? AND is_admin = 1', [job.company_id]);
    if (employerAdmin) {
      const jobTitle = (await queryOne('SELECT title FROM job_postings WHERE id = ?', [job.id]))?.title;
      await query(
        `INSERT INTO notifications (id, user_id, type, title, body, reference_id, reference_type)
         VALUES (?, ?, 'new_application', ?, ?, ?, 'job_application')`,
        [uuid(), employerAdmin.user_id, 'New application received', `New application for ${jobTitle}`, appId]
      );
    }

    await calculateAndSave(candidate.id);

    return sendSuccess(res, {
      status: 201,
      data: {
        application_id: appId,
        status: 'submitted',
        career_score_at_apply: scoreRow?.total_score || 300,
      },
      legacy: {
        application_id: appId,
        status: 'submitted',
      },
    });
  } catch (err) {
    console.error(err);
    return sendError(res, {
      status: 500,
      code: 'APPLICATION_FAILED',
      message: 'Application failed',
    });
  }
}));

// GET /api/jobs/my/applications
router.get('/my/applications', auth, requireCandidate, asyncHandler(async (req, res) => {
  const candidate = await queryOne('SELECT id FROM candidates WHERE user_id = ?', [req.user.id]);
  if (!candidate) {
    return sendError(res, {
      status: 404,
      code: 'CANDIDATE_NOT_FOUND',
      message: 'Candidate profile not found',
    });
  }

  const apps = await query(
    `SELECT ja.id, ja.status, ja.career_score_at_apply, ja.ai_match_score, ja.applied_at, ja.status_updated_at,
     ja.rejection_reason, ja.hold_until, ja.tat_breach,
     jp.id as job_id, jp.title, jp.department, jp.level, jp.work_mode, jp.salary_min, jp.salary_max, jp.salary_disclosed,
     c.name as company_name, c.logo_url,
     (SELECT COUNT(*) FROM job_applications ja2
      JOIN job_postings jp2 ON ja2.job_id = jp2.id
      WHERE ja2.candidate_id = ? AND jp2.company_id = jp.company_id) as total_apps_to_company
     FROM job_applications ja
     JOIN job_postings jp ON ja.job_id = jp.id
     JOIN companies c ON jp.company_id = c.id
     WHERE ja.candidate_id = ?
     ORDER BY ja.applied_at DESC`,
    [candidate.id, candidate.id]
  );

  return sendSuccess(res, {
    data: apps,
    meta: { count: apps.length },
  });
}));

// GET /api/jobs/:id/applications
router.get('/:id/applications', auth, requireEmployer, asyncHandler(async (req, res) => {
  const employer = await queryOne('SELECT company_id FROM employers WHERE user_id = ?', [req.user.id]);
  if (!employer) {
    return sendError(res, {
      status: 404,
      code: 'EMPLOYER_NOT_FOUND',
      message: 'Employer profile not found',
    });
  }

  const job = await queryOne('SELECT id, company_id FROM job_postings WHERE id = ?', [req.params.id]);
  if (!job || job.company_id !== employer.company_id) {
    return sendError(res, {
      status: 403,
      code: 'JOB_FORBIDDEN',
      message: 'Not your job',
    });
  }

  const { status, sort = 'score' } = req.query;
  const { page, limit, offset } = getPagination(req.query, { defaultLimit: 50 });
  const params = [employer.company_id, employer.company_id, req.params.id];

  let sql = `SELECT ja.id, ja.status, ja.career_score_at_apply, ja.ai_match_score, ja.applied_at,
     ja.employer_notes, ja.tat_breach,
     c.id as candidate_id, c.full_name, c.headline, c.location, c.total_experience_months,
     cs.total_score as current_career_score, cs.offer_reliability_pct, cs.no_show_count,
     (SELECT COUNT(*) FROM job_applications ja2
      JOIN job_postings jp2 ON ja2.job_id = jp2.id
      WHERE ja2.candidate_id = c.id AND jp2.company_id = ?) as times_applied_to_us,
     (SELECT GROUP_CONCAT(jp2.title SEPARATOR ', ') FROM job_applications ja2
      JOIN job_postings jp2 ON ja2.job_id = jp2.id
      WHERE ja2.candidate_id = c.id AND jp2.company_id = ? AND ja2.id != ja.id LIMIT 3) as other_roles_applied
     FROM job_applications ja
     JOIN candidates c ON ja.candidate_id = c.id
     LEFT JOIN career_scores cs ON c.id = cs.candidate_id
     WHERE ja.job_id = ?`;

  if (status) {
    sql += ' AND ja.status = ?';
    params.push(status);
  }
  sql += sort === 'date' ? ' ORDER BY ja.applied_at DESC' : ' ORDER BY cs.total_score DESC, ja.applied_at ASC';
  sql += ` LIMIT ${limit} OFFSET ${offset}`;

  const apps = await query(sql, params);
  const items = apps.map((application) => ({
    ...application,
    other_roles_applied_list: splitCsv(application.other_roles_applied),
  }));

  return sendSuccess(res, {
    data: items,
    meta: buildPaginationMeta({ page, limit, count: items.length, sort }),
    legacy: { page, limit },
  });
}));

// PATCH /api/jobs/applications/:appId
router.patch('/applications/:appId', auth, requireEmployer, asyncHandler(async (req, res) => {
  const employer = await queryOne('SELECT company_id FROM employers WHERE user_id = ?', [req.user.id]);
  if (!employer) {
    return sendError(res, {
      status: 404,
      code: 'EMPLOYER_NOT_FOUND',
      message: 'Employer profile not found',
    });
  }

  const app = await queryOne(
    `SELECT ja.*, jp.company_id FROM job_applications ja JOIN job_postings jp ON ja.job_id = jp.id WHERE ja.id = ?`,
    [req.params.appId]
  );
  if (!app || app.company_id !== employer.company_id) {
    return sendError(res, {
      status: 403,
      code: 'APPLICATION_FORBIDDEN',
      message: 'Not your application',
    });
  }

  const { status, rejection_reason, employer_notes, hold_until } = req.body;
  const validStatuses = [
    'under_review', 'shortlisted', 'relevancy_test', 'interview_scheduled',
    'interview_done', 'on_hold', 'offer_sent', 'offer_accepted',
    'offer_declined', 'joined', 'rejected', 'withdrawn',
  ];

  if (status && !validStatuses.includes(status)) {
    return sendError(res, {
      status: 400,
      code: 'APPLICATION_STATUS_INVALID',
      message: 'Invalid status',
    });
  }

  const updates = [];
  const params = [];

  if (status) {
    updates.push('status = ?', 'status_updated_at = NOW()', 'reviewed_at = COALESCE(reviewed_at, NOW())');
    params.push(status);
  }
  if (rejection_reason !== undefined) {
    updates.push('rejection_reason = ?');
    params.push(rejection_reason || null);
  }
  if (employer_notes !== undefined) {
    updates.push('employer_notes = ?');
    params.push(employer_notes || null);
  }
  if (hold_until !== undefined) {
    updates.push('hold_until = ?');
    params.push(hold_until || null);
  }

  if (!updates.length) {
    return sendError(res, {
      status: 400,
      code: 'APPLICATION_UPDATE_EMPTY',
      message: 'No valid application fields to update',
    });
  }

  params.push(req.params.appId);
  await query(`UPDATE job_applications SET ${updates.join(', ')} WHERE id = ?`, params);

  await query(
    `INSERT INTO application_status_history (id, application_id, from_status, to_status, note, changed_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [uuid(), req.params.appId, app.status, status || app.status, rejection_reason || null, req.user.id]
  );

  const statusMessages = {
    shortlisted: 'You\'ve been shortlisted!',
    rejected: 'Application update from employer',
    offer_sent: 'You have a job offer!',
    on_hold: 'Your application is on hold',
    interview_scheduled: 'Interview scheduled',
  };

  if (status && statusMessages[status]) {
    await query(
      `INSERT INTO notifications (id, user_id, type, title, body, reference_id, reference_type)
       VALUES (?, (SELECT user_id FROM candidates WHERE id = ?), 'application_update', ?, ?, ?, 'job_application')`,
      [uuid(), app.candidate_id, 'Application update', statusMessages[status], req.params.appId]
    );
  }

  if (status === 'offer_declined' || status === 'withdrawn') {
    const { addScoreEvent } = require('../services/careerScore');
    await addScoreEvent(app.candidate_id, 'offer_declined', 'credibility', -5, req.params.appId, 'Offer declined or withdrawn');
  }
  if (status === 'joined') {
    const { addScoreEvent } = require('../services/careerScore');
    await addScoreEvent(app.candidate_id, 'offer_accepted_and_joined', 'credibility', 10, req.params.appId, 'Successfully joined');
  }

  return sendSuccess(res, {
    data: {
      application_id: req.params.appId,
      status: status || app.status,
    },
  });
}));

// GET /api/jobs/applications/:appId/history
router.get('/applications/:appId/history', auth, asyncHandler(async (req, res) => {
  const app = await queryOne(
    `SELECT ja.id as application_id, ja.candidate_id, jp.company_id
     FROM job_applications ja
     JOIN job_postings jp ON ja.job_id = jp.id
     WHERE ja.id = ?`,
    [req.params.appId]
  );
  if (!app) {
    return sendError(res, {
      status: 404,
      code: 'APPLICATION_NOT_FOUND',
      message: 'Application history not found',
    });
  }

  if (req.user.role === 'candidate') {
    const candidate = await queryOne('SELECT id FROM candidates WHERE user_id = ?', [req.user.id]);
    if (candidate?.id !== app.candidate_id) {
      return sendError(res, {
        status: 403,
        code: 'APPLICATION_HISTORY_FORBIDDEN',
        message: 'Not your application history',
      });
    }
  } else if (req.user.role === 'employer' || req.user.role === 'admin') {
    const employer = await queryOne('SELECT company_id FROM employers WHERE user_id = ?', [req.user.id]);
    if (!employer || employer.company_id !== app.company_id) {
      return sendError(res, {
        status: 403,
        code: 'APPLICATION_HISTORY_FORBIDDEN',
        message: 'Not your company application history',
      });
    }
  } else {
    return sendError(res, {
      status: 403,
      code: 'FORBIDDEN',
      message: 'Forbidden',
    });
  }

  const history = await query(
    'SELECT * FROM application_status_history WHERE application_id = ? ORDER BY created_at ASC',
    [req.params.appId]
  );

  return sendSuccess(res, {
    data: history,
    meta: {
      application_id: req.params.appId,
      count: history.length,
    },
  });
}));

async function checkTATBreaches() {
  const breached = await query(
    `SELECT ja.id, ja.job_id, ja.company_id, jp.tat_hours
     FROM job_applications ja
     JOIN job_postings jp ON ja.job_id = jp.id
     WHERE ja.status = 'submitted'
     AND ja.tat_breach = 0
     AND TIMESTAMPDIFF(HOUR, ja.applied_at, NOW()) > jp.tat_hours`
  );

  for (const application of breached) {
    await query('UPDATE job_applications SET tat_breach = 1 WHERE id = ?', [application.id]);
    await query(
      `UPDATE company_scores
       SET response_rate_pct = GREATEST(0, response_rate_pct - 1)
       WHERE company_id = ?`,
      [application.company_id]
    );
  }

  console.log(`TAT check: ${breached.length} breaches flagged`);
}

module.exports = { router, checkTATBreaches };
