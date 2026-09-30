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
  deleteCv: (id) => axiosClient.delete(`/cvs/${id}`),
};

export default cvApi;
