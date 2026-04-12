'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredRole, getStoredToken } from '@/utils/authStorage';
import { getDashboardRoute } from '@/utils/roles';

export default function ProtectedRoute({ allowedRoles, children }) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    const role = getStoredRole();

    if (!token || !role) {
      router.replace('/login');
      return;
    }

    if (!allowedRoles.includes(role)) {
      router.replace(getDashboardRoute(role));
      return;
    }

    setIsReady(true);
  }, [allowedRoles, router]);

  if (!isReady) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-600">Checking access...</div>;
  }

  return children;
}
