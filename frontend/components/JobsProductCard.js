import Link from 'next/link';
import { formatExperienceRange, formatRelativeTime, formatSalaryRange, formatStatus } from '@/utils/formatters';

function buildTags(job) {
  return [
    job.location || null,
    job.work_mode ? formatStatus(job.work_mode) : null,
    formatExperienceRange(job.experience_min_years, job.experience_max_years),
  ].filter(Boolean);
}

export default function JobsProductCard({
  job,
  href,
  onOpen,
}) {
  const tags = buildTags(job);
  const scoreLabel = job.company_score
    ? `Co. Score ${job.company_score}`
    : `${job.openings || 1} opening${job.openings === 1 ? '' : 's'}`;
  const metaLine = [job.industry, job.level ? formatStatus(job.level) : null].filter(Boolean).join(' | ');

  return (
    <Link
      className="group block h-full rounded-[10px] border border-[rgba(93,224,230,0.14)] bg-[rgba(2,9,27,0.72)] p-5 shadow-[inset_-4px_-1px_8px_-5px_rgba(93,224,230,0.3),inset_6px_3px_10px_5px_rgba(0,0,0,0.3),10px_10px_22px_rgba(0,0,0,0.22)] transition hover:border-[rgba(93,224,230,0.22)]"
      href={href}
      onClick={onOpen}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-[#9bbcff]">
              {job.company_name}
            </p>
            <h3 className="mt-4 text-[1.18rem] font-semibold leading-tight text-white transition-colors group-hover:text-[var(--brand-accent)]">
              {job.title}
            </h3>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className="rounded-full border border-[rgba(93,224,230,0.24)] bg-[rgba(93,224,230,0.06)] px-3 py-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-[#d9f8ff]">
              {scoreLabel}
            </span>
            <span className="rounded-full border border-[rgba(93,224,230,0.16)] bg-[rgba(255,255,255,0.02)] px-3 py-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              {formatRelativeTime(job.created_at)}
            </span>
          </div>
        </div>

        {metaLine ? (
          <p className="mt-4 text-[0.9rem] font-medium leading-6 text-white">
            {metaLine}
          </p>
        ) : null}

        {tags.length ? (
          <div className="mt-5 flex flex-wrap gap-2.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[rgba(93,224,230,0.14)] bg-[rgba(7,20,45,0.82)] px-3.5 py-2 text-[0.78rem] font-medium leading-none text-white"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-6 grid gap-7 px-2 pb-2 sm:grid-cols-2">
          <div className="big-box-shadow rounded-[12px] border border-[rgba(93,224,230,0.13)] bg-[var(--transparent-2)] px-3 py-2.5">
            <p className="text-[0.56rem] uppercase tracking-[0.24em] text-[#9bbcff]">Salary</p>
            <p className="mt-2.5 text-[0.78rem] font-semibold leading-5 text-white">
              {formatSalaryRange(job.salary_min, job.salary_max, job.salary_disclosed)}
            </p>
          </div>

          <div className="big-box-shadow rounded-[12px] border border-[rgba(93,224,230,0.13)] bg-[var(--transparent-2)] px-3 py-2.5">
            <p className="text-[0.56rem] uppercase tracking-[0.24em] text-[#9bbcff]">Department</p>
            <p className="mt-2.5 text-[0.78rem] font-semibold leading-5 text-white">{job.department || 'General'}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
