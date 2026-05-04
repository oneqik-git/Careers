'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FormField from '@/components/FormField';
import { registerUser } from '@/services/auth';
import { setAuthSession } from '@/utils/authStorage';
import { getPostAuthRoute } from '@/utils/roles';

const initialForm = {
  role: 'candidate',
  full_name: '',
  email: '',
  phone: '',
  password: '',
  company_name: '',
  designation: '',
};

function getCompactCandidateName(email) {
  const localPart = String(email || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
  return localPart.length >= 2 ? localPart : 'Candidate';
}

export default function RegisterForm({
  fixedRole = null,
  compactCandidate = false,
  submitLabel = 'Create account',
  emailLabel = 'Email',
  emailPlaceholder = 'name@example.com',
  hideLabels = false,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeRole = fixedRole || form.role;
  const isEmployer = useMemo(() => activeRole === 'employer', [activeRole]);

  useEffect(() => {
    if (fixedRole === 'candidate' || fixedRole === 'employer') {
      setForm((current) => ({ ...current, role: fixedRole }));
      return;
    }

    const requestedRole = searchParams.get('role');

    if (requestedRole === 'candidate' || requestedRole === 'employer') {
      setForm((current) => ({ ...current, role: requestedRole }));
    }
  }, [fixedRole, searchParams]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const normalizedForm = compactCandidate && !isEmployer
        ? { ...form, full_name: getCompactCandidateName(form.email) }
        : form;
      const payload = await registerUser({ ...normalizedForm, role: activeRole });
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
      {!fixedRole ? (
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
      ) : null}

      {compactCandidate && !isEmployer ? null : (
        <FormField
          label="Full name"
          name="full_name"
          value={form.full_name}
          onChange={handleChange}
          placeholder={isEmployer ? 'Your full name' : 'Your full name'}
          hideLabel={hideLabels}
          required
        />
      )}
      <FormField
        label={emailLabel}
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder={emailPlaceholder}
        hideLabel={hideLabels}
        required
      />
      {!isEmployer && !compactCandidate ? (
        <FormField
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Indian mobile number"
          hideLabel={hideLabels}
          required
        />
      ) : null}
      <FormField
        label="Password"
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        placeholder="At least 8 characters"
        hideLabel={hideLabels}
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
            hideLabel={hideLabels}
            required
          />
          <FormField
            label="Designation"
            name="designation"
            value={form.designation}
            onChange={handleChange}
            placeholder="Talent lead, founder, hiring manager..."
            hideLabel={hideLabels}
          />
        </>
      ) : null}

      {error ? <p className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <button
        className="oq-button-primary w-full"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating account...' : submitLabel}
      </button>
    </form>
  );
}
