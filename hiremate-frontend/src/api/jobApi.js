import axiosClient from './axiosClient';

export const jobApi = {
  getJobs: (params) => axiosClient.get('/jobs', { params }),
  getJobById: (id) => axiosClient.get(`/jobs/${id}`),
  getJobDetail: (id) => axiosClient.get(`/jobs/${id}`),
  getRecommendations: (params) => axiosClient.get('/jobs/recommendations', { params }),
  reMatch: () => axiosClient.post('/jobs/re-match'),
  createJob: (jobData) => axiosClient.post('/jobs', jobData),
  updateJob: (id, jobData) => axiosClient.put(`/jobs/${id}`, jobData),
  closeJob: (id) => axiosClient.delete(`/jobs/${id}`),
  deleteJob: (id) => axiosClient.delete(`/jobs/${id}`),
  getMyJobs: () => axiosClient.get('/jobs/recruiter/my'),
  getMyJobsPaged: (params) => axiosClient.get('/jobs/recruiter/my/paged', { params }),
  getJobsByCompany: (companyId) => axiosClient.get(`/jobs/company/${companyId}`),
  updateJobStatus: (id, status) => axiosClient.patch(`/jobs/${id}/status?status=${status}`),
  cloneJob: (id) => axiosClient.post(`/jobs/${id}/clone`),
  scanJd: (formData) => axiosClient.post('/jobs/scan-jd', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export default jobApi;
