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

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  titleIcon?: ReactNode;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'inherit';
  confirmIcon?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  titleIcon,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmColor = 'error',
  confirmIcon,
  loading = false,
  loadingLabel,
  children,
  footer,
}: ConfirmDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          {titleIcon}
          <Typography variant="h6">{title}</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {message && (
          <Typography variant="body1" sx={{ mb: 2 }}>
            {message}
          </Typography>
        )}

        {children}

        {footer && (
          <Typography variant="body2" sx={{ mt: 2, color: '#6b7280' }}>
            {footer}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={confirmColor}
          disabled={loading}
          startIcon={confirmIcon}
        >
          {loading ? (loadingLabel || confirmLabel) : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
