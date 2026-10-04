import axiosClient from './axiosClient';

export const skillApi = {
  getAllSkills: () => axiosClient.get('/skills'),
  getCategories: () => axiosClient.get('/skills/categories'),
  searchSkills: (keyword) => axiosClient.get('/skills/search', { params: { keyword } }),
};

export default skillApi;
