import { RefreshProvider as CoreRefreshProvider, useRefresh } from '@app/core';
import type { ReactNode } from 'react';

export { useRefresh };

export const RefreshProvider = ({ children }: { children: ReactNode }) => (
  <CoreRefreshProvider
    initialKeys={['companies', 'certificates', 'documents', 'applications', 'dashboard']}
    alwaysRefresh={['dashboard']}
  >
    {children}
  </CoreRefreshProvider>
);
