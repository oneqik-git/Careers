'use client';

import { usePathname, useRouter } from 'next/navigation';
import { getStoredRole, getStoredToken } from '@/utils/authStorage';
import { getDashboardRoute } from '@/utils/roles';

export default function PublicApplyAction({ jobId }) {
  const router = useRouter();
  const pathname = usePathname();

  function openCandidateAuth(mode, nextPath) {
    const params = new URLSearchParams();
    params.set('auth', mode);
    params.set('next', nextPath);
    router.push(`${pathname || '/'}?${params.toString()}`);
  }

  function handleApply() {
    const token = getStoredToken();
    const role = getStoredRole();
    const nextPath = `/candidate/jobs/detail?jobId=${jobId}`;

    if (!token || !role) {
      openCandidateAuth('login', nextPath);
      return;
    }

    if (role === 'candidate') {
      router.push(nextPath);
      return;
    }

    router.push(getDashboardRoute(role));
  }

  function handleRegister() {
    openCandidateAuth('register', `/candidate/jobs/detail?jobId=${jobId}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button className="oq-button-primary" onClick={handleApply} type="button">
        Continue to apply
      </button>
      <button className="oq-button-secondary" onClick={handleRegister} type="button">
        Create candidate account
      </button>
    </div>
  );
}
