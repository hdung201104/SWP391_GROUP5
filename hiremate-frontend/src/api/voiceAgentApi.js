import axiosClient from './axiosClient';

/**
 * API client tương tác với Voice Realtime AI Agent của HireMate
 */
export const voiceAgentApi = {
  /**
   * Kiểm tra xem Voice AI Realtime đã được cấu hình trên server hay chưa
   */
  getStatus: () => {
    return axiosClient.get('/voice-agent/status');
  },

  /**
   * Yêu cầu Backend Spring Boot tạo ephemeral client token với OpenAI Realtime API
   * @param {Object} payload { targetPosition, level, voice, customNotes, jobId }
   */
  createSession: (payload = {}) => {
    return axiosClient.post('/voice-agent/session', payload);
  },
};

export default voiceAgentApi;
