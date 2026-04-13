'use client';

import { Suspense } from 'react';
import AuthLayout from '@/components/AuthLayout';
import RegisterForm from '@/components/RegisterForm';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

export default function RegisterPage() {
  useAuthRedirect();

  return (
    <AuthLayout
      variant="candidate"
      eyebrow="Candidate profile"
      title="Create your profile"
      subtitle="Start with the basics and build the rest as you go."
      footerLabel="Already registered?"
      footerHref="/login"
      footerText="Sign in"
      sidePoints={[
        'Apply with more than a resume when you are ready.',
        'Keep your candidate flow lightweight at the point of entry.',
      ]}
    >
      <Suspense fallback={<div className="text-sm text-[var(--text-soft)]">Loading registration...</div>}>
        <RegisterForm fixedRole="candidate" submitLabel="Create Profile" />
      </Suspense>
    </AuthLayout>
  );
}
