'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchCandidateProfile } from '@/services/candidate';

export function useCandidateProfile() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const profile = await fetchCandidateProfile();
      setData(profile);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    error,
    isLoading,
    refetch: load,
  };
}
