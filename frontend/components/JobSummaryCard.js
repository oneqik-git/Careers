import Link from 'next/link';
import { formatSalaryRange, formatStatus } from '@/utils/formatters';

function createDefaultMetaChips(job) {
  return [job.location, job.work_mode ? formatStatus(job.work_mode) : null, job.level || job.department].filter(Boolean);
}

export default function JobSummaryCard({
  job,
  href,
  actionLabel = 'View details',
  badge,
  clickableCard = false,
  footer,
  helper,
  hideAction = false,
  metaChips,
  stats = [],
}) {
  const chips = metaChips?.length ? metaChips : createDefaultMetaChips(job);
  const content = (
    <article className="oq-card oq-public-job-card group rounded-[1.8rem] p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-[var(--text-muted)]">
              {job.company_name || 'Company'}
            </p>
            {badge}
          </div>
          <h3 className="mt-3 text-2xl font-medium tracking-[-0.05em] text-[var(--text)] transition-colors group-hover:text-[var(--brand-accent)]">
            {job.title}
          </h3>
          {helper ? <p className="mt-2 text-sm text-[var(--text-soft)]">{helper}</p> : null}

          {chips.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span key={chip} className="oq-chip">
                  {chip}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="oq-public-job-panel rounded-[1.25rem] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Salary</p>
              <p className="mt-2 text-sm font-medium text-[var(--text)]">
                {formatSalaryRange(job.salary_min, job.salary_max, job.salary_disclosed)}
              </p>
            </div>
            {stats.map((stat, index) => (
              <div key={`${stat.label}-${index}`} className="oq-public-job-panel rounded-[1.25rem] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">{stat.label}</p>
                <p className="mt-2 text-sm font-medium text-[var(--text)]">{stat.value}</p>
              </div>
            ))}
            {!stats.length && job.status ? (
              <div className="oq-public-job-panel rounded-[1.25rem] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Status</p>
                <p className="mt-2 text-sm font-medium text-[var(--text)]">{formatStatus(job.status)}</p>
              </div>
            ) : null}
          </div>
        </div>

        {!hideAction ? (
          <div className="flex min-w-[154px] justify-start lg:justify-end">
            <Link className="oq-button-primary w-full sm:w-auto" href={href}>
              {actionLabel}
            </Link>
          </div>
        ) : null}
      </div>
      {footer ? <div className="mt-5 border-t border-[var(--border)] pt-4">{footer}</div> : null}
    </article>
  );

  if (clickableCard && href) {
    return (
      <Link className="block" href={href}>
        {content}
      </Link>
    );
  }

  return content;
}
