require('dotenv').config();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuid } = require('uuid');
const { pool, query } = require('../config/database');
const { calculateAndSave } = require('../src/services/careerScore');

const DEMO_PASSWORD = 'Demo@123';
const NOW = new Date();

function isoDate(daysAgo, hour = 10) {
  const date = new Date(NOW);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function toSqlDateTime(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function roundSalary(value) {
  return Math.round(value / 50000) * 50000;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function slugToDomain(urlSlug, tld = 'in') {
  return `https://www.${urlSlug}.${tld}`;
}

function hashAadhaar(seed) {
  return crypto.createHash('sha256').update(`AADHAAR:${seed}`).digest('hex');
}

function listToJson(value) {
  return JSON.stringify(value || []);
}

const LOCATION_LIBRARY = {
  Ahmedabad: { city: 'Ahmedabad', state: 'Gujarat', country: 'India', latitude: 23.0225, longitude: 72.5714 },
  Bengaluru: { city: 'Bengaluru', state: 'Karnataka', country: 'India', latitude: 12.9716, longitude: 77.5946 },
  Chandigarh: { city: 'Chandigarh', state: 'Chandigarh', country: 'India', latitude: 30.7333, longitude: 76.7794 },
  Chennai: { city: 'Chennai', state: 'Tamil Nadu', country: 'India', latitude: 13.0827, longitude: 80.2707 },
  Delhi: { city: 'Delhi', state: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.2090 },
  Gurugram: { city: 'Gurugram', state: 'Haryana', country: 'India', latitude: 28.4595, longitude: 77.0266 },
  Hyderabad: { city: 'Hyderabad', state: 'Telangana', country: 'India', latitude: 17.3850, longitude: 78.4867 },
  Indore: { city: 'Indore', state: 'Madhya Pradesh', country: 'India', latitude: 22.7196, longitude: 75.8577 },
  Jaipur: { city: 'Jaipur', state: 'Rajasthan', country: 'India', latitude: 26.9124, longitude: 75.7873 },
  Kochi: { city: 'Kochi', state: 'Kerala', country: 'India', latitude: 9.9312, longitude: 76.2673 },
  Mumbai: { city: 'Mumbai', state: 'Maharashtra', country: 'India', latitude: 19.0760, longitude: 72.8777 },
  Noida: { city: 'Noida', state: 'Uttar Pradesh', country: 'India', latitude: 28.5355, longitude: 77.3910 },
  Pune: { city: 'Pune', state: 'Maharashtra', country: 'India', latitude: 18.5204, longitude: 73.8567 },
};

function getLocationSpec(cityOrText) {
  const firstPart = String(cityOrText || '').split(',')[0].trim();
  return LOCATION_LIBRARY[firstPart] || { city: firstPart || null, state: null, country: 'India', latitude: null, longitude: null };
}

function formatLocation(spec) {
  return [spec.city, spec.state, spec.country].filter(Boolean).join(', ');
}

const COURSE_LIBRARY = {
  Communication: {
    subDomain: 'Executive Presence',
    description:
      'Practical communication training for candidates who need clearer stories, calmer follow-ups, and better cross-functional credibility.',
    lessons: [
      ['Communicating your value without sounding rehearsed', 'reading', 4],
      ['Handling difficult conversations with clarity', 'video', 5],
      ['Follow-up notes that feel professional', 'reading', 4],
      ['Practice prompt: align expectations and next steps', 'assignment', 5],
    ],
  },
  'Interview Readiness': {
    subDomain: 'Hiring Performance',
    description:
      'Structured preparation for stories, panel flow, follow-through, and the operational details that improve interview outcomes.',
    lessons: [
      ['Building evidence-based interview stories', 'video', 5],
      ['Turning messy experience into crisp answers', 'reading', 4],
      ['Final-round preparation without over-prepping', 'reading', 5],
      ['Mock panel reflection checklist', 'assignment', 6],
    ],
  },
  'Sales Execution': {
    subDomain: 'Pipeline Discipline',
    description:
      'A focused track on discovery quality, stakeholder mapping, deal hygiene, and how strong revenue operators actually run the work.',
    lessons: [
      ['Discovery questions that uncover real pain', 'video', 6],
      ['Moving from activity to quality pipeline', 'reading', 5],
      ['Forecasting without false confidence', 'reading', 5],
      ['Practice exercise: account plan review', 'assignment', 6],
    ],
  },
  'Business Acumen': {
    subDomain: 'Commercial Judgment',
    description:
      'Build the judgment to read company goals, trade-offs, metrics, and role context instead of working in a narrow task bubble.',
    lessons: [
      ['How teams make trade-offs under pressure', 'video', 5],
      ['Reading goals, metrics, and revenue language', 'reading', 4],
      ['Understanding cost, margin, and operating leverage', 'reading', 4],
      ['Scenario review: make the sharper business call', 'assignment', 5],
    ],
  },
  'Profile Optimization': {
    subDomain: 'Career Narrative',
    description:
      'A practical course on improving headline clarity, evidence of impact, structured work history, and role-fit signaling.',
    lessons: [
      ['Writing a stronger professional headline', 'reading', 3],
      ['Summaries that sound credible and specific', 'video', 4],
      ['Choosing which impact signals to highlight', 'reading', 3],
      ['Profile rewrite checklist', 'assignment', 4],
    ],
  },
  'Leadership Basics': {
    subDomain: 'First-Line Leadership',
    description:
      'Early leadership habits for managers and team leads who need more structure around coaching, feedback, and execution rhythm.',
    lessons: [
      ['The operating system of dependable managers', 'video', 6],
      ['Feedback that improves the work', 'reading', 5],
      ['Running a clean weekly review cadence', 'reading', 6],
      ['Leadership reflection worksheet', 'assignment', 7],
    ],
  },
};

const LADDER_LIBRARY = {
  'Sales & GTM': [
    { level: 1, title: 'Sales Associate', salary_min: 450000, salary_max: 700000, exp_min_yrs: 0, exp_max_yrs: 1.5, team_size: null },
    { level: 2, title: 'Business Development Executive', salary_min: 700000, salary_max: 1100000, exp_min_yrs: 1, exp_max_yrs: 3, team_size: null },
    { level: 3, title: 'Account Executive', salary_min: 1200000, salary_max: 1900000, exp_min_yrs: 3, exp_max_yrs: 6, team_size: 2 },
    { level: 4, title: 'Sales Manager', salary_min: 1800000, salary_max: 2800000, exp_min_yrs: 5, exp_max_yrs: 8, team_size: 6 },
  ],
  Technology: [
    { level: 1, title: 'Software Engineer I', salary_min: 900000, salary_max: 1400000, exp_min_yrs: 0, exp_max_yrs: 2, team_size: null },
    { level: 2, title: 'Software Engineer II', salary_min: 1400000, salary_max: 2200000, exp_min_yrs: 2, exp_max_yrs: 5, team_size: null },
    { level: 3, title: 'Senior Engineer', salary_min: 2200000, salary_max: 3200000, exp_min_yrs: 5, exp_max_yrs: 8, team_size: 2 },
    { level: 4, title: 'Engineering Manager', salary_min: 3000000, salary_max: 4300000, exp_min_yrs: 7, exp_max_yrs: 11, team_size: 8 },
  ],
  Product: [
    { level: 1, title: 'Associate Product Manager', salary_min: 1000000, salary_max: 1500000, exp_min_yrs: 1, exp_max_yrs: 3, team_size: null },
    { level: 2, title: 'Product Manager', salary_min: 1600000, salary_max: 2400000, exp_min_yrs: 3, exp_max_yrs: 6, team_size: 2 },
    { level: 3, title: 'Senior Product Manager', salary_min: 2400000, salary_max: 3400000, exp_min_yrs: 5, exp_max_yrs: 8, team_size: 4 },
  ],
  Operations: [
    { level: 1, title: 'Operations Executive', salary_min: 420000, salary_max: 650000, exp_min_yrs: 0, exp_max_yrs: 2, team_size: null },
    { level: 2, title: 'Operations Analyst', salary_min: 650000, salary_max: 1000000, exp_min_yrs: 1, exp_max_yrs: 4, team_size: null },
    { level: 3, title: 'Operations Manager', salary_min: 1200000, salary_max: 1900000, exp_min_yrs: 4, exp_max_yrs: 8, team_size: 6 },
  ],
  'Human Resources': [
    { level: 1, title: 'HR Executive', salary_min: 500000, salary_max: 750000, exp_min_yrs: 1, exp_max_yrs: 3, team_size: null },
    { level: 2, title: 'Talent Acquisition Partner', salary_min: 900000, salary_max: 1500000, exp_min_yrs: 3, exp_max_yrs: 6, team_size: null },
    { level: 3, title: 'HRBP Manager', salary_min: 1600000, salary_max: 2400000, exp_min_yrs: 6, exp_max_yrs: 10, team_size: 4 },
  ],
};

const BLUEPRINTS = [
  { title: 'Enterprise Account Executive', department: 'Sales & GTM', job_function: 'Enterprise Sales', level: 'senior', seniority_label: 'Account Executive', work_mode: 'hybrid', experience: [4, 8], salary: [1800000, 2800000], minCareerScore: 520, required: ['Pipeline Management', 'Consultative Selling', 'Forecasting'], preferred: ['CRM Hygiene', 'B2B SaaS'] },
  { title: 'Sales Development Representative', department: 'Sales & GTM', job_function: 'Inside Sales', level: 'junior', seniority_label: 'SDR', work_mode: 'remote', experience: [1, 3], salary: [600000, 950000], minCareerScore: 340, required: ['Prospecting', 'Outbound Sequencing', 'Discovery'], preferred: ['CRM', 'Email Personalisation'] },
  { title: 'Revenue Operations Analyst', department: 'Sales & GTM', job_function: 'Sales Ops', level: 'junior', seniority_label: 'Analyst', work_mode: 'hybrid', experience: [1, 4], salary: [800000, 1200000], minCareerScore: 320, required: ['Reporting', 'CRM Hygiene', 'Analytics'], preferred: ['Forecasting', 'SQL'] },
  { title: 'Sales Executive', department: 'Sales & GTM', job_function: 'Inside Sales', level: 'junior', seniority_label: 'Executive', work_mode: 'hybrid', experience: [1, 3], salary: [550000, 850000], minCareerScore: 300, required: ['Prospecting', 'Customer Communication', 'Follow-up Discipline'], preferred: ['CRM', 'Retail Sales'] },
  { title: 'Business Development Manager', department: 'Sales & GTM', job_function: 'Business Development', level: 'mid', seniority_label: 'BDM', work_mode: 'hybrid', experience: [3, 6], salary: [1200000, 1900000], minCareerScore: 380, required: ['Lead Generation', 'Partnership Development', 'Negotiation'], preferred: ['Market Mapping', 'B2B Sales'] },
  { title: 'Sales Manager', department: 'Sales & GTM', job_function: 'Sales Management', level: 'manager', seniority_label: 'Manager', work_mode: 'on_site', experience: [5, 9], salary: [1600000, 2500000], minCareerScore: 450, required: ['Team Coaching', 'Pipeline Reviews', 'Target Ownership'], preferred: ['Territory Planning', 'Forecasting'] },
  { title: 'Sales Team Lead', department: 'Sales & GTM', job_function: 'Inside Sales', level: 'manager', seniority_label: 'Team Lead', work_mode: 'on_site', experience: [4, 7], salary: [1000000, 1500000], minCareerScore: 390, required: ['People Management', 'Call Reviews', 'Escalation Handling'], preferred: ['Sales Enablement', 'KPI Management'] },
  { title: 'Talent Acquisition Partner', department: 'Human Resources', job_function: 'Talent Acquisition', level: 'mid', seniority_label: 'TA Partner', work_mode: 'hybrid', experience: [3, 7], salary: [1000000, 1600000], minCareerScore: 360, required: ['Stakeholder Management', 'Hiring', 'Interview Design'], preferred: ['Employer Branding', 'Calibration'] },
  { title: 'HRBP Manager', department: 'Human Resources', job_function: 'HRBP', level: 'senior', seniority_label: 'Manager', work_mode: 'hybrid', experience: [6, 10], salary: [1800000, 2600000], minCareerScore: 470, required: ['Employee Relations', 'Org Planning', 'Manager Coaching'], preferred: ['Performance Cycles', 'Change Management'] },
  { title: 'Learning Program Coordinator', department: 'Human Resources', job_function: 'L&D', level: 'junior', seniority_label: 'Coordinator', work_mode: 'remote', experience: [1, 3], salary: [550000, 850000], minCareerScore: 300, required: ['Program Coordination', 'Facilitation Support', 'Communication'], preferred: ['LMS', 'Operations'] },
  { title: 'HR Executive', department: 'Human Resources', job_function: 'HR Ops', level: 'junior', seniority_label: 'Executive', work_mode: 'on_site', experience: [1, 3], salary: [450000, 700000], minCareerScore: 290, required: ['Employee Documentation', 'HRIS Updates', 'Onboarding Coordination'], preferred: ['Payroll Support', 'Compliance Basics'] },
  { title: 'HR Recruiter', department: 'Human Resources', job_function: 'Talent Acquisition', level: 'junior', seniority_label: 'Recruiter', work_mode: 'hybrid', experience: [1, 4], salary: [550000, 900000], minCareerScore: 310, required: ['Sourcing', 'Screening', 'Candidate Coordination'], preferred: ['LinkedIn Recruiter', 'Interview Scheduling'] },
  { title: 'HR Operations Specialist', department: 'Human Resources', job_function: 'HR Ops', level: 'mid', seniority_label: 'Specialist', work_mode: 'hybrid', experience: [2, 5], salary: [750000, 1200000], minCareerScore: 340, required: ['Employee Lifecycle', 'Policy Support', 'HR Reporting'], preferred: ['HRMS', 'Process Improvement'] },
  { title: 'Product Manager', department: 'Product', job_function: 'Product Management', level: 'mid', seniority_label: 'PM', work_mode: 'hybrid', experience: [3, 6], salary: [1800000, 2700000], minCareerScore: 430, required: ['Roadmapping', 'Discovery', 'Execution'], preferred: ['Analytics', 'B2B SaaS'] },
  { title: 'Associate Product Manager', department: 'Product', job_function: 'Product Management', level: 'junior', seniority_label: 'APM', work_mode: 'hybrid', experience: [1, 3], salary: [1100000, 1600000], minCareerScore: 340, required: ['Problem Solving', 'Documentation', 'Stakeholder Communication'], preferred: ['SQL', 'Analytics'] },
  { title: 'Product Designer', department: 'Product', job_function: 'Product Design', level: 'mid', seniority_label: 'Designer', work_mode: 'remote', experience: [3, 6], salary: [1400000, 2200000], minCareerScore: 390, required: ['UX Design', 'Interaction Design', 'Product Thinking'], preferred: ['Design Systems', 'Research'] },
  { title: 'Frontend Engineer', department: 'Technology', job_function: 'Frontend', level: 'mid', seniority_label: 'SDE II', work_mode: 'hybrid', experience: [3, 6], salary: [1500000, 2300000], minCareerScore: 400, required: ['React', 'API Integration', 'UI Quality'], preferred: ['Next.js', 'Accessibility'] },
  { title: 'Backend Engineer', department: 'Technology', job_function: 'Backend', level: 'mid', seniority_label: 'SDE II', work_mode: 'hybrid', experience: [3, 6], salary: [1600000, 2400000], minCareerScore: 400, required: ['Node.js', 'SQL', 'API Design'], preferred: ['System Design', 'Reliability'] },
  { title: 'Full Stack Engineer', department: 'Technology', job_function: 'Product Engineering', level: 'mid', seniority_label: 'SDE II', work_mode: 'remote', experience: [3, 6], salary: [1700000, 2500000], minCareerScore: 410, required: ['React', 'Node.js', 'SQL'], preferred: ['Next.js', 'System Thinking'] },
  { title: 'QA Automation Engineer', department: 'Technology', job_function: 'QA', level: 'mid', seniority_label: 'Engineer', work_mode: 'hybrid', experience: [2, 5], salary: [1000000, 1600000], minCareerScore: 340, required: ['Automation Testing', 'Regression Planning', 'Bug Triage'], preferred: ['API Testing', 'Cypress'] },
  { title: 'DevOps Engineer', department: 'Technology', job_function: 'DevOps', level: 'mid', seniority_label: 'Engineer', work_mode: 'remote', experience: [3, 6], salary: [1700000, 2500000], minCareerScore: 400, required: ['Cloud Infrastructure', 'CI/CD', 'Observability'], preferred: ['Security', 'Cost Optimisation'] },
  { title: 'Operations Analyst', department: 'Operations', job_function: 'Process Ops', level: 'junior', seniority_label: 'Analyst', work_mode: 'hybrid', experience: [1, 4], salary: [700000, 1100000], minCareerScore: 300, required: ['Reporting', 'Process Mapping', 'Excel'], preferred: ['SQL', 'Operations Reviews'] },
  { title: 'Implementation Consultant', department: 'Operations', job_function: 'Customer Ops', level: 'mid', seniority_label: 'Consultant', work_mode: 'remote', experience: [3, 6], salary: [1200000, 1800000], minCareerScore: 360, required: ['Client Onboarding', 'Requirements Gathering', 'Project Delivery'], preferred: ['SaaS', 'Configuration'] },
  { title: 'Operations Manager', department: 'Operations', job_function: 'Process Ops', level: 'manager', seniority_label: 'Manager', work_mode: 'on_site', experience: [5, 9], salary: [1500000, 2300000], minCareerScore: 430, required: ['Team Management', 'Process Excellence', 'Escalation Handling'], preferred: ['Capacity Planning', 'SOP Design'] },
  { title: 'Supply Chain Coordinator', department: 'Operations', job_function: 'Supply Chain', level: 'junior', seniority_label: 'Coordinator', work_mode: 'on_site', experience: [1, 4], salary: [550000, 900000], minCareerScore: 290, required: ['Vendor Coordination', 'Dispatch Tracking', 'Documentation'], preferred: ['ERP', 'Logistics Ops'] },
  { title: 'FP&A Analyst', department: 'Finance', job_function: 'FP&A', level: 'mid', seniority_label: 'Analyst', work_mode: 'hybrid', experience: [2, 5], salary: [1100000, 1700000], minCareerScore: 350, required: ['Financial Planning', 'Variance Analysis', 'Business Partnering'], preferred: ['SaaS Metrics', 'Excel Modelling'] },
  { title: 'Finance Controller', department: 'Finance', job_function: 'Accounting', level: 'manager', seniority_label: 'Controller', work_mode: 'on_site', experience: [6, 10], salary: [2200000, 3200000], minCareerScore: 470, required: ['Controllership', 'Compliance', 'Closing'], preferred: ['ERP', 'Internal Controls'] },
  { title: 'Accounts Executive', department: 'Finance', job_function: 'Accounting', level: 'junior', seniority_label: 'Executive', work_mode: 'on_site', experience: [1, 3], salary: [500000, 800000], minCareerScore: 300, required: ['Bookkeeping', 'Invoice Processing', 'Reconciliation'], preferred: ['Tally', 'GST Basics'] },
  { title: 'Payroll Specialist', department: 'Finance', job_function: 'Payroll', level: 'mid', seniority_label: 'Specialist', work_mode: 'hybrid', experience: [2, 5], salary: [700000, 1100000], minCareerScore: 330, required: ['Payroll Processing', 'Compliance', 'Employee Queries'], preferred: ['HRMS', 'Statutory Reporting'] },
  { title: 'Customer Support Associate', department: 'BPO / Contact Centre', job_function: 'Inbound', level: 'entry', seniority_label: 'Associate', work_mode: 'on_site', experience: [0, 2], salary: [320000, 500000], minCareerScore: 250, required: ['Customer Communication', 'Case Handling', 'Typing Speed'], preferred: ['Voice Support', 'CRM'] },
  { title: 'Customer Support Executive', department: 'BPO / Contact Centre', job_function: 'Inbound', level: 'junior', seniority_label: 'Executive', work_mode: 'on_site', experience: [1, 3], salary: [420000, 650000], minCareerScore: 280, required: ['Customer Communication', 'Ticket Handling', 'Escalation Notes'], preferred: ['Chat Support', 'CRM'] },
  { title: 'Quality Analyst - Customer Operations', department: 'BPO / Contact Centre', job_function: 'Quality Analyst', level: 'junior', seniority_label: 'Analyst', work_mode: 'on_site', experience: [2, 4], salary: [550000, 850000], minCareerScore: 300, required: ['Quality Audits', 'Coaching', 'Root Cause Analysis'], preferred: ['Contact Centre', 'Calibration'] },
  { title: 'Team Lead - Customer Operations', department: 'BPO / Contact Centre', job_function: 'Blended', level: 'manager', seniority_label: 'Team Lead', work_mode: 'on_site', experience: [4, 7], salary: [700000, 1100000], minCareerScore: 340, required: ['People Management', 'Escalation Handling', 'Coaching'], preferred: ['WFM Coordination', 'KPI Management'] },
  { title: 'Content Marketing Strategist', department: 'Marketing', job_function: 'Content', level: 'mid', seniority_label: 'Strategist', work_mode: 'remote', experience: [3, 6], salary: [900000, 1450000], minCareerScore: 330, required: ['Content Strategy', 'Writing', 'Campaign Planning'], preferred: ['SEO', 'B2B Content'] },
  { title: 'Performance Marketing Manager', department: 'Marketing', job_function: 'Performance Marketing', level: 'mid', seniority_label: 'Manager', work_mode: 'hybrid', experience: [3, 6], salary: [1200000, 1800000], minCareerScore: 360, required: ['Paid Acquisition', 'Experimentation', 'Reporting'], preferred: ['B2B or Consumer Growth', 'Landing Page Iteration'] },
  { title: 'Customer Success Manager', department: 'Customer Success', job_function: 'Renewals', level: 'mid', seniority_label: 'Manager', work_mode: 'remote', experience: [3, 6], salary: [1000000, 1550000], minCareerScore: 380, required: ['Account Management', 'Renewals', 'Stakeholder Communication'], preferred: ['QBRs', 'SaaS'] },
];

const COMPANIES = [
  { name: 'Northstar Commerce', slug: 'northstar-commerce', industry: 'Retail Technology', location: 'Bengaluru', companyScore: 4.6, jobCount: 6, departments: ['Sales & GTM', 'Operations', 'Marketing', 'Technology', 'Product'], primaryDomain: 'Sales & GTM', recruiterName: 'Ritika Sharma', recruiterEmail: 'ritika.sharma@northstarcommerce.com', recruiterDesignation: 'Talent Acquisition Lead', description: 'Builds omnichannel commerce tooling for multi-store retail brands scaling catalog, fulfilment, and revenue operations across India.', websiteUrl: slugToDomain('northstarcommerce'), linkedinUrl: 'https://www.linkedin.com/company/northstar-commerce', foundedYear: 2018, employeeRange: [220, 420], fundingStage: 'series_b', fundingAmountUsd: 24000000, isProfitable: false, globalOffices: ['IN', 'AE'], ceoName: 'Shivam Bedi' },
  { name: 'AtlasGrid Systems', slug: 'atlasgrid-systems', industry: 'Enterprise Services', location: 'Hyderabad', companyScore: 4.5, jobCount: 6, departments: ['Technology', 'Product', 'Operations', 'Sales & GTM', 'Finance'], primaryDomain: 'Technology', recruiterName: 'Arjun Menon', recruiterEmail: 'arjun.menon@atlasgridsystems.com', recruiterDesignation: 'Director of Talent', description: 'Delivers workflow automation and managed business systems for distributed enterprise teams moving off brittle internal tools.', websiteUrl: slugToDomain('atlasgridsystems'), linkedinUrl: 'https://www.linkedin.com/company/atlasgrid-systems', foundedYear: 2017, employeeRange: [300, 620], fundingStage: 'series_b', fundingAmountUsd: 31000000, isProfitable: false, globalOffices: ['IN', 'SG'], ceoName: 'Niranjan Rao' },
  { name: 'Meridian HealthTech', slug: 'meridian-healthtech', industry: 'Health Technology', location: 'Chennai', companyScore: 4.4, jobCount: 5, departments: ['Operations', 'Product', 'Technology', 'Human Resources'], primaryDomain: 'Operations', recruiterName: 'Neha Iyer', recruiterEmail: 'neha.iyer@meridianhealthtech.com', recruiterDesignation: 'Head of People', description: 'Operates patient operations and care-delivery platforms used by hospital chains, outpatient networks, and clinical support teams.', websiteUrl: slugToDomain('meridianhealthtech'), linkedinUrl: 'https://www.linkedin.com/company/meridian-healthtech', foundedYear: 2019, employeeRange: [180, 340], fundingStage: 'series_a', fundingAmountUsd: 12000000, isProfitable: false, globalOffices: ['IN'], ceoName: 'Drishti Krishnan' },
  { name: 'LedgerLane Finance', slug: 'ledgerlane-finance', industry: 'Fintech', location: 'Mumbai', companyScore: 4.7, jobCount: 5, departments: ['Sales & GTM', 'Finance', 'Operations', 'Technology'], primaryDomain: 'Sales & GTM', recruiterName: 'Mehul Shah', recruiterEmail: 'mehul.shah@ledgerlane.finance', recruiterDesignation: 'Senior Talent Partner', description: 'Provides modern collections, credit operations, and embedded finance infrastructure for SMB lenders and NBFC partners.', websiteUrl: 'https://www.ledgerlane.finance', linkedinUrl: 'https://www.linkedin.com/company/ledgerlane-finance', foundedYear: 2020, employeeRange: [140, 260], fundingStage: 'series_a', fundingAmountUsd: 15000000, isProfitable: false, globalOffices: ['IN', 'AE'], ceoName: 'Bhavin Shah' },
  { name: 'PeoplePulse Labs', slug: 'peoplepulse-labs', industry: 'HR Tech', location: 'Pune', companyScore: 4.3, jobCount: 5, departments: ['Human Resources', 'Technology', 'Product', 'Sales & GTM', 'Marketing'], primaryDomain: 'Human Resources', recruiterName: 'Sonal Khanna', recruiterEmail: 'sonal.khanna@peoplepulselabs.com', recruiterDesignation: 'People Operations Lead', description: 'Builds recruiting workflow, workforce planning, and people-analytics products for fast-growing India-based teams.', websiteUrl: slugToDomain('peoplepulselabs'), linkedinUrl: 'https://www.linkedin.com/company/peoplepulse-labs', foundedYear: 2018, employeeRange: [160, 280], fundingStage: 'series_a', fundingAmountUsd: 9000000, isProfitable: false, globalOffices: ['IN'], ceoName: 'Raghav Khanna' },
  { name: 'SwiftRoute Logistics', slug: 'swiftroute-logistics', industry: 'Logistics', location: 'Gurugram', companyScore: 4.2, jobCount: 6, departments: ['Operations', 'Technology', 'Finance', 'BPO / Contact Centre', 'Sales & GTM'], primaryDomain: 'Operations', recruiterName: 'Nupur Sethi', recruiterEmail: 'nupur.sethi@swiftroute.in', recruiterDesignation: 'Head of Talent', description: 'Runs mid-mile planning, last-mile visibility, and merchant delivery orchestration for regional and national commerce networks.', websiteUrl: 'https://www.swiftroute.in', linkedinUrl: 'https://www.linkedin.com/company/swiftroute-logistics', foundedYear: 2016, employeeRange: [420, 900], fundingStage: 'series_c', fundingAmountUsd: 54000000, isProfitable: false, globalOffices: ['IN'], ceoName: 'Anand Sethi' },
  { name: 'BrightPath Learning', slug: 'brightpath-learning', industry: 'Education', location: 'Noida', companyScore: 4.1, jobCount: 4, departments: ['Product', 'Marketing', 'Operations', 'Sales & GTM'], primaryDomain: 'Product', recruiterName: 'Harsha Prasad', recruiterEmail: 'harsha.prasad@brightpathlearning.in', recruiterDesignation: 'Talent Acquisition Manager', description: 'Creates blended learning products for employability programs, cohort operations, and student success teams.', websiteUrl: 'https://www.brightpathlearning.in', linkedinUrl: 'https://www.linkedin.com/company/brightpath-learning', foundedYear: 2015, employeeRange: [210, 360], fundingStage: 'profitable', fundingAmountUsd: 0, isProfitable: true, globalOffices: ['IN'], ceoName: 'Gaurav Prasad' },
  { name: 'OrbitServe Global', slug: 'orbitserve-global', industry: 'BPO / Operations', location: 'Jaipur', companyScore: 4.0, jobCount: 7, departments: ['BPO / Contact Centre', 'Operations', 'Human Resources', 'Finance'], primaryDomain: 'Operations', recruiterName: 'Saba Khan', recruiterEmail: 'saba.khan@orbitserveglobal.com', recruiterDesignation: 'Regional Talent Manager', description: 'Handles customer operations, back-office support, and multilingual service delivery for digital brands and enterprise teams.', websiteUrl: slugToDomain('orbitserveglobal'), linkedinUrl: 'https://www.linkedin.com/company/orbitserve-global', foundedYear: 2014, employeeRange: [650, 1400], fundingStage: 'profitable', fundingAmountUsd: 0, isProfitable: true, globalOffices: ['IN', 'PH'], ceoName: 'Imran Qureshi' },
  { name: 'ZenithCare Clinics', slug: 'zenithcare-clinics', industry: 'Health Technology', location: 'Kochi', companyScore: 4.2, jobCount: 4, departments: ['Operations', 'Finance', 'Human Resources', 'Product'], primaryDomain: 'Operations', recruiterName: 'Devika Nair', recruiterEmail: 'devika.nair@zenithcareclinics.com', recruiterDesignation: 'HR Lead', description: 'Combines outpatient care operations with digital scheduling, claims coordination, and front-desk workflow software.', websiteUrl: slugToDomain('zenithcareclinics'), linkedinUrl: 'https://www.linkedin.com/company/zenithcare-clinics', foundedYear: 2021, employeeRange: [120, 220], fundingStage: 'seed', fundingAmountUsd: 3500000, isProfitable: false, globalOffices: ['IN'], ceoName: 'Dr. Mihir Nair' },
  { name: 'CloudMosaic SaaS', slug: 'cloudmosaic-saas', industry: 'SaaS', location: 'Bengaluru', companyScore: 4.8, jobCount: 5, departments: ['Technology', 'Product', 'Sales & GTM', 'Marketing', 'Customer Success'], primaryDomain: 'Technology', recruiterName: 'Kriti Bansal', recruiterEmail: 'kriti.bansal@cloudmosaic.ai', recruiterDesignation: 'Senior Talent Partner', description: 'Builds workflow software for RevOps, onboarding, and internal operations teams that need configurable automation without heavy implementation drag.', websiteUrl: 'https://www.cloudmosaic.ai', linkedinUrl: 'https://www.linkedin.com/company/cloudmosaic-saas', foundedYear: 2019, employeeRange: [260, 520], fundingStage: 'series_b', fundingAmountUsd: 28000000, isProfitable: false, globalOffices: ['IN', 'US'], ceoName: 'Aditya Bansal' },
  { name: 'VerveRetail Cloud', slug: 'ververetail-cloud', industry: 'Retail Technology', location: 'Mumbai', companyScore: 4.3, jobCount: 5, departments: ['Sales & GTM', 'Operations', 'Marketing', 'Finance'], primaryDomain: 'Sales & GTM', recruiterName: 'Anjali Rao', recruiterEmail: 'anjali.rao@ververetail.cloud', recruiterDesignation: 'People Operations Manager', description: 'Serves retail brands with catalog ops, demand planning, and order-quality tooling for modern multi-channel businesses.', websiteUrl: 'https://www.ververetail.cloud', linkedinUrl: 'https://www.linkedin.com/company/ververetail-cloud', foundedYear: 2017, employeeRange: [180, 320], fundingStage: 'series_a', fundingAmountUsd: 10000000, isProfitable: false, globalOffices: ['IN'], ceoName: 'Sarthak Rao' },
  { name: 'Finova Stack', slug: 'finova-stack', industry: 'Fintech', location: 'Gurugram', companyScore: 4.6, jobCount: 5, departments: ['Finance', 'Operations', 'Sales & GTM', 'Technology'], primaryDomain: 'Finance', recruiterName: 'Tanya Sood', recruiterEmail: 'tanya.sood@finovastack.com', recruiterDesignation: 'Lead Recruiter', description: 'Offers finance operations, treasury workflow, and compliance-grade tooling for lending and payments businesses.', websiteUrl: slugToDomain('finovastack', 'com'), linkedinUrl: 'https://www.linkedin.com/company/finova-stack', foundedYear: 2018, employeeRange: [230, 440], fundingStage: 'series_b', fundingAmountUsd: 26000000, isProfitable: false, globalOffices: ['IN', 'SG'], ceoName: 'Kush Sood' },
  { name: 'SkillBridge Campus', slug: 'skillbridge-campus', industry: 'Education', location: 'Indore', companyScore: 4.1, jobCount: 4, departments: ['Operations', 'Sales & GTM', 'Marketing', 'Human Resources'], primaryDomain: 'Operations', recruiterName: 'Ishita Ghosh', recruiterEmail: 'ishita.ghosh@skillbridgecampus.com', recruiterDesignation: 'Hiring Manager', description: 'Runs employability, admissions, and training operations for college-to-work transition programs across tier-two cities.', websiteUrl: slugToDomain('skillbridgecampus'), linkedinUrl: 'https://www.linkedin.com/company/skillbridge-campus', foundedYear: 2016, employeeRange: [150, 260], fundingStage: 'profitable', fundingAmountUsd: 0, isProfitable: true, globalOffices: ['IN'], ceoName: 'Amitesh Ghosh' },
  { name: 'OpsHarbor Services', slug: 'opsharbor-services', industry: 'Enterprise Services', location: 'Chandigarh', companyScore: 4.0, jobCount: 6, departments: ['Operations', 'BPO / Contact Centre', 'Finance', 'Human Resources'], primaryDomain: 'Operations', recruiterName: 'Pallavi Dua', recruiterEmail: 'pallavi.dua@opsharborservices.com', recruiterDesignation: 'Senior Manager - Talent', description: 'Supports enterprise clients with back-office execution, support operations, reconciliations, and service desk programs.', websiteUrl: slugToDomain('opsharborservices'), linkedinUrl: 'https://www.linkedin.com/company/opsharbor-services', foundedYear: 2013, employeeRange: [540, 1200], fundingStage: 'profitable', fundingAmountUsd: 0, isProfitable: true, globalOffices: ['IN'], ceoName: 'Puneet Dua' },
  { name: 'TrueNorth HR Cloud', slug: 'truenorth-hr-cloud', industry: 'HR Tech', location: 'Bengaluru', companyScore: 4.5, jobCount: 4, departments: ['Human Resources', 'Technology', 'Product', 'Sales & GTM'], primaryDomain: 'Human Resources', recruiterName: 'Namrata Joshi', recruiterEmail: 'namrata.joshi@truenorthhrcloud.com', recruiterDesignation: 'Head of Talent', description: 'Builds employee lifecycle and talent-management tools for mid-market companies formalizing people systems.', websiteUrl: 'https://www.truenorthhrcloud.com', linkedinUrl: 'https://www.linkedin.com/company/truenorth-hr-cloud', foundedYear: 2020, employeeRange: [140, 230], fundingStage: 'series_a', fundingAmountUsd: 8000000, isProfitable: false, globalOffices: ['IN'], ceoName: 'Naina Joshi' },
  { name: 'ParcelPilot Networks', slug: 'parcelpilot-networks', industry: 'Logistics', location: 'Ahmedabad', companyScore: 4.2, jobCount: 5, departments: ['Operations', 'Technology', 'BPO / Contact Centre', 'Finance'], primaryDomain: 'Operations', recruiterName: 'Shruti Raval', recruiterEmail: 'shruti.raval@parcelpilot.io', recruiterDesignation: 'Talent Manager', description: 'Delivers route visibility, dispatch orchestration, and operations analytics for regional delivery fleets and fulfilment teams.', websiteUrl: 'https://www.parcelpilot.io', linkedinUrl: 'https://www.linkedin.com/company/parcelpilot-networks', foundedYear: 2018, employeeRange: [240, 460], fundingStage: 'series_a', fundingAmountUsd: 11000000, isProfitable: false, globalOffices: ['IN'], ceoName: 'Aarav Raval' },
  { name: 'NovaDesk Solutions', slug: 'novadesk-solutions', industry: 'Enterprise Services', location: 'Hyderabad', companyScore: 4.4, jobCount: 5, departments: ['Operations', 'Technology', 'Product', 'Finance', 'Sales & GTM'], primaryDomain: 'Technology', recruiterName: 'Vaishali Reddy', recruiterEmail: 'vaishali.reddy@novadesk.solutions', recruiterDesignation: 'Talent Acquisition Lead', description: 'Creates internal workflow and service-delivery products for shared services, support teams, and enterprise operations leaders.', websiteUrl: 'https://www.novadesk.solutions', linkedinUrl: 'https://www.linkedin.com/company/novadesk-solutions', foundedYear: 2019, employeeRange: [210, 380], fundingStage: 'series_a', fundingAmountUsd: 13000000, isProfitable: false, globalOffices: ['IN', 'AE'], ceoName: 'Varun Reddy' },
  { name: 'MarketMint Digital', slug: 'marketmint-digital', industry: 'Retail Technology', location: 'Delhi', companyScore: 4.1, jobCount: 4, departments: ['Marketing', 'Sales & GTM', 'Operations', 'Product'], primaryDomain: 'Sales & GTM', recruiterName: 'Karan Sethi', recruiterEmail: 'karan.sethi@marketmint.digital', recruiterDesignation: 'Hiring Manager', description: 'Supports digital commerce brands with campaign execution, channel operations, and performance-focused growth tooling.', websiteUrl: 'https://www.marketmint.digital', linkedinUrl: 'https://www.linkedin.com/company/marketmint-digital', foundedYear: 2017, employeeRange: [130, 250], fundingStage: 'bootstrapped', fundingAmountUsd: 0, isProfitable: true, globalOffices: ['IN'], ceoName: 'Rhea Sethi' },
  { name: 'CareAxis Health Systems', slug: 'careaxis-health-systems', industry: 'Health Technology', location: 'Bengaluru', companyScore: 4.4, jobCount: 4, departments: ['Operations', 'Customer Success', 'Product', 'Technology'], primaryDomain: 'Operations', recruiterName: 'Nikita Dsouza', recruiterEmail: 'nikita.dsouza@careaxishealth.com', recruiterDesignation: 'Talent Partner', description: 'Runs care-team workflow, patient support, and implementation services for healthcare operators adopting digital systems.', websiteUrl: 'https://www.careaxishealth.com', linkedinUrl: 'https://www.linkedin.com/company/careaxis-health-systems', foundedYear: 2020, employeeRange: [150, 270], fundingStage: 'series_a', fundingAmountUsd: 9500000, isProfitable: false, globalOffices: ['IN'], ceoName: 'Vikram Dsouza' },
  { name: 'AptEdge Software', slug: 'aptedge-software', industry: 'SaaS', location: 'Pune', companyScore: 4.7, jobCount: 5, departments: ['Technology', 'Product', 'Sales & GTM', 'Customer Success', 'Marketing'], primaryDomain: 'Technology', recruiterName: 'Sneha Kapoor', recruiterEmail: 'sneha.kapoor@aptedge.software', recruiterDesignation: 'Head of Talent', description: 'Builds workflow software for fast-growing product teams that want stronger execution visibility across support, product, and revenue motions.', websiteUrl: 'https://www.aptedge.software', linkedinUrl: 'https://www.linkedin.com/company/aptedge-software', foundedYear: 2018, employeeRange: [240, 430], fundingStage: 'series_b', fundingAmountUsd: 22000000, isProfitable: false, globalOffices: ['IN', 'US'], ceoName: 'Karan Kapoor' },
];

const CANDIDATES = [
  {
    fullName: 'Priya Sharma',
    email: 'priya.sharma+candidate@demo.oneqik',
    phone: '9876500001',
    headline: 'Revenue leader who builds disciplined enterprise pipelines and mentor-driven sales teams.',
    summary: 'Eight years across retail-tech and fintech sales environments. Strong on qualification quality, cleaner forecasting, and coaching newer sellers into repeatable execution.',
    location: 'Bengaluru, Karnataka',
    city: 'Bengaluru',
    state: 'Karnataka',
    currentRole: 'Senior Account Executive',
    currentCompany: 'VerveRetail Cloud',
    totalExperienceMonths: 98,
    domains: ['Sales & GTM', 'Operations'],
    preferredLocations: ['Bengaluru', 'Mumbai', 'Remote - India'],
    expectedSalary: [2600000, 3400000],
    noticePeriodDays: 30,
    openToWork: true,
    careerStage: 'senior',
    generation: 'millennial',
    aadhaarSeed: 'PRIYA-1122',
    digilockerLinked: true,
    offerReliabilityPct: 97,
    noShowCount: 0,
    ghostingCount: 0,
    avgEmployerRating: 4.5,
    experiences: [
      { companySlug: 'ververetail-cloud', companyName: 'VerveRetail Cloud', jobTitle: 'Senior Account Executive', department: 'Sales & GTM', startDate: '2022-03-01', endDate: null, isCurrent: true, verified: true, description: 'Owned mid-market and enterprise retail accounts across the west region with a focus on complex multi-stakeholder cycles.', achievements: ['Closed INR 4.8 Cr in annualized pipeline within the first full year.', 'Built deal-review templates later adopted across the sales pod.'], performance: { targetPct: 112, attendancePct: 98, employerRating: 4.6 } },
      { companySlug: 'northstar-commerce', companyName: 'Northstar Commerce', jobTitle: 'Account Executive', department: 'Sales & GTM', startDate: '2019-01-01', endDate: '2022-02-15', isCurrent: false, verified: true, description: 'Managed growth accounts and regional pipeline reviews while improving forecast accuracy for the inside sales team.', achievements: ['Reduced stage-slippage by introducing a simpler qualification checklist.', 'Mentored three junior reps into quota-carrying roles.'], performance: { targetPct: 106, attendancePct: 99, employerRating: 4.4 } },
    ],
    skills: [['Consultative Selling', 88, ['enterprise', 'discovery', 'stakeholder']], ['Forecasting', 83, ['pipeline', 'reviews', 'accuracy']], ['Pipeline Coaching', 85, ['manager', 'enablement', 'rituals']], ['Negotiation', 80, ['commercial', 'renewals', 'multi-stakeholder']]],
    docs: [['aadhaar', 'Masked Aadhaar', true], ['degree', 'B.Com Degree', true], ['certificate', 'Strategic Selling Certification', true]],
    learning: [['discovery-calls-that-convert', 'completed', 100, 4, 22], ['high-stakes-interview-stories', 'completed', 100, 4, 20], ['profile-optimization-role-fit', 'in_progress', 58, 3, 0]],
  },
  {
    fullName: 'Kabir Mehta',
    email: 'kabir.mehta+candidate@demo.oneqik',
    phone: '9876500002',
    headline: 'Full-stack engineer focused on shipping clear workflow products with strong frontend quality.',
    summary: 'Hands-on engineer with strong frontend depth and enough backend range to ship product-facing workflows without handoff confusion.',
    location: 'Pune, Maharashtra',
    city: 'Pune',
    state: 'Maharashtra',
    currentRole: 'Senior Frontend Engineer',
    currentCompany: 'AptEdge Software',
    totalExperienceMonths: 68,
    domains: ['Technology', 'Product'],
    preferredLocations: ['Pune', 'Bengaluru', 'Remote - India'],
    expectedSalary: [2400000, 3200000],
    noticePeriodDays: 45,
    openToWork: true,
    careerStage: 'mid',
    generation: 'millennial',
    aadhaarSeed: 'KABIR-2244',
    digilockerLinked: true,
    offerReliabilityPct: 95,
    noShowCount: 0,
    ghostingCount: 0,
    avgEmployerRating: 4.4,
    experiences: [
      { companySlug: 'aptedge-software', companyName: 'AptEdge Software', jobTitle: 'Senior Frontend Engineer', department: 'Technology', startDate: '2022-01-10', endDate: null, isCurrent: true, verified: true, description: 'Leads frontend quality for customer-facing workflow surfaces, shared UI patterns, and performance-sensitive product areas.', achievements: ['Reduced repeat UI regressions by formalizing release checklists and component ownership.', 'Partnered with product managers to simplify several brittle workflow states before implementation.'], performance: { targetPct: 108, attendancePct: 97, employerRating: 4.5 } },
      { companySlug: 'peoplepulse-labs', companyName: 'PeoplePulse Labs', jobTitle: 'Frontend Engineer', department: 'Technology', startDate: '2020-02-01', endDate: '2021-12-20', isCurrent: false, verified: true, description: 'Built recruiter-facing dashboards and profile workflows in a people-tech product environment.', achievements: ['Shipped a new dashboard shell that cut navigation friction for recruiters.', 'Improved accessibility issues on the core workflow surface.'], performance: { targetPct: 103, attendancePct: 99, employerRating: 4.3 } },
    ],
    skills: [['React', 91, ['frontend', 'state', 'ui-quality']], ['Next.js', 86, ['routing', 'product-ui', 'ssr']], ['Node.js', 78, ['api', 'integration', 'services']], ['Accessibility', 82, ['semantics', 'keyboard', 'ux']]],
    docs: [['aadhaar', 'Masked Aadhaar', true], ['degree', 'B.Tech Degree', true], ['certificate', 'Frontend Systems Design Workshop', true]],
    learning: [['business-acumen-non-finance-roles', 'completed', 100, 4, 16], ['leadership-basics-first-time-managers', 'in_progress', 42, 2, 0]],
  },
  {
    fullName: 'Aisha Thomas',
    email: 'aisha.thomas+candidate@demo.oneqik',
    phone: '9876500003',
    headline: 'People partner with a bias for structured hiring, manager coaching, and calmer org operations.',
    summary: 'HR and recruiting partner who improves hiring discipline, manager calibration, and candidate experience in scaling teams.',
    location: 'Chennai, Tamil Nadu',
    city: 'Chennai',
    state: 'Tamil Nadu',
    currentRole: 'Talent Acquisition Partner',
    currentCompany: 'Meridian HealthTech',
    totalExperienceMonths: 74,
    domains: ['Human Resources', 'Operations'],
    preferredLocations: ['Chennai', 'Bengaluru', 'Remote - India'],
    expectedSalary: [1600000, 2200000],
    noticePeriodDays: 30,
    openToWork: true,
    careerStage: 'senior',
    generation: 'millennial',
    aadhaarSeed: 'AISHA-7788',
    digilockerLinked: true,
    offerReliabilityPct: 96,
    noShowCount: 0,
    ghostingCount: 0,
    avgEmployerRating: 4.6,
    experiences: [
      { companySlug: 'meridian-healthtech', companyName: 'Meridian HealthTech', jobTitle: 'Talent Acquisition Partner', department: 'Human Resources', startDate: '2021-07-01', endDate: null, isCurrent: true, verified: true, description: 'Owns structured hiring for product, operations, and corporate roles while improving interviewer consistency and hiring manager readiness.', achievements: ['Reduced average interview turnaround time by introducing clearer panel ownership.', 'Built a recruiter calibration ritual that improved signal quality across teams.'], performance: { targetPct: 111, attendancePct: 99, employerRating: 4.7 } },
      { companySlug: 'truenorth-hr-cloud', companyName: 'TrueNorth HR Cloud', jobTitle: 'Recruitment Specialist', department: 'Human Resources', startDate: '2018-05-01', endDate: '2021-06-15', isCurrent: false, verified: true, description: 'Handled structured recruiting for customer-facing and corporate roles in a high-growth HR-tech environment.', achievements: ['Created a tighter scorecard format for hiring managers.', 'Improved candidate experience feedback scores across three quarters.'], performance: { targetPct: 105, attendancePct: 98, employerRating: 4.5 } },
    ],
    skills: [['Structured Hiring', 89, ['interview-design', 'scorecards', 'signal-quality']], ['Stakeholder Management', 86, ['hiring-managers', 'alignment', 'communication']], ['Interview Design', 84, ['panel', 'rubrics', 'debrief']], ['Candidate Experience', 88, ['follow-through', 'process', 'communication']]],
    docs: [['aadhaar', 'Masked Aadhaar', true], ['degree', 'MBA HR', true], ['certificate', 'Structured Interviewing Program', true]],
    learning: [['executive-communication-growth-teams', 'completed', 100, 4, 18], ['profile-optimization-role-fit', 'completed', 100, 4, 14], ['leadership-basics-first-time-managers', 'in_progress', 35, 2, 0]],
  },
  {
    fullName: 'Rohit Verma',
    email: 'rohit.verma+candidate@demo.oneqik',
    phone: '9876500004',
    headline: 'Operations analyst who likes bringing reporting clarity and service discipline into messy workflows.',
    summary: 'Operations generalist with logistics and service experience, strongest in reporting hygiene, process visibility, and operational follow-through.',
    location: 'Noida, Uttar Pradesh',
    city: 'Noida',
    state: 'Uttar Pradesh',
    currentRole: 'Operations Analyst',
    currentCompany: 'SwiftRoute Logistics',
    totalExperienceMonths: 39,
    domains: ['Operations', 'Finance', 'BPO / Contact Centre'],
    preferredLocations: ['Noida', 'Gurugram', 'Chandigarh'],
    expectedSalary: [900000, 1250000],
    noticePeriodDays: 20,
    openToWork: true,
    careerStage: 'mid',
    generation: 'millennial',
    aadhaarSeed: 'ROHIT-5566',
    digilockerLinked: false,
    offerReliabilityPct: 93,
    noShowCount: 0,
    ghostingCount: 1,
    avgEmployerRating: 4.1,
    experiences: [
      { companySlug: 'swiftroute-logistics', companyName: 'SwiftRoute Logistics', jobTitle: 'Operations Analyst', department: 'Operations', startDate: '2023-02-01', endDate: null, isCurrent: true, verified: true, description: 'Runs reporting cadences, exception reviews, and operational issue tracking for logistics teams handling time-sensitive delivery workflows.', achievements: ['Built a daily exception tracker that reduced unresolved cases at end of shift.', 'Improved escalation categorization across dispatch operations.'], performance: { targetPct: 101, attendancePct: 96, employerRating: 4.2 } },
      { companySlug: 'orbitserve-global', companyName: 'OrbitServe Global', jobTitle: 'Senior Customer Support Associate', department: 'BPO / Contact Centre', startDate: '2021-02-01', endDate: '2023-01-10', isCurrent: false, verified: true, description: 'Handled service escalations and queue discipline for customer operations accounts with strict response windows.', achievements: ['Trained new associates on escalation documentation standards.', 'Maintained strong service-quality scores during a high-volume ramp.'], performance: { targetPct: 98, attendancePct: 97, employerRating: 4.0 } },
    ],
    skills: [['Operational Reporting', 82, ['dashboards', 'metrics', 'ops-reviews']], ['Escalation Handling', 77, ['service', 'queue-management', 'follow-through']], ['Excel', 84, ['analysis', 'tracking', 'reporting']], ['Process Mapping', 76, ['sops', 'handoffs', 'improvement']]],
    docs: [['degree', 'BBA Degree', true], ['certificate', 'Advanced Excel for Operations', true]],
    learning: [['business-acumen-non-finance-roles', 'completed', 100, 4, 16], ['profile-optimization-role-fit', 'completed', 100, 4, 14], ['executive-communication-growth-teams', 'in_progress', 36, 2, 0]],
  },
  {
    fullName: 'Meera Kulkarni',
    email: 'meera.kulkarni+candidate@demo.oneqik',
    phone: '9876500005',
    headline: 'Product and growth operator who turns messy launches into cleaner execution and clearer outcomes.',
    summary: 'Cross-functional operator with product-ops and growth execution experience, especially strong at launch rhythm, campaign coordination, and role-fit storytelling.',
    location: 'Mumbai, Maharashtra',
    city: 'Mumbai',
    state: 'Maharashtra',
    currentRole: 'Product Operations Specialist',
    currentCompany: 'BrightPath Learning',
    totalExperienceMonths: 53,
    domains: ['Product', 'Marketing', 'Operations'],
    preferredLocations: ['Mumbai', 'Bengaluru', 'Remote - India'],
    expectedSalary: [1500000, 2100000],
    noticePeriodDays: 30,
    openToWork: true,
    careerStage: 'mid',
    generation: 'millennial',
    aadhaarSeed: 'MEERA-9900',
    digilockerLinked: true,
    offerReliabilityPct: 94,
    noShowCount: 0,
    ghostingCount: 0,
    avgEmployerRating: 4.3,
    experiences: [
      { companySlug: 'brightpath-learning', companyName: 'BrightPath Learning', jobTitle: 'Product Operations Specialist', department: 'Product', startDate: '2022-06-01', endDate: null, isCurrent: true, verified: true, description: 'Supports launches, cross-functional execution tracking, and issue management for student-facing product releases and operational changes.', achievements: ['Built a tighter launch brief format that reduced avoidable dependencies.', 'Improved weekly launch-readiness reporting across product and operations teams.'], performance: { targetPct: 109, attendancePct: 98, employerRating: 4.4 } },
      { companySlug: 'marketmint-digital', companyName: 'MarketMint Digital', jobTitle: 'Growth Operations Associate', department: 'Marketing', startDate: '2020-03-01', endDate: '2022-05-15', isCurrent: false, verified: true, description: 'Coordinated campaign operations and reporting for growth initiatives spanning performance, content, and landing page updates.', achievements: ['Introduced a campaign QA checklist that reduced launch-day issues.', 'Improved weekly reporting consistency for growth reviews.'], performance: { targetPct: 104, attendancePct: 99, employerRating: 4.2 } },
    ],
    skills: [['Product Operations', 87, ['launches', 'rituals', 'dependencies']], ['Campaign Reporting', 79, ['tracking', 'dashboards', 'analysis']], ['Stakeholder Management', 82, ['alignment', 'follow-through', 'clarity']], ['Process Design', 81, ['workflows', 'reviews', 'execution']]],
    docs: [['aadhaar', 'Masked Aadhaar', true], ['degree', 'BMS Degree', true], ['certificate', 'Product Operations Playbook', true]],
    learning: [['profile-optimization-role-fit', 'completed', 100, 4, 14], ['executive-communication-growth-teams', 'in_progress', 53, 3, 0], ['leadership-basics-first-time-managers', 'completed', 100, 4, 24]],
  },
];

const COMMUNITY_POSTS = [
  { authorEmail: 'priya.sharma+candidate@demo.oneqik', role: 'candidate', type: 'post', title: 'What changed when I stopped overselling in discovery', content: 'The quality of my pipeline changed when I listened for operational pain instead of racing to pitch features. Slower early conversations gave me cleaner next steps and much better forecast confidence.', tags: ['Sales Execution', 'Communication'], anonymous: false, alias: 'Revenue professional - 8 yrs', upvotes: 38, views: 460 },
  { authorEmail: 'kabir.mehta+candidate@demo.oneqik', role: 'candidate', type: 'question', title: 'How much product context should a frontend engineer ask for before implementation starts?', content: 'I keep seeing tickets that are detailed on UI states but thin on business rules. How do you ask sharper product questions without sounding obstructive?', tags: ['Technology', 'Product'], anonymous: false, alias: 'Frontend engineer · 5 yrs', upvotes: 27, views: 389 },
  { authorEmail: 'aisha.thomas+candidate@demo.oneqik', role: 'candidate', type: 'poll', title: 'Which interview-stage gap frustrates candidates most right now?', content: 'Curious what people feel most often breaks the experience after a process starts moving.', tags: ['Interview Readiness', 'Human Resources'], anonymous: false, alias: 'Talent partner · 6 yrs', upvotes: 42, views: 512 },
  { authorEmail: 'rohit.verma+candidate@demo.oneqik', role: 'candidate', type: 'post', title: 'A small ops habit that helped me a lot', content: 'If a repeated issue needs three explanations, it probably needs a tracker, not another meeting.', tags: ['Operations', 'Business Acumen'], anonymous: true, alias: 'Operations analyst - 3 yrs', upvotes: 25, views: 280 },
  { authorEmail: 'meera.kulkarni+candidate@demo.oneqik', role: 'candidate', type: 'post', title: 'Launches got better when our briefs got shorter', content: 'Moving from long documents to a tighter launch brief plus a dependency tracker cut a lot of avoidable confusion for us.', tags: ['Product Careers', 'Communication'], anonymous: false, alias: 'Product ops specialist - 4 yrs', upvotes: 31, views: 344 },
  { authorEmail: 'sneha.kapoor@aptedge.software', role: 'employer', type: 'post', title: 'What makes a candidate follow-up stand out to hiring teams', content: 'A strong follow-up references one concrete discussion point, clarifies one relevant strength, and keeps the tone calm. The best ones make it easier for the panel to remember you, not guilty for forgetting you.', tags: ['Interview Readiness', 'Employer Expectations'], anonymous: false, alias: 'Hiring leader', upvotes: 44, views: 601 },
  { authorEmail: 'kriti.bansal@cloudmosaic.ai', role: 'employer', type: 'question', title: 'What makes implementation talent stand out in SaaS hiring now?', content: 'We meet many strong operators, but the people who stand out can translate workflow mess into a calm plan. Curious what others look for in implementation roles.', tags: ['Operations', 'SaaS'], anonymous: false, alias: 'Talent partner', upvotes: 18, views: 233 },
  { authorEmail: 'vaishali.reddy@novadesk.solutions', role: 'employer', type: 'poll', title: 'What matters most in an early PM interview?', content: 'We are reviewing our PM screening. Which signal should carry the most weight in the first serious conversation?', tags: ['Product', 'Interview Readiness'], anonymous: false, alias: 'Talent acquisition lead', upvotes: 16, views: 198 },
  { authorEmail: 'namrata.joshi@truenorthhrcloud.com', role: 'employer', type: 'post', title: 'Why we now share hiring timelines much earlier', content: 'Our process quality improved when we started telling candidates what would happen after each round, even when the answer was imperfect. Uncertainty creates more friction than most teams realize.', tags: ['Application Feedback', 'Employer Expectations'], anonymous: false, alias: 'Head of talent', upvotes: 22, views: 248 },
  { authorEmail: 'mehul.shah@ledgerlane.finance', role: 'employer', type: 'post', title: 'Commercial candidates who stand out in fintech', content: 'The strongest revenue candidates we meet can connect customer pain to business impact without losing the operational detail that risk teams care about.', tags: ['Sales Execution', 'Fintech'], anonymous: false, alias: 'Senior talent partner', upvotes: 20, views: 214 },
  { authorEmail: 'rohit.verma+candidate@demo.oneqik', role: 'candidate', type: 'question', title: 'Are BPO voice roles still a good first job for freshers?', content: 'I am mentoring two cousins who need their first stable job. The concern is whether voice support gives useful career capital or traps them too early.', tags: ['BPO Jobs', 'Fresher Hiring'], anonymous: false, alias: 'Operations analyst - 3 yrs', upvotes: 29, views: 371 },
  { authorEmail: 'meera.kulkarni+candidate@demo.oneqik', role: 'candidate', type: 'question', title: 'How should freshers ask for application feedback without sounding impatient?', content: 'Many entry-level candidates get silence after interviews. What is the right way to ask for feedback and still sound professional?', tags: ['Fresher Hiring', 'Application Feedback'], anonymous: false, alias: 'Product ops specialist - 4 yrs', upvotes: 34, views: 418 },
  { authorEmail: 'priya.sharma+candidate@demo.oneqik', role: 'candidate', type: 'question', title: 'What is a reasonable way to negotiate salary after a verbal offer?', content: 'I want to negotiate without making the recruiter feel I am shopping the offer around. What language has worked for people here?', tags: ['Salary Negotiation', 'Interview Readiness'], anonymous: false, alias: 'Revenue professional - 8 yrs', upvotes: 41, views: 530 },
];

const COMMUNITY_COMMENTS = {
  'What changed when I stopped overselling in discovery': [
    ['aisha.thomas+candidate@demo.oneqik', 'candidate', 'This maps closely to hiring too. The better the early questions, the calmer the later stages.'],
    ['kriti.bansal@cloudmosaic.ai', 'employer', 'The best sales candidates we meet usually sound more curious than rehearsed.'],
  ],
  'How much product context should a frontend engineer ask for before implementation starts?': [
    ['meera.kulkarni+candidate@demo.oneqik', 'candidate', 'Ask for one ideal happy path and one edge case. That usually unlocks the real product context quickly.'],
    ['vaishali.reddy@novadesk.solutions', 'employer', 'I like when engineers ask what can break the workflow, not just what the happy path should look like.'],
  ],
  'Which interview-stage gap frustrates candidates most right now?': [
    ['priya.sharma+candidate@demo.oneqik', 'candidate', 'Changing role scope late in the process is still the worst for me.'],
  ],
  'Why we now share hiring timelines much earlier': [
    ['aisha.thomas+candidate@demo.oneqik', 'candidate', 'This alone changes how candidates interpret silence.'],
  ],
  'How should freshers ask for application feedback without sounding impatient?': [
    ['sneha.kapoor@aptedge.software', 'employer', 'A short note after the stated timeline is reasonable. Include thanks, one line of context, and a clear ask.'],
    ['aisha.thomas+candidate@demo.oneqik', 'candidate', 'I tell freshers to ask for one improvement area rather than a full review. It gets better responses.'],
  ],
  'What is a reasonable way to negotiate salary after a verbal offer?': [
    ['mehul.shah@ledgerlane.finance', 'employer', 'Anchor it in role scope and market evidence, not personal pressure. That keeps the conversation professional.'],
  ],
};

const COMMUNITY_ANSWERS = {
  'How much product context should a frontend engineer ask for before implementation starts?': [
    { authorEmail: 'meera.kulkarni+candidate@demo.oneqik', role: 'candidate', body: 'Ask for the decision the user is trying to make, the state that blocks that decision, and the edge case the team is most worried about. Those three prompts usually reveal the real business rule behind the UI.', upvotes: 19 },
    { authorEmail: 'vaishali.reddy@novadesk.solutions', role: 'employer', body: 'As a hiring signal, I like engineers who separate "needed to ship" from "nice context". It shows judgment. A crisp question list with assumptions is better than pausing the whole ticket.', upvotes: 14 },
  ],
  'What makes implementation talent stand out in SaaS hiring now?': [
    { authorEmail: 'rohit.verma+candidate@demo.oneqik', role: 'candidate', body: 'The strongest implementation people I have worked with write down the messy workflow before proposing the clean one. They are not just good with customers; they are good at making ambiguity visible.', upvotes: 12 },
    { authorEmail: 'kabir.mehta+candidate@demo.oneqik', role: 'candidate', body: 'Technical curiosity helps too. They do not need to code, but they should understand integrations, data quality, permissions, and where handoffs usually break.', upvotes: 9 },
  ],
  'Are BPO voice roles still a good first job for freshers?': [
    { authorEmail: 'aisha.thomas+candidate@demo.oneqik', role: 'candidate', body: 'They can be a good first step when the company has structured training, fair shifts, and a path into QA, workforce management, customer success, or team lead roles. The risk is staying too long without building evidence beyond call volume.', upvotes: 21 },
    { authorEmail: 'namrata.joshi@truenorthhrcloud.com', role: 'employer', body: 'Freshers should ask about ramp targets, shift policy, escalation training, and internal movement. A good BPO job teaches communication under pressure; a weak one only teaches endurance.', upvotes: 17 },
  ],
  'How should freshers ask for application feedback without sounding impatient?': [
    { authorEmail: 'sneha.kapoor@aptedge.software', role: 'employer', body: 'Wait until the timeline shared by the recruiter has passed. Then send a note that says you are still interested, ask whether there is an update, and request one area to improve if the team has closed the role.', upvotes: 22 },
  ],
  'What is a reasonable way to negotiate salary after a verbal offer?': [
    { authorEmail: 'mehul.shah@ledgerlane.finance', role: 'employer', body: 'Thank them first, restate interest, then say the scope and market range make you more comfortable around a specific number. Give a number, not a vague "better package" request.', upvotes: 24 },
    { authorEmail: 'priya.sharma+candidate@demo.oneqik', role: 'candidate', body: 'What helped me was asking about the full structure first: fixed, variable, joining bonus, review cycle, and benefits. Sometimes the negotiation space is not only base pay.', upvotes: 16 },
  ],
};

const POLL_OPTIONS = {
  'Which interview-stage gap frustrates candidates most right now?': [
    ['No feedback after strong rounds', 18],
    ['Late reschedules without context', 11],
    ['Role scope keeps changing mid-process', 9],
    ['No idea what happens after interview', 14],
  ],
  'What matters most in an early PM interview?': [
    ['Clear problem framing', 16],
    ['Structured thinking under ambiguity', 12],
    ['Execution detail from past launches', 10],
    ['Stakeholder communication', 8],
  ],
};

const APPLICATION_PLANS = {
  'priya.sharma+candidate@demo.oneqik': [['ledgerlane-finance', 'Sales & GTM', 'offer_sent', 18, 91, 'Strong commercial framing and structured deal reviews.'], ['northstar-commerce', 'Sales & GTM', 'joined', 280, 88, 'Completed process and joined in a prior cycle.'], ['cloudmosaic-saas', 'Customer Success', 'interview_done', 11, 80, 'Final round completed; waiting for sign-off.'], ['finova-stack', 'Sales & GTM', 'shortlisted', 8, 84, 'Profile aligned on stakeholder handling and funnel quality.'], ['ververetail-cloud', 'Sales & GTM', 'withdrawn', 34, 74, 'Candidate withdrew after scope discussion.', 'Candidate prioritised a more strategic role.'], ['aptedge-software', 'Sales & GTM', 'under_review', 5, 78, 'Hiring team reviewing discovery depth.'], ['marketmint-digital', 'Marketing', 'rejected', 26, 66, 'Role required heavier brand-campaign execution.', 'Search leaned toward consumer-brand launch depth.'], ['novadesk-solutions', 'Sales & GTM', 'submitted', 2, 82, 'Fresh application awaiting first recruiter review.'], ['northstar-commerce', 'Operations', 'on_hold', 13, 72, 'Role has headcount approval delay.'], ['careaxis-health-systems', 'Customer Success', 'offer_accepted', 21, 86, 'Offer accepted pending joining date confirmation.']],
  'kabir.mehta+candidate@demo.oneqik': [['atlasgrid-systems', 'Technology', 'interview_scheduled', 7, 89, 'Strong frontend depth and thoughtful implementation examples.'], ['cloudmosaic-saas', 'Technology', 'offer_sent', 16, 92, 'Panel liked his UX judgment and product engineering range.'], ['aptedge-software', 'Technology', 'joined', 400, 90, 'Joined successfully after a strong panel process.'], ['peoplepulse-labs', 'Technology', 'shortlisted', 9, 84, 'Strong fit on workflow UI quality.'], ['meridian-healthtech', 'Product', 'rejected', 23, 71, 'Product role needed more healthcare domain depth.', 'Role leaned heavily toward domain research.'], ['novadesk-solutions', 'Technology', 'under_review', 4, 81, 'Application in review with engineering leadership.'], ['truenorth-hr-cloud', 'Technology', 'submitted', 2, 79, 'Recently applied.'], ['careaxis-health-systems', 'Technology', 'on_hold', 14, 77, 'Role paused while team finalises ownership.']],
  'aisha.thomas+candidate@demo.oneqik': [['peoplepulse-labs', 'Human Resources', 'offer_sent', 15, 90, 'Strong recruiter calibration and manager partnership.'], ['truenorth-hr-cloud', 'Human Resources', 'joined', 520, 87, 'Historical joined application at a previous employer.'], ['meridian-healthtech', 'Human Resources', 'interview_done', 12, 88, 'Final interviews completed; team aligning on scope.'], ['brightpath-learning', 'Human Resources', 'shortlisted', 6, 82, 'Profile aligned on hiring-ops structure.'], ['skillbridge-campus', 'Operations', 'under_review', 5, 74, 'Cross-functional people-ops angle being assessed.'], ['northstar-commerce', 'Human Resources', 'rejected', 24, 69, 'Role moved toward senior org-design depth.', 'Search shifted to a more senior people-business partnering profile.'], ['careaxis-health-systems', 'Operations', 'submitted', 3, 73, 'Early application.']],
  'rohit.verma+candidate@demo.oneqik': [['swiftroute-logistics', 'Operations', 'interview_scheduled', 9, 84, 'Strong logistics reporting background.'], ['orbitserve-global', 'BPO / Contact Centre', 'joined', 460, 80, 'Historical joined application for the support program.'], ['opsharbor-services', 'Operations', 'under_review', 4, 78, 'Reviewing fit for reporting-heavy operations role.'], ['parcelpilot-networks', 'Operations', 'shortlisted', 7, 82, 'Profile aligned on dispatch visibility and exception handling.'], ['finova-stack', 'Finance', 'rejected', 21, 63, 'Basic fit but finance controls depth was thinner.', 'Role required stronger accounting-cycle ownership.'], ['swiftroute-logistics', 'Finance', 'on_hold', 18, 66, 'Finance operations opening temporarily paused.'], ['orbitserve-global', 'Operations', 'submitted', 2, 76, 'Fresh application pending queue review.']],
  'meera.kulkarni+candidate@demo.oneqik': [['brightpath-learning', 'Product', 'joined', 330, 85, 'Historical joined application for product operations.'], ['marketmint-digital', 'Marketing', 'offer_sent', 13, 87, 'Strong execution and campaign coordination examples.'], ['northstar-commerce', 'Operations', 'interview_done', 10, 83, 'Final discussion completed with the operations lead.'], ['cloudmosaic-saas', 'Product', 'shortlisted', 8, 81, 'Good product-ops and launch experience.'], ['careaxis-health-systems', 'Product', 'under_review', 6, 79, 'Team reviewing product and domain translation fit.'], ['marketmint-digital', 'Operations', 'submitted', 1, 76, 'Recently applied.'], ['novadesk-solutions', 'Product', 'rejected', 29, 70, 'Search shifted toward deeper B2B PM ownership.', 'Role required end-to-end roadmap ownership beyond current scope.'], ['skillbridge-campus', 'Marketing', 'on_hold', 14, 74, 'Role paused during budget review.']],
};

const STATUS_PATHS = {
  submitted: ['submitted'],
  under_review: ['submitted', 'under_review'],
  shortlisted: ['submitted', 'under_review', 'shortlisted'],
  interview_scheduled: ['submitted', 'under_review', 'shortlisted', 'interview_scheduled'],
  interview_done: ['submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'interview_done'],
  on_hold: ['submitted', 'under_review', 'on_hold'],
  offer_sent: ['submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'interview_done', 'offer_sent'],
  offer_accepted: ['submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'interview_done', 'offer_sent', 'offer_accepted'],
  joined: ['submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'interview_done', 'offer_sent', 'offer_accepted', 'joined'],
  rejected: ['submitted', 'under_review', 'rejected'],
  withdrawn: ['submitted', 'under_review', 'withdrawn'],
};

function buildJobDescription(company, blueprint) {
  return `${company.name} is hiring a ${blueprint.title} to strengthen ${blueprint.department.toLowerCase()} execution for a growing ${company.industry.toLowerCase()} business based in ${company.location}.

This role sits close to real operating outcomes. The person joining will work across teams, turn ambiguity into cleaner decisions, and help the business move with better discipline instead of more noise.

We are looking for someone who can bring relevant functional depth, communicate clearly with stakeholders, and operate well inside a business that is scaling process maturity along with growth.`;
}

function buildResponsibilities(company, blueprint) {
  const lines = {
    'Sales & GTM': ['Own a focused portion of pipeline generation and progression with consistent review discipline.', 'Partner with marketing, operations, and leadership to tighten qualification quality and forecast accuracy.', 'Translate customer pain points into commercially credible next steps.'],
    Technology: ['Ship stable workflow improvements with strong product and engineering collaboration.', 'Balance implementation speed with maintainability, testing discipline, and system clarity.', 'Help shape better engineering rituals around quality, visibility, and delivery planning.'],
    Product: ['Turn user and business context into practical prioritization and execution plans.', 'Work closely with design, engineering, and operations to keep launches clear and coordinated.', 'Improve product judgment by grounding decisions in outcomes and not just tickets.'],
    Operations: ['Run structured daily and weekly reviews for workflows, queues, or implementation readiness.', 'Spot avoidable failure patterns and turn them into cleaner processes and clearer ownership.', 'Improve service quality through reporting, issue tracking, and follow-through.'],
    'Human Resources': ['Improve hiring or people-process discipline with better structure, communication, and follow-through.', 'Partner with hiring managers to raise signal quality and reduce avoidable process friction.', 'Keep candidate and employee experience calm, clear, and well-organized.'],
    Finance: ['Maintain clean reporting rhythms and reliable decision support for business leaders.', 'Surface risk, variance, and process gaps early with concise context.', 'Bring better financial discipline into cross-functional planning and reviews.'],
    Marketing: ['Own campaign or content execution with sharper planning and stronger feedback loops.', 'Translate goals into practical work plans, measurement, and iteration cadence.', 'Work cross-functionally to improve message quality and launch readiness.'],
    'BPO / Contact Centre': ['Deliver queue discipline, quality adherence, and escalations handling in a service-heavy environment.', 'Coach frontline performance with specific feedback and documented process expectations.', 'Keep service reliability visible through accurate reporting and issue ownership.'],
    'Customer Success': ['Drive onboarding, renewals, and account confidence through clearer execution and stakeholder management.', 'Spot risk early and keep customer conversations grounded in outcomes and adoption.', 'Partner with product and operations when customer workflows need translation or escalation.'],
  };

  return (lines[blueprint.department] || lines.Operations).join('\n');
}

function buildBenefits(company, blueprint) {
  return [
    `${blueprint.work_mode === 'remote' ? 'Remote-first' : blueprint.work_mode === 'hybrid' ? 'Hybrid work rhythm' : 'Structured on-site support'} with clear team expectations`,
    'Health insurance and annual learning budget',
    'Manager-led feedback cadence and role-specific onboarding support',
  ].join('\n');
}

function getQuestionTemplates(blueprint) {
  const templates = {
    'Sales & GTM': [['Walk us through a recent deal or sales cycle where you had to win stakeholder confidence before talking solution.', 'video'], ['How do you keep pipeline quality clean when activity volume starts masking weak opportunities?', 'text']],
    Technology: [['Describe a feature or workflow you shipped recently and the implementation trade-offs you made.', 'video'], ['How do you get clarity when business rules are thin but delivery expectations are already moving?', 'text']],
    Product: [['Tell us about a product decision where you had to balance customer pain, execution cost, and business urgency.', 'video'], ['How do you make sure launch plans are clear enough for engineering and operations to act on?', 'text']],
    Operations: [['Describe a workflow you improved. What was messy before, and what changed after?', 'video'], ['How do you decide what deserves escalation versus what should stay inside the operating rhythm?', 'text']],
    'Human Resources': [['Share an example of a hiring or people-process issue you helped stabilize with better structure.', 'video'], ['What does a strong hiring-manager calibration look like in practice for you?', 'text']],
    Finance: [['Tell us about a reporting or planning situation where you had to explain variance clearly to non-finance stakeholders.', 'video'], ['How do you keep financial detail clear without overwhelming the operating team?', 'text']],
    Marketing: [['Describe a campaign or content launch where cleaner execution improved results.', 'video'], ['How do you judge whether a message or campaign direction is actually working early?', 'text']],
    'BPO / Contact Centre': [['Tell us about a service issue or queue problem you helped stabilize under pressure.', 'video'], ['How do you coach consistency without slowing the floor down?', 'text']],
    'Customer Success': [['Describe a customer situation where strong expectation-setting changed the outcome.', 'video'], ['How do you spot renewal or adoption risk before it turns into escalation?', 'text']],
  };
  return templates[blueprint.department] || templates.Operations;
}

function buildAnswer(candidate, questionText) {
  return `${candidate.fullName.split(' ')[0]} would answer this by grounding the example in recent work, a clear problem statement, and the measurable change created after the intervention. Question context: ${questionText}`;
}

async function clearExistingData() {
  const conn = await pool.getConnection();
  const tables = [
    'community_poll_votes', 'community_poll_options', 'community_comments', 'community_reactions', 'community_post_topics', 'community_answers', 'community_post_votes', 'community_posts', 'community_topics',
    'notifications', 'application_status_history', 'prescreening_answers', 'prescreening_questions', 'job_applications',
    'job_postings', 'score_events', 'career_scores', 'course_enrollments', 'course_modules', 'courses',
    'skill_assessments', 'performance_records', 'achievements', 'work_experiences', 'digilocker_documents',
    'company_reviews', 'appraisal_data', 'career_ladders', 'company_scores', 'company_intel_history',
    'hrm_connections', 'employers', 'candidates', 'companies', 'users',
  ];

  try {
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of tables) {
      await conn.execute(`DELETE FROM ${table}`);
    }
    await conn.execute('ALTER TABLE job_applications AUTO_INCREMENT = 1');
    await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    conn.release();
  }
}

async function seedCourses() {
  const specs = [
    ['executive-communication-growth-teams', 'Executive Communication for Growth Teams', 'Communication', 'mid', 18, 4],
    ['high-stakes-interview-stories', 'High-Stakes Interview Stories', 'Interview Readiness', 'mid', 20, 4],
    ['discovery-calls-that-convert', 'Discovery Calls That Convert', 'Sales Execution', 'mid', 22, 4],
    ['business-acumen-non-finance-roles', 'Business Acumen for Non-Finance Roles', 'Business Acumen', 'mid', 16, 4],
    ['profile-optimization-role-fit', 'Profile Optimization for Better Role Fit', 'Profile Optimization', 'entry', 14, 4],
    ['leadership-basics-first-time-managers', 'Leadership Basics for First-Time Managers', 'Leadership Basics', 'senior', 24, 4],
  ];
  const coursesBySlug = new Map();

  for (const [slug, title, domain, level, durationMins, reward] of specs) {
    const courseId = uuid();
    const library = COURSE_LIBRARY[domain];

    await query(
      `INSERT INTO courses
        (id, title, slug, domain, sub_domain, level, career_target, description, duration_mins, module_count, price_inr, is_certified, score_pts_reward, xp_reward, provider, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?, 'Careers by OneQik', 'published')`,
      [courseId, title, slug, domain, library.subDomain, level, 'Career acceleration', library.description, durationMins, library.lessons.length, reward * 3, reward * 8]
    );

    for (let index = 0; index < library.lessons.length; index += 1) {
      const [lessonTitle, contentType, lessonDuration] = library.lessons[index];
      await query(
        `INSERT INTO course_modules
          (id, course_id, title, description, content_type, content_url, duration_mins, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuid(), courseId, lessonTitle, `${lessonTitle} for ${title}.`, contentType, `https://demo.oneqik.learn/${slug}/module-${index + 1}`, lessonDuration, index + 1]
      );
    }

    coursesBySlug.set(slug, { id: courseId, slug, title, domain });
  }

  return coursesBySlug;
}

async function seedCompaniesAndEmployers(passwordHash) {
  const companiesBySlug = new Map();
  const employersByEmail = new Map();
  const usersByEmail = new Map();

  for (const company of COMPANIES) {
    const userId = uuid();
    const companyId = uuid();
    const employerId = uuid();
    const companyLocation = getLocationSpec(company.location);

    await query(
      `INSERT INTO users (id, email, phone, password_hash, \`role\`, is_verified, is_active, created_at)
       VALUES (?, ?, NULL, ?, 'employer', 1, 1, ?)`,
      [userId, company.recruiterEmail, passwordHash, toSqlDateTime(isoDate(120))]
    );

    await query(
      `INSERT INTO companies
        (id, name, slug, industry, sub_industry, description, website_url, linkedin_url, founded_year, employee_count_min, employee_count_max, funding_stage, funding_amount_usd, is_profitable, headquarters, location_formatted, location_city, location_state, location_country, location_latitude, location_longitude, location_source, location_confidence, global_offices, ceo_name, verified_company, data_source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', 0.900, ?, ?, 1, 'verified', ?)`,
      [companyId, company.name, company.slug, company.industry, company.industry, company.description, company.websiteUrl, company.linkedinUrl, company.foundedYear, company.employeeRange[0], company.employeeRange[1], company.fundingStage, company.fundingAmountUsd, company.isProfitable ? 1 : 0, formatLocation(companyLocation), formatLocation(companyLocation), companyLocation.city, companyLocation.state, companyLocation.country, companyLocation.latitude, companyLocation.longitude, listToJson(company.globalOffices), company.ceoName, toSqlDateTime(isoDate(200))]
    );

    await query(
      `INSERT INTO employers (id, user_id, company_id, full_name, designation, department, is_admin, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      [employerId, userId, companyId, company.recruiterName, company.recruiterDesignation, company.primaryDomain, toSqlDateTime(isoDate(119))]
    );

    await query(
      `INSERT INTO company_scores
        (id, company_id, total_score, process_fairness, employee_experience, contractual_integrity, ethics_conduct, review_count, verified_review_count, feedback_rate_pct, response_rate_pct, offer_integrity_score, ff_settlement_score, red_flag_count, active_flags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuid(), companyId, company.companyScore, clamp(company.companyScore - 0.1, 3.6, 4.9), clamp(company.companyScore - 0.05, 3.5, 4.9), clamp(company.companyScore, 3.7, 5.0), clamp(company.companyScore - 0.08, 3.6, 4.9), 18 + (company.jobCount * 2), 8 + company.jobCount, clamp(86 + company.jobCount, 86, 98), clamp(83 + company.jobCount, 83, 97), clamp(company.companyScore, 3.8, 5.0), clamp(company.companyScore - 0.05, 3.7, 5.0), company.companyScore < 4.1 ? 1 : 0, listToJson(company.companyScore < 4.1 ? ['longer_review_cycles'] : [])]
    );

    await query(
      `INSERT INTO company_intel_history (id, company_id, field_name, old_value, new_value, change_type, changed_by, created_at)
       VALUES
       (?, ?, 'employee_count_max', ?, ?, 'admin_corrected', ?, ?),
       (?, ?, 'funding_stage', ?, ?, 'company_updated', ?, ?)`,
      [uuid(), companyId, String(company.employeeRange[0]), String(company.employeeRange[1]), userId, toSqlDateTime(isoDate(40)), uuid(), companyId, 'seed', company.fundingStage, userId, toSqlDateTime(isoDate(18))]
    );

    await query(
      `INSERT INTO appraisal_data (id, company_id, department, cycle_frequency, avg_increment_pct, avg_rating, source, period_year, created_at)
       VALUES (?, ?, ?, 'annual', ?, ?, 'company_reported', ?, ?)`,
      [uuid(), companyId, company.primaryDomain, clamp(7 + (company.companyScore - 4) * 3, 6.5, 10.5), clamp(company.companyScore - 0.1, 3.8, 4.8), NOW.getFullYear() - 1, toSqlDateTime(isoDate(60))]
    );

    const ladderDomains = [company.primaryDomain, company.departments.find((dept) => LADDER_LIBRARY[dept] && dept !== company.primaryDomain)]
      .filter((domain) => Boolean(domain && LADDER_LIBRARY[domain]));
    for (const domain of ladderDomains) {
      await query(
        `INSERT INTO career_ladders (id, company_id, domain, steps, source, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'ai_generated', ?, ?)`,
        [uuid(), companyId, domain, JSON.stringify(LADDER_LIBRARY[domain]), toSqlDateTime(isoDate(75)), toSqlDateTime(isoDate(15))]
      );
    }

    companiesBySlug.set(company.slug, { ...company, id: companyId });
    employersByEmail.set(company.recruiterEmail, { id: employerId, userId, companyId, fullName: company.recruiterName, email: company.recruiterEmail });
    usersByEmail.set(company.recruiterEmail, { id: userId, role: 'employer', fullName: company.recruiterName });
  }

  return { companiesBySlug, employersByEmail, usersByEmail };
}

async function seedCandidates(passwordHash, context) {
  const { companiesBySlug, employersByEmail, coursesBySlug, usersByEmail } = context;
  const candidatesByEmail = new Map();

  for (const spec of CANDIDATES) {
    const userId = uuid();
    const candidateId = uuid();
    const candidateLocation = getLocationSpec(spec.city || spec.location);
    const preferredLocation = getLocationSpec(spec.preferredLocations?.[0] || spec.city || spec.location);

    await query(
      `INSERT INTO users (id, email, phone, password_hash, \`role\`, is_verified, is_active, created_at)
       VALUES (?, ?, ?, ?, 'candidate', 1, 1, ?)`,
      [userId, spec.email, spec.phone, passwordHash, toSqlDateTime(isoDate(140))]
    );

    await query(
      `INSERT INTO candidates
        (id, user_id, full_name, headline, summary, location, city, state, country, latitude, longitude, location_source, location_confidence, aadhaar_hash, digilocker_linked, \`current_role\`, current_company, total_experience_months, domains, preferred_locations, preferred_location_text, preferred_location_city, preferred_location_state, preferred_location_country, preferred_location_latitude, preferred_location_longitude, preferred_location_radius_km, preferred_location_source, expected_salary_min, expected_salary_max, notice_period_days, open_to_work, career_stage, generation, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', 0.900, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 20.00, 'manual', ?, ?, ?, ?, ?, ?, ?)`,
      [candidateId, userId, spec.fullName, spec.headline, spec.summary, spec.location, candidateLocation.city, candidateLocation.state, candidateLocation.country, candidateLocation.latitude, candidateLocation.longitude, spec.aadhaarSeed ? hashAadhaar(spec.aadhaarSeed) : null, spec.digilockerLinked ? 1 : 0, spec.currentRole, spec.currentCompany, spec.totalExperienceMonths, listToJson(spec.domains), listToJson(spec.preferredLocations), formatLocation(preferredLocation), preferredLocation.city, preferredLocation.state, preferredLocation.country, preferredLocation.latitude, preferredLocation.longitude, spec.expectedSalary[0], spec.expectedSalary[1], spec.noticePeriodDays, spec.openToWork ? 1 : 0, spec.careerStage, spec.generation, toSqlDateTime(isoDate(140))]
    );

    for (const [docType, docName, verified] of spec.docs) {
      await query(
        `INSERT INTO digilocker_documents
          (id, candidate_id, doc_type, doc_name, issuer, issue_year, digilocker_uri, is_verified, is_editable, file_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        [uuid(), candidateId, docType, docName, docType === 'aadhaar' ? 'UIDAI' : 'Demo Credential Registry', 2018, `digilocker://demo/${candidateId}/${docType}`, verified ? 1 : 0, `https://demo.oneqik.docs/${candidateId}/${docType}`, toSqlDateTime(isoDate(100))]
      );
    }

    for (const experience of spec.experiences) {
      const experienceId = uuid();
      const company = companiesBySlug.get(experience.companySlug);
      const verifyingEmployer = Array.from(employersByEmail.values()).find((item) => item.companyId === company?.id) || Array.from(employersByEmail.values())[0];

      await query(
        `INSERT INTO work_experiences
          (id, candidate_id, company_id, company_name, job_title, department, start_date, end_date, is_current, description, is_employer_verified, verified_by, verified_at, hrm_linked, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [experienceId, candidateId, company?.id || null, experience.companyName, experience.jobTitle, experience.department, experience.startDate, experience.endDate, experience.isCurrent ? 1 : 0, experience.description, experience.verified ? 1 : 0, verifyingEmployer.userId, experience.verified ? toSqlDateTime(isoDate(50)) : null, toSqlDateTime(isoDate(120))]
      );

      for (const achievement of experience.achievements) {
        await query(
          `INSERT INTO achievements
            (id, experience_id, candidate_id, title, description, is_employer_verified, verified_by, verified_at, is_editable, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
          [uuid(), experienceId, candidateId, achievement, `${achievement} Role: ${experience.jobTitle} at ${experience.companyName}.`, experience.verified ? 1 : 0, verifyingEmployer.userId, experience.verified ? toSqlDateTime(isoDate(45)) : null, toSqlDateTime(isoDate(110))]
        );
      }

      await query(
        `INSERT INTO performance_records
          (id, experience_id, candidate_id, employer_id, period_start, period_end, target_pct, attendance_pct, employer_rating, notes, is_verified, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [uuid(), experienceId, candidateId, verifyingEmployer.id, experience.startDate, experience.endDate || toSqlDateTime(isoDate(0)).slice(0, 10), experience.performance.targetPct, experience.performance.attendancePct, experience.performance.employerRating, `Performance history imported for ${experience.jobTitle}.`, toSqlDateTime(isoDate(42))]
      );
    }

    for (const [skillName, score, tags] of spec.skills) {
      await query(
        `INSERT INTO skill_assessments
          (id, candidate_id, skill_name, score, max_score, status, source, ai_summary, ai_tags, parsed_text, parsed_json, index_status, embedding_status, assessed_at, created_at)
         VALUES (?, ?, ?, ?, 100, 'completed', 'assessment', ?, ?, ?, ?, 'ready', 'ready', ?, ?)`,
        [uuid(), candidateId, skillName, score, `${spec.fullName} shows reliable ability in ${skillName.toLowerCase()} with examples grounded in recent work history.`, listToJson(tags), `${skillName} assessment notes for ${spec.fullName}.`, JSON.stringify({ candidate: spec.fullName, skill: skillName, score }), toSqlDateTime(isoDate(30)), toSqlDateTime(isoDate(30))]
      );
    }

    for (const [courseSlug, status, progressPct, currentModule, durationMins] of spec.learning) {
      const course = coursesBySlug.get(courseSlug);
      if (!course) continue;
      await query(
        `INSERT INTO course_enrollments
          (id, course_id, candidate_id, status, progress_pct, current_module, score_pts_earned, xp_earned, enrolled_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuid(), course.id, candidateId, status, progressPct, currentModule, status === 'completed' ? durationMins : 0, status === 'completed' ? durationMins * 2 : Math.round(progressPct / 2), toSqlDateTime(isoDate(35)), status === 'completed' ? toSqlDateTime(isoDate(12)) : null]
      );
    }

    await query(
      `INSERT INTO career_scores
        (id, candidate_id, total_score, skill_impact_pts, credibility_pts, engagement_pts, values_pts, identity_pts, phase, band, offer_reliability_pct, no_show_count, ghosting_count, avg_employer_rating, identity_verified, identity_cap_active, last_calculated_at)
       VALUES (?, ?, 300, 0, 0, 0, 0, 0, 'phase_1_active', 'fair', ?, ?, ?, ?, ?, ?, ?)`,
      [uuid(), candidateId, spec.offerReliabilityPct, spec.noShowCount, spec.ghostingCount, spec.avgEmployerRating, spec.aadhaarSeed ? 1 : 0, spec.aadhaarSeed ? 0 : 1, toSqlDateTime(isoDate(8))]
    );

    candidatesByEmail.set(spec.email, { id: candidateId, userId, fullName: spec.fullName, spec });
    usersByEmail.set(spec.email, { id: userId, role: 'candidate', fullName: spec.fullName });
  }

  return candidatesByEmail;
}

async function seedJobs(context) {
  const { companiesBySlug, employersByEmail } = context;
  const jobsByCompanyDept = new Map();
  const jobsById = new Map();
  let featuredCount = 0;

  for (let companyIndex = 0; companyIndex < COMPANIES.length; companyIndex += 1) {
    const companySpec = COMPANIES[companyIndex];
    const company = companiesBySlug.get(companySpec.slug);
    const employer = employersByEmail.get(companySpec.recruiterEmail);
    const relevantBlueprints = BLUEPRINTS.filter((blueprint) => companySpec.departments.includes(blueprint.department));

    for (let jobIndex = 0; jobIndex < companySpec.jobCount; jobIndex += 1) {
      const blueprint = relevantBlueprints[(jobIndex + companyIndex) % relevantBlueprints.length];
      const jobId = uuid();
      const minSalary = roundSalary(blueprint.salary[0] * (0.96 + (companySpec.companyScore - 4) * 0.08));
      const maxSalary = roundSalary(blueprint.salary[1] * (0.98 + (companySpec.companyScore - 4) * 0.08));
      const isFeatured = featuredCount < 12 && jobIndex === 0;
      const createdAt = isoDate(2 + ((companyIndex * 5) + jobIndex), 9 + (jobIndex % 5));
      const tatHours = 36 + ((jobIndex + companyIndex) % 4) * 12;
      const companyLocation = getLocationSpec(company.location);
      const isRemote = blueprint.work_mode === 'remote';
      const jobLocationText = isRemote ? 'Remote - India' : formatLocation(companyLocation);

      await query(
        `INSERT INTO job_postings
          (id, company_id, employer_id, title, department, sub_department, job_function, level, seniority_label, employment_type, work_mode, location, location_formatted, location_city, location_state, location_country, location_latitude, location_longitude, location_source, location_confidence, location_radius_km, salary_min, salary_max, salary_currency, salary_period, salary_disclosed, experience_min_years, experience_max_years, min_career_score, required_skills, preferred_skills, education_requirement, description, responsibilities, benefits, openings, status, expires_at, is_featured, tat_hours, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'full_time', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'INR', 'yearly', 1, ?, ?, ?, ?, ?, 'ug', ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)`,
        [jobId, company.id, employer.id, blueprint.title, blueprint.department, blueprint.job_function, blueprint.job_function, blueprint.level, blueprint.seniority_label, blueprint.work_mode, jobLocationText, jobLocationText, isRemote ? null : companyLocation.city, isRemote ? null : companyLocation.state, isRemote ? 'India' : companyLocation.country, isRemote ? null : companyLocation.latitude, isRemote ? null : companyLocation.longitude, isRemote ? 'remote' : 'company_default', isRemote ? null : 0.9, isRemote ? null : 5, minSalary, maxSalary, blueprint.experience[0], blueprint.experience[1], blueprint.minCareerScore, listToJson(blueprint.required), listToJson(blueprint.preferred), buildJobDescription(companySpec, blueprint), buildResponsibilities(companySpec, blueprint), buildBenefits(companySpec, blueprint), blueprint.level === 'manager' || blueprint.level === 'senior' ? 1 : 2, toSqlDateTime(isoDate(-25 + ((companyIndex + jobIndex) % 10))), isFeatured ? 1 : 0, tatHours, toSqlDateTime(createdAt), toSqlDateTime(createdAt)]
      );

      const jobQuestions = [];
      if ((companyIndex + jobIndex) % 4 !== 0) {
        const questions = getQuestionTemplates(blueprint);
        for (let questionIndex = 0; questionIndex < questions.length; questionIndex += 1) {
          const [questionText, questionType] = questions[questionIndex];
          const questionId = uuid();
          await query(
            `INSERT INTO prescreening_questions
              (id, job_id, question_text, question_type, is_required, max_duration_s, ideal_answer, display_order, created_at)
             VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)`,
            [questionId, jobId, questionText, questionType, questionType === 'video' ? 90 : 120, 'A strong answer should be specific, grounded in recent work, and clearly explain outcomes.', questionIndex + 1, toSqlDateTime(createdAt)]
          );
          jobQuestions.push({ id: questionId, questionText, questionType });
        }
      }

      const key = `${companySpec.slug}|${blueprint.department}`;
      const collection = jobsByCompanyDept.get(key) || [];
      const record = { id: jobId, title: blueprint.title, department: blueprint.department, companySlug: companySpec.slug, companyId: company.id, companyName: companySpec.name, tatHours, questions: jobQuestions };
      collection.push(record);
      jobsByCompanyDept.set(key, collection);
      jobsById.set(jobId, record);
      if (isFeatured) featuredCount += 1;
    }
  }

  return { jobsByCompanyDept, jobsById };
}

function getStatusTimeline(status, appliedAt, extraNote) {
  const steps = STATUS_PATHS[status] || STATUS_PATHS.submitted;
  const notes = {
    submitted: 'Application submitted',
    under_review: 'Recruiter reviewed profile and initial fit',
    shortlisted: 'Profile shortlisted for next-stage evaluation',
    interview_scheduled: 'Interview slot shared with the candidate',
    interview_done: 'Interview completed and feedback recorded',
    on_hold: extraNote || 'Role paused pending internal alignment',
    offer_sent: 'Offer details shared with the candidate',
    offer_accepted: 'Candidate confirmed interest and accepted the offer',
    joined: 'Candidate has joined successfully',
    rejected: extraNote || 'Application closed after evaluation',
    withdrawn: extraNote || 'Candidate withdrew from the process',
  };

  return steps.map((step, index) => ({
    fromStatus: index === 0 ? null : steps[index - 1],
    toStatus: step,
    note: index === steps.length - 1 ? (extraNote || notes[step]) : notes[step],
    createdAt: toSqlDateTime(new Date(appliedAt.getTime() + (index * 24 * 60 * 60 * 1000))),
  }));
}

async function seedApplications(context) {
  const { candidatesByEmail, jobsByCompanyDept } = context;
  const assignmentCursor = new Map();

  for (const [candidateEmail, plans] of Object.entries(APPLICATION_PLANS)) {
    const candidate = candidatesByEmail.get(candidateEmail);
    const initialScore = await calculateAndSave(candidate.id);
    const usedJobIds = new Set();

    for (const plan of plans) {
      const [companySlug, department, status, daysAgo, matchScore, employerNotes, finalNote] = plan;
      const key = `${companySlug}|${department}`;
      let jobList = jobsByCompanyDept.get(key) || [];
      let assignmentKey = key;

      if (!jobList.length) {
        jobList = Array.from(jobsByCompanyDept.entries())
          .filter(([mapKey]) => mapKey.startsWith(`${companySlug}|`))
          .flatMap(([, items]) => items);
        assignmentKey = `${companySlug}|fallback`;
      }

      if (!jobList.length) continue;

      const cursor = assignmentCursor.get(assignmentKey) || 0;
      let job = jobList[cursor % jobList.length];
      assignmentCursor.set(assignmentKey, cursor + 1);

      if (usedJobIds.has(job.id)) {
        const nextUnused = jobList.find((item) => !usedJobIds.has(item.id));
        if (!nextUnused) {
          continue;
        }
        job = nextUnused;
      }
      usedJobIds.add(job.id);

      const appId = uuid();
      const appliedAt = isoDate(daysAgo, 11);
      const timeline = getStatusTimeline(status, appliedAt, finalNote);
      const reviewedAt = timeline.find((entry) => entry.toStatus === 'under_review')?.createdAt || null;
      const holdUntil = status === 'on_hold' ? toSqlDateTime(new Date(appliedAt.getTime() + (6 * 24 * 60 * 60 * 1000))) : null;
      const statusUpdatedAt = timeline[timeline.length - 1].createdAt;
      const tatBreach = status === 'submitted' && daysAgo * 24 > job.tatHours;

      await query(
        `INSERT INTO job_applications
          (id, job_id, candidate_id, company_id, status, rejection_reason, hold_until, cover_note, career_score_at_apply, ai_match_score, ai_summary, employer_notes, applied_at, reviewed_at, status_updated_at, tat_breach)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [appId, job.id, candidate.id, job.companyId, status, status === 'rejected' ? (finalNote || 'Moved ahead with a profile that aligned more closely with current needs.') : null, holdUntil, `${candidate.spec.fullName.split(' ')[0]} is applying with experience in ${candidate.spec.domains.join(', ')} and a strong fit for ${department}.`, initialScore.total, matchScore, `${candidate.spec.fullName} shows credible fit for ${job.title} based on prior work history, profile depth, and role alignment.`, employerNotes, toSqlDateTime(appliedAt), reviewedAt, statusUpdatedAt, tatBreach ? 1 : 0]
      );

      for (const entry of timeline) {
        await query(
          `INSERT INTO application_status_history
            (id, application_id, from_status, to_status, note, changed_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [uuid(), appId, entry.fromStatus, entry.toStatus, entry.note, candidate.userId, entry.createdAt]
        );
      }

      for (const question of job.questions) {
        await query(
          `INSERT INTO prescreening_answers
            (id, application_id, question_id, answer_type, answer_text, video_url, ai_score, ai_feedback, employer_viewed, submitted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
          [uuid(), appId, question.id, question.questionType === 'video' ? 'video' : 'text', buildAnswer(candidate.spec, question.questionText), question.questionType === 'video' ? `https://demo.oneqik.video/${appId}/${question.id}` : null, clamp(matchScore - 8, 58, 95), 'Answer is structured, specific, and relevant to the role context.', toSqlDateTime(new Date(appliedAt.getTime() + (2 * 60 * 60 * 1000)))]
        );
      }
    }

    await calculateAndSave(candidate.id);
  }

  await query(
    `UPDATE job_postings jp
     SET
       applications_count = (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = jp.id),
       shortlisted_count = (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = jp.id AND ja.status IN ('shortlisted', 'interview_scheduled', 'interview_done', 'offer_sent', 'offer_accepted', 'joined')),
       hired_count = (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = jp.id AND ja.status = 'joined')`
  );
}

async function seedCommunity(usersByEmail) {
  const communityUsers = Array.from(usersByEmail.values());
  const postIdsByTitle = new Map();

  async function seedTopics(postId, tags) {
    for (const tag of tags || []) {
      const slug = String(tag || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      if (!slug) continue;

      await query(
        `INSERT INTO community_topics (id, name, slug)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [uuid(), tag, slug]
      );

      const [topic] = await query('SELECT id FROM community_topics WHERE slug = ?', [slug]);
      if (topic?.id) {
        await query(
          `INSERT IGNORE INTO community_post_topics (post_id, topic_id)
           VALUES (?, ?)`,
          [postId, topic.id]
        );
      }
    }
  }

  async function seedReactions(targetType, targetId, count, createdAtDaysAgo) {
    const voters = communityUsers.slice(0, Math.min(count, communityUsers.length));
    for (let index = 0; index < voters.length; index += 1) {
      await query(
        `INSERT IGNORE INTO community_reactions
          (id, target_type, target_id, user_id, reaction_type, created_at)
         VALUES (?, ?, ?, ?, 'upvote', ?)`,
        [uuid(), targetType, targetId, voters[index].id, toSqlDateTime(isoDate(createdAtDaysAgo, 12 + (index % 6)))]
      );
    }
  }

  for (let index = 0; index < COMMUNITY_POSTS.length; index += 1) {
    const post = COMMUNITY_POSTS[index];
    const user = usersByEmail.get(post.authorEmail);
    if (!user) continue;

    const postId = uuid();
    await query(
      `INSERT INTO community_posts
        (id, author_id, author_role, post_type, title, content, domain_tags, is_anonymous, alias, upvote_count, comment_count, view_count, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'approved', ?)`,
      [postId, user.id, post.role, post.type, post.title, post.content, listToJson(post.tags), post.anonymous ? 1 : 0, post.alias, post.upvotes, post.views, toSqlDateTime(isoDate(20 - index))]
    );
    postIdsByTitle.set(post.title, postId);
    await seedTopics(postId, post.tags);
    await seedReactions('post', postId, Math.min(post.upvotes, 8), 20 - index);

    let commentCount = 0;
    for (let commentIndex = 0; commentIndex < (COMMUNITY_COMMENTS[post.title] || []).length; commentIndex += 1) {
      const [commentEmail, authorRole, content] = COMMUNITY_COMMENTS[post.title][commentIndex];
      const commentUser = usersByEmail.get(commentEmail);
      if (!commentUser) continue;

      const commentId = uuid();
      await query(
        `INSERT INTO community_comments
          (id, post_id, author_id, author_role, parent_comment_id, content, upvote_count, status, created_at)
         VALUES (?, ?, ?, ?, NULL, ?, ?, 'approved', ?)`,
        [commentId, postId, commentUser.id, authorRole, content, 2 + commentIndex, toSqlDateTime(isoDate(19 - index))]
      );
      commentCount += 1;

      if (commentIndex === 0 && index % 2 === 0) {
        await query(
          `INSERT INTO community_comments
            (id, post_id, author_id, author_role, parent_comment_id, content, upvote_count, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 1, 'approved', ?)`,
          [uuid(), postId, user.id, post.role, commentId, 'That is exactly the tension I was trying to describe.', toSqlDateTime(isoDate(18 - index))]
        );
        commentCount += 1;
      }
    }

    for (let optionIndex = 0; optionIndex < (POLL_OPTIONS[post.title] || []).length; optionIndex += 1) {
      const [optionText, voteCount] = POLL_OPTIONS[post.title][optionIndex];
      await query(
        `INSERT INTO community_poll_options (id, post_id, option_text, vote_count, display_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuid(), postId, optionText, voteCount, optionIndex + 1, toSqlDateTime(isoDate(20 - index))]
      );
    }

    await query('UPDATE community_posts SET comment_count = ? WHERE id = ?', [commentCount, postId]);
  }

  for (const [questionTitle, answers] of Object.entries(COMMUNITY_ANSWERS)) {
    const questionId = postIdsByTitle.get(questionTitle);
    if (!questionId) continue;

    for (let answerIndex = 0; answerIndex < answers.length; answerIndex += 1) {
      const answer = answers[answerIndex];
      const user = usersByEmail.get(answer.authorEmail);
      if (!user) continue;

      const answerId = uuid();
      await query(
        `INSERT INTO community_answers
          (id, question_id, author_id, author_role, body, upvote_count, comment_count, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, 'approved', ?)`,
        [answerId, questionId, user.id, answer.role, answer.body, answer.upvotes, toSqlDateTime(isoDate(9 - answerIndex, 14 + answerIndex))]
      );
      await seedReactions('answer', answerId, Math.min(answer.upvotes, 6), 8 - answerIndex);
    }
  }
}

async function seedCompanyReviews(context) {
  const { candidatesByEmail, companiesBySlug } = context;

  for (const candidate of candidatesByEmail.values()) {
    for (let index = 0; index < candidate.spec.experiences.length; index += 1) {
      const experience = candidate.spec.experiences[index];
      const company = companiesBySlug.get(experience.companySlug);
      if (!company) continue;

      await query(
        `INSERT INTO company_reviews
          (id, company_id, candidate_id, employment_verified, manager_behaviour, work_life_respect, growth_investment, psych_safety, process_fairness, overall_rating, review_text, pros, cons, would_recommend, is_anonymous, status, created_at)
         VALUES (?, ?, ?, 1, 4, 4, 4, 4, 4, ?, ?, ?, ?, 1, 1, 'approved', ?)`,
        [uuid(), company.id, candidate.id, experience.isCurrent ? 5 : 4, `${experience.companyName} felt structured on execution and expectations. The strongest part was clarity on ownership and follow-through when the team was moving fast.`, 'Clear role expectations, dependable manager communication, and practical onboarding support.', index === 0 ? 'Some quarters had slower decision cycles when multiple stakeholders were involved.' : 'Internal alignment could occasionally take longer than expected.', toSqlDateTime(isoDate(30 + index))]
      );
    }
  }
}

async function seedScoreHistory(candidatesByEmail) {
  for (const candidate of candidatesByEmail.values()) {
    const scoreRow = await query('SELECT total_score FROM career_scores WHERE candidate_id = ?', [candidate.id]);
    const finalTotal = scoreRow[0]?.total_score || 300;
    const delta = Math.max(0, finalTotal - 300);
    const stageDeltas = [Math.round(delta * 0.22), Math.round(delta * 0.18), Math.round(delta * 0.24), Math.round(delta * 0.19)];
    stageDeltas.push(delta - stageDeltas.reduce((sum, value) => sum + value, 0));
    const stages = [['profile_completed', 'engagement', 'Profile summary and preferences became recruiter-ready.'], ['documents_verified', 'identity', 'Identity and supporting documents were verified.'], ['skills_assessed', 'skill_impact', 'Skill assessments captured clearer capability depth.'], ['work_history_verified', 'credibility', 'Verified work history improved employer trust signals.'], ['career_progression', 'values', 'Learning activity and application quality improved the overall score.']];

    let before = 300;
    for (let index = 0; index < stages.length; index += 1) {
      const [eventType, pillar, note] = stages[index];
      const change = stageDeltas[index];
      const after = before + change;
      await query(
        `INSERT INTO score_events
          (id, candidate_id, event_type, pillar, delta, score_before, score_after, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuid(), candidate.id, eventType, pillar, change, before, after, note, toSqlDateTime(isoDate(90 - (index * 14)))]
      );
      before = after;
    }
  }
}

async function buildCounts() {
  const [companies, employers, jobs, candidates, applications, posts, courses] = await Promise.all([
    query('SELECT COUNT(*) AS count FROM companies'),
    query('SELECT COUNT(*) AS count FROM employers'),
    query('SELECT COUNT(*) AS count FROM job_postings'),
    query('SELECT COUNT(*) AS count FROM candidates'),
    query('SELECT COUNT(*) AS count FROM job_applications'),
    query('SELECT COUNT(*) AS count FROM community_posts'),
    query('SELECT COUNT(*) AS count FROM courses'),
  ]);

  return { companies: companies[0].count, employers: employers[0].count, jobs: jobs[0].count, candidates: candidates[0].count, applications: applications[0].count, communityPosts: posts[0].count, courses: courses[0].count };
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  console.log('\nSeeding realistic demo data...');
  await clearExistingData();
  console.log('  - base tables cleared');
  const coursesBySlug = await seedCourses();
  console.log('  - courses seeded');
  const baseContext = await seedCompaniesAndEmployers(passwordHash);
  console.log('  - companies and employers seeded');
  const candidatesByEmail = await seedCandidates(passwordHash, { ...baseContext, coursesBySlug });
  console.log('  - candidates seeded');
  const jobsContext = await seedJobs({ ...baseContext, candidatesByEmail });
  console.log('  - jobs seeded');
  await seedApplications({ ...baseContext, ...jobsContext, candidatesByEmail });
  console.log('  - applications seeded');
  await seedCommunity(baseContext.usersByEmail);
  console.log('  - community seeded');
  await seedCompanyReviews({ ...baseContext, candidatesByEmail });
  console.log('  - company reviews seeded');
  await seedScoreHistory(candidatesByEmail);
  console.log('  - score history seeded');

  const counts = await buildCounts();
  console.log('\nDemo seed complete.');
  console.log(counts);

  console.log('\nCandidate credentials');
  CANDIDATES.forEach((candidate) => console.log(`- ${candidate.fullName} | candidate | ${candidate.email} | ${DEMO_PASSWORD}`));

  console.log('\nEmployer credentials');
  COMPANIES.forEach((company) => console.log(`- ${company.recruiterName} | employer | ${company.recruiterEmail} | ${DEMO_PASSWORD} | ${company.name}`));
}

main()
  .catch((error) => {
    console.error('\nDemo seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
