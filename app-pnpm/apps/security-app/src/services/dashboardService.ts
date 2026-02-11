import { userService } from './userService';
import { roleService } from './roleService';
import { applicationService } from './applicationService';
import { clientService } from './clientService';
import type { DashboardOverview } from '../types';

export const dashboardService = {
  getOverview: async (): Promise<DashboardOverview> => {
    const [users, roles, applications, clients] = await Promise.all([
      userService.getCount(),
      roleService.getCount(),
      applicationService.getCount(),
      clientService.getCount(),
    ]);

    return { users, roles, applications, clients };
  },
};
