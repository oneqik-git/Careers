import { formatDateTime } from '@/utils/formatters';

const baseApplicationMeta = {
  tone: 'info',
  label: 'Submitted',
  badgeLabel: 'Submitted',
  jobsState: 'applied',
  category: 'active',
  cardClassName: 'border-[rgba(59,130,246,0.24)] bg-[linear-gradient(180deg,rgba(59,130,246,0.08),transparent_38%),rgba(7,20,46,0.96)]',
  badgeClassName: 'border-[rgba(96,165,250,0.28)] bg-[rgba(37,99,235,0.18)] text-sky-200',
  panelClassName: 'border-[rgba(59,130,246,0.22)] bg-[rgba(59,130,246,0.08)]',
  accentClassName: 'text-sky-200',
  dotClassName: 'border-[rgba(96,165,250,0.28)] bg-[rgba(59,130,246,0.18)] text-sky-100',
};

const applicationStatusMetaMap = {
  submitted: {
    ...baseApplicationMeta,
    headline: 'Application submitted',
    summary: 'Your application is in the queue and waiting for first review.',
    nextStep: 'The next meaningful update should be review, hold, or a final decision.',
  },
  under_review: {
    ...baseApplicationMeta,
    tone: 'warning',
    label: 'In review',
    badgeLabel: 'In review',
    jobsState: 'in_review',
    cardClassName: 'border-[rgba(249,115,22,0.28)] bg-[linear-gradient(180deg,rgba(249,115,22,0.08),transparent_38%),rgba(15,18,34,0.97)]',
    badgeClassName: 'border-[rgba(251,146,60,0.26)] bg-[rgba(249,115,22,0.18)] text-orange-200',
    panelClassName: 'border-[rgba(249,115,22,0.24)] bg-[rgba(249,115,22,0.1)]',
    accentClassName: 'text-orange-200',
    dotClassName: 'border-[rgba(251,146,60,0.26)] bg-[rgba(249,115,22,0.22)] text-orange-100',
    headline: 'Employer review is in progress',
    summary: 'Your application has moved beyond submission and is currently being reviewed.',
    nextStep: 'Watch for shortlist movement, interview activity, a hold notice, or a final decision.',
  },
  shortlisted: {
    ...baseApplicationMeta,
    tone: 'success',
    label: 'Shortlisted',
    badgeLabel: 'Shortlisted',
    jobsState: 'in_review',
    cardClassName: 'border-[rgba(45,212,191,0.28)] bg-[linear-gradient(180deg,rgba(45,212,191,0.08),transparent_38%),rgba(8,23,38,0.97)]',
    badgeClassName: 'border-[rgba(45,212,191,0.26)] bg-[rgba(13,148,136,0.2)] text-teal-100',
    panelClassName: 'border-[rgba(45,212,191,0.22)] bg-[rgba(13,148,136,0.1)]',
    accentClassName: 'text-teal-100',
    dotClassName: 'border-[rgba(45,212,191,0.24)] bg-[rgba(13,148,136,0.22)] text-teal-50',
    headline: 'You have cleared the first filter',
    summary: 'This application has reached the shortlist stage.',
    nextStep: 'The employer may follow with a test, interview scheduling, offer movement, or a final outcome.',
  },
  relevancy_test: {
    ...baseApplicationMeta,
    tone: 'support',
    label: 'Relevancy test',
    badgeLabel: 'Relevancy test',
    jobsState: 'in_review',
    cardClassName: 'border-[rgba(129,140,248,0.28)] bg-[linear-gradient(180deg,rgba(129,140,248,0.08),transparent_38%),rgba(12,18,42,0.97)]',
    badgeClassName: 'border-[rgba(129,140,248,0.28)] bg-[rgba(99,102,241,0.18)] text-indigo-100',
    panelClassName: 'border-[rgba(129,140,248,0.24)] bg-[rgba(99,102,241,0.1)]',
    accentClassName: 'text-indigo-100',
    dotClassName: 'border-[rgba(129,140,248,0.26)] bg-[rgba(99,102,241,0.22)] text-indigo-50',
    headline: 'Additional screening has been requested',
    summary: 'The employer has moved this application into a structured assessment step.',
    nextStep: 'Complete the requested assessment if it has been shared with you outside the current API surface.',
  },
  interview_scheduled: {
    ...baseApplicationMeta,
    tone: 'support',
    label: 'Interview scheduled',
    badgeLabel: 'Interview scheduled',
    jobsState: 'in_review',
    cardClassName: 'border-[rgba(167,139,250,0.28)] bg-[linear-gradient(180deg,rgba(167,139,250,0.08),transparent_38%),rgba(12,18,42,0.97)]',
    badgeClassName: 'border-[rgba(167,139,250,0.28)] bg-[rgba(124,58,237,0.18)] text-violet-100',
    panelClassName: 'border-[rgba(167,139,250,0.24)] bg-[rgba(124,58,237,0.1)]',
    accentClassName: 'text-violet-100',
    dotClassName: 'border-[rgba(167,139,250,0.26)] bg-[rgba(124,58,237,0.22)] text-violet-50',
    headline: 'Interview stage is underway',
    summary: 'This application has progressed into interview scheduling.',
    nextStep: 'Prepare for the interview and watch for follow-up movement after the conversation.',
  },
  interview_done: {
    ...baseApplicationMeta,
    tone: 'support',
    label: 'Interview completed',
    badgeLabel: 'Interview completed',
    jobsState: 'in_review',
    cardClassName: 'border-[rgba(192,132,252,0.28)] bg-[linear-gradient(180deg,rgba(192,132,252,0.08),transparent_38%),rgba(12,18,42,0.97)]',
    badgeClassName: 'border-[rgba(192,132,252,0.28)] bg-[rgba(147,51,234,0.18)] text-fuchsia-100',
    panelClassName: 'border-[rgba(192,132,252,0.24)] bg-[rgba(147,51,234,0.1)]',
    accentClassName: 'text-fuchsia-100',
    dotClassName: 'border-[rgba(192,132,252,0.26)] bg-[rgba(147,51,234,0.22)] text-fuchsia-50',
    headline: 'Interview is complete',
    summary: 'The interview step has been completed and the application is waiting on the next decision.',
    nextStep: 'The next update is usually a hold notice, offer movement, or final outcome.',
  },
  offer_sent: {
    ...baseApplicationMeta,
    tone: 'success',
    label: 'Offer received',
    badgeLabel: 'Offer received',
    jobsState: 'offer',
    category: 'offer',
    cardClassName: 'border-[rgba(34,197,94,0.3)] bg-[linear-gradient(180deg,rgba(34,197,94,0.09),transparent_38%),rgba(7,24,31,0.97)]',
    badgeClassName: 'border-[rgba(74,222,128,0.28)] bg-[rgba(22,163,74,0.2)] text-emerald-100',
    panelClassName: 'border-[rgba(34,197,94,0.24)] bg-[rgba(22,163,74,0.1)]',
    accentClassName: 'text-emerald-100',
    dotClassName: 'border-[rgba(74,222,128,0.28)] bg-[rgba(22,163,74,0.24)] text-emerald-50',
    headline: 'Offer received',
    summary: 'The employer has moved this application into the offer stage.',
    nextStep: 'Review the final offer details shared by the employer and respond before their deadline.',
  },
  offer_accepted: {
    ...baseApplicationMeta,
    tone: 'success',
    label: 'Offer accepted',
    badgeLabel: 'Offer accepted',
    jobsState: 'offer',
    category: 'offer',
    cardClassName: 'border-[rgba(16,185,129,0.32)] bg-[linear-gradient(180deg,rgba(16,185,129,0.1),transparent_38%),rgba(7,24,31,0.97)]',
    badgeClassName: 'border-[rgba(52,211,153,0.3)] bg-[rgba(5,150,105,0.22)] text-emerald-100',
    panelClassName: 'border-[rgba(16,185,129,0.24)] bg-[rgba(5,150,105,0.1)]',
    accentClassName: 'text-emerald-100',
    dotClassName: 'border-[rgba(52,211,153,0.3)] bg-[rgba(5,150,105,0.24)] text-emerald-50',
    headline: 'Offer accepted',
    summary: 'You have accepted the employer’s offer for this application.',
    nextStep: 'The remaining steps depend on employer onboarding and joining communication.',
  },
  joined: {
    ...baseApplicationMeta,
    tone: 'success',
    label: 'Joined',
    badgeLabel: 'Joined',
    jobsState: 'offer',
    category: 'offer',
    cardClassName: 'border-[rgba(34,197,94,0.32)] bg-[linear-gradient(180deg,rgba(34,197,94,0.1),transparent_38%),rgba(7,24,31,0.97)]',
    badgeClassName: 'border-[rgba(74,222,128,0.32)] bg-[rgba(21,128,61,0.24)] text-emerald-100',
    panelClassName: 'border-[rgba(34,197,94,0.24)] bg-[rgba(21,128,61,0.12)]',
    accentClassName: 'text-emerald-100',
    dotClassName: 'border-[rgba(74,222,128,0.3)] bg-[rgba(21,128,61,0.24)] text-emerald-50',
    headline: 'Joined successfully',
    summary: 'This application has reached a completed positive outcome.',
    nextStep: 'No further application updates are expected in the current flow.',
  },
  on_hold: {
    ...baseApplicationMeta,
    tone: 'warning',
    label: 'On hold',
    badgeLabel: 'On hold',
    jobsState: 'on_hold',
    cardClassName: 'border-[rgba(245,158,11,0.28)] bg-[linear-gradient(180deg,rgba(245,158,11,0.08),transparent_38%),rgba(22,18,12,0.97)]',
    badgeClassName: 'border-[rgba(251,191,36,0.28)] bg-[rgba(217,119,6,0.18)] text-amber-100',
    panelClassName: 'border-[rgba(245,158,11,0.22)] bg-[rgba(217,119,6,0.1)]',
    accentClassName: 'text-amber-100',
    dotClassName: 'border-[rgba(251,191,36,0.28)] bg-[rgba(217,119,6,0.22)] text-amber-50',
    headline: 'This application is on hold',
    summary: 'The employer has paused movement on this application for now.',
    nextStep: 'No action is needed from you unless the employer restarts the process or shares more context.',
  },
  rejected: {
    ...baseApplicationMeta,
    tone: 'danger',
    label: 'Not proceeding',
    badgeLabel: 'Not proceeding',
    jobsState: 'rejected',
    category: 'rejected',
    cardClassName: 'border-[rgba(244,63,94,0.3)] bg-[linear-gradient(180deg,rgba(244,63,94,0.08),transparent_38%),rgba(23,13,19,0.97)]',
    badgeClassName: 'border-[rgba(251,113,133,0.28)] bg-[rgba(225,29,72,0.18)] text-rose-100',
    panelClassName: 'border-[rgba(244,63,94,0.24)] bg-[rgba(225,29,72,0.1)]',
    accentClassName: 'text-rose-100',
    dotClassName: 'border-[rgba(251,113,133,0.28)] bg-[rgba(225,29,72,0.22)] text-rose-50',
    headline: 'The employer is not proceeding',
    summary: 'This application has reached a final negative outcome.',
    nextStep: 'Use any employer feedback here as a directional signal for similar roles.',
  },
  offer_declined: {
    ...baseApplicationMeta,
    tone: 'danger',
    label: 'Offer declined',
    badgeLabel: 'Offer declined',
    jobsState: 'rejected',
    category: 'rejected',
    cardClassName: 'border-[rgba(251,113,133,0.3)] bg-[linear-gradient(180deg,rgba(251,113,133,0.08),transparent_38%),rgba(23,13,19,0.97)]',
    badgeClassName: 'border-[rgba(251,113,133,0.28)] bg-[rgba(225,29,72,0.18)] text-rose-100',
    panelClassName: 'border-[rgba(251,113,133,0.24)] bg-[rgba(225,29,72,0.1)]',
    accentClassName: 'text-rose-100',
    dotClassName: 'border-[rgba(251,113,133,0.28)] bg-[rgba(225,29,72,0.22)] text-rose-50',
    headline: 'Offer declined',
    summary: 'This application reached offer stage, but the offer was not accepted.',
    nextStep: 'No further action is required unless the employer reopens the conversation.',
  },
  withdrawn: {
    ...baseApplicationMeta,
    tone: 'muted',
    label: 'Withdrawn',
    badgeLabel: 'Withdrawn',
    jobsState: 'withdrawn',
    category: 'withdrawn',
    cardClassName: 'border-[rgba(148,163,184,0.24)] bg-[linear-gradient(180deg,rgba(148,163,184,0.06),transparent_38%),rgba(10,18,34,0.96)]',
    badgeClassName: 'border-[rgba(148,163,184,0.24)] bg-[rgba(71,85,105,0.18)] text-slate-200',
    panelClassName: 'border-[rgba(148,163,184,0.18)] bg-[rgba(71,85,105,0.1)]',
    accentClassName: 'text-slate-200',
    dotClassName: 'border-[rgba(148,163,184,0.24)] bg-[rgba(71,85,105,0.18)] text-slate-100',
    headline: 'Application withdrawn',
    summary: 'This application is no longer active because it was withdrawn.',
    nextStep: 'No further updates are expected unless you apply again in the future.',
  },
};

const workflowStatusMetaMap = {
  active: {
    badgeClassName: 'border-[rgba(74,222,128,0.28)] bg-[rgba(22,163,74,0.18)] text-emerald-100',
  },
  closed: {
    badgeClassName: 'border-[rgba(148,163,184,0.24)] bg-[rgba(71,85,105,0.18)] text-slate-200',
  },
  draft: {
    badgeClassName: 'border-[rgba(251,191,36,0.24)] bg-[rgba(217,119,6,0.16)] text-amber-100',
  },
};

const pipelineBaseSteps = [
  { id: 'submitted', label: 'Submitted' },
  { id: 'under_review', label: 'Under review' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'offer_sent', label: 'Offer sent' },
];

const statusProgressIndex = {
  submitted: 0,
  under_review: 1,
  on_hold: 1,
  rejected: 1,
  shortlisted: 2,
  relevancy_test: 2,
  interview_scheduled: 2,
  interview_done: 2,
  offer_sent: 3,
  offer_accepted: 3,
  offer_declined: 3,
  joined: 3,
  withdrawn: 0,
};

const terminalStageMap = {
  on_hold: { id: 'on_hold', label: 'On hold', tone: 'warning' },
  rejected: { id: 'rejected', label: 'Rejected', tone: 'danger' },
  withdrawn: { id: 'withdrawn', label: 'Withdrawn', tone: 'muted' },
  offer_declined: { id: 'offer_declined', label: 'Declined', tone: 'danger' },
  joined: { id: 'joined', label: 'Joined', tone: 'success' },
};

function normalizeStatus(status) {
  return String(status || 'submitted').toLowerCase();
}

export function getApplicationStatusMeta(status) {
  const normalizedStatus = normalizeStatus(status);
  return applicationStatusMetaMap[normalizedStatus] || {
    ...baseApplicationMeta,
    label: normalizedStatus.replaceAll('_', ' '),
    badgeLabel: normalizedStatus.replaceAll('_', ' '),
    headline: 'Application update',
    summary: 'This application has a status update.',
    nextStep: 'Check the latest timeline entry for more context.',
  };
}

export function hasApplicationStatusMeta(status) {
  return Boolean(applicationStatusMetaMap[normalizeStatus(status)]);
}

export function getStatusBadgeTone(status) {
  const normalizedStatus = normalizeStatus(status);
  return getApplicationStatusMeta(normalizedStatus).badgeClassName
    || workflowStatusMetaMap[normalizedStatus]?.badgeClassName
    || 'border-[rgba(148,163,184,0.24)] bg-[rgba(71,85,105,0.18)] text-slate-200';
}

export function getApplicationFilterKey(status) {
  return getApplicationStatusMeta(status).category;
}

export function isActiveApplication(status) {
  return getApplicationFilterKey(status) === 'active';
}

export function getJobsVisualState(status) {
  return getApplicationStatusMeta(status).jobsState || 'default';
}

export function buildApplicationPipeline(status) {
  const normalizedStatus = normalizeStatus(status);
  const progressIndex = statusProgressIndex[normalizedStatus] ?? 0;
  const terminalStage = terminalStageMap[normalizedStatus] || null;

  const steps = pipelineBaseSteps.map((step, index) => {
    const state = index < progressIndex ? 'done' : index === progressIndex && !terminalStage ? 'active' : 'pending';
    return {
      ...step,
      state,
      tone: state === 'active' ? getApplicationStatusMeta(normalizedStatus).tone : state,
    };
  });

  if (!terminalStage) {
    return steps;
  }

  return [
    ...steps.map((step, index) => ({
      ...step,
      state: index <= progressIndex ? 'done' : 'pending',
      tone: index <= progressIndex ? 'done' : 'pending',
    })),
    {
      ...terminalStage,
      state: 'active',
    },
  ];
}

export function getApplicationFeedback(application, historyEntries = []) {
  const meta = getApplicationStatusMeta(application?.status);
  const latestHistory = historyEntries[historyEntries.length - 1] || null;
  const rejectionReason = application?.rejection_reason || latestHistory?.note || null;
  const holdUntil = application?.hold_until ? formatDateTime(application.hold_until) : null;

  if (application?.status === 'offer_sent') {
    return {
      tone: 'success',
      title: meta.headline,
      summary: 'The employer has sent an offer for this application.',
      detail: 'Offer amount, joining date, and expiry are not exposed in the current API yet, so final package details still depend on employer communication.',
    };
  }

  if (application?.status === 'offer_accepted') {
    return {
      tone: 'success',
      title: meta.headline,
      summary: meta.summary,
      detail: 'Joining and onboarding specifics are still handled outside the current API payload.',
    };
  }

  if (application?.status === 'joined') {
    return {
      tone: 'success',
      title: meta.headline,
      summary: meta.summary,
      detail: 'This flow is effectively complete in the current product state.',
    };
  }

  if (application?.status === 'on_hold') {
    return {
      tone: 'warning',
      title: meta.headline,
      summary: holdUntil ? `The employer marked this application on hold until ${holdUntil}.` : meta.summary,
      detail: 'No action is required from you unless the employer resumes the process or shares more context.',
    };
  }

  if (application?.status === 'rejected') {
    return {
      tone: 'danger',
      title: meta.headline,
      summary: rejectionReason || meta.summary,
      detail: rejectionReason ? 'The feedback above is the strongest signal currently available from the employer.' : meta.nextStep,
    };
  }

  if (application?.status === 'offer_declined') {
    return {
      tone: 'danger',
      title: meta.headline,
      summary: meta.summary,
      detail: 'The API does not currently expose a structured decline reason for this state.',
    };
  }

  if (application?.status === 'withdrawn') {
    return {
      tone: 'muted',
      title: meta.headline,
      summary: meta.summary,
      detail: 'This application is no longer active in the tracker.',
    };
  }

  if (application?.status === 'under_review' && application?.reviewed_at) {
    return {
      tone: 'warning',
      title: meta.headline,
      summary: `The employer moved this application into review on ${formatDateTime(application.reviewed_at)}.`,
      detail: meta.nextStep,
    };
  }

  if (application?.tat_breach) {
    return {
      tone: 'warning',
      title: meta.headline,
      summary: 'The employer has passed the original response target on this application.',
      detail: meta.nextStep,
    };
  }

  return {
    tone: meta.tone,
    title: meta.headline,
    summary: meta.summary,
    detail: meta.nextStep,
  };
}

export function getApplicationFilterDefinitions(applications = []) {
  const counts = applications.reduce((accumulator, application) => {
    const key = getApplicationFilterKey(application.status);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, { all: applications.length, active: 0, offer: 0, rejected: 0, withdrawn: 0 });

  return [
    { key: 'all', label: 'All', count: counts.all || 0 },
    { key: 'active', label: 'Active', count: counts.active || 0 },
    { key: 'offer', label: 'Offer', count: counts.offer || 0 },
    { key: 'rejected', label: 'Rejected', count: counts.rejected || 0 },
    { key: 'withdrawn', label: 'Withdrawn', count: counts.withdrawn || 0 },
  ];
}
