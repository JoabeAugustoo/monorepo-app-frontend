import api from './api';
import type { Employee, SearchRequest, PaginatedResponse } from '../types';

export const employeeService = {
  getEmployeeById: async (id: string): Promise<Employee> => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  updateEmployee: async (id: string, employeeData: Partial<Employee>): Promise<Employee> => {
    const response = await api.put(`/employees/${id}`, employeeData);
    return response.data;
  },

  deleteEmployee: async (id: string): Promise<void> => {
    await api.delete(`/employees/${id}`);
  },

  createEmployee: async (employeeData: Partial<Employee>): Promise<Employee> => {
    const response = await api.post('/employees', employeeData);
    return response.data;
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

  searchByName: async (name: string): Promise<Employee[]> => {
    const response = await api.get(`/employees/search/by-name?name=${encodeURIComponent(name)}`);
    return response.data?.data || [];
  },

  searchByEmail: async (email: string): Promise<Employee[]> => {
    const response = await api.get(`/employees/search/by-email?email=${encodeURIComponent(email)}`);
    return response.data?.data || [];
  },

  searchBySalaryRange: async (minSalary: number, maxSalary: number): Promise<Employee[]> => {
    const response = await api.get(`/employees/search/by-salary-range?minSalary=${minSalary}&maxSalary=${maxSalary}`);
    return response.data?.data || [];
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

  softDeleteEmployee: async (id: string): Promise<Employee> => {
    const response = await api.patch(`/employees/${id}/deactivate`);
    return response.data;
  },

  getAllEmployees: async (): Promise<Employee[]> => {
    const response = await api.post('/employees/search', {
      where: {},
      skip: 0,
      take: 1000,
      sort: [{ field: 'createdAt', direction: 'ASC' }],
    });
    return response.data?.data || [];
  },

  getActiveEmployees: async (): Promise<Employee[]> => {
    const response = await api.post('/employees/search', {
      where: { active: true },
      skip: 0,
      take: 1000,
      sort: [{ field: 'createdAt', direction: 'ASC' }],
    });
    return response.data?.data || [];
  },
};
