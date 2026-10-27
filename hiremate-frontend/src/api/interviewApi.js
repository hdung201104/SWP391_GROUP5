import axiosClient from './axiosClient';

export const interviewApi = {
  startSession: (params) => axiosClient.post('/ai-interviews/start', null, { params }),
  submitAnswer: (sessionId, data) => axiosClient.post(`/ai-interviews/${sessionId}/submit-answer`, data),
  completeSession: (sessionId, data) => axiosClient.post(`/ai-interviews/${sessionId}/complete`, data),
  getSessionResult: (sessionId) => axiosClient.get(`/ai-interviews/${sessionId}/result`),
  getHistory: () => axiosClient.get('/ai-interviews/history'),
  generateQuestions: (params) => axiosClient.get('/ai-interviews/generate-questions', { params }),
  getNextAdaptiveQuestion: (sessionId) => axiosClient.get(`/ai-interviews/${sessionId}/next-question`),
  getConfig: () => axiosClient.get('/ai-interviews/config'),
  getQuotaStatus: () => axiosClient.get('/ai-interviews/quota-status'),
  processVoiceTurn: (sessionId, data) => axiosClient.post(`/ai-interviews/${sessionId}/voice-turn`, data),
  processVoiceTurnStandalone: (data) => axiosClient.post('/ai-interviews/voice-turn', data),
  checkTurnComplete: (data) => axiosClient.post('/ai-interviews/turn-complete', data),
  getAnswerCoaching: (data) => axiosClient.post('/ai-interviews/coach', data),
};


export default interviewApi;
