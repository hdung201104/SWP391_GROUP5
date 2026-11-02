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
  getAnswerCoaching: (data) => axiosClient.post('/ai-interviews/coach', data),
  uploadAudio: (audioBlob) => {
    const formData = new FormData();
    const ext = audioBlob.type?.includes('mp4') ? 'm4a' : audioBlob.type?.includes('ogg') ? 'ogg' : 'webm';
    formData.append('file', audioBlob, `candidate_answer_${Date.now()}.${ext}`);
    return axiosClient.post('/ai-interviews/upload-audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAudioPlaybackUrl: (audioUrl) => {
    if (!audioUrl) return null;
    if (audioUrl.startsWith('blob:') || audioUrl.startsWith('https://') || audioUrl.startsWith('http://')) {
      return audioUrl;
    }
    return `/api/v1/ai-interviews/audio-playback?url=${encodeURIComponent(audioUrl)}`;
  },
  getLatestCandidateInterview: (candidateId, jobId) =>
    axiosClient.get(`/ai-interviews/candidate/${candidateId}/latest`, { params: jobId ? { jobId } : {} }),
  getByApplication: (applicationId) =>
    axiosClient.get(`/ai-interviews/application/${applicationId}`).catch(() => null),
};


export default interviewApi;
