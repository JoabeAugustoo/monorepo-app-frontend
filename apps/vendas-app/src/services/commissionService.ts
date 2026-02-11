import api from './api';
import type { EmployeePerformance } from '../types';

export const commissionService = {
  calculateCommission: async (employeePublicId: string, year: number, month: number) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const [salesResponse, employeeResponse] = await Promise.all([
      api.get(`/sales/search/by-date-range?startDate=${startDate}&endDate=${endDate}`),
      api.get(`/employees/${employeePublicId}`),
    ]);

    const allSales = salesResponse.data?.data || [];
    const employee = employeeResponse.data;

    const employeeSales = allSales.filter(
      (sale: { employeePublicId: string }) => sale.employeePublicId === employeePublicId
    );
    const totalSales = employeeSales.reduce(
      (sum: number, sale: { totalPrice?: number }) => sum + (sale.totalPrice || 0),
      0
    );

    return {
      employeePublicId,
      employeeName: employee?.name || '',
      month: `${year}-${String(month).padStart(2, '0')}`,
      totalSales,
      salesCount: employeeSales.length,
      sales: employeeSales,
    };
  },

  getEmployeePerformance: async (year: number, month: number): Promise<EmployeePerformance[]> => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const response = await api.get(`/sales/dashboard/employee-performance?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },
};
