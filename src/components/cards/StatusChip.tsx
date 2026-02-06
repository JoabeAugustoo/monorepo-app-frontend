import { Chip, type ChipProps, alpha } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface StatusChipProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  size?: ChipProps['size'];
  showIcon?: boolean;
}

export function StatusChip({
  active,
  activeLabel = 'Ativo',
  inactiveLabel = 'Inativo',
  size = 'small',
  showIcon = true,
}: StatusChipProps) {
  return (
    <Chip
      icon={showIcon ? (active ? <CheckCircleIcon /> : <CancelIcon />) : undefined}
      label={active ? activeLabel : inactiveLabel}
      size={size}
      sx={{
        fontWeight: 600,
        minWidth: 80,
        backgroundColor: active
          ? (theme) => alpha(theme.palette.success.main, 0.12)
          : (theme) => alpha(theme.palette.grey[500], 0.12),
        color: active ? 'success.dark' : 'text.secondary',
        border: 'none',
        '& .MuiChip-icon': {
          color: 'inherit',
          fontSize: 16,
        },
      }}
    />
  );
}
