import { RefreshProvider as CoreRefreshProvider, useRefresh } from '@app/core';
import type { ReactNode } from 'react';

export { useRefresh };

export const RefreshProvider = ({ children }: { children: ReactNode }) => (
  <CoreRefreshProvider
    initialKeys={['products', 'purchases', 'sales', 'employees', 'dashboard']}
    alwaysRefresh={['dashboard']}
  >
    {children}
  </CoreRefreshProvider>
);
