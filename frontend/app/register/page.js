'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RegisterRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('auth', 'register');
    router.replace(`/?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-sm text-[var(--text-soft)]">
      Opening registration...
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center px-4 text-sm text-[var(--text-soft)]">Opening registration...</main>}>
      <RegisterRedirect />
    </Suspense>
  );
}
