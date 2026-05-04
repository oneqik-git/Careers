'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FormField from '@/components/FormField';
import { loginUser } from '@/services/auth';
import { setAuthSession } from '@/utils/authStorage';
import { getPostAuthRoute } from '@/utils/roles';

const initialState = {
  email: '',
  password: '',
};

const roleLabels = {
  candidate: 'candidate',
  employer: 'employer',
};

export default function LoginForm({
  expectedRole = null,
  submitLabel = 'Sign in',
  emailPlaceholder = 'name@example.com',
  hideLabels = false,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = await loginUser(form);

      if (expectedRole && payload?.user?.role !== expectedRole) {
        throw new Error(`This sign-in page is for ${roleLabels[expectedRole] || expectedRole} accounts.`);
      }

      setAuthSession(payload);
      router.push(getPostAuthRoute(payload?.user?.role, searchParams.get('next')));
    } catch (requestError) {
      setError(requestError.message || 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <FormField
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder={emailPlaceholder}
        hideLabel={hideLabels}
        required
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        placeholder="Enter your password"
        hideLabel={hideLabels}
        required
      />

      {error ? <p className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <button
        className="oq-button-primary w-full"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Signing in...' : submitLabel}
      </button>
    </form>
  );
}
