import axiosClient from './axiosClient';

export const applicationApi = {
  applyJob: (data) => axiosClient.post('/applications', data),
  getMyApplications: () => axiosClient.get('/applications/my'),
  getMyRecruiterApplications: () => axiosClient.get('/applications/recruiter/my'),
  getJobApplications: (jobId, status) => axiosClient.get(`/applications/job/${jobId}`, {
    params: status ? { status } : {},
  }),
  updateStatus: (applicationId, data) => axiosClient.put(`/applications/${applicationId}/status`, data),
  batchUpdateStatus: (data) => axiosClient.put('/applications/batch-status', data),
  getCandidateProfile: (candidateId) => axiosClient.get(`/applications/candidate/${candidateId}`),
  getApplicationTimeline: (applicationId) => axiosClient.get(`/applications/${applicationId}/timeline`),
  exportJobApplicationsCsv: (jobId) => axiosClient.get(`/applications/job/${jobId}/export`, {
    responseType: 'blob',
  }),
  withdrawApplication: (applicationId) => axiosClient.put(`/applications/${applicationId}/withdraw`),
};

export default applicationApi;
