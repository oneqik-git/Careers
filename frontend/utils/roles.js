export function getDashboardRoute(role) {
  if (role === 'candidate') {
    return '/candidate/dashboard';
  }

  if (role === 'employer' || role === 'admin') {
    return '/employer/dashboard';
  }

  return '/login';
}
