import axiosClient from './axiosClient';

export const candidateApi = {
  getProfile: (candidateId) => axiosClient.get(`/candidates/${candidateId}`),
  getMyProfile: () => axiosClient.get('/users/profile'),
  updateProfile: (data) => axiosClient.put('/users/profile', data),
  updateAvatar: (avatarUrl) => axiosClient.post('/users/avatar', { avatarUrl }),
};

export default candidateApi;
