import axiosClient from './axiosClient';

export const adminApi = {
  // System Metrics & Overview
  getStats: () => axiosClient.get('/admin/stats'),

  // Users Management
  getUsers: () => axiosClient.get('/admin/users'),
  updateUserStatus: (userId, status) => axiosClient.put(`/admin/users/${userId}/status`, { status }),

  // Companies Management
  getCompanies: () => axiosClient.get('/admin/companies'),
  updateCompanyStatus: (companyId, status) => axiosClient.put(`/admin/companies/${companyId}/status`, { status }),

  // Orders Management (VietQR)
  getOrders: () => axiosClient.get('/admin/orders'),
  approveOrder: (orderId, adminNote) => axiosClient.put(`/admin/orders/${orderId}/approve`, { adminNote }),
  rejectOrder: (orderId, adminNote) => axiosClient.put(`/admin/orders/${orderId}/reject`, { adminNote }),

  // Subscription Plans
  getPlans: () => axiosClient.get('/admin/plans'),
  createPlan: (plan) => axiosClient.post('/admin/plans', plan),
  updatePlan: (planId, plan) => axiosClient.put(`/admin/plans/${planId}`, plan),

  // Job Moderation
  getJobs: () => axiosClient.get('/admin/jobs'),
  updateJobApproval: (jobId, status) => axiosClient.put(`/admin/jobs/${jobId}/approval`, { status }),

  // Vouchers Management
  getVouchers: () => axiosClient.get('/admin/vouchers'),
  createVoucher: (voucher) => axiosClient.post('/admin/vouchers', voucher),
  toggleVoucher: (voucherId) => axiosClient.put(`/admin/vouchers/${voucherId}/toggle`),
};

export default adminApi;
