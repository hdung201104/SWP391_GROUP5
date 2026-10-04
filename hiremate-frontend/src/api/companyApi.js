import axiosClient from './axiosClient';

export const companyApi = {
  getAllCompanies: () => axiosClient.get('/companies'),
  getMyCompany: () => axiosClient.get('/companies/my-company'),
  updateMyCompany: (data) => axiosClient.put('/companies/my-company', data),
  getCompanyById: (id) => axiosClient.get(`/companies/${id}`),
};

export default companyApi;
