export function getDashboardRoute(role) {
  if (role === 'candidate') {
    return '/candidate/dashboard';
  }

  if (role === 'employer' || role === 'admin') {
    return '/employer/dashboard';
  }

  return '/login';
}

export function getPostAuthRoute(role, nextPath) {
  const dashboardRoute = getDashboardRoute(role);

  if (!nextPath || typeof nextPath !== 'string' || !nextPath.startsWith('/')) {
    return dashboardRoute;
  }

  if (nextPath.startsWith('/candidate') && role !== 'candidate') {
    return dashboardRoute;
  }

  if (nextPath.startsWith('/employer') && role !== 'employer' && role !== 'admin') {
    return dashboardRoute;
  }

  return nextPath;
}
