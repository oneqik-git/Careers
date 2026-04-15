export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatSalaryRange(min, max, disclosed = true) {
  if (disclosed === false) {
    return 'Not disclosed';
  }

  const formattedMin = formatCurrency(min);
  const formattedMax = formatCurrency(max);

  if (formattedMin && formattedMax) {
    return `${formattedMin} - ${formattedMax}`;
  }

  return formattedMin || formattedMax || 'Not specified';
}

export function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatRelativeTime(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1 || now.toDateString() === date.toDateString()) {
    return 'Today';
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)}w ago`;
  }

  if (diffDays < 365) {
    return `${Math.floor(diffDays / 30)}mo ago`;
  }

  return `${Math.floor(diffDays / 365)}y ago`;
}

export function formatStatus(value) {
  if (!value) {
    return '-';
  }

  return String(value)
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatExperienceRange(minYears, maxYears) {
  const min = minYears ?? 0;
  const max = maxYears ?? null;

  if (max) {
    return `${min}-${max} years`;
  }

  if (min) {
    return `${min}+ years`;
  }

  return 'Open to varied experience';
}

export function formatExperienceMonths(totalMonths) {
  if (totalMonths === null || totalMonths === undefined) {
    return '-';
  }

  const years = totalMonths / 12;

  if (years < 1) {
    return `${totalMonths} months`;
  }

  const rounded = Number.isInteger(years) ? years : years.toFixed(1);
  return `${rounded} years`;
}
