import { useState, useEffect } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { ptBR } from 'date-fns/locale';
import { Box, type SxProps, type Theme } from '@mui/material';

export interface MuiDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  mode?: 'month' | 'day';
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
  className?: string;
}

function parseValue(value: string, mode: 'month' | 'day'): Date {
  if (!value) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const parts = value.split('-').map(Number);
  if (mode === 'month') {
    return new Date(parts[0], parts[1] - 1, 1);
  }
  return new Date(parts[0], parts[1] - 1, parts[2] ?? 1);
}

function formatValue(date: Date, mode: 'month' | 'day'): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  if (mode === 'month') return `${y}-${m}`;
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function MuiDatePicker({
  value,
  onChange,
  mode = 'month',
  label,
  placeholder = 'Selecione...',
  disabled = false,
  size = 'medium',
  sx,
  className,
}: MuiDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => parseValue(value, mode));

  useEffect(() => {
    if (value) {
      setSelectedDate(parseValue(value, mode));
    }
  }, [value, mode]);

  const handleDateChange = (newDate: Date | null) => {
    if (!newDate) return;
    setSelectedDate(newDate);
    onChange(formatValue(newDate, mode));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ width: '100%', ...sx }} className={className}>
        <DatePicker
          value={selectedDate}
          onChange={handleDateChange}
          views={mode === 'month' ? ['year', 'month'] : ['day']}
          openTo={mode === 'month' ? 'month' : 'day'}
          format={mode === 'month' ? 'MM/yyyy' : 'dd/MM/yyyy'}
          disabled={disabled}
          slotProps={{
            textField: {
              label,
              placeholder,
              fullWidth: true,
              size,
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
}
