import { useState, useEffect } from 'react';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { ptBR } from 'date-fns/locale';
import { Box, type SxProps, type Theme } from '@mui/material';

export interface MuiTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
  className?: string;
}

function parseTime(value: string): Date | null {
  if (!value) return null;
  const [h, m] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date;
}

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function MuiTimePicker({
  value,
  onChange,
  placeholder = 'Hora',
  disabled = false,
  size = 'medium',
  sx,
  className,
}: MuiTimePickerProps) {
  const [selectedTime, setSelectedTime] = useState<Date | null>(() => parseTime(value));

  useEffect(() => {
    setSelectedTime(parseTime(value));
  }, [value]);

  const handleChange = (newTime: Date | null) => {
    if (!newTime || isNaN(newTime.getTime())) return;
    setSelectedTime(newTime);
    onChange(formatTime(newTime));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ width: '100%', ...sx }} className={className}>
        <TimePicker
          value={selectedTime}
          onChange={handleChange}
          ampm={false}
          disabled={disabled}
          viewRenderers={{
            hours: renderTimeViewClock,
            minutes: renderTimeViewClock,
          }}
          slotProps={{
            textField: {
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
