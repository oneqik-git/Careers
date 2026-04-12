import { formatDateTime, formatStatus } from '@/utils/formatters';

export default function ApplicationTimeline({ entries = [] }) {
  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {formatStatus(entry.from_status) === '-'
                  ? `Moved to ${formatStatus(entry.to_status)}`
                  : `${formatStatus(entry.from_status)} to ${formatStatus(entry.to_status)}`}
              </p>
              <p className="mt-1 text-sm text-slate-600">{entry.note || 'No note added'}</p>
            </div>
            <p className="text-sm text-slate-500">{formatDateTime(entry.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
