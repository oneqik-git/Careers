'use client';

import { Suspense } from 'react';
import AuthLayout from '@/components/AuthLayout';
import LoginForm from '@/components/LoginForm';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

export default function LoginPage() {
  useAuthRedirect();

  return (
    <AuthLayout
      variant="candidate"
      eyebrow="Candidate sign in"
      title="Sign in"
      subtitle="Pick up where you left off."
      footerLabel="Need an account?"
      footerHref="/register"
      footerText="Create your profile"
      sidePoints={[
        'Browse publicly before you sign in.',
        'Continue applications and track progress after auth.',
      ]}
    >
      <Suspense fallback={<div className="text-sm text-[var(--text-soft)]">Loading sign-in...</div>}>
        <LoginForm submitLabel="Sign in" />
      </Suspense>
    </AuthLayout>
  );
}
