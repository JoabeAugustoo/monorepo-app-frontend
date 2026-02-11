import { TextField, type TextFieldProps } from '@mui/material';

export type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
} & Omit<TextFieldProps, 'value' | 'onChange' | 'size'>;

export const SearchField = ({
  value,
  onChange,
  placeholder = 'Buscar...',
  sx,
  ...rest
}: SearchFieldProps) => {
  return (
    <TextField
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ minWidth: '200px', ...sx }}
      {...rest}
    />
  );
};
