import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  IconButton,
  InputAdornment,
  TextField,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { copyToClipboard } from '../../utils/format';
import { toast } from 'sonner';

interface SecretDisplayDialogProps {
  open: boolean;
  clientId: string;
  clientSecret: string;
  onClose: () => void;
  title?: string;
}

export function SecretDisplayDialog({
  open,
  clientId,
  clientSecret,
  onClose,
  title = 'Credencial Criada',
}: SecretDisplayDialogProps) {
  const [showSecret, setShowSecret] = useState(false);

  const handleCopy = async (text: string, label: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      toast.success(`${label} copiado!`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight="bold">
            Atencao: O Client Secret sera exibido apenas uma vez!
          </Typography>
          <Typography variant="body2">
            Copie e armazene em local seguro antes de fechar esta janela.
          </Typography>
        </Alert>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Client ID
          </Typography>
          <TextField
            value={clientId}
            fullWidth
            size="small"
            InputProps={{
              readOnly: true,
              sx: { fontFamily: 'monospace' },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => handleCopy(clientId, 'Client ID')}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Client Secret
          </Typography>
          <TextField
            value={clientSecret}
            type={showSecret ? 'text' : 'password'}
            fullWidth
            size="small"
            InputProps={{
              readOnly: true,
              sx: { fontFamily: 'monospace' },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowSecret(!showSecret)}
                    sx={{ mr: 0.5 }}
                  >
                    {showSecret ? (
                      <VisibilityOffIcon fontSize="small" />
                    ) : (
                      <VisibilityIcon fontSize="small" />
                    )}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleCopy(clientSecret, 'Client Secret')}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
