import { formatStatus } from '@/utils/formatters';

const toneMap = {
  submitted: 'border-sky-200 bg-sky-50 text-sky-700',
  under_review: 'border-sky-200 bg-sky-50 text-sky-700',
  relevancy_test: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  interview_scheduled: 'border-violet-200 bg-violet-50 text-violet-700',
  interview_done: 'border-violet-200 bg-violet-50 text-violet-700',
  shortlisted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  offer_sent: 'border-amber-200 bg-amber-50 text-amber-700',
  offer_accepted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  joined: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  on_hold: 'border-amber-200 bg-amber-50 text-amber-700',
  offer_declined: 'border-rose-200 bg-rose-50 text-rose-700',
  rejected: 'border-rose-200 bg-rose-50 text-rose-700',
  withdrawn: 'border-slate-200 bg-slate-100 text-slate-700',
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  closed: 'border-slate-200 bg-slate-100 text-slate-700',
  draft: 'border-amber-200 bg-amber-50 text-amber-700',
};

export default function StatusBadge({ status, label, className = '' }) {
  if (!status && !label) {
    return null;
  }

  const normalizedStatus = String(status || '').toLowerCase();
  const tone = toneMap[normalizedStatus] || 'border-slate-200 bg-slate-100 text-slate-700';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase ${tone} ${className}`.trim()}
    >
      {label || formatStatus(status)}
    </span>
  );
}
