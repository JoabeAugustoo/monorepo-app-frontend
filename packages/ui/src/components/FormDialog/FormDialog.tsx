import { type ReactNode } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from '@mui/material';

export interface FormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  titleIcon?: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  loadingLabel?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  children: ReactNode;
}

export const FormDialog = ({
  open,
  onClose,
  onSubmit,
  title,
  titleIcon,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  loading = false,
  loadingLabel,
  maxWidth = 'sm',
  disabled = false,
  children,
}: FormDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          {titleIcon}
          <Typography variant="h6">{title}</Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={onSubmit}>
        <DialogContent>{children}</DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            {cancelLabel}
          </Button>
          <Button type="submit" variant="contained" disabled={loading || disabled}>
            {loading ? (loadingLabel || submitLabel) : submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
