import axiosClient from './axiosClient';

export const jobApi = {
  getJobs: (params) => axiosClient.get('/jobs', { params }),
  getJobById: (id) => axiosClient.get(`/jobs/${id}`),
  getJobDetail: (id) => axiosClient.get(`/jobs/${id}`),
  getRecommendations: (params) => axiosClient.get('/ai-matches/recommendations', { params }),
  createJob: (jobData) => axiosClient.post('/jobs', jobData),
  updateJob: (id, jobData) => axiosClient.put(`/jobs/${id}`, jobData),
  closeJob: (id) => axiosClient.delete(`/jobs/${id}`),
  getMyJobs: () => axiosClient.get('/jobs/recruiter/my'),
};

export default jobApi;
