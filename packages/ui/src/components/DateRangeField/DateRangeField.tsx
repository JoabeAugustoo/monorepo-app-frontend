import { useState, useRef } from 'react';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { PickersDay, type PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { format, isSameDay, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TextField, Popover, Box, InputAdornment, type TextFieldProps } from '@mui/material';
import { CalendarMonth } from '@mui/icons-material';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export type DateRangeFieldProps = Omit<TextFieldProps, 'value' | 'onChange'> & {
  value: DateRange;
  onChange: (value: DateRange) => void;
};

interface RangeDayProps extends PickersDayProps<Date> {
  tempStart: Date | null;
  tempEnd: Date | null;
}

function RangeDay({ day, tempStart, tempEnd, ...other }: RangeDayProps) {
  const isStart = !!tempStart && isSameDay(day, tempStart);
  const isEnd = !!tempEnd && isSameDay(day, tempEnd);
  const isInRange =
    !!tempStart && !!tempEnd && isAfter(day, tempStart) && isBefore(day, tempEnd);

  return (
    <Box
      sx={{
        position: 'relative',
        ...(isInRange && {
          backgroundColor: 'rgba(25, 118, 210, 0.12)',
          borderRadius: 0,
        }),
        ...(isStart &&
          tempEnd && {
            backgroundColor: 'rgba(25, 118, 210, 0.12)',
            borderRadius: '50% 0 0 50%',
          }),
        ...(isEnd &&
          tempStart && {
            backgroundColor: 'rgba(25, 118, 210, 0.12)',
            borderRadius: '0 50% 50% 0',
          }),
        ...(isStart && isEnd && { borderRadius: '50%' }),
      }}
    >
      <PickersDay
        {...other}
        day={day}
        selected={isStart || isEnd}
        sx={{
          ...((isStart || isEnd) && {
            backgroundColor: '#1976d2 !important',
            color: '#fff !important',
            '&:hover': { backgroundColor: '#1565c0 !important' },
          }),
          ...(isInRange && {
            color: '#1976d2',
            fontWeight: 600,
          }),
        }}
      />
    </Box>
  );
}

export function DateRangeField({ value, onChange, size = 'small', ...rest }: DateRangeFieldProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [firstDate, setFirstDate] = useState<Date | null>(null);
  const [tempStart, setTempStart] = useState<Date | null>(value.start);
  const [tempEnd, setTempEnd] = useState<Date | null>(value.end);
  const inputRef = useRef<HTMLDivElement>(null);

  const open = Boolean(anchorEl);

  const handleOpen = () => {
    setTempStart(value.start);
    setTempEnd(value.end);
    setFirstDate(null);
    setAnchorEl(inputRef.current);
  };

  const handleClose = () => setAnchorEl(null);

  const handleDateClick = (newDate: Date) => {
    if (firstDate === null) {
      setFirstDate(newDate);
      setTempStart(newDate);
      setTempEnd(null);
    } else {
      const [start, end] = isBefore(newDate, firstDate)
        ? [newDate, firstDate]
        : [firstDate, newDate];
      setTempStart(start);
      setTempEnd(end);
      onChange({ start, end });
      setFirstDate(null);
      setAnchorEl(null);
    }
  };

  const formatDisplay = () => {
    const s = value.start ? format(value.start, 'dd/MM/yyyy') : '--/--/----';
    const e = value.end ? format(value.end, 'dd/MM/yyyy') : '--/--/----';
    return `${s}  —  ${e}`;
  };

  return (
    <>
      <TextField
        {...rest}
        ref={inputRef}
        value={formatDisplay()}
        onClick={handleOpen}
        size={size}
        slotProps={{
          input: {
            readOnly: true,
            startAdornment: (
              <InputAdornment position="start">
                <CalendarMonth fontSize="small" color="action" />
              </InputAdornment>
            ),
            sx: { cursor: 'pointer' },
          },
        }}
        sx={{ minWidth: '280px', '& input': { cursor: 'pointer' }, ...rest.sx }}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
          <DateCalendar
            value={firstDate || tempStart}
            onChange={handleDateClick}
            slots={{ day: RangeDay as any }}
            slotProps={{ day: { tempStart, tempEnd } as any }}
          />
        </LocalizationProvider>
      </Popover>
    </>
  );
}
