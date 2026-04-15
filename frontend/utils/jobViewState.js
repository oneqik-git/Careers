const VIEWED_JOBS_KEY = 'oq-viewed-jobs';

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function getViewedJobs() {
  if (!canUseStorage()) {
    return [];
  }

  const raw = window.localStorage.getItem(VIEWED_JOBS_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function markJobViewed(jobId) {
  if (!canUseStorage() || !jobId) {
    return;
  }

  const nextIds = Array.from(new Set([...getViewedJobs(), jobId]));
  window.localStorage.setItem(VIEWED_JOBS_KEY, JSON.stringify(nextIds));
}
