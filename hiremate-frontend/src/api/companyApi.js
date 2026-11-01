import axiosClient from './axiosClient';

export const companyApi = {
  lookupCompanies: (params) => axiosClient.get('/companies/lookup', { params }),
  getAllCompanies: () => axiosClient.get('/companies'),
  getMyCompany: () => axiosClient.get('/companies/my'),
  updateMyCompany: (data) => axiosClient.put('/companies/my', data),
  uploadLogo: (formData) => axiosClient.post('/companies/my/logo/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadImage: (formData, folder = 'workplace') => axiosClient.post(`/companies/my/upload-image?folder=${folder}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadLicenseDoc: (formData) => axiosClient.post('/companies/my/license/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadPublicLicenseDoc: (formData) => axiosClient.post('/companies/public/license/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getCompanyById: (id) => axiosClient.get(`/companies/${id}`),
  getLicensePreviewUrl: (companyId) => companyId ? `/api/v1/companies/${companyId}/license/preview` : '/api/v1/companies/my/license/preview',
  getLicenseDownloadUrl: (companyId) => companyId ? `/api/v1/companies/${companyId}/license/download` : '/api/v1/companies/my/license/download',
  downloadLicenseFile: (companyId) => axiosClient.get(companyId ? `/companies/${companyId}/license/download` : '/companies/my/license/download', {
    responseType: 'blob',
  }),
  previewLicenseFile: (companyId) => axiosClient.get(companyId ? `/companies/${companyId}/license/preview` : '/companies/my/license/preview', {
    responseType: 'blob',
  }),
  approveJoinRequest: (identifier) => axiosClient.post(`/companies/my/join-requests/${identifier}/approve`),
  rejectJoinRequest: (identifier) => axiosClient.post(`/companies/my/join-requests/${identifier}/reject`),
  getPendingJoinRequests: () => axiosClient.get('/companies/my/pending-join-requests'),
  getCompanyMembers: () => axiosClient.get('/companies/my/members'),
  inviteMember: (data) => axiosClient.post('/companies/my/members/invite', data),
};

export default companyApi;
