import { createContext, useContext, useState, type ReactNode } from 'react';

export interface DateContextValue {
  selectedYear: number;
  selectedMonth: number;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  setDate: (year: number, month: number) => void;
}

const DateContext = createContext<DateContextValue | null>(null);

export const useDate = (): DateContextValue => {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useDate deve ser usado dentro de um DateProvider');
  }
  return context;
};

export const DateProvider = ({ children }: { children: ReactNode }) => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const setDate = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  return (
    <DateContext.Provider
      value={{ selectedYear, selectedMonth, setSelectedYear, setSelectedMonth, setDate }}
    >
      {children}
    </DateContext.Provider>
  );
};
