'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('auth', 'login');
    router.replace(`/?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-sm text-[var(--text-soft)]">
      Opening sign-in...
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center px-4 text-sm text-[var(--text-soft)]">Opening sign-in...</main>}>
      <LoginRedirect />
    </Suspense>
  );
}
