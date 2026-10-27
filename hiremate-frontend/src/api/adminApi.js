import axiosClient from './axiosClient';

export const adminApi = {
  // System Metrics & Overview
  getStats: () => axiosClient.get('/admin/stats'),

  // Users Management
  getUsers: () => axiosClient.get('/admin/users'),
  updateUserStatus: (userId, status) => axiosClient.put(`/admin/users/${userId}/status`, { status }),

  // Companies Management
  getCompanies: () => axiosClient.get('/admin/companies'),
  updateCompanyStatus: (companyId, status, extraData = {}) => {
    const payload = typeof status === 'object' ? status : { status, ...(typeof extraData === 'string' ? { notes: extraData } : extraData) };
    return axiosClient.put(`/admin/companies/${companyId}/status`, payload);
  },

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

  // Master Skills Management (Quản Trị Từ Điển Kỹ Năng)
  getSkills: (params) => axiosClient.get('/admin/skills', { params }),
  createSkill: (data) => axiosClient.post('/admin/skills', data),
  deleteSkill: (id) => axiosClient.delete(`/admin/skills/${id}`),
  generateSkillsForIndustry: (data) => axiosClient.post('/admin/skills/ai-generate-industry', data),

  // System Settings & AI Matching Configuration
  getSettings: () => axiosClient.get('/admin/settings'),
  updateSettings: (settings) => axiosClient.put('/admin/settings', settings),

  // AI Interview Sessions Audit & Logs
  getInterviews: () => axiosClient.get('/admin/interviews'),
  getInterviewDetail: (sessionId) => axiosClient.get(`/admin/interviews/${sessionId}`),

  // AI Matching Simulation & Audit (table: ai_job_matches)
  simulateAiMatch: (data) => axiosClient.post('/admin/ai-matching/simulate', data),
  getAiMatches: () => axiosClient.get('/admin/ai-matches'),

  // Payment Gateway & Automated Settlement (PayOS & VietQR)
  getPaymentGatewayStatus: () => axiosClient.get('/admin/payment-gateway/status'),
  testPaymentGateway: () => axiosClient.post('/admin/payment-gateway/test-connection'),
  simulateBalanceFluctuation: (orderCode) => axiosClient.post(`/payment/simulate-transfer/${orderCode}`),
};

export default adminApi;
