'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/DashboardShell';
import MessageBanner from '@/components/MessageBanner';
import PageHero from '@/components/PageHero';
import ProtectedRoute from '@/components/ProtectedRoute';
import SectionCard from '@/components/SectionCard';
import { createJob } from '@/services/jobs';
import { clearAuthStorage } from '@/utils/authStorage';
import { employerNavItems } from '@/utils/navigation';

function createBlankQuestion() {
  return {
    question_text: '',
  };
}

export default function PostJobPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    work_mode: 'on_site',
    salary_min: '',
    salary_max: '',
    description: '',
  });
  const [questions, setQuestions] = useState([createBlankQuestion()]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (error?.code === 'AUTH_REQUIRED' || error?.code === 'TOKEN_INVALID' || error?.code === 'TOKEN_EXPIRED') {
      clearAuthStorage();
      router.replace('/login');
    }
  }, [error, router]);

  function updateField(field, value) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateQuestion(index, value) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, question_text: value } : question
      )
    );
  }

  function addQuestion() {
    setQuestions((current) => [...current, createBlankQuestion()]);
  }

  function removeQuestion(index) {
    setQuestions((current) => current.filter((_, questionIndex) => questionIndex !== index));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSuccessMessage('');
    const trimmedTitle = formData.title.trim();
    const trimmedDepartment = formData.department.trim();
    const trimmedDescription = formData.description.trim();
    const sanitizedQuestions = questions
      .map((question) => question.question_text.trim())
      .filter(Boolean);

    if (!trimmedTitle) {
      setError({ message: 'Job title is required.' });
      return;
    }

    if (!trimmedDepartment) {
      setError({ message: 'Department is required.' });
      return;
    }

    if (trimmedDescription.length < 50) {
      setError({ message: 'Description must be at least 50 characters to match backend validation.' });
      return;
    }

    const shortQuestion = sanitizedQuestions.find((questionText) => questionText.length < 3);

    if (shortQuestion) {
      setError({ message: 'Each prescreening question must be at least 3 characters long.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createJob({
        ...formData,
        title: trimmedTitle,
        department: trimmedDepartment,
        description: trimmedDescription,
        location: formData.location.trim() || null,
        salary_min: formData.salary_min ? Number(formData.salary_min) : null,
        salary_max: formData.salary_max ? Number(formData.salary_max) : null,
        prescreening_questions: sanitizedQuestions.map((question_text) => ({
            question_text,
            question_type: 'text',
          })),
      });

      setSuccessMessage(`Job created successfully. Job ID: ${response?.data?.job_id}`);
      setFormData({
        title: '',
        department: '',
        location: '',
        work_mode: 'on_site',
        salary_min: '',
        salary_max: '',
        description: '',
      });
      setQuestions([createBlankQuestion()]);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={['employer', 'admin']}>
      <DashboardShell
        title="Post a Job"
        subtitle="Create a role with clearer grouping so the posting flow feels more structured and less form-heavy."
        navItems={employerNavItems}
      >
        <div className="space-y-6">
          <PageHero
            eyebrow="New role"
            title="Create a job posting"
            description="This pass keeps the form simple but improves the grouping, guidance text, and spacing so employers can move through it with more confidence."
            actions={[
              { label: 'View Jobs', href: '/employer/jobs', variant: 'secondary' },
              { label: 'Dashboard', href: '/employer/dashboard' },
            ]}
            aside={
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-sky-100/80">Current scope</p>
                <p className="mt-2 text-lg font-semibold">Core posting flow only</p>
                <p className="mt-2 text-sm text-slate-200">
                  Title, department, compensation, description, and prescreen text prompts are all supported.
                </p>
              </div>
            }
          />

          <SectionCard title="New Job Form" description="This page submits POST /api/jobs with the current prototype fields.">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <MessageBanner tone="success" message={successMessage} />
              <MessageBanner tone="error" message={error?.message} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="job-title">
                    Title
                  </label>
                  <input
                    id="job-title"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                    onChange={(event) => updateField('title', event.target.value)}
                    value={formData.title}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="job-department">
                    Department
                  </label>
                  <input
                    id="job-department"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                    onChange={(event) => updateField('department', event.target.value)}
                    value={formData.department}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="job-location">
                    Location
                  </label>
                  <input
                    id="job-location"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                    onChange={(event) => updateField('location', event.target.value)}
                    value={formData.location}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="job-work-mode">
                    Work mode
                  </label>
                  <select
                    id="job-work-mode"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                    onChange={(event) => updateField('work_mode', event.target.value)}
                    value={formData.work_mode}
                  >
                    <option value="on_site">On-site</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="salary-min">
                    Salary min
                  </label>
                  <input
                    id="salary-min"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                    onChange={(event) => updateField('salary_min', event.target.value)}
                    type="number"
                    value={formData.salary_min}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="salary-max">
                    Salary max
                  </label>
                  <input
                    id="salary-max"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                    onChange={(event) => updateField('salary_max', event.target.value)}
                    type="number"
                    value={formData.salary_max}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="job-description">
                  Description
                </label>
                <textarea
                  id="job-description"
                  className="min-h-40 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                  onChange={(event) => updateField('description', event.target.value)}
                  placeholder="Summarize the role, team context, and what success looks like."
                  value={formData.description}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Prescreening questions</p>
                    <p className="mt-1 text-sm text-slate-600">These are sent as text questions for the current frontend prototype.</p>
                  </div>
                  <button
                    className="rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-white"
                    onClick={addQuestion}
                    type="button"
                  >
                    Add question
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {questions.map((question, index) => (
                    <div key={`question-${index}`} className="flex gap-3">
                      <input
                        className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
                        onChange={(event) => updateQuestion(index, event.target.value)}
                        placeholder={`Question ${index + 1}`}
                        value={question.question_text}
                      />
                      {questions.length > 1 ? (
                        <button
                          className="rounded-2xl border border-red-200 px-4 py-3 text-sm text-red-700 transition hover:bg-red-50"
                          onClick={() => removeQuestion(index)}
                          type="button"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? 'Creating job...' : 'Create job'}
                </button>
                <Link
                  className="rounded-2xl border border-slate-300 px-5 py-3 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  href="/employer/jobs"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </SectionCard>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
