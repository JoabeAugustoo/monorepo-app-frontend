import { I18nProvider as CoreI18nProvider, useI18n } from '@app/core';
import { translations } from '../utils/i18n';
import type { ReactNode } from 'react';

export { useI18n };

export const I18nProvider = ({ children }: { children: ReactNode }) => (
  <CoreI18nProvider
    translations={translations}
    defaultLanguage="pt"
    defaultCurrency="BRL"
    storagePrefix="security"
  >
    {children}
  </CoreI18nProvider>
);
