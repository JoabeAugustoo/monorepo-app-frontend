import api from './api';
import type { MonthlyClosing } from '../types';

interface ApiMonthlyClosing {
  year: number;
  month: number;
  sales: { totalAmount: number; totalCount: number; newClients: number };
  purchases: { cashTotal: number; creditTotal: number; total: number };
  expenses: { totalSalaries: number; totalExtraWorks: number };
  netProfit: number;
}

export const monthlyReportService = {
  getMonthlyClosing: async (year: number, month: number): Promise<MonthlyClosing> => {
    const response = await api.get<ApiMonthlyClosing>(`/reports/monthly-closing?year=${year}&month=${month}`);
    const d = response.data;
    return {
      totalSales: d.sales?.totalAmount ?? 0,
      totalAttendances: d.sales?.totalCount ?? 0,
      newClients: d.sales?.newClients ?? 0,
      totalPurchasesCash: d.purchases?.cashTotal ?? 0,
      totalPurchasesCredit: d.purchases?.creditTotal ?? 0,
      totalSalaries: d.expenses?.totalSalaries ?? 0,
      totalExtraWorks: d.expenses?.totalExtraWorks ?? 0,
      netProfit: d.netProfit ?? 0,
    };
  },
};
