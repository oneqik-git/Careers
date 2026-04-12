'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredRole, getStoredToken } from '@/utils/authStorage';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (!getStoredToken()) {
      router.replace('/login');
      return;
    }

    const role = getStoredRole();
    if (role === 'candidate') {
      router.replace('/candidate/dashboard');
      return;
    }

    if (role === 'employer' || role === 'admin') {
      router.replace('/employer/dashboard');
      return;
    }

    router.replace('/login');
  }, [router]);

  return <div className="flex min-h-screen items-center justify-center text-sm text-slate-600">Loading OQ Career...</div>;
}
