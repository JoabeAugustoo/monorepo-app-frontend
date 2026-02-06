import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  Box,
  alpha,
  Chip,
} from '@mui/material';
import AppsIcon from '@mui/icons-material/Apps';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { StatusChip } from '../../components/cards/StatusChip';
import { copyToClipboard } from '../../utils/format';
import { toast } from 'sonner';
import type { Application } from '../../types';

interface ApplicationCardProps {
  application: Application;
  onToggleStatus: (application: Application) => void;
  onEdit: (application: Application) => void;
  onDelete: (application: Application) => void;
  onViewDetails: (application: Application) => void;
  isToggling?: boolean;
}

export function ApplicationCard({
  application,
  onToggleStatus,
  onEdit,
  onDelete,
  onViewDetails,
  isToggling,
}: ApplicationCardProps) {
  const handleCopyId = async () => {
    const success = await copyToClipboard(application.publicId);
    if (success) {
      toast.success('ID copiado!');
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '3px',
          background: application.active
            ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
            : (theme) => alpha(theme.palette.grey[400], 0.5),
        },
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: application.active
                ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                : (theme) => alpha(theme.palette.grey[500], 0.2),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: application.active
                ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                : 'none',
            }}
          >
            <AppsIcon
              sx={{
                color: application.active ? 'white' : 'grey.500',
                fontSize: 24,
              }}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <Typography variant="subtitle1" fontWeight={600} noWrap>
                {application.name}
              </Typography>
              <StatusChip active={application.active} showIcon={false} />
            </Stack>
            <Typography variant="body2" color="text.secondary" noWrap>
              {application.description || 'Sem descrição'}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ mt: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              mb: 0.5,
            }}
          >
            ID
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip
              label={application.publicId}
              size="small"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                backgroundColor: (theme) => alpha(theme.palette.grey[500], 0.1),
                maxWidth: '100%',
                '& .MuiChip-label': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
              }}
            />
            <Tooltip title="Copiar ID">
              <IconButton
                size="small"
                onClick={handleCopyId}
                sx={{
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                  },
                }}
              >
                <ContentCopyIcon sx={{ fontSize: 14 }} color="primary" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2, pt: 1 }}>
        <Tooltip title="Ver Detalhes">
          <IconButton
            size="small"
            onClick={() => onViewDetails(application)}
            sx={{
              backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.1),
              '&:hover': {
                backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.2),
              },
            }}
          >
            <VisibilityIcon fontSize="small" color="secondary" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Editar">
          <IconButton
            size="small"
            onClick={() => onEdit(application)}
            sx={{
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            <EditIcon fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>
        <Tooltip title={application.active ? 'Desativar' : 'Ativar'}>
          <IconButton
            size="small"
            onClick={() => onToggleStatus(application)}
            disabled={isToggling}
            sx={{
              backgroundColor: (theme) =>
                application.active
                  ? alpha(theme.palette.warning.main, 0.1)
                  : alpha(theme.palette.success.main, 0.1),
              '&:hover': {
                backgroundColor: (theme) =>
                  application.active
                    ? alpha(theme.palette.warning.main, 0.2)
                    : alpha(theme.palette.success.main, 0.2),
              },
            }}
          >
            {application.active ? (
              <BlockIcon fontSize="small" color="warning" />
            ) : (
              <CheckCircleIcon fontSize="small" color="success" />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title="Excluir">
          <IconButton
            size="small"
            onClick={() => onDelete(application)}
            sx={{
              backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
              '&:hover': {
                backgroundColor: (theme) => alpha(theme.palette.error.main, 0.2),
              },
            }}
          >
            <DeleteIcon fontSize="small" color="error" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
