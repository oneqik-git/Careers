'use client';

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
      <RegisterForm />
    </AuthLayout>
  );
}
