import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Button,
  alpha,
  Chip,
  CircularProgress,
  Grid,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import RefreshIcon from '@mui/icons-material/Refresh';
import SecurityIcon from '@mui/icons-material/Security';
import KeyIcon from '@mui/icons-material/Key';
import {
  useClientsByApplication,
  useActivateClient,
  useDeactivateClient,
  useDeleteClient,
  useRotateClientSecret,
} from '../../../hooks/useClients';
import { ClientFormDialog } from '../../../components/dialogs/ClientFormDialog';
import { ManageClientRolesDialog } from '../../../components/dialogs/ManageClientRolesDialog';
import { SecretDisplayDialog } from '../../../components/dialogs/SecretDisplayDialog';
import { ConfirmDialog } from '../../../components/dialogs/ConfirmDialog';
import { StatusChip } from '../../../components/cards/StatusChip';
import type { Client, ClientWithSecret } from '../../../types';

interface ApplicationClientsTabProps {
  applicationId: string;
  applicationName: string;
}

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onToggleStatus: (client: Client) => void;
  onRotateSecret: (client: Client) => void;
  onManageRoles: (client: Client) => void;
  onDelete: (client: Client) => void;
  isToggling?: boolean;
}

function ClientCard({
  client,
  onEdit,
  onToggleStatus,
  onRotateSecret,
  onManageRoles,
  onDelete,
  isToggling,
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
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                background: client.active
                  ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                  : (theme) => alpha(theme.palette.grey[500], 0.2),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <KeyIcon sx={{ color: client.active ? 'white' : 'grey.500', fontSize: 20 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
                <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ lineHeight: 1.2 }}>
                  {client.name}
                </Typography>
                <StatusChip active={client.active} showIcon={false} />
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: 'monospace', fontSize: '0.7rem', lineHeight: 1, display: 'block' }}
                noWrap
              >
                {client.clientId}
              </Typography>
              {client.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.3 }} noWrap>
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

        <Box sx={{ mt: 1.5 }}>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
            {client.roles && client.roles.length > 0 ? (
              client.roles.slice(0, 3).map((role) => (
                <Chip
                  key={role}
                  label={role.replace('ROLE_', '')}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 22, fontSize: '0.7rem' }}
                />
              ))
            ) : (
              <Typography variant="caption" color="text.disabled">
                Nenhuma role
              </Typography>
            )}
            {client.roles && client.roles.length > 3 && (
              <Chip
                label={`+${client.roles.length - 3}`}
                size="small"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.7rem' }}
              />
            )}
          </Stack>
        </Box>

        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1, fontSize: '0.65rem' }}>
          Criado em:{' '}
          {new Date(client.createdAt).toLocaleDateString('pt-BR')}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function ApplicationClientsTab({
  applicationId,
  applicationName,
}: ApplicationClientsTabProps) {
  const { data: clients, isLoading, isError, refetch } = useClientsByApplication(applicationId);
  const activateClient = useActivateClient();
  const deactivateClient = useDeactivateClient();
  const deleteClient = useDeleteClient();
  const rotateSecret = useRotateClientSecret();

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [manageRolesDialogOpen, setManageRolesDialogOpen] = useState(false);
  const [secretDialogOpen, setSecretDialogOpen] = useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [confirmRotateDialogOpen, setConfirmRotateDialogOpen] = useState(false);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClientCredentials, setNewClientCredentials] = useState<ClientWithSecret | null>(null);
  const [secretDialogTitle, setSecretDialogTitle] = useState('Credencial Criada');

  const handleCreateClick = () => {
    setSelectedClient(null);
    setFormDialogOpen(true);
  };

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setFormDialogOpen(true);
  };

  const handleClientCreated = (client: ClientWithSecret) => {
    setNewClientCredentials(client);
    setSecretDialogTitle('Credencial Criada');
    setSecretDialogOpen(true);
  };

  const handleToggleStatus = async (client: Client) => {
    if (client.active) {
      await deactivateClient.mutateAsync(client.publicId);
    } else {
      await activateClient.mutateAsync(client.publicId);
    }
  };

  const handleRotateSecretClick = (client: Client) => {
    setSelectedClient(client);
    setConfirmRotateDialogOpen(true);
  };

  const handleConfirmRotateSecret = async () => {
    if (!selectedClient) return;

    const result = await rotateSecret.mutateAsync(selectedClient.publicId);
    setConfirmRotateDialogOpen(false);
    setNewClientCredentials(result);
    setSecretDialogTitle('Secret Rotacionado');
    setSecretDialogOpen(true);
    setSelectedClient(null);
  };

  const handleManageRolesClick = (client: Client) => {
    setSelectedClient(client);
    setManageRolesDialogOpen(true);
  };

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client);
    setConfirmDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedClient) return;

    await deleteClient.mutateAsync(selectedClient.publicId);
    setConfirmDeleteDialogOpen(false);
    setSelectedClient(null);
  };

  const isToggling = activateClient.isPending || deactivateClient.isPending;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">Erro ao carregar clients</Typography>
          <Button onClick={() => refetch()} sx={{ mt: 1 }}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Client Credentials ({clients?.length || 0})
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateClick}>
          Novo Client
        </Button>
      </Stack>

      {clients && clients.length > 0 ? (
        <Grid container spacing={2}>
          {clients.map((client) => (
            <Grid item xs={12} sm={6} md={4} key={client.publicId}>
              <ClientCard
                client={client}
                onEdit={handleEditClick}
                onToggleStatus={handleToggleStatus}
                onRotateSecret={handleRotateSecretClick}
                onManageRoles={handleManageRolesClick}
                onDelete={handleDeleteClick}
                isToggling={isToggling}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card>
          <CardContent>
            <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
              <KeyIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
              <Typography color="text.secondary">
                Nenhum client credential cadastrado
              </Typography>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={handleCreateClick}>
                Criar Primeiro Client
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      <ClientFormDialog
        open={formDialogOpen}
        client={selectedClient}
        applicationId={applicationId}
        applicationName={applicationName}
        onClose={() => {
          setFormDialogOpen(false);
          setSelectedClient(null);
        }}
        onClientCreated={handleClientCreated}
      />

      <ManageClientRolesDialog
        open={manageRolesDialogOpen}
        client={selectedClient}
        applicationId={applicationId}
        onClose={() => {
          setManageRolesDialogOpen(false);
          setSelectedClient(null);
        }}
      />

      {newClientCredentials && (
        <SecretDisplayDialog
          open={secretDialogOpen}
          clientId={newClientCredentials.clientId}
          clientSecret={newClientCredentials.clientSecret}
          title={secretDialogTitle}
          onClose={() => {
            setSecretDialogOpen(false);
            setNewClientCredentials(null);
          }}
        />
      )}

      <ConfirmDialog
        open={confirmDeleteDialogOpen}
        title="Excluir Client"
        message={`Deseja excluir o client "${selectedClient?.name}"? Esta acao nao pode ser desfeita.`}
        confirmText="Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmDeleteDialogOpen(false);
          setSelectedClient(null);
        }}
        isLoading={deleteClient.isPending}
      />

      <ConfirmDialog
        open={confirmRotateDialogOpen}
        title="Rotacionar Secret"
        message={`Deseja rotacionar o secret do client "${selectedClient?.name}"? O secret atual sera invalidado imediatamente.`}
        confirmText="Rotacionar"
        onConfirm={handleConfirmRotateSecret}
        onCancel={() => {
          setConfirmRotateDialogOpen(false);
          setSelectedClient(null);
        }}
        isLoading={rotateSecret.isPending}
      />
    </Box>
  );
}
