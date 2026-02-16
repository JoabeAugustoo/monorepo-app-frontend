import api from './api';
import type { Pet, PetDto, PetTutorDto, SearchRequest, PaginatedResponse, GenerateVaccinationAuthResponse } from '../types';

export const petService = {
  getPetById: async (id: string): Promise<Pet> => {
    const response = await api.get(`/pets/${id}`);
    return response.data;
  },

  createPet: async (data: PetDto): Promise<Pet> => {
    const response = await api.post('/pets', data);
    return response.data;
  },

  updatePet: async (id: string, data: Partial<PetDto>): Promise<Pet> => {
    const response = await api.put(`/pets/${id}`, data);
    return response.data;
  },

  deletePet: async (id: string): Promise<void> => {
    await api.delete(`/pets/${id}`);
  },

  searchPets: async (searchRequest: SearchRequest = {}): Promise<PaginatedResponse<Pet>> => {
    const defaultRequest: SearchRequest = {
      where: {},
      skip: 0,
      take: 10,
      sort: [{ field: 'createdAt', direction: 'DESC' }],
    };
    const request = { ...defaultRequest, ...searchRequest };
    const response = await api.post('/pets/search', request);
    return response.data;
  },

  findByCustomer: async (customerId: string): Promise<Pet[]> => {
    const response = await api.get(`/pets/by-customer/${customerId}`);
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },

  assignTutor: async (petId: string, data: PetTutorDto): Promise<Pet> => {
    const response = await api.post(`/pets/${petId}/tutors`, data);
    return response.data;
  },

  removeTutor: async (petId: string, tutorId: string): Promise<Pet> => {
    const response = await api.delete(`/pets/${petId}/tutors/${tutorId}`);
    return response.data;
  },

  markDeceased: async (id: string): Promise<Pet> => {
    const response = await api.patch(`/pets/${id}/deceased`);
    return response.data;
  },

  markTransferred: async (id: string): Promise<Pet> => {
    const response = await api.patch(`/pets/${id}/transferred`);
    return response.data;
  },

  getActivePets: async (): Promise<Pet[]> => {
    const response = await api.get('/pets/active');
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },

  getCount: async () => {
    const response = await api.get('/pets/stats/count');
    return response.data;
  },

  activatePet: async (id: string): Promise<Pet> => {
    const response = await api.patch(`/pets/${id}/activate`);
    return response.data;
  },

  deactivatePet: async (id: string): Promise<Pet> => {
    const response = await api.patch(`/pets/${id}/deactivate`);
    return response.data;
  },

  generateVaccinationAuth: async (petId: string): Promise<GenerateVaccinationAuthResponse> => {
    const response = await api.post(`/pets/${petId}/documents/vaccination-auth`);
    return response.data;
  },
};
