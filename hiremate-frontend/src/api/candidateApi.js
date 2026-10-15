import axiosClient from './axiosClient';

export const candidateApi = {
  getProfile: (candidateId) => axiosClient.get(`/candidates/${candidateId}`),
  getMyProfile: () => axiosClient.get('/users/profile'),
  updateProfile: (data) => axiosClient.put('/users/profile', data),
  updateAvatar: (avatarUrl) => axiosClient.post('/users/avatar', { avatarUrl }),
  uploadAvatar: (formData) => axiosClient.post('/users/avatar/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export default candidateApi;
