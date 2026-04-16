import { formatDateTime, formatStatus } from '@/utils/formatters';
import StatusBadge from '@/components/StatusBadge';
import { getApplicationStatusMeta } from '@/utils/applicationStatus';

export default function ApplicationTimeline({ entries = [] }) {
  return (
    <div className="relative space-y-4 before:absolute before:bottom-0 before:left-[15px] before:top-1 before:w-px before:bg-[var(--border)]">
      {entries.map((entry, index) => {
        const meta = getApplicationStatusMeta(entry.to_status);
        const title =
          formatStatus(entry.from_status) === '-'
            ? `Moved to ${formatStatus(entry.to_status)}`
            : `${formatStatus(entry.from_status)} to ${formatStatus(entry.to_status)}`;

        return (
          <div key={entry.id} className="relative pl-10">
            <div className={`absolute left-0 top-4 flex h-8 w-8 items-center justify-center rounded-full border text-center text-xs font-semibold ${meta.dotClassName}`.trim()}>
              {index === entries.length - 1 ? 'Now' : index + 1}
            </div>
            <div className={`rounded-[1.7rem] border p-5 shadow-[0_18px_34px_rgba(0,0,0,0.18)] ${meta.cardClassName}`.trim()}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
                    <StatusBadge status={entry.to_status} />
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-soft)]">{entry.note || 'No employer note was added for this step.'}</p>
                </div>
                <p className="text-sm text-[var(--text-muted)]">{formatDateTime(entry.created_at)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
