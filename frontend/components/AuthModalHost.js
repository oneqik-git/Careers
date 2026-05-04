'use client';

import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';

function updateAuthParam(pathname, searchParams, mode) {
  const params = new URLSearchParams(searchParams.toString());

  if (mode) {
    params.set('auth', mode);
  } else {
    params.delete('auth');
  }

  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ''}`;
}

function AuthModalContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const authMode = searchParams.get('auth');
  const isOpen = authMode === 'login' || authMode === 'register';
  const isRegister = authMode === 'register';

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        router.push(updateAuthParam(pathname, searchParams, null));
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, pathname, router, searchParams]);

  if (!isOpen) {
    return null;
  }

  const closeHref = updateAuthParam(pathname, searchParams, null);
  const switchHref = updateAuthParam(pathname, searchParams, isRegister ? 'login' : 'register');

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#000820]/82 px-4 py-6 backdrop-blur-[3px]" role="dialog" aria-modal="true" aria-labelledby="candidate-auth-title">
      <div className="candidate-auth-modal relative flex w-full max-w-[500px] flex-col items-center justify-start overflow-hidden rounded-[15px] bg-[rgba(29,40,56,0.9)] px-6 py-8 text-center text-white sm:px-9 sm:py-10">
        <div className="w-full max-w-[390px]">
          <div className="min-w-0">
            <h2 id="candidate-auth-title" className="text-[1.35rem] font-normal leading-none tracking-[-0.06em] text-white">
              {isRegister ? 'Create your profile' : 'Sign in to Careers'}
            </h2>
            <p className="mt-3 text-sm font-light leading-6 text-[var(--secondary-1)]">
              {isRegister ? 'Use your email and password for now.' : 'Continue with your email and password.'}
            </p>
          </div>
        </div>
        <Link aria-label="Close auth modal" className="absolute right-5 top-5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-3xl font-light leading-none text-white/82 transition hover:text-white" href={closeHref}>
          &times;
        </Link>

        <div className="mt-7 w-full max-w-[390px]">
          {isRegister ? (
            <RegisterForm fixedRole="candidate" compactCandidate hideLabels submitLabel="Create Profile" />
          ) : (
            <LoginForm hideLabels submitLabel="Sign in" />
          )}
        </div>

        <p className="mt-5 w-full max-w-[390px] border-t border-[rgba(93,224,230,0.12)] pt-4 text-sm font-light text-[var(--secondary-1)]">
          {isRegister ? 'Already registered?' : 'Need an account?'}{' '}
          <Link className="font-semibold text-[var(--primary-2)] transition hover:text-white" href={switchHref}>
            {isRegister ? 'Sign in' : 'Create your profile'}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AuthModalHost() {
  return (
    <Suspense fallback={null}>
      <AuthModalContent />
    </Suspense>
  );
}
