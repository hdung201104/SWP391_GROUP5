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
};

export default aiMatchApi;
