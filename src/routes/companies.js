const express = require('express');
const { query, queryOne } = require('../../config/database');
const { auth, requireEmployer } = require('../middleware/auth');
const { v4: uuid } = require('uuid');
const { asyncHandler, sendError, sendSuccess } = require('../utils/api');
const { normalizeCareerLadder, normalizeCompany } = require('../utils/normalize');

const router = express.Router();

// GET /api/companies/me
router.get('/me', auth, requireEmployer, asyncHandler(async (req, res) => {
  const employer = await queryOne(
    `SELECT e.id as employer_id, e.company_id, e.full_name, e.designation, e.department, e.is_admin,
            c.name as company_name, c.slug as company_slug
     FROM employers e
     JOIN companies c ON e.company_id = c.id
     WHERE e.user_id = ?`,
    [req.user.id]
  );

  if (!employer) {
    return sendError(res, {
      status: 404,
      code: 'EMPLOYER_NOT_FOUND',
      message: 'Employer profile not found',
    });
  }

  const company = await queryOne('SELECT * FROM companies WHERE id = ?', [employer.company_id]);

  return sendSuccess(res, {
    data: {
      employer,
      company: normalizeCompany(company),
    },
  });
}));

// GET /api/companies/:slug
router.get('/:slug', auth, asyncHandler(async (req, res) => {
  const company = await queryOne('SELECT * FROM companies WHERE slug = ?', [req.params.slug]);

  if (!company) {
    return sendError(res, {
      status: 404,
      code: 'COMPANY_NOT_FOUND',
      message: 'Company not found',
    });
  }

  const [score, intelHistory, careerLadders, appraisal, teamData, attrition] = await Promise.all([
    queryOne('SELECT * FROM company_scores WHERE company_id = ?', [company.id]),
    query('SELECT * FROM company_intel_history WHERE company_id = ? ORDER BY created_at DESC', [company.id]),
    query('SELECT * FROM career_ladders WHERE company_id = ?', [company.id]),
    query('SELECT * FROM appraisal_data WHERE company_id = ? ORDER BY period_year DESC', [company.id]),
    queryOne(`SELECT
      COUNT(*) as total_employees,
      SUM(CASE WHEN department = 'Sales & GTM' THEN 1 ELSE 0 END) as sales,
      SUM(CASE WHEN department = 'Technology' THEN 1 ELSE 0 END) as tech,
      SUM(CASE WHEN department = 'Product' THEN 1 ELSE 0 END) as product,
      SUM(CASE WHEN department = 'Operations' THEN 1 ELSE 0 END) as ops,
      SUM(CASE WHEN department = 'Human Resources' THEN 1 ELSE 0 END) as hr,
      SUM(CASE WHEN department = 'Finance' THEN 1 ELSE 0 END) as finance
      FROM work_experiences WHERE company_id = ? AND is_current = 1`,
      [company.id]),
    queryOne(
      'SELECT COUNT(*) as exits FROM work_experiences WHERE company_id = ? AND is_current = 0 AND YEAR(end_date) = YEAR(NOW())',
      [company.id]
    ),
  ]);

  let employeeOnly = null;
  if (req.user.role === 'candidate') {
    const isEmployee = await queryOne(
      'SELECT id FROM work_experiences WHERE candidate_id = (SELECT id FROM candidates WHERE user_id = ?) AND company_id = ? AND is_current = 1',
      [req.user.id, company.id]
    );

    if (isEmployee) {
      employeeOnly = {
        leave_policy: null,
        reimbursements: null,
        travel_policy: null,
      };
    }
  }

  const reviews = await query(
    `SELECT cr.overall_rating, cr.manager_behaviour, cr.work_life_respect,
     cr.growth_investment, cr.psych_safety, cr.process_fairness,
     cr.review_text, cr.pros, cr.cons, cr.would_recommend, cr.created_at
     FROM company_reviews cr
     WHERE cr.company_id = ? AND cr.status = 'approved'
     ORDER BY cr.created_at DESC LIMIT 20`,
    [company.id]
  );

  return sendSuccess(res, {
    data: {
      ...normalizeCompany(company),
      score,
      intel_history: intelHistory,
      career_ladders: careerLadders.map(normalizeCareerLadder),
      appraisal,
      team_data: teamData,
      attrition,
      reviews,
      employee_only: employeeOnly,
    },
  });
}));

// PATCH /api/companies/me
router.patch('/me', auth, requireEmployer, asyncHandler(async (req, res) => {
  const employer = await queryOne('SELECT company_id FROM employers WHERE user_id = ? AND is_admin = 1', [req.user.id]);

  if (!employer) {
    return sendError(res, {
      status: 403,
      code: 'COMPANY_ADMIN_REQUIRED',
      message: 'Only company admins can edit the profile',
    });
  }

  const allowed = [
    'name', 'description', 'website_url', 'linkedin_url', 'founded_year',
    'employee_count_min', 'employee_count_max', 'funding_stage', 'funding_amount_usd',
    'headquarters', 'global_offices', 'ceo_name', 'is_profitable',
  ];

  const updates = [];
  const params = [];
  const historyEntries = [];
  const current = await queryOne('SELECT * FROM companies WHERE id = ?', [employer.company_id]);

  for (const key of allowed) {
    if (req.body[key] !== undefined && req.body[key] !== current[key]) {
      updates.push(`\`${key}\` = ?`);
      params.push(Array.isArray(req.body[key]) ? JSON.stringify(req.body[key]) : req.body[key]);
      historyEntries.push({
        field: key,
        old: current[key],
        next: req.body[key],
      });
    }
  }

  if (!updates.length) {
    return sendError(res, {
      status: 400,
      code: 'NO_COMPANY_CHANGES',
      message: 'No changes detected',
    });
  }

  params.push(employer.company_id);
  await query(`UPDATE companies SET ${updates.join(', ')}, data_source = 'self_reported' WHERE id = ?`, params);

  for (const entry of historyEntries) {
    await query(
      `INSERT INTO company_intel_history (id, company_id, field_name, old_value, new_value, change_type, changed_by)
       VALUES (?, ?, ?, ?, ?, 'company_updated', ?)`,
      [uuid(), employer.company_id, entry.field,
        String(entry.old ?? ''), String(entry.next ?? ''), req.user.id]
    );
  }

  return sendSuccess(res, {
    data: {
      company_id: employer.company_id,
      updated_fields: historyEntries.map((entry) => entry.field),
    },
  });
}));

// POST /api/companies/me/career-ladder
router.post('/me/career-ladder', auth, requireEmployer, asyncHandler(async (req, res) => {
  const employer = await queryOne('SELECT company_id FROM employers WHERE user_id = ?', [req.user.id]);

  if (!employer) {
    return sendError(res, {
      status: 404,
      code: 'EMPLOYER_NOT_FOUND',
      message: 'Employer profile not found',
    });
  }

  const { domain, steps } = req.body;
  if (!domain || !Array.isArray(steps) || !steps.length) {
    return sendError(res, {
      status: 400,
      code: 'CAREER_LADDER_INVALID',
      message: 'domain and a non-empty steps array are required',
    });
  }

  await query(
    `INSERT INTO career_ladders (id, company_id, domain, steps, source)
     VALUES (?, ?, ?, ?, 'company_reported')
     ON DUPLICATE KEY UPDATE steps = VALUES(steps), source = 'company_reported', updated_at = NOW()`,
    [uuid(), employer.company_id, domain, JSON.stringify(steps)]
  );

  return sendSuccess(res, {
    data: {
      company_id: employer.company_id,
      domain,
      step_count: steps.length,
    },
  });
}));

// POST /api/companies/me/appraisal
router.post('/me/appraisal', auth, requireEmployer, asyncHandler(async (req, res) => {
  const employer = await queryOne('SELECT company_id FROM employers WHERE user_id = ?', [req.user.id]);

  if (!employer) {
    return sendError(res, {
      status: 404,
      code: 'EMPLOYER_NOT_FOUND',
      message: 'Employer profile not found',
    });
  }

  const { department, cycle_frequency, avg_increment_pct, avg_rating, period_year } = req.body;

  if (!cycle_frequency) {
    return sendError(res, {
      status: 400,
      code: 'APPRAISAL_CYCLE_REQUIRED',
      message: 'cycle_frequency is required',
    });
  }

  const effectiveYear = period_year || new Date().getFullYear();

  await query(
    `INSERT INTO appraisal_data (id, company_id, department, cycle_frequency, avg_increment_pct, avg_rating, period_year, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'company_reported')`,
    [uuid(), employer.company_id, department || null, cycle_frequency, avg_increment_pct, avg_rating, effectiveYear]
  );

  return sendSuccess(res, {
    data: {
      company_id: employer.company_id,
      period_year: effectiveYear,
    },
  });
}));

// POST /api/companies/:companyId/review
router.post('/:companyId/review', auth, asyncHandler(async (req, res) => {
  if (req.user.role !== 'candidate') {
    return sendError(res, {
      status: 403,
      code: 'CANDIDATE_REQUIRED',
      message: 'Only candidates can submit company reviews',
    });
  }

  const candidate = await queryOne('SELECT id FROM candidates WHERE user_id = ?', [req.user.id]);
  if (!candidate) {
    return sendError(res, {
      status: 404,
      code: 'CANDIDATE_NOT_FOUND',
      message: 'Candidate profile not found',
    });
  }

  const company = await queryOne('SELECT id FROM companies WHERE id = ?', [req.params.companyId]);
  if (!company) {
    return sendError(res, {
      status: 404,
      code: 'COMPANY_NOT_FOUND',
      message: 'Company not found',
    });
  }

  const worked = await queryOne(
    'SELECT id FROM work_experiences WHERE candidate_id = ? AND company_id = ?',
    [candidate.id, req.params.companyId]
  );

  const {
    manager_behaviour,
    work_life_respect,
    growth_investment,
    psych_safety,
    process_fairness,
    overall_rating,
    review_text,
    pros,
    cons,
    would_recommend,
  } = req.body;

  await query(
    `INSERT INTO company_reviews
      (id, company_id, candidate_id, employment_verified, manager_behaviour, work_life_respect,
       growth_investment, psych_safety, process_fairness, overall_rating, review_text, pros, cons, would_recommend)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       manager_behaviour=VALUES(manager_behaviour), work_life_respect=VALUES(work_life_respect),
       growth_investment=VALUES(growth_investment), psych_safety=VALUES(psych_safety),
       process_fairness=VALUES(process_fairness), overall_rating=VALUES(overall_rating),
       review_text=VALUES(review_text), pros=VALUES(pros), cons=VALUES(cons),
       would_recommend=VALUES(would_recommend), status='pending_moderation'`,
    [uuid(), req.params.companyId, candidate.id, Boolean(worked),
      manager_behaviour, work_life_respect, growth_investment, psych_safety,
      process_fairness, overall_rating, review_text || null, pros || null, cons || null, would_recommend]
  );

  return sendSuccess(res, {
    status: 201,
    message: 'Review submitted for moderation',
    data: {
      company_id: req.params.companyId,
      employment_verified: Boolean(worked),
    },
  });
}));

module.exports = router;
