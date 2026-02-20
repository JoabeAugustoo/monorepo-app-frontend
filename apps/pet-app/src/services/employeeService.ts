import api from './api';
import type { Employee, EmployeeDto, EmployeeCreateResponse, SearchRequest, PaginatedResponse } from '../types';

export const employeeService = {
  getEmployeeById: async (id: string): Promise<Employee> => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  createEmployee: async (data: EmployeeDto): Promise<EmployeeCreateResponse> => {
    const response = await api.post<EmployeeCreateResponse>('/employees', data);
    return response.data;
  },

  updateEmployee: async (id: string, data: Partial<EmployeeDto>): Promise<Employee> => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  deleteEmployee: async (id: string): Promise<void> => {
    await api.delete(`/employees/${id}`);
  },

  searchEmployees: async (searchRequest: SearchRequest = {}): Promise<PaginatedResponse<Employee>> => {
    const defaultRequest: SearchRequest = {
      where: {},
      skip: 0,
      take: 10,
      sort: [{ field: 'createdAt', direction: 'DESC' }],
    };
    const request = { ...defaultRequest, ...searchRequest };
    const response = await api.post('/employees/search', request);
    return response.data;
  },

  getVeterinarians: async (): Promise<Employee[]> => {
    const response = await api.get('/employees/veterinarians');
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },

  getActiveEmployees: async (): Promise<Employee[]> => {
    const response = await api.get('/employees/active');
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },

  getCount: async () => {
    const response = await api.get('/employees/stats/count');
    return response.data;
  },

  activateEmployee: async (id: string): Promise<Employee> => {
    const response = await api.patch(`/employees/${id}/activate`);
    return response.data;
  },

  deactivateEmployee: async (id: string): Promise<Employee> => {
    const response = await api.patch(`/employees/${id}/deactivate`);
    return response.data;
  },
};
