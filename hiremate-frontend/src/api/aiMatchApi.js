import axiosClient from './axiosClient';

export const aiMatchApi = {
  // Lấy toàn bộ kết quả phân tích AI Match của ứng viên nộp vào một job
  getJobMatchesForRecruiter: (jobId) => axiosClient.get(`/ai-matches/recruiter/job/${jobId}`),

  // Kích hoạt quét và tính toán lại điểm tương thích AI hàng loạt
  recalculateMatchesForJob: (jobId) => axiosClient.post(`/ai-matches/recruiter/job/${jobId}/recalculate-all`),

  // Lấy chi tiết match giữa candidate hiện tại và job
  getCandidateJobMatch: (jobId) => axiosClient.get(`/ai-matches/job/${jobId}`),

  // Lấy tất cả matches của ứng viên
  getMyJobMatches: () => axiosClient.get('/ai-matches/my'),

  // Lấy danh sách việc làm gợi ý cá nhân hóa
  getRecommendations: (params) => axiosClient.get('/ai-matches/recommendations', { params }),

  // Lấy báo cáo đối soát AI chuyên sâu giữa CV của ứng viên và bài đăng tuyển dụng (Gemini AI Evaluation)
  getDetailedCandidateEvaluation: (jobId, candidateId) =>
    axiosClient.get(`/ai-matches/job/${jobId}/candidate/${candidateId}/detailed-evaluation`),
};

export default aiMatchApi;
