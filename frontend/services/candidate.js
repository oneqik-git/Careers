import api from '@/services/api';

export async function fetchCandidateProfile() {
  const response = await api.get('/api/candidates/me');
  return response.data?.data;
}
