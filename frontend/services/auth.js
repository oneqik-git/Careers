import api from '@/services/api';

function unwrapAuthResponse(response) {
  return response?.data?.data || {
    user: response?.data?.user || null,
    tokens: response?.data?.tokens || null,
    links: response?.data?.links || null,
  };
}

export async function loginUser(payload) {
  const response = await api.post('/api/auth/login', payload);
  return unwrapAuthResponse(response);
}

export async function registerUser(payload) {
  const endpoint = payload.role === 'employer'
    ? '/api/auth/register/employer'
    : '/api/auth/register/candidate';

  const body = payload.role === 'employer'
    ? {
        email: payload.email,
        password: payload.password,
        full_name: payload.full_name,
        company_name: payload.company_name,
        designation: payload.designation || undefined,
      }
    : {
        email: payload.email,
        phone: payload.phone || undefined,
        password: payload.password,
        full_name: payload.full_name,
      };

  const response = await api.post(endpoint, body);
  return unwrapAuthResponse(response);
}
