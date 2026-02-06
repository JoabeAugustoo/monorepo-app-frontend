import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Box,
  alpha,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import RefreshIcon from '@mui/icons-material/Refresh';
import SecurityIcon from '@mui/icons-material/Security';
import KeyIcon from '@mui/icons-material/Key';
import { StatusChip } from '../../components/cards/StatusChip';
import type { Client } from '../../types';

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onToggleStatus: (client: Client) => void;
  onRotateSecret: (client: Client) => void;
  onManageRoles: (client: Client) => void;
  onDelete: (client: Client) => void;
  isToggling?: boolean;
  showApplication?: boolean;
}

export function ClientCard({
  client,
  onEdit,
  onToggleStatus,
  onRotateSecret,
  onManageRoles,
  onDelete,
  isToggling,
  showApplication = false,
}: ClientCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: () => void) => {
    handleMenuClose();
    action();
  };

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.2s ease-in-out',
        opacity: client.active ? 1 : 0.7,
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ flex: 1 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: client.active
                  ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                  : (theme) => alpha(theme.palette.grey[500], 0.2),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <KeyIcon sx={{ color: client.active ? 'white' : 'grey.500' }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle1" fontWeight={600} noWrap>
                  {client.name}
                </Typography>
                <StatusChip active={client.active} showIcon={false} />
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: 'monospace' }}
              >
                {client.clientId}
              </Typography>
              {showApplication && (
                <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                  {client.applicationName}
                </Typography>
              )}
              {client.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} noWrap>
                  {client.description}
                </Typography>
              )}
            </Box>
          </Stack>

          <IconButton size="small" onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => handleAction(() => onEdit(client))}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Editar</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleAction(() => onManageRoles(client))}>
              <ListItemIcon>
                <SecurityIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Gerenciar Roles</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleAction(() => onRotateSecret(client))}>
              <ListItemIcon>
                <RefreshIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Rotacionar Secret</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => handleAction(() => onToggleStatus(client))}
              disabled={isToggling}
            >
              <ListItemIcon>
                {client.active ? (
                  <BlockIcon fontSize="small" color="warning" />
                ) : (
                  <CheckCircleIcon fontSize="small" color="success" />
                )}
              </ListItemIcon>
              <ListItemText>{client.active ? 'Desativar' : 'Ativar'}</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => handleAction(() => onDelete(client))}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Excluir</ListItemText>
            </MenuItem>
          </Menu>
        </Stack>

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Roles
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5, gap: 0.5 }}>
            {client.roles && client.roles.length > 0 ? (
              client.roles.map((role) => (
                <Chip
                  key={role}
                  label={role.replace('ROLE_', '')}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))
            ) : (
              <Typography variant="caption" color="text.disabled">
                Nenhuma role
              </Typography>
            )}
          </Stack>
        </Box>

        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2 }}>
          Criado em:{' '}
          {new Date(client.createdAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </Typography>
      </CardContent>
    </Card>
  );
}
