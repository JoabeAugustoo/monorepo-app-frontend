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
import type { EmployeeCreateResponse } from '../../types';

interface EmployeeCredentialsDialogProps {
  open: boolean;
  data: EmployeeCreateResponse | null;
  onClose: () => void;
}

export function EmployeeCredentialsDialog({ open, data, onClose }: EmployeeCredentialsDialogProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copiado!`);
    });
  };

  if (!data) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <KeyIcon sx={{ color: '#9C72D9' }} />
          <Typography variant="h6">Credenciais de Acesso</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {data.isExistingUser ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            O funcionario <strong>{data.name}</strong> ja possuia um usuario no sistema. O acesso foi vinculado automaticamente.
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Salve as credenciais agora! A senha nao sera exibida novamente.
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Funcionario</Typography>
            <Box sx={{ mt: 0.5, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {data.name}
              </Typography>
            </Box>
          </Box>

          {data.generatedUserName && (
            <Box>
              <Typography variant="caption" color="text.secondary">Usuario</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1, wordBreak: 'break-all' }}>
                  {data.generatedUserName}
                </Typography>
                <IconButton size="small" onClick={() => copyToClipboard(data.generatedUserName!, 'Usuario')}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          )}

          {data.generatedPassword && (
            <Box>
              <Typography variant="caption" color="text.secondary">Senha</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, p: 1.5, bgcolor: '#fff3e0', borderRadius: 1, border: '1px solid #ffe0b2' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1, wordBreak: 'break-all', fontWeight: 600 }}>
                  {data.generatedPassword}
                </Typography>
                <IconButton size="small" onClick={() => copyToClipboard(data.generatedPassword!, 'Senha')}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          )}
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
