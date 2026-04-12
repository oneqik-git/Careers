import axios from 'axios';
import { getStoredToken } from '@/utils/authStorage';
import { extractError } from '@/utils/api';

function normalizeBaseUrl(value) {
  return value ? value.replace(/\/+$/, '') : value;
}

function getApiBaseUrl() {
  const configuredBaseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  return process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined;
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(extractError(error))
);

export default api;
