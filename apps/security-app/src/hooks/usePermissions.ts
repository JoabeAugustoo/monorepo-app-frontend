import { useMemo } from 'react';
import { authService } from '../services/authService';
import type { SecurityGranularRole, Permissions } from '../types';

const PERMISSION_MAP: Record<string, Record<string, SecurityGranularRole[]>> = {
  dashboard: {
    read: ['ADMIN', 'SUPER_ADMIN', 'VIEWER', 'DASHBOARD_READ'],
  },
  users: {
    read: ['ADMIN', 'SUPER_ADMIN', 'VIEWER', 'USER_READ'],
    write: ['ADMIN', 'SUPER_ADMIN', 'USER_WRITE'],
  },
  roles: {
    read: ['ADMIN', 'SUPER_ADMIN', 'VIEWER', 'ROLE_READ'],
    write: ['ADMIN', 'SUPER_ADMIN', 'ROLE_WRITE'],
  },
  apps: {
    read: ['ADMIN', 'SUPER_ADMIN', 'VIEWER', 'APP_READ'],
    write: ['ADMIN', 'SUPER_ADMIN', 'APP_WRITE'],
  },
  clients: {
    read: ['ADMIN', 'SUPER_ADMIN', 'VIEWER', 'CLIENT_READ'],
    write: ['ADMIN', 'SUPER_ADMIN', 'CLIENT_WRITE'],
  },
};

export const usePermissions = (): Permissions => {
  const user = authService.getCurrentUser();
  const userRoles = (user?.roles || []) as SecurityGranularRole[];

  const permissions = useMemo((): Permissions => {
    const hasRole = (requiredRoles: SecurityGranularRole[]): boolean => {
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
      canReadUsers: hasRole(PERMISSION_MAP.users.read),
      canWriteUsers: hasRole(PERMISSION_MAP.users.write),
      canReadRoles: hasRole(PERMISSION_MAP.roles.read),
      canWriteRoles: hasRole(PERMISSION_MAP.roles.write),
      canReadApps: hasRole(PERMISSION_MAP.apps.read),
      canWriteApps: hasRole(PERMISSION_MAP.apps.write),
      canReadClients: hasRole(PERMISSION_MAP.clients.read),
      canWriteClients: hasRole(PERMISSION_MAP.clients.write),
      canAccess,
      hasRole,
      isAdmin,
      userRoles,
    };
  }, [userRoles]);

  return permissions;
};
