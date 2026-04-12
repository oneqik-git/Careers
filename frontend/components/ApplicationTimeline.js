import { formatDateTime, formatStatus } from '@/utils/formatters';
import StatusBadge from '@/components/StatusBadge';

export default function ApplicationTimeline({ entries = [] }) {
  return (
    <div className="relative space-y-4 before:absolute before:bottom-0 before:left-[15px] before:top-1 before:w-px before:bg-slate-200">
      {entries.map((entry, index) => {
        const title =
          formatStatus(entry.from_status) === '-'
            ? `Moved to ${formatStatus(entry.to_status)}`
            : `${formatStatus(entry.from_status)} to ${formatStatus(entry.to_status)}`;

        return (
          <div key={entry.id} className="relative pl-10">
            <div className="absolute left-0 top-5 h-8 w-8 rounded-full border border-sky-200 bg-sky-50 text-center text-xs font-semibold leading-8 text-sky-700">
              {index + 1}
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-950">{title}</p>
                    <StatusBadge status={entry.to_status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{entry.note || 'No note was added for this step.'}</p>
                </div>
                <p className="text-sm text-slate-500">{formatDateTime(entry.created_at)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
