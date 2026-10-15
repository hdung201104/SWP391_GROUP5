import axiosClient from './axiosClient';

export const companyApi = {
  getAllCompanies: () => axiosClient.get('/companies'),
  getMyCompany: () => axiosClient.get('/companies/my'),
  updateMyCompany: (data) => axiosClient.put('/companies/my', data),
  uploadLogo: (formData) => axiosClient.post('/companies/my/logo/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadImage: (formData, folder = 'workplace') => axiosClient.post(`/companies/my/upload-image?folder=${folder}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getCompanyById: (id) => axiosClient.get(`/companies/${id}`),
};

export default companyApi;
