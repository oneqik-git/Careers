import api from '@/services/api';

export async function fetchCompanyProfile() {
  const response = await api.get('/api/companies/me');
  return response.data?.data;
}
