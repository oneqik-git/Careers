import api from '@/services/api';

export async function fetchLearnOverview() {
  const response = await api.get('/api/learn/overview');
  return response.data?.data;
}
