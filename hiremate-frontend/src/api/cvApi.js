import axiosClient from './axiosClient';

export const cvApi = {
  uploadCv: (formData) =>
    axiosClient.post('/cvs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000,
    }),
  getMyCvs: () => axiosClient.get('/cvs'),
  getCvById: (id) => axiosClient.get(`/cvs/${id}`),
  setDefaultCv: (id) => axiosClient.put(`/cvs/${id}/default`),
  analyzeCv: (id) =>
    axiosClient.post(`/cvs/${id}/analyze`, null, {
      timeout: 120000,
    }),
  updateCv: (id, data) => axiosClient.put(`/cvs/${id}`, data),
  deleteCv: (id) => axiosClient.delete(`/cvs/${id}`),
  downloadCv: (id) =>
    axiosClient.get(`/cvs/${id}/download`, {
      responseType: 'blob',
    }),
  previewCv: (id) =>
    axiosClient.get(`/cvs/${id}/preview`, {
      responseType: 'blob',
    }),
  rewriteSummary: (data) => axiosClient.post('/cvs/rewrite-summary', data),
};

export default cvApi;
