import axiosClient from './axiosClient';

export const applicationApi = {
  applyJob: (data) => axiosClient.post('/applications', data),
  getMyApplications: () => axiosClient.get('/applications/my'),
  getJobApplications: (jobId) => axiosClient.get(`/applications/job/${jobId}`),
  updateStatus: (applicationId, data) => axiosClient.put(`/applications/${applicationId}/status`, data),
};

export default applicationApi;
