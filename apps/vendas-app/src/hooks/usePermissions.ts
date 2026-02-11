import { useMemo } from 'react';
import { authService } from '../services/authService';
import type { GranularRole, Permissions } from '../types';

const PERMISSION_MAP: Record<string, Record<string, GranularRole[]>> = {
  dashboard: {
    read: ['ADMIN', 'VIEWER', 'DASHBOARD_READ'],
  },
  employees: {
    read: ['ADMIN', 'VIEWER', 'EMPLOYEE_READ'],
    write: ['ADMIN', 'EMPLOYEE_WRITE'],
  },
  products: {
    read: ['ADMIN', 'VIEWER', 'PRODUCT_READ'],
    write: ['ADMIN', 'PRODUCT_WRITE'],
  },
  sales: {
    read: ['ADMIN', 'VIEWER', 'SALE_READ'],
    write: ['ADMIN', 'SALE_WRITE'],
  },
  purchases: {
    read: ['ADMIN', 'VIEWER', 'PURCHASE_READ'],
    write: ['ADMIN', 'PURCHASE_WRITE'],
  },
  stock: {
    read: ['ADMIN', 'VIEWER', 'STOCK_READ'],
    write: ['ADMIN', 'STOCK_WRITE'],
  },
  stockMovement: {
    read: ['ADMIN', 'VIEWER', 'STOCKMOVEMENT_READ'],
    write: ['ADMIN', 'STOCKMOVEMENT_WRITE'],
  },
};

export const usePermissions = (): Permissions => {
  const user = authService.getCurrentUser();
  const userRoles = (user?.roles || []) as GranularRole[];

  const permissions = useMemo((): Permissions => {
    const hasRole = (requiredRoles: GranularRole[]): boolean => {
      if (!requiredRoles || requiredRoles.length === 0) return true;
      return requiredRoles.some(role => userRoles.includes(role));
    };

    const canAccess = (resource: string, action = 'read'): boolean => {
      const resourcePermissions = PERMISSION_MAP[resource];
      if (!resourcePermissions) return false;
      const requiredRoles = resourcePermissions[action];
      return hasRole(requiredRoles);
    };

    const isAdmin = (): boolean => {
      return userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN');
    };

    return {
      canReadDashboard: hasRole(PERMISSION_MAP.dashboard.read),
      canReadEmployees: hasRole(PERMISSION_MAP.employees.read),
      canWriteEmployees: hasRole(PERMISSION_MAP.employees.write),
      canReadProducts: hasRole(PERMISSION_MAP.products.read),
      canWriteProducts: hasRole(PERMISSION_MAP.products.write),
      canReadSales: hasRole(PERMISSION_MAP.sales.read),
      canWriteSales: hasRole(PERMISSION_MAP.sales.write),
      canReadPurchases: hasRole(PERMISSION_MAP.purchases.read),
      canWritePurchases: hasRole(PERMISSION_MAP.purchases.write),
      canReadStock: hasRole(PERMISSION_MAP.stock.read),
      canWriteStock: hasRole(PERMISSION_MAP.stock.write),
      canReadStockMovement: hasRole(PERMISSION_MAP.stockMovement.read),
      canWriteStockMovement: hasRole(PERMISSION_MAP.stockMovement.write),
      canAccess,
      hasRole,
      isAdmin,
      userRoles,
    };
  }, [userRoles]);

  return permissions;
};
