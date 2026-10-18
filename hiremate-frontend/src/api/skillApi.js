import axiosClient from './axiosClient';

export const skillApi = {
  getAllSkills: (params) => axiosClient.get('/skills', { params }),
  getSkillById: (id) => axiosClient.get(`/skills/${id}`),
  createSkill: (data) => axiosClient.post('/skills', data),
  deleteSkill: (id) => axiosClient.delete(`/skills/${id}`),
  getCategories: () => axiosClient.get('/skills/categories'),
  searchSkills: (keyword) => axiosClient.get('/skills', { params: { keyword } }),
};

export default skillApi;
