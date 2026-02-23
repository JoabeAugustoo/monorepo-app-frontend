import api from './api';
import type { Clinic, ClinicDto, ClinicCertificate } from '../types';

export const clinicService = {
  getActive: async (): Promise<Clinic> => {
    const response = await api.get('/clinics/active');
    return response.data;
  },

  create: async (data: ClinicDto): Promise<Clinic> => {
    const response = await api.post('/clinics', data);
    return response.data;
  },

  update: async (id: string, data: ClinicDto): Promise<Clinic> => {
    const response = await api.put(`/clinics/${id}`, data);
    return response.data;
  },

  getCertificate: async (): Promise<ClinicCertificate | null> => {
    const response = await api.get('/clinics/certificate', {
      validateStatus: (status) => status === 200 || status === 204,
    });
    if (response.status === 204) return null;
    return response.data;
  },

  uploadCertificate: async (file: File, name: string, password: string): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('password', password);
    await api.post('/clinics/certificate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadLogo: async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    await api.post('/clinics/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getLogo: async (): Promise<string | null> => {
    try {
      const response = await api.get('/clinics/logo', {
        responseType: 'blob',
        validateStatus: (status) => status === 200 || status === 204 || status === 404,
      });
      if (response.status !== 200 || !response.data) return null;
      return URL.createObjectURL(response.data);
    } catch {
      return null;
    }
  },
};
