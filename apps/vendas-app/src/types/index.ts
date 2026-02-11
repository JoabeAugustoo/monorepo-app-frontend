export type UserRole = 'super_admin' | 'admin' | 'employee';

export type GranularRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'VIEWER'
  | 'DASHBOARD_READ'
  | 'EMPLOYEE_READ'
  | 'EMPLOYEE_WRITE'
  | 'PRODUCT_READ'
  | 'PRODUCT_WRITE'
  | 'SALE_READ'
  | 'SALE_WRITE'
  | 'PURCHASE_READ'
  | 'PURCHASE_WRITE'
  | 'STOCK_READ'
  | 'STOCK_WRITE'
  | 'STOCKMOVEMENT_READ'
  | 'STOCKMOVEMENT_WRITE';

export interface VendasUser {
  id: string;
  guid: string;
  username: string;
  email: string;
  name: string;
  app: string;
  isEmployee: boolean;
  employeePublicId: string | null;
  managerGuid: string | null;
  managerName: string | null;
  tokenType: string;
  expiresIn: number;
  roles: GranularRole[];
  role: UserRole;
}

export interface Product {
  id?: string;
  publicId?: string;
  name: string;
  price: number;
  suggestedSalePrice?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Employee {
  id?: string;
  publicId?: string;
  name: string;
  email?: string;
  password?: string;
  monthlySalary: number;
  startTime?: string;
  endTime?: string;
  hoursPerDay?: number;
  daysPerWeek?: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Sale {
  id?: string;
  publicId?: string;
  productPublicId?: string;
  productName?: string;
  employeePublicId?: string;
  employeeName?: string;
  clientName?: string;
  isNewClient?: boolean;
  quantity?: number;
  salePrice?: number;
  totalPrice?: number;
  notes?: string;
  date?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Purchase {
  id?: string;
  publicId?: string;
  productPublicId?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  paymentType?: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'BANK_TRANSFER' | 'CHECK' | 'OTHER';
  date?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Stock {
  id?: string;
  publicId?: string;
  productPublicId?: string;
  productName?: string;
  quantity: number;
  lastUpdated?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockMovement {
  id?: string;
  publicId?: string;
  productPublicId?: string;
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  referenceType?: string;
  description?: string;
  createdAt?: string;
}

export type { SortField, SearchRequest, PaginatedResponse, CurrencyCode, Language, TranslationSet } from '@app/core';

export interface Permissions {
  canReadDashboard: boolean;
  canReadEmployees: boolean;
  canWriteEmployees: boolean;
  canReadProducts: boolean;
  canWriteProducts: boolean;
  canReadSales: boolean;
  canWriteSales: boolean;
  canReadPurchases: boolean;
  canWritePurchases: boolean;
  canReadStock: boolean;
  canWriteStock: boolean;
  canReadStockMovement: boolean;
  canWriteStockMovement: boolean;
  canAccess: (resource: string, action?: string) => boolean;
  hasRole: (requiredRoles: GranularRole[]) => boolean;
  isAdmin: () => boolean;
  userRoles: GranularRole[];
}

export interface MonthlyClosing {
  totalSales: number;
  totalAttendances: number;
  newClients: number;
  totalPurchasesCash: number;
  totalPurchasesCredit: number;
  totalSalaries: number;
  totalExtraWorks: number;
  netProfit: number;
  employees?: EmployeeClosing[];
}

export interface EmployeeClosing {
  name: string;
  sales: number;
  attendances: number;
  commission: number;
}

export interface DashboardKPIs {
  totalSales: number;
  newClients: number;
  totalPurchases: number;
}

export interface DailySale {
  day: string;
  sales: number;
  amount: number;
}

export interface EmployeePerformance {
  employeeId: string;
  employeeName: string;
  sales: number;
  amount: number;
}

export interface MonthlyTrend {
  month: number;
  year: number;
  sales: number;
  expenses: number;
  profit: number;
}

export interface PurchaseDistribution {
  name: string;
  amount: number;
}

