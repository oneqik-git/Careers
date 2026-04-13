require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { pool, queryOne, transaction } = require('../config/database');

const demoPassword = 'DemoPass123!';

const companies = [
  {
    company: {
      name: 'Northstar Commerce',
      slug: 'northstar-commerce-demo',
      industry: 'Retail Technology',
      description: 'Northstar Commerce helps omnichannel brands scale inventory, merchandising, and customer lifecycle operations.',
      employee_count_min: 180,
      employee_count_max: 350,
      headquarters: 'Bengaluru',
    },
    score: {
      total_score: 4.6,
      process_fairness: 4.7,
      employee_experience: 4.4,
    },
    employer: {
      full_name: 'Ritika Sharma',
      email: 'ritika.sharma@northstarcommerce.com',
      designation: 'Talent Acquisition Lead',
    },
    jobs: [
      {
        title: 'Product Operations Specialist',
        department: 'Operations',
        level: 'mid',
        work_mode: 'hybrid',
        location: 'Bengaluru',
        salary_min: 850000,
        salary_max: 1250000,
        experience_min_years: 2,
        experience_max_years: 5,
        min_career_score: 320,
        required_skills: ['Stakeholder Management', 'Analytics', 'Process Design'],
        preferred_skills: ['SQL', 'Marketplace Ops'],
        description: 'Own cross-functional product operations for seller and catalog workflows. You will coordinate launches, surface bottlenecks, and keep execution crisp across teams.',
        responsibilities: 'Drive launch readiness, maintain dashboards, and turn operational gaps into repeatable playbooks.',
        benefits: 'Hybrid flexibility, medical insurance, learning stipend, and performance bonus.',
        openings: 2,
        tat_hours: 36,
        is_featured: true,
        questions: [
          { question_text: 'Tell us about an operational problem you simplified across teams.', question_type: 'text', display_order: 1 },
          { question_text: 'How do you keep launches on track when inputs are incomplete?', question_type: 'video', display_order: 2 },
        ],
      },
      {
        title: 'Customer Success Manager',
        department: 'Customer Success',
        level: 'mid',
        work_mode: 'remote',
        location: 'Remote - India',
        salary_min: 900000,
        salary_max: 1350000,
        experience_min_years: 3,
        experience_max_years: 6,
        min_career_score: 300,
        required_skills: ['Client Management', 'Renewals', 'Escalation Handling'],
        preferred_skills: ['B2B SaaS', 'QBRs'],
        description: 'Partner with key accounts, protect renewals, and drive measurable adoption across customer teams.',
        responsibilities: 'Lead executive reviews, improve retention health, and align internal teams to unblock customers.',
        benefits: 'Remote work support, health cover, ESOP eligibility, and quarterly offsites.',
        openings: 1,
        tat_hours: 48,
        is_featured: false,
      },
      {
        title: 'Growth Marketing Associate',
        department: 'Marketing',
        level: 'junior',
        work_mode: 'hybrid',
        location: 'Mumbai',
        salary_min: 650000,
        salary_max: 900000,
        experience_min_years: 1,
        experience_max_years: 3,
        min_career_score: 280,
        required_skills: ['Performance Marketing', 'Campaign Reporting', 'Copy Sense'],
        preferred_skills: ['Meta Ads', 'CRM'],
        description: 'Support paid growth and lifecycle campaigns with disciplined experimentation and clear reporting.',
        responsibilities: 'Manage campaign operations, build weekly insights, and support landing page iteration.',
        benefits: 'Flexible hybrid model, wellness allowance, and team learning budget.',
        openings: 1,
        tat_hours: 48,
        is_featured: false,
      },
    ],
  },
  {
    company: {
      name: 'AtlasGrid Systems',
      slug: 'atlasgrid-systems-demo',
      industry: 'Enterprise Software',
      description: 'AtlasGrid Systems builds workflow and data products for large distributed operations teams.',
      employee_count_min: 320,
      employee_count_max: 700,
      headquarters: 'Hyderabad',
    },
    score: {
      total_score: 4.4,
      process_fairness: 4.5,
      employee_experience: 4.2,
    },
    employer: {
      full_name: 'Arjun Menon',
      email: 'arjun.menon@atlasgridsystems.com',
      designation: 'Director of Talent',
    },
    jobs: [
      {
        title: 'Frontend Engineer',
        department: 'Technology',
        level: 'mid',
        work_mode: 'hybrid',
        location: 'Hyderabad',
        salary_min: 1400000,
        salary_max: 2100000,
        experience_min_years: 3,
        experience_max_years: 6,
        min_career_score: 340,
        required_skills: ['React', 'Design Systems', 'API Integration'],
        preferred_skills: ['Next.js', 'Accessibility'],
        description: 'Build polished workflow interfaces for enterprise operators with a strong eye for detail and execution quality.',
        responsibilities: 'Ship product features, improve design-system consistency, and partner closely with product and backend teams.',
        benefits: 'Hybrid work, annual bonus, home office support, and extended health benefits.',
        openings: 2,
        tat_hours: 36,
        is_featured: true,
        questions: [
          { question_text: 'What makes a complex interface feel clear to users?', question_type: 'text', display_order: 1 },
          { question_text: 'Walk us through a frontend decision you defended with product and engineering.', question_type: 'video', display_order: 2 },
        ],
      },
      {
        title: 'Implementation Consultant',
        department: 'Customer Success',
        level: 'mid',
        work_mode: 'remote',
        location: 'Remote - India',
        salary_min: 1100000,
        salary_max: 1600000,
        experience_min_years: 3,
        experience_max_years: 7,
        min_career_score: 310,
        required_skills: ['Client Onboarding', 'Project Delivery', 'Requirements Gathering'],
        preferred_skills: ['SQL', 'Enterprise SaaS'],
        description: 'Lead onboarding and rollout for enterprise customers, balancing configuration depth with stakeholder alignment.',
        responsibilities: 'Run discovery, configure workflows, and ensure value is visible early in the deployment cycle.',
        benefits: 'Remote setup allowance, insurance, and certification reimbursement.',
        openings: 1,
        tat_hours: 48,
        is_featured: false,
      },
      {
        title: 'Revenue Operations Analyst',
        department: 'Sales & GTM',
        level: 'junior',
        work_mode: 'hybrid',
        location: 'Pune',
        salary_min: 750000,
        salary_max: 1100000,
        experience_min_years: 1,
        experience_max_years: 4,
        min_career_score: 290,
        required_skills: ['Reporting', 'CRM Hygiene', 'Sales Analytics'],
        preferred_skills: ['HubSpot', 'Forecasting'],
        description: 'Support the GTM team with clean reporting, better process visibility, and sharper pipeline insights.',
        responsibilities: 'Own dashboards, improve data quality, and work with sales leadership on forecasting visibility.',
        benefits: 'Hybrid work, medical cover, and performance-linked variable pay.',
        openings: 1,
        tat_hours: 48,
        is_featured: false,
      },
    ],
  },
  {
    company: {
      name: 'Meridian HealthTech',
      slug: 'meridian-healthtech-demo',
      industry: 'Health Technology',
      description: 'Meridian HealthTech designs digital operations products for modern care teams and health service providers.',
      employee_count_min: 120,
      employee_count_max: 260,
      headquarters: 'Chennai',
    },
    score: {
      total_score: 4.7,
      process_fairness: 4.8,
      employee_experience: 4.5,
    },
    employer: {
      full_name: 'Neha Iyer',
      email: 'neha.iyer@meridianhealthtech.com',
      designation: 'Head of People',
    },
    jobs: [
      {
        title: 'Clinical Operations Analyst',
        department: 'Operations',
        level: 'mid',
        work_mode: 'on_site',
        location: 'Chennai',
        salary_min: 800000,
        salary_max: 1200000,
        experience_min_years: 2,
        experience_max_years: 5,
        min_career_score: 300,
        required_skills: ['Process Analysis', 'Documentation', 'Stakeholder Communication'],
        preferred_skills: ['Healthcare Ops', 'Dashboarding'],
        description: 'Improve care-operations workflows by turning field feedback into practical process changes and reporting.',
        responsibilities: 'Track operational metrics, maintain SOPs, and support improvement programs across care teams.',
        benefits: 'On-site team support, insurance, and learning allowance.',
        openings: 2,
        tat_hours: 48,
        is_featured: true,
        questions: [
          { question_text: 'Describe a process improvement you owned from problem to rollout.', question_type: 'text', display_order: 1 },
        ],
      },
      {
        title: 'Talent Acquisition Partner',
        department: 'Human Resources',
        level: 'senior',
        work_mode: 'hybrid',
        location: 'Bengaluru',
        salary_min: 1200000,
        salary_max: 1700000,
        experience_min_years: 4,
        experience_max_years: 8,
        min_career_score: 320,
        required_skills: ['Hiring', 'Stakeholder Management', 'Interview Design'],
        preferred_skills: ['Employer Branding', 'Healthcare Hiring'],
        description: 'Own full-cycle hiring across product, operations, and care-delivery functions with a strong bar for candidate experience.',
        responsibilities: 'Partner with hiring managers, run structured process design, and improve funnel quality.',
        benefits: 'Hybrid flexibility, health cover, and leadership coaching budget.',
        openings: 1,
        tat_hours: 36,
        is_featured: false,
      },
      {
        title: 'Product Designer',
        department: 'Product',
        level: 'mid',
        work_mode: 'remote',
        location: 'Remote - India',
        salary_min: 1300000,
        salary_max: 1900000,
        experience_min_years: 3,
        experience_max_years: 6,
        min_career_score: 330,
        required_skills: ['UX Design', 'Product Thinking', 'Interaction Design'],
        preferred_skills: ['Design Systems', 'Healthcare Product'],
        description: 'Shape workflows that help care teams move faster without losing clarity or confidence.',
        responsibilities: 'Lead product discovery, prototype flows, and partner with engineers through implementation.',
        benefits: 'Remote-first culture, insurance, annual retreat, and learning budget.',
        openings: 1,
        tat_hours: 48,
        is_featured: false,
      },
    ],
  },
];

async function ensureUser(conn, { email, role }) {
  const existingUser = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
  const passwordHash = await bcrypt.hash(demoPassword, 12);

  if (existingUser) {
    await conn.execute(
      'UPDATE users SET password_hash = ?, role = ?, is_active = 1 WHERE id = ?',
      [passwordHash, role, existingUser.id]
    );
    return existingUser.id;
  }

  const userId = uuid();
  await conn.execute(
    'INSERT INTO users (id, email, phone, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, 1)',
    [userId, email, null, passwordHash, role]
  );
  return userId;
}

async function ensureCompany(conn, company) {
  const existingCompany = await queryOne('SELECT id FROM companies WHERE slug = ?', [company.slug]);

  if (existingCompany) {
    await conn.execute(
      `UPDATE companies
       SET name = ?, industry = ?, description = ?, employee_count_min = ?, employee_count_max = ?, headquarters = ?
       WHERE id = ?`,
      [
        company.name,
        company.industry,
        company.description,
        company.employee_count_min,
        company.employee_count_max,
        company.headquarters,
        existingCompany.id,
      ]
    );
    return existingCompany.id;
  }

  const companyId = uuid();
  await conn.execute(
    `INSERT INTO companies
      (id, name, slug, industry, description, employee_count_min, employee_count_max, headquarters, verified_company)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      companyId,
      company.name,
      company.slug,
      company.industry,
      company.description,
      company.employee_count_min,
      company.employee_count_max,
      company.headquarters,
    ]
  );
  return companyId;
}

async function ensureCompanyScore(conn, companyId, score) {
  const existingScore = await queryOne('SELECT id FROM company_scores WHERE company_id = ?', [companyId]);

  if (existingScore) {
    await conn.execute(
      'UPDATE company_scores SET total_score = ?, process_fairness = ?, employee_experience = ? WHERE company_id = ?',
      [score.total_score, score.process_fairness, score.employee_experience, companyId]
    );
    return;
  }

  await conn.execute(
    'INSERT INTO company_scores (id, company_id, total_score, process_fairness, employee_experience) VALUES (?, ?, ?, ?, ?)',
    [uuid(), companyId, score.total_score, score.process_fairness, score.employee_experience]
  );
}

async function ensureEmployer(conn, { userId, companyId, full_name, designation }) {
  const existingEmployer = await queryOne('SELECT id FROM employers WHERE user_id = ?', [userId]);

  if (existingEmployer) {
    await conn.execute(
      'UPDATE employers SET company_id = ?, full_name = ?, designation = ?, is_admin = 1 WHERE id = ?',
      [companyId, full_name, designation, existingEmployer.id]
    );
    return existingEmployer.id;
  }

  const employerId = uuid();
  await conn.execute(
    'INSERT INTO employers (id, user_id, company_id, full_name, designation, is_admin) VALUES (?, ?, ?, ?, ?, 1)',
    [employerId, userId, companyId, full_name, designation]
  );
  return employerId;
}

async function ensureQuestions(conn, jobId, questions = []) {
  if (!questions.length) {
    return;
  }

  const existingQuestion = await queryOne('SELECT id FROM prescreening_questions WHERE job_id = ? LIMIT 1', [jobId]);

  if (existingQuestion) {
    return;
  }

  for (const question of questions) {
    await conn.execute(
      `INSERT INTO prescreening_questions
        (id, job_id, question_text, question_type, is_required, max_duration_s, display_order)
       VALUES (?, ?, ?, ?, 1, ?, ?)`,
      [uuid(), jobId, question.question_text, question.question_type || 'text', 90, question.display_order]
    );
  }
}

async function ensureJob(conn, employerId, companyId, job) {
  const existingJob = await queryOne(
    'SELECT id FROM job_postings WHERE company_id = ? AND title = ? LIMIT 1',
    [companyId, job.title]
  );

  if (existingJob) {
    await conn.execute(
      `UPDATE job_postings
       SET employer_id = ?, department = ?, level = ?, work_mode = ?, location = ?, salary_min = ?, salary_max = ?,
           salary_disclosed = 1, experience_min_years = ?, experience_max_years = ?, min_career_score = ?,
           required_skills = ?, preferred_skills = ?, description = ?, responsibilities = ?, benefits = ?, openings = ?,
           status = 'active', tat_hours = ?, is_featured = ?
       WHERE id = ?`,
      [
        employerId,
        job.department,
        job.level,
        job.work_mode,
        job.location,
        job.salary_min,
        job.salary_max,
        job.experience_min_years,
        job.experience_max_years,
        job.min_career_score,
        JSON.stringify(job.required_skills),
        JSON.stringify(job.preferred_skills),
        job.description,
        job.responsibilities,
        job.benefits,
        job.openings,
        job.tat_hours,
        job.is_featured ? 1 : 0,
        existingJob.id,
      ]
    );
    await ensureQuestions(conn, existingJob.id, job.questions);
    return;
  }

  const jobId = uuid();
  await conn.execute(
    `INSERT INTO job_postings
      (id, company_id, employer_id, title, department, level, work_mode, location, salary_min, salary_max,
       salary_disclosed, experience_min_years, experience_max_years, min_career_score, required_skills,
       preferred_skills, description, responsibilities, benefits, openings, status, tat_hours, is_featured)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
    [
      jobId,
      companyId,
      employerId,
      job.title,
      job.department,
      job.level,
      job.work_mode,
      job.location,
      job.salary_min,
      job.salary_max,
      job.experience_min_years,
      job.experience_max_years,
      job.min_career_score,
      JSON.stringify(job.required_skills),
      JSON.stringify(job.preferred_skills),
      job.description,
      job.responsibilities,
      job.benefits,
      job.openings,
      job.tat_hours,
      job.is_featured ? 1 : 0,
    ]
  );

  await ensureQuestions(conn, jobId, job.questions);
}

async function seedCompany(entry) {
  await transaction(async (conn) => {
    const companyId = await ensureCompany(conn, entry.company);
    await ensureCompanyScore(conn, companyId, entry.score);

    const userId = await ensureUser(conn, { email: entry.employer.email, role: 'employer' });
    const employerId = await ensureEmployer(conn, {
      userId,
      companyId,
      full_name: entry.employer.full_name,
      designation: entry.employer.designation,
    });

    for (const job of entry.jobs) {
      await ensureJob(conn, employerId, companyId, job);
    }
  });
}

async function main() {
  console.log('Seeding demo employers and public jobs...');

  for (const company of companies) {
    await seedCompany(company);
    console.log(`Seeded ${company.company.name}`);
  }

  console.log('\nDemo credentials');
  companies.forEach((company) => {
    console.log(`- ${company.employer.email} / ${demoPassword}`);
  });

  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
