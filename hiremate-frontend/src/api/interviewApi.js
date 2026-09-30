import axiosClient from './axiosClient';

export const interviewApi = {
  startSession: (params) => axiosClient.post('/ai-interviews/start', null, { params }),
  submitAnswer: (sessionId, data) => axiosClient.post(`/ai-interviews/${sessionId}/submit-answer`, data),
  completeSession: (sessionId) => axiosClient.post(`/ai-interviews/${sessionId}/complete`),
  getSessionResult: (sessionId) => axiosClient.get(`/ai-interviews/${sessionId}/result`),
  getHistory: () => axiosClient.get('/ai-interviews/history'),
};

export default interviewApi;
