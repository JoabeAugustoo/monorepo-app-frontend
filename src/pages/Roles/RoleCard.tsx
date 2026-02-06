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
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { StatusChip } from '../../components/cards/StatusChip';
import type { Role } from '../../types';

interface RoleCardProps {
  role: Role;
  onToggleStatus: (role: Role) => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  isToggling?: boolean;
}

export function RoleCard({
  role,
  onToggleStatus,
  onEdit,
  onDelete,
  isToggling,
}: RoleCardProps) {
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
          background: role.active
            ? 'linear-gradient(90deg, #ec4899 0%, #f472b6 100%)'
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
              background: role.active
                ? 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
                : (theme) => alpha(theme.palette.grey[500], 0.2),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: role.active
                ? '0 4px 12px rgba(236, 72, 153, 0.3)'
                : 'none',
            }}
          >
            <SecurityIcon
              sx={{
                color: role.active ? 'white' : 'grey.500',
                fontSize: 24,
              }}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <Typography variant="subtitle1" fontWeight={600} noWrap>
                {role.name.replace('ROLE_', '')}
              </Typography>
              <StatusChip
                active={role.active}
                activeLabel="Ativa"
                inactiveLabel="Inativa"
                showIcon={false}
              />
            </Stack>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                minHeight: 40,
              }}
            >
              {role.description || 'Sem descrição'}
            </Typography>
          </Box>
        </Stack>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2, pt: 1 }}>
        <Tooltip title="Editar">
          <IconButton
            size="small"
            onClick={() => onEdit(role)}
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
        <Tooltip title={role.active ? 'Desativar' : 'Ativar'}>
          <IconButton
            size="small"
            onClick={() => onToggleStatus(role)}
            disabled={isToggling}
            sx={{
              backgroundColor: (theme) =>
                role.active
                  ? alpha(theme.palette.warning.main, 0.1)
                  : alpha(theme.palette.success.main, 0.1),
              '&:hover': {
                backgroundColor: (theme) =>
                  role.active
                    ? alpha(theme.palette.warning.main, 0.2)
                    : alpha(theme.palette.success.main, 0.2),
              },
            }}
          >
            {role.active ? (
              <BlockIcon fontSize="small" color="warning" />
            ) : (
              <CheckCircleIcon fontSize="small" color="success" />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title="Excluir">
          <IconButton
            size="small"
            onClick={() => onDelete(role)}
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
