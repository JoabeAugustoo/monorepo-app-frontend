import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  Box,
  Avatar,
  alpha,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import { StatusChip } from '../../components/cards/StatusChip';
import type { User } from '../../types';

interface UserCardProps {
  user: User;
  onToggleStatus: (user: User) => void;
  onManageRoles: (user: User) => void;
  isToggling?: boolean;
}

export function UserCard({ user, onToggleStatus, onManageRoles, isToggling }: UserCardProps) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const initials = user.userName.slice(0, 2).toUpperCase();

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Avatar
            sx={{
              width: 52,
              height: 52,
              background: user.enabled
                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                : (theme) => alpha(theme.palette.grey[500], 0.2),
              color: user.enabled ? 'white' : 'grey.500',
              fontSize: '1.1rem',
              fontWeight: 600,
              boxShadow: user.enabled
                ? '0 4px 12px rgba(99, 102, 241, 0.3)'
                : 'none',
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <Typography variant="subtitle1" fontWeight={600} noWrap>
                {user.userName}
              </Typography>
              <StatusChip active={user.enabled} showIcon={false} />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
              <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" noWrap>
                {user.email}
              </Typography>
            </Stack>
            {fullName && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {fullName}
                </Typography>
              </Stack>
            )}
          </Box>
        </Stack>

      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2, pt: 0 }}>
        <Tooltip title="Gerenciar Roles">
          <IconButton
            size="small"
            onClick={() => onManageRoles(user)}
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
        <Tooltip title={user.enabled ? 'Desativar' : 'Ativar'}>
          <IconButton
            size="small"
            onClick={() => onToggleStatus(user)}
            disabled={isToggling}
            sx={{
              backgroundColor: (theme) =>
                user.enabled
                  ? alpha(theme.palette.error.main, 0.1)
                  : alpha(theme.palette.success.main, 0.1),
              '&:hover': {
                backgroundColor: (theme) =>
                  user.enabled
                    ? alpha(theme.palette.error.main, 0.2)
                    : alpha(theme.palette.success.main, 0.2),
              },
            }}
          >
            {user.enabled ? (
              <BlockIcon fontSize="small" color="error" />
            ) : (
              <CheckCircleIcon fontSize="small" color="success" />
            )}
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
