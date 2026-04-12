import Link from 'next/link';
import { formatSalaryRange, formatStatus } from '@/utils/formatters';

export default function JobSummaryCard({ job, href, footer }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{job.company_name || 'Company'}</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">{job.title}</h3>
          <p className="mt-2 text-sm text-slate-600">
            {[job.location, job.work_mode, job.level].filter(Boolean).join(' | ') || 'Details pending'}
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Salary: {formatSalaryRange(job.salary_min, job.salary_max, job.salary_disclosed)}
          </p>
          {job.status ? <p className="mt-2 text-sm text-slate-700">Status: {formatStatus(job.status)}</p> : null}
        </div>
        <Link
          className="inline-flex rounded-2xl bg-slate-950 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
          href={href}
        >
          View details
        </Link>
      </div>
      {footer ? <div className="mt-4 border-t border-slate-200 pt-4">{footer}</div> : null}
    </div>
  );
}
