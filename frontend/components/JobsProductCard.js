import Link from 'next/link';
import { formatExperienceRange, formatRelativeTime, formatSalaryRange, formatStatus } from '@/utils/formatters';
import { getApplicationStatusMeta } from '@/utils/applicationStatus';

const stateToneMap = {
  default: {
    card: 'border-[rgba(29,40,56,0.9)]',
    badge: '',
  },
  viewed: {
    card: 'border-[rgba(93,224,230,0.2)] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent_100%),rgba(8,24,54,0.96)]',
    badge: 'border-[rgba(93,224,230,0.22)] bg-[rgba(93,224,230,0.1)] text-[var(--brand-accent)]',
  },
  applied: {
    card: 'border-[rgba(59,130,246,0.28)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_100%),rgba(8,22,52,0.98)]',
    badge: 'border-[rgba(59,130,246,0.28)] bg-[rgba(59,130,246,0.14)] text-[#9fd0ff]',
  },
  in_review: {
    card: 'border-[rgba(245,158,11,0.3)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_100%),rgba(13,24,49,0.98)]',
    badge: 'border-[rgba(245,158,11,0.32)] bg-[rgba(245,158,11,0.16)] text-[#ffd784]',
  },
  offer: {
    card: 'border-[rgba(34,197,94,0.3)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_100%),rgba(8,27,48,0.98)]',
    badge: 'border-[rgba(34,197,94,0.32)] bg-[rgba(34,197,94,0.15)] text-[#8cf0b1]',
  },
  on_hold: {
    card: 'border-[rgba(245,158,11,0.3)] bg-[linear-gradient(180deg,rgba(245,158,11,0.08),transparent_100%),rgba(19,22,32,0.98)]',
    badge: 'border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.16)] text-amber-200',
  },
  rejected: {
    card: 'border-[rgba(244,63,94,0.3)] bg-[linear-gradient(180deg,rgba(244,63,94,0.08),transparent_100%),rgba(21,18,28,0.98)]',
    badge: 'border-[rgba(244,63,94,0.3)] bg-[rgba(244,63,94,0.16)] text-rose-200',
  },
  withdrawn: {
    card: 'border-[rgba(148,163,184,0.24)] bg-[linear-gradient(180deg,rgba(148,163,184,0.06),transparent_100%),rgba(12,20,34,0.98)]',
    badge: 'border-[rgba(148,163,184,0.24)] bg-[rgba(71,85,105,0.18)] text-slate-200',
  },
};

function getCompanyInitials(companyName) {
  const parts = String(companyName || 'Company')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return (parts.join(' ').match(/\b\w/g) || ['C']).join('').slice(0, 2).toUpperCase();
}

function buildTags(job) {
  return [
    formatExperienceRange(job.experience_min_years, job.experience_max_years),
    job.work_mode ? formatStatus(job.work_mode) : null,
    job.level || null,
    job.department || null,
  ].filter(Boolean);
}

function renderInfoPanel(label, value) {
  return (
    <div className="rounded-[1.05rem] border border-[rgba(29,40,56,0.85)] bg-[rgba(255,255,255,0.02)] px-4 py-3 shadow-[0_14px_24px_rgba(0,0,0,0.16)]">
      <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[var(--text)]">{value}</p>
    </div>
  );
}

function getCandidateFooterMessage(state, stateLabel) {
  if (state === 'offer') {
    return 'Offer-stage application. Open the candidate detail flow to review the role and jump into the tracker.';
  }

  if (state === 'in_review' || state === 'on_hold') {
    return `${stateLabel || 'Application in progress'}. Open the candidate detail flow for structured context and next steps.`;
  }

  if (state === 'rejected' || state === 'withdrawn') {
    return `${stateLabel || 'Application closed'}. Re-open the opportunity to compare fit or move into similar opportunities.`;
  }

  if (state === 'applied') {
    return 'Already submitted. Open the candidate detail flow or tracker to monitor progress.';
  }

  return 'Structured application flow with status tracking once you apply.';
}

export default function JobsProductCard({
  job,
  href,
  state = 'default',
  stateLabel = '',
  matchPercent = null,
  showApplicationState = false,
  showMatch = false,
  onOpen,
}) {
  const tone = stateToneMap[state] || stateToneMap.default;
  const tags = buildTags(job);
  const companyDetails = [job.company_name, job.location].filter(Boolean).join(' | ');
  const statusMeta = getApplicationStatusMeta(job.applied_status);
  const candidateFooterMessage = getCandidateFooterMessage(state, stateLabel);
  const companyScoreValue = job.company_score ?? '-';
  const isCandidateMode = showApplicationState || showMatch;

  return (
    <Link className="block" href={href} onClick={onOpen}>
      <article className={`oq-card oq-public-job-card rounded-[1.7rem] p-5 sm:p-6 ${tone.card}`.trim()}>
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-[rgba(93,224,230,0.18)] bg-[linear-gradient(180deg,rgba(11,32,65,0.96)_0%,rgba(5,18,42,0.96)_100%)] text-sm font-semibold tracking-[0.08em] text-[var(--text)] shadow-[0_14px_24px_rgba(0,0,0,0.18)]">
              {getCompanyInitials(job.company_name)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-[1.2rem] font-medium tracking-[-0.04em] text-[var(--text)] sm:text-[1.35rem]">
                    {job.title}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-soft)]">{companyDetails || 'Company details pending'}</p>
                  {isCandidateMode ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">Company Score</span>
                      <span className="text-sm font-semibold text-[var(--text)]">{companyScoreValue}</span>
                      {job.applied_status ? (
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] ${statusMeta.badgeClassName}`.trim()}>
                          {statusMeta.badgeLabel}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  {showMatch ? (
                    <div className="rounded-[1rem] border border-[rgba(45,212,191,0.24)] bg-[rgba(13,148,136,0.12)] px-3 py-2 text-right shadow-[0_12px_22px_rgba(0,0,0,0.14)]">
                      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-teal-100/80">Match</p>
                      <p className="mt-1 text-base font-semibold text-teal-100">{matchPercent !== null ? `${matchPercent}%` : '-'}</p>
                    </div>
                  ) : null}
                  {!showMatch && state !== 'default' && (showApplicationState || state === 'viewed') ? (
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em] ${tone.badge}`.trim()}
                    >
                      {stateLabel}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-[rgba(29,40,56,0.85)] bg-[rgba(255,255,255,0.02)] px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {formatRelativeTime(job.created_at)}
                  </span>
                </div>
              </div>

              {tags.length ? (
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {tags.map((tag) => (
                    <span key={tag} className="oq-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className={`grid gap-3 ${isCandidateMode ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
            {renderInfoPanel('Salary', formatSalaryRange(job.salary_min, job.salary_max, job.salary_disclosed))}
            {renderInfoPanel('Experience', formatExperienceRange(job.experience_min_years, job.experience_max_years))}
            {renderInfoPanel(isCandidateMode ? 'Application state' : 'Status', isCandidateMode ? (stateLabel || 'Open') : (state === 'viewed' ? 'Viewed' : 'Open'))}
          </div>

          {isCandidateMode ? (
            <div className="rounded-[1.15rem] border border-[rgba(29,40,56,0.9)] bg-[rgba(255,255,255,0.025)] px-4 py-3 text-sm text-[var(--text-soft)]">
              {candidateFooterMessage}
            </div>
          ) : null}
        </div>
      </article>
    </Link>
  );
}
