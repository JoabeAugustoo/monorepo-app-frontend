import { useState } from 'react';
import { TextField, type TextFieldProps } from '@mui/material';

export type CurrencyFieldProps = Omit<TextFieldProps, 'value' | 'onChange'> & {
  value: number;
  onChange: (value: number) => void;
};

const formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function parseToNumber(raw: string): number {
  const cleaned = raw.replace(/[^\d.,]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function CurrencyField({ value, onChange, onBlur, ...rest }: CurrencyFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [rawInput, setRawInput] = useState('');

  const displayValue = (() => {
    if (isFocused) return rawInput;
    if (value == null && value !== 0) return '';
    return formatter.format(value);
  })();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (input === '') {
      setRawInput('');
      onChange(0);
      return;
    }
    // Allow only digits, comma and dot while editing
    const clean = input.replace(/[^\d.,]/g, '');
    setRawInput(clean);
    onChange(parseToNumber(clean));
  };

  const handleFocus = () => {
    setIsFocused(true);
    setRawInput(value === 0 ? '' : String(value).replace('.', ','));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <TextField
      {...rest}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      slotProps={{
        htmlInput: {
          inputMode: 'decimal',
          'data-value': value ?? '',
        },
      }}
    />
  );
}
