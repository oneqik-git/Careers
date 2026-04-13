import api from '@/services/api';

function unwrapData(response) {
  return response.data?.data ?? response.data;
}

export async function fetchJobs(params = {}) {
  const response = await api.get('/api/jobs', { params });
  return response.data;
}

export async function fetchJobDetail(jobId) {
  const response = await api.get(`/api/jobs/${jobId}`);
  return response.data;
}

export async function applyToJob(jobId, payload) {
  const response = await api.post(`/api/jobs/${jobId}/apply`, payload);
  return unwrapData(response);
}

export async function fetchMyApplications() {
  const response = await api.get('/api/jobs/my/applications');
  return unwrapData(response);
}

export async function fetchApplicationHistory(applicationId) {
  const response = await api.get(`/api/jobs/applications/${applicationId}/history`);
  return unwrapData(response);
}

export async function createJob(payload) {
  const response = await api.post('/api/jobs', payload);
  return response.data;
}

export async function fetchEmployerJobs(params = {}) {
  const response = await api.get('/api/jobs/employer', { params });
  return response.data;
}

export async function fetchJobApplications(jobId, params = {}) {
  const response = await api.get(`/api/jobs/${jobId}/applications`, { params });
  return unwrapData(response);
}

export async function updateJobApplication(applicationId, payload) {
  const response = await api.patch(`/api/jobs/applications/${applicationId}`, payload);
  return unwrapData(response);
}
