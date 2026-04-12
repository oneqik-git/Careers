'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredRole, getStoredToken } from '@/utils/authStorage';
import { getDashboardRoute } from '@/utils/roles';

export function useAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = getStoredToken();
    const role = getStoredRole();

    if (token && role) {
      router.replace(getDashboardRoute(role));
    }
  }, [router]);
}
