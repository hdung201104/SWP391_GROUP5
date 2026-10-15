import axiosClient from './axiosClient';

export const cvApi = {
  uploadCv: (formData) =>
    axiosClient.post('/cvs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  getMyCvs: () => axiosClient.get('/cvs'),
  getCvById: (id) => axiosClient.get(`/cvs/${id}`),
  setDefaultCv: (id) => axiosClient.put(`/cvs/${id}/default`),
  analyzeCv: (id) => axiosClient.post(`/cvs/${id}/analyze`),
  updateCv: (id, data) => axiosClient.put(`/cvs/${id}`, data),
  deleteCv: (id) => axiosClient.delete(`/cvs/${id}`),
  downloadCv: (id) =>
    axiosClient.get(`/cvs/${id}/download`, {
      responseType: 'blob',
    }),
};

export default cvApi;
