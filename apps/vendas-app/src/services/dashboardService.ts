import api from './api';
import type { DashboardKPIs, DailySale, EmployeePerformance, MonthlyTrend, PurchaseDistribution } from '../types';

const extractNumericValue = (data: unknown): number => {
  if (data === null || data === undefined) return 0;
  if (typeof data === 'number') return data;
  if (typeof data === 'object') {
    const obj = data as Record<string, number>;
    return obj.count ?? obj.total ?? obj.value ?? obj.amount ?? 0;
  }
  return Number(data) || 0;
};

// Safely extract array from API response (handles both raw arrays and { data: [...] } wrappers)
const extractArray = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'data' in data) {
    const inner = (data as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner;
  }
  return [];
};

const getDateRange = (year: number, month: number) => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
};

export const dashboardService = {
  getKPIs: async (year: number, month: number): Promise<DashboardKPIs> => {
    const { startDate, endDate } = getDateRange(year, month);

    const [totalSales, newClients, totalPurchases] = await Promise.all([
      api.get(`/sales/dashboard/total?startDate=${startDate}&endDate=${endDate}`).catch(() => ({ data: null })),
      api.get(`/sales/dashboard/new-clients?startDate=${startDate}&endDate=${endDate}`).catch(() => ({ data: null })),
      api.get(`/purchases/dashboard/total?startDate=${startDate}&endDate=${endDate}`).catch(() => ({ data: null })),
    ]);


    return {
      totalSales: extractNumericValue(totalSales.data),
      newClients: extractNumericValue(newClients.data),
      totalPurchases: extractNumericValue(totalPurchases.data),
    };
  },

  getDailySales: async (year: number, month: number): Promise<DailySale[]> => {
    const { startDate, endDate } = getDateRange(year, month);
    const response = await api.get(`/sales/dashboard/daily?startDate=${startDate}&endDate=${endDate}`);
    return extractArray<DailySale>(response.data);
  },

  getEmployeePerformance: async (year: number, month: number): Promise<EmployeePerformance[]> => {
    const { startDate, endDate } = getDateRange(year, month);
    const response = await api.get(`/sales/dashboard/employee-performance?startDate=${startDate}&endDate=${endDate}`);
    return extractArray<EmployeePerformance>(response.data);
  },

  getMonthlyTrend: async (year: number, month: number): Promise<MonthlyTrend[]> => {
    const response = await api.get(`/dashboard/monthly-trend?year=${year}&month=${month}&months=6`);
    return extractArray<MonthlyTrend>(response.data);
  },

  getPurchaseDistribution: async (year: number, month: number): Promise<PurchaseDistribution[]> => {
    const { startDate, endDate } = getDateRange(year, month);
    const response = await api.get(`/purchases/dashboard/distribution?startDate=${startDate}&endDate=${endDate}`);
    return extractArray<PurchaseDistribution>(response.data);
  },
};
