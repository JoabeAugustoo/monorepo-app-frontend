import type { CurrencyCode } from '../types';

interface CurrencyConfig {
  symbol: string;
  name: string;
  locale: string;
}

export const currencyConfig: Record<CurrencyCode, CurrencyConfig> = {
  BRL: { symbol: 'R$', name: 'Real', locale: 'pt-BR' },
  USD: { symbol: '$', name: 'Dollar', locale: 'en-US' },
  EUR: { symbol: '€', name: 'Euro', locale: 'de-DE' },
};

export const formatCurrency = (value: number, currency: CurrencyCode = 'BRL'): string => {
  const config = currencyConfig[currency];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatNumber = (value: number, locale = 'pt-BR'): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
