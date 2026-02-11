import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type RefreshTriggers = Record<string, number>;

export interface RefreshContextValue {
  refreshTriggers: RefreshTriggers;
  triggerRefresh: (component: string) => void;
  triggerMultipleRefresh: (components: string[]) => void;
}

export interface RefreshProviderProps {
  children: ReactNode;
  initialKeys?: string[];
  alwaysRefresh?: string[];
}

const RefreshContext = createContext<RefreshContextValue | null>(null);

export const useRefresh = (): RefreshContextValue => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh deve ser usado dentro de um RefreshProvider');
  }
  return context;
};

export const RefreshProvider = ({ children, initialKeys = [], alwaysRefresh = [] }: RefreshProviderProps) => {
  const [refreshTriggers, setRefreshTriggers] = useState<RefreshTriggers>(() => {
    const initial: RefreshTriggers = {};
    initialKeys.forEach(key => { initial[key] = 0; });
    return initial;
  });

  const triggerRefresh = useCallback((component: string) => {
    setRefreshTriggers(prev => {
      const next = { ...prev, [component]: (prev[component] || 0) + 1 };
      alwaysRefresh.forEach(key => {
        if (key !== component) {
          next[key] = (prev[key] || 0) + 1;
        }
      });
      return next;
    });
  }, [alwaysRefresh]);

  const triggerMultipleRefresh = useCallback((components: string[]) => {
    setRefreshTriggers(prev => {
      const next = { ...prev };
      components.forEach(component => {
        next[component] = (prev[component] || 0) + 1;
      });
      alwaysRefresh.forEach(key => {
        if (!components.includes(key)) {
          next[key] = (prev[key] || 0) + 1;
        }
      });
      return next;
    });
  }, [alwaysRefresh]);

  return (
    <RefreshContext.Provider value={{ refreshTriggers, triggerRefresh, triggerMultipleRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};
