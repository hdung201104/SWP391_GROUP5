import axiosClient from './axiosClient';

export const candidateApi = {
  getProfile: (candidateId) => axiosClient.get(`/candidates/${candidateId}`),
  getMyProfile: () => axiosClient.get('/users/profile'),
  updateProfile: (data) => axiosClient.put('/users/profile', data),
  updateAvatar: (avatarUrl) => axiosClient.post('/users/avatar', { avatarUrl }),
  uploadAvatar: (formData) => axiosClient.post('/users/avatar/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getSavedJobs: () => axiosClient.get('/candidates/saved-jobs'),
  saveSavedJobs: (savedJobsJson) => axiosClient.post('/candidates/saved-jobs', savedJobsJson, {
    headers: { 'Content-Type': 'application/json' },
  }),
};

export default candidateApi;
