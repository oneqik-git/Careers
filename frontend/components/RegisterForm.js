'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FormField from '@/components/FormField';
import { registerUser } from '@/services/auth';
import { setAuthSession } from '@/utils/authStorage';
import { getPostAuthRoute } from '@/utils/roles';

const initialCandidate = {
  role: 'candidate',
  full_name: '',
  email: '',
  phone: '',
  password: '',
  company_name: '',
  designation: '',
};

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState(initialCandidate);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEmployer = useMemo(() => form.role === 'employer', [form.role]);

  useEffect(() => {
    const requestedRole = searchParams.get('role');

    if (requestedRole === 'candidate' || requestedRole === 'employer') {
      setForm((current) => ({ ...current, role: requestedRole }));
    }
  }, [searchParams]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = await registerUser(form);
      setAuthSession(payload);
      router.push(getPostAuthRoute(payload?.user?.role, searchParams.get('next')));
    } catch (requestError) {
      setError(requestError.message || 'Unable to register.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-[var(--text-soft)]">Role</span>
        <select
          className="oq-select text-sm"
          name="role"
          value={form.role}
          onChange={handleChange}
        >
          <option value="candidate">Candidate</option>
          <option value="employer">Employer</option>
        </select>
      </label>

      <FormField
        label="Full name"
        name="full_name"
        value={form.full_name}
        onChange={handleChange}
        placeholder="Your full name"
        required
      />
      <FormField
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder="name@example.com"
        required
      />
      <FormField
        label="Phone"
        name="phone"
        value={form.phone}
        onChange={handleChange}
        placeholder="Optional for employer, required for candidate"
        required={!isEmployer}
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        placeholder="At least 8 characters"
        required
      />

      {isEmployer ? (
        <>
          <FormField
            label="Company name"
            name="company_name"
            value={form.company_name}
            onChange={handleChange}
            placeholder="Your company name"
            required
          />
          <FormField
            label="Designation"
            name="designation"
            value={form.designation}
            onChange={handleChange}
            placeholder="Optional"
          />
        </>
      ) : null}

      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <button
        className="oq-button-primary w-full"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  );
}
