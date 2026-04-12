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
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {job.company_name || 'Company'}
            </p>
            {badge}
          </div>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{job.title}</h3>
          {helper ? <p className="mt-2 text-sm text-slate-600">{helper}</p> : null}
          {chips.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span key={chip} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700">
                  {chip}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Salary</p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {formatSalaryRange(job.salary_min, job.salary_max, job.salary_disclosed)}
              </p>
            </div>
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{stat.value}</p>
              </div>
            ))}
            {!stats.length && job.status ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{formatStatus(job.status)}</p>
              </div>
            ) : null}
          </div>
        </div>

        <Link
          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm text-white transition hover:bg-slate-800"
          href={href}
        >
          {actionLabel}
        </Link>
      </div>
      {footer ? <div className="mt-5 border-t border-slate-200 pt-4">{footer}</div> : null}
    </article>
  );
}
