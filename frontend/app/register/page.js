'use client';

import { Suspense } from 'react';
import AuthLayout from '@/components/AuthLayout';
import RegisterForm from '@/components/RegisterForm';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

export default function RegisterPage() {
  useAuthRedirect();

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start with a candidate or employer profile. The rest can grow from here."
      footerLabel="Already registered?"
      footerHref="/login"
      footerText="Sign in"
    >
      <Suspense fallback={<div className="text-sm text-[var(--text-soft)]">Loading registration...</div>}>
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}
