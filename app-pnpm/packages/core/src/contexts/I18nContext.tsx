import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CurrencyCode, Language, TranslationSet } from '../types';

export interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: CurrencyCode;
  setCurrency: (curr: CurrencyCode) => void;
  t: (key: string) => string;
}

export interface I18nProviderProps {
  children: ReactNode;
  translations: Record<string, TranslationSet>;
  defaultLanguage?: Language;
  defaultCurrency?: CurrencyCode;
  storagePrefix?: string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const useI18n = (): I18nContextValue => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};

export const I18nProvider = ({
  children,
  translations,
  defaultLanguage = 'pt',
  defaultCurrency = 'BRL',
  storagePrefix = 'app',
}: I18nProviderProps) => {
  const langKey = `${storagePrefix}_language`;
  const currKey = `${storagePrefix}_currency`;

  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem(langKey) as Language) || defaultLanguage;
  });

  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    return (localStorage.getItem(currKey) as CurrencyCode) || defaultCurrency;
  });

  useEffect(() => {
    localStorage.setItem(langKey, language);
  }, [language, langKey]);

  useEffect(() => {
    localStorage.setItem(currKey, currency);
  }, [currency, currKey]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = translations[language];

    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }

    return (value as string) || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, currency, setCurrency, t }}>
      {children}
    </I18nContext.Provider>
  );
};
