'use client';

import { Suspense } from 'react';
import AuthLayout from '@/components/AuthLayout';
import LoginForm from '@/components/LoginForm';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

export default function EmployerLoginPage() {
  useAuthRedirect();

  return (
    <AuthLayout
      variant="employer"
      eyebrow="Employer sign in"
      title="Employer sign in"
      subtitle="Access your hiring workspace with your employer account."
      footerLabel="Need employer access?"
      footerHref="/employer/register"
      footerText="Create employer account"
      sideTitle="Keep employer access separate from the candidate journey."
      sideBody="Use your employer credentials to manage opportunities, applicants, and company-owned hiring workflows."
      sidePoints={[
        'Employer-focused entry and copy',
        'Protected posting and applicant review',
        'Work-email registration path',
      ]}
    >
      <Suspense fallback={<div className="text-sm text-[var(--text-soft)]">Loading sign-in...</div>}>
        <LoginForm expectedRole="employer" submitLabel="Sign in as Employer" emailPlaceholder="you@company.com" />
      </Suspense>
    </AuthLayout>
  );
}
