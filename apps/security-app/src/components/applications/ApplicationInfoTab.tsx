import {
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  alpha,
  Box,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { StatusChip } from '@app/ui';
import { toast } from 'sonner';
import type { Application } from '../../types';

interface ApplicationInfoTabProps {
  application: Application;
}

export function ApplicationInfoTab({ application }: ApplicationInfoTabProps) {
  const handleCopyId = () => {
    navigator.clipboard.writeText(application.publicId).then(() => {
      toast.success('ID copiado!');
    });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Informacoes
        </Typography>
        <Stack spacing={2}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              ID
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip
                label={application.publicId}
                size="small"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  backgroundColor: alpha('#9e9e9e', 0.1),
                }}
              />
              <Tooltip title="Copiar ID">
                <IconButton size="small" onClick={handleCopyId}>
                  <ContentCopyIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Nome
            </Typography>
            <Typography variant="body2">{application.name}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Codigo
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {application.code}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Descricao
            </Typography>
            <Typography variant="body2">
              {application.description || 'Sem descricao'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Status
            </Typography>
            <Box>
              <StatusChip active={application.active} />
            </Box>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Criado em
            </Typography>
            <Typography variant="body2">
              {new Date(application.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Atualizado em
            </Typography>
            <Typography variant="body2">
              {new Date(application.updatedAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
