'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchCompanyProfile } from '@/services/company';

export function useCompanyProfile() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const profile = await fetchCompanyProfile();
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
