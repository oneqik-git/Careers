import api from '@/services/api';

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
  return response.data;
}

export async function fetchMyApplications() {
  const response = await api.get('/api/jobs/my/applications');
  return response.data;
}

export async function fetchApplicationHistory(applicationId) {
  const response = await api.get(`/api/jobs/applications/${applicationId}/history`);
  return response.data;
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
  return response.data;
}

export async function updateJobApplication(applicationId, payload) {
  const response = await api.patch(`/api/jobs/applications/${applicationId}`, payload);
  return response.data;
}
