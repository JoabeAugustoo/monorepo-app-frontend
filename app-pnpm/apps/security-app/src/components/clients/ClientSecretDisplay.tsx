import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import KeyIcon from '@mui/icons-material/Key';
import { toast } from 'sonner';

interface ClientSecretDisplayProps {
  open: boolean;
  clientId: string;
  clientSecret: string;
  onClose: () => void;
}

export function ClientSecretDisplay({ open, clientId, clientSecret, onClose }: ClientSecretDisplayProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copiado!`);
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <KeyIcon sx={{ color: '#3F51B5' }} />
          <Typography variant="h6">Credenciais do Client</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Salve o Client Secret agora! Ele nao sera exibido novamente.
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Client ID</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1, wordBreak: 'break-all' }}>
                {clientId}
              </Typography>
              <IconButton size="small" onClick={() => copyToClipboard(clientId, 'Client ID')}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">Client Secret</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, p: 1.5, bgcolor: '#fff3e0', borderRadius: 1, border: '1px solid #ffe0b2' }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1, wordBreak: 'break-all', fontWeight: 600 }}>
                {clientSecret}
              </Typography>
              <IconButton size="small" onClick={() => copyToClipboard(clientSecret, 'Client Secret')}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained">
          Entendido, ja salvei
        </Button>
      </DialogActions>
    </Dialog>
  );
}
