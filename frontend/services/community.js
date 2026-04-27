import api from '@/services/api';

function unwrapData(response) {
  return response.data?.data ?? response.data;
}

export async function fetchCommunityFeed(params = {}) {
  const response = await api.get('/api/community', { params });
  return unwrapData(response);
}

export async function toggleCommunityUpvote(postId) {
  const response = await api.post(`/api/community/${postId}/upvote`);
  return unwrapData(response);
}

export async function toggleCommunityReaction(targetType, targetId) {
  const response = await api.post(`/api/community/${targetType}/${targetId}/reactions`);
  return unwrapData(response);
}

export async function createCommunityComment(postId, payload) {
  const response = await api.post(`/api/community/${postId}/comments`, payload);
  return unwrapData(response);
}

export async function createCommunityTargetComment(targetType, targetId, payload) {
  const response = await api.post(`/api/community/${targetType}/${targetId}/comments`, payload);
  return unwrapData(response);
}

export async function createCommunityQuestion(payload) {
  const response = await api.post('/api/community/questions', payload);
  return unwrapData(response);
}

export async function createCommunityPost(payload) {
  const response = await api.post('/api/community/posts', payload);
  return unwrapData(response);
}

export async function createCommunityAnswer(questionId, payload) {
  const response = await api.post(`/api/community/questions/${questionId}/answers`, payload);
  return unwrapData(response);
}

export async function submitCommunityPollVote(postId, payload) {
  const response = await api.post(`/api/community/${postId}/poll-vote`, payload);
  return unwrapData(response);
}
