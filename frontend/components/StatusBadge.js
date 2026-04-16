import { formatStatus } from '@/utils/formatters';
import { getApplicationStatusMeta, getStatusBadgeTone, hasApplicationStatusMeta } from '@/utils/applicationStatus';

export default function StatusBadge({ status, label, className = '' }) {
  if (!status && !label) {
    return null;
  }

  const normalizedStatus = String(status || '').toLowerCase();
  const meta = getApplicationStatusMeta(normalizedStatus);
  const tone = getStatusBadgeTone(normalizedStatus);
  const displayLabel = label || (hasApplicationStatusMeta(normalizedStatus) ? meta.badgeLabel : formatStatus(status));

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase ${tone} ${className}`.trim()}
    >
      {displayLabel}
    </span>
  );
}
