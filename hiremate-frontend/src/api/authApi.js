import axiosClient from './axiosClient';

export const authApi = {
  // Authentication core
  login: (credentials) => axiosClient.post('/auth/login', credentials),
  register: (userData) => axiosClient.post('/auth/register', userData),
  getMe: () => axiosClient.get('/auth/me'),
  logout: () => axiosClient.post('/auth/logout'),

  // Email OTP Verification
  sendOtp: (data) => axiosClient.post('/auth/send-otp', data),
  verifyOtp: (data) => axiosClient.post('/auth/verify-otp', data),

  // Password Recovery & Security
  forgotPassword: (data) => axiosClient.post('/auth/forgot-password', data),
  resetPassword: (data) => axiosClient.post('/auth/reset-password', data),
  changePassword: (data) => axiosClient.post('/auth/change-password', data),

  // Social Login (Google & GitHub)
  googleLogin: (data) => axiosClient.post('/auth/google', data),

  // Personal Account Profile Management (User Profile)
  getProfile: () => axiosClient.get('/users/profile'),
  updateProfile: (data) => axiosClient.put('/users/profile', data),
  updateAvatar: (avatarUrl) => axiosClient.post('/users/avatar', { avatarUrl }),
};

export default authApi;
