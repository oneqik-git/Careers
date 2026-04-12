const TOKEN_KEY = 'oq-career-access-token';
const ROLE_KEY = 'oq-career-role';
const USER_KEY = 'oq-career-user';
const LINKS_KEY = 'oq-career-links';

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function setAuthSession(payload) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, payload?.tokens?.access || '');
  window.localStorage.setItem(ROLE_KEY, payload?.user?.role || '');
  window.localStorage.setItem(USER_KEY, JSON.stringify(payload?.user || null));
  window.localStorage.setItem(LINKS_KEY, JSON.stringify(payload?.links || null));
}

export function clearAuthStorage() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(ROLE_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(LINKS_KEY);
}

export function getStoredToken() {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredRole() {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(ROLE_KEY);
}

export function getStoredUser() {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
