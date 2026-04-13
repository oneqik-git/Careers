'use client';

import { Suspense } from 'react';
import AuthLayout from '@/components/AuthLayout';
import LoginForm from '@/components/LoginForm';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

export default function LoginPage() {
  useAuthRedirect();

  return (
    <AuthLayout
      title="Sign in to OQ Career"
      subtitle="Use your existing candidate or employer account to continue."
      footerLabel="Need an account?"
      footerHref="/register"
      footerText="Register"
    >
      <Suspense fallback={<div className="text-sm text-[var(--text-soft)]">Loading sign-in...</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
