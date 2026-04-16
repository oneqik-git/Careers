import { formatRelativeTime, formatStatus } from '@/utils/formatters';

export const employerStatusActions = [
  {
    value: 'under_review',
    label: 'Under review',
    description: 'Move the candidate into active recruiter review.',
    toneClassName: 'border-[rgba(249,115,22,0.32)] bg-[rgba(249,115,22,0.14)] text-orange-100',
  },
  {
    value: 'shortlisted',
    label: 'Shortlisted',
    description: 'Keep the profile in the live funnel for next steps.',
    toneClassName: 'border-[rgba(45,212,191,0.32)] bg-[rgba(13,148,136,0.16)] text-teal-100',
  },
  {
    value: 'on_hold',
    label: 'On hold',
    description: 'Pause movement while the team resolves capacity or role scope.',
    toneClassName: 'border-[rgba(245,158,11,0.3)] bg-[rgba(217,119,6,0.16)] text-amber-100',
  },
  {
    value: 'interview_scheduled',
    label: 'Interview scheduled',
    description: 'Mark the profile ready for a booked conversation.',
    toneClassName: 'border-[rgba(167,139,250,0.3)] bg-[rgba(124,58,237,0.16)] text-violet-100',
  },
  {
    value: 'interview_done',
    label: 'Interview completed',
    description: 'Capture that the conversation happened and feedback is in.',
    toneClassName: 'border-[rgba(192,132,252,0.3)] bg-[rgba(147,51,234,0.16)] text-fuchsia-100',
  },
  {
    value: 'offer_sent',
    label: 'Offer sent',
    description: 'Move the application into the offer stage.',
    toneClassName: 'border-[rgba(34,197,94,0.3)] bg-[rgba(22,163,74,0.18)] text-emerald-100',
  },
  {
    value: 'rejected',
    label: 'Rejected',
    description: 'Close the application with a final decision.',
    toneClassName: 'border-[rgba(251,113,133,0.32)] bg-[rgba(225,29,72,0.16)] text-rose-100',
  },
];

export function getEmployerStatusAction(status) {
  return employerStatusActions.find((option) => option.value === status) || null;
}

export function formatPercentValue(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return `${numericValue}%`;
}

export function formatCompanyScale(minEmployees, maxEmployees) {
  if (minEmployees && maxEmployees) {
    return `${minEmployees}-${maxEmployees} employees`;
  }

  if (minEmployees) {
    return `${minEmployees}+ employees`;
  }

  return 'Team size not added';
}

export function getNameInitials(value, fallback = 'HQ') {
  const parts = String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return fallback;
  }

  return (parts.join(' ').match(/\b\w/g) || [fallback]).join('').slice(0, 2).toUpperCase();
}

export function buildEmployerDashboardStats(jobs = []) {
  return {
    openJobs: jobs.filter((job) => job.status === 'active').length,
    applicants: jobs.reduce((sum, job) => sum + (job.total_applications || 0), 0),
    underReview: jobs.reduce((sum, job) => sum + (job.under_review_count || 0), 0),
    interviewPipeline: jobs.reduce((sum, job) => sum + (job.interview_pipeline_count || 0), 0),
    offers: jobs.reduce((sum, job) => sum + (job.offers_count || 0), 0),
  };
}

export function buildEmployerJobsSummary(jobs = []) {
  const totals = buildEmployerDashboardStats(jobs);

  return {
    ...totals,
    newApplicants: jobs.reduce((sum, job) => sum + (job.submitted_count || 0), 0),
    onHold: jobs.reduce((sum, job) => sum + (job.on_hold_count || 0), 0),
  };
}

export function getJobActivityLabel(job) {
  if (job.offers_count) {
    return `${job.offers_count} offer${job.offers_count === 1 ? '' : 's'} active`;
  }

  if (job.interview_pipeline_count) {
    return `${job.interview_pipeline_count} in interviews`;
  }

  if (job.under_review_count) {
    return `${job.under_review_count} under review`;
  }

  if (job.submitted_count) {
    return `${job.submitted_count} waiting for first review`;
  }

  return 'No candidate movement yet';
}

export function getRecentActivityLabel(activity) {
  if (!activity) {
    return 'No recent candidate activity';
  }

  return `${activity.full_name} moved to ${formatStatus(activity.status)} ${formatRelativeTime(activity.status_updated_at || activity.applied_at)}`;
}
