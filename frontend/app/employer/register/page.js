'use client';

import { Suspense } from 'react';
import AuthLayout from '@/components/AuthLayout';
import RegisterForm from '@/components/RegisterForm';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

export default function EmployerRegisterPage() {
  useAuthRedirect();

  return (
    <AuthLayout
      variant="employer"
      eyebrow="Employer registration"
      title="Create employer account"
      subtitle="Start with your work email and company details."
      footerLabel="Already have employer access?"
      footerHref="/employer/login"
      footerText="Sign in"
      sideTitle="Start hiring from a company-linked account."
      sideBody="Employer signup is focused on work identity first, with lightweight registration and no phone requirement at the first step."
      sidePoints={[
        'Work email required',
        'Personal email domains blocked',
        'Minimal safe change to existing auth architecture',
      ]}
    >
      <Suspense fallback={<div className="text-sm text-[var(--text-soft)]">Loading registration...</div>}>
        <RegisterForm
          fixedRole="employer"
          submitLabel="Create Employer Account"
          emailLabel="Work email"
          emailPlaceholder="you@company.com"
        />
      </Suspense>
    </AuthLayout>
  );
}
