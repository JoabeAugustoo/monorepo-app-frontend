import api from './api';
import type {
  DashboardKpis,
  VisitsPerDayItem,
  ProceduresByTypeItem,
  ProceduresByStatusItem,
  MedicationStockItem,
} from '../types';

export const dashboardService = {
  getKpis: async (startDate: string, endDate: string): Promise<DashboardKpis> => {
    const response = await api.get('/dashboard/kpis', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getVisitsPerDay: async (startDate: string, endDate: string): Promise<VisitsPerDayItem[]> => {
    const response = await api.get('/dashboard/visits-per-day', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  getProceduresByType: async (startDate: string, endDate: string): Promise<ProceduresByTypeItem[]> => {
    const response = await api.get('/dashboard/procedures-by-type', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  getProceduresByStatus: async (startDate: string, endDate: string): Promise<ProceduresByStatusItem[]> => {
    const response = await api.get('/dashboard/procedures-by-status', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  getMedicationStock: async (): Promise<MedicationStockItem[]> => {
    const response = await api.get('/dashboard/medication-stock');
    return response.data.data;
  },
};
