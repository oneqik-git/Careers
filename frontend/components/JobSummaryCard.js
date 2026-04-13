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
  footer,
  helper,
  metaChips,
  stats = [],
}) {
  const chips = metaChips?.length ? metaChips : createDefaultMetaChips(job);

  return (
    <article className="oq-card rounded-[2rem] p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">
              {job.company_name || 'Company'}
            </p>
            {badge}
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text)]">{job.title}</h3>
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
            <div className="rounded-[1.3rem] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Salary</p>
              <p className="mt-2 text-sm font-semibold text-[var(--text)]">
                {formatSalaryRange(job.salary_min, job.salary_max, job.salary_disclosed)}
              </p>
            </div>
            {stats.map((stat, index) => (
              <div key={`${stat.label}-${index}`} className="rounded-[1.3rem] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">{stat.label}</p>
                <p className="mt-2 text-sm font-semibold text-[var(--text)]">{stat.value}</p>
              </div>
            ))}
            {!stats.length && job.status ? (
              <div className="rounded-[1.3rem] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Status</p>
                <p className="mt-2 text-sm font-semibold text-[var(--text)]">{formatStatus(job.status)}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-[154px] justify-start lg:justify-end">
          <Link className="oq-button-primary w-full sm:w-auto" href={href}>
            {actionLabel}
          </Link>
        </div>
      </div>
      {footer ? <div className="mt-5 border-t border-[var(--border)] pt-4">{footer}</div> : null}
    </article>
  );
}
