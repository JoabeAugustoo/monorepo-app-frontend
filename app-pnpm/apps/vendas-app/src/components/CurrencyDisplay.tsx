import { useI18n } from '../contexts/I18nContext';
import { formatCurrency } from '../utils/i18n';

interface CurrencyDisplayProps {
  value: number;
  className?: string;
}

export const CurrencyDisplay = ({ value, className = '' }: CurrencyDisplayProps) => {
  const { currency } = useI18n();

  return (
    <span className={`data-number ${className}`}>
      {formatCurrency(value || 0, currency)}
    </span>
  );
};
