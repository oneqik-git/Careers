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

export function formatStatus(value) {
  if (!value) {
    return '-';
  }

  return String(value)
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
