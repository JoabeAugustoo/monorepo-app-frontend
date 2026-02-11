import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Button,
  Chip,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import KeyIcon from '@mui/icons-material/Key';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { toast } from 'sonner';
import { StatusChip, ConfirmDialog } from '@app/ui';
import { clientService } from '../../services';
import { ClientFormDialog } from '../clients/ClientFormDialog';
import { ClientSecretDisplay } from '../clients/ClientSecretDisplay';
import type { Client, ClientWithSecret } from '../../types';

interface ApplicationClientsTabProps {
  applicationId: string;
  applicationName: string;
}

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onToggleStatus: (client: Client) => void;
  onRotateSecret: (client: Client) => void;
  onDelete: (client: Client) => void;
}

function ClientCard({ client, onEdit, onToggleStatus, onRotateSecret, onDelete }: ClientCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleAction = (action: () => void) => {
    setAnchorEl(null);
    action();
  };

  return (
    <Card
      sx={{
        height: '100%',
        minHeight: 180,
        transition: 'all 0.2s ease-in-out',
        opacity: client.active ? 1 : 0.7,
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: client.active
                  ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                  : alpha('#9e9e9e', 0.2),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: client.active ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
              }}
            >
              <KeyIcon sx={{ color: client.active ? 'white' : '#9e9e9e', fontSize: 24 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <Typography variant="subtitle1" fontWeight={600} noWrap>
                  {client.name}
                </Typography>
                <StatusChip active={client.active} />
              </Stack>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: 'monospace', fontSize: '0.75rem', display: 'block' }}
                noWrap
              >
                {client.clientId}
              </Typography>
              {client.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.4 }} noWrap>
                  {client.description}
                </Typography>
              )}
            </Box>
          </Stack>

          <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ flexShrink: 0 }}>
            <MoreVertIcon />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => handleAction(() => onEdit(client))}>
              <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Editar</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleAction(() => onRotateSecret(client))}>
              <ListItemIcon><RefreshIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Rotacionar Secret</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleAction(() => onToggleStatus(client))}>
              <ListItemIcon>
                {client.active ? <BlockIcon fontSize="small" color="warning" /> : <CheckCircleIcon fontSize="small" color="success" />}
              </ListItemIcon>
              <ListItemText>{client.active ? 'Desativar' : 'Ativar'}</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleAction(() => onDelete(client))} sx={{ color: 'error.main' }}>
              <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
              <ListItemText>Excluir</ListItemText>
            </MenuItem>
          </Menu>
        </Stack>

        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
            Roles
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
            {client.roles && client.roles.length > 0 ? (
              client.roles.slice(0, 4).map((role) => (
                <Chip key={role} label={role.replace('ROLE_', '')} size="small" color="primary" variant="outlined" sx={{ height: 24, fontSize: '0.75rem' }} />
              ))
            ) : (
              <Typography variant="caption" color="text.disabled">Nenhuma role</Typography>
            )}
            {client.roles && client.roles.length > 4 && (
              <Chip label={`+${client.roles.length - 4}`} size="small" variant="outlined" sx={{ height: 24, fontSize: '0.75rem' }} />
            )}
          </Stack>
        </Box>

        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
            ID
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Chip
              label={client.publicId}
              size="small"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                backgroundColor: alpha('#9e9e9e', 0.1),
                height: 24,
              }}
            />
            <Tooltip title="Copiar ID">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(client.publicId).then(() => toast.success('ID copiado!'));
                }}
                sx={{
                  width: 24,
                  height: 24,
                  backgroundColor: alpha('#3F51B5', 0.1),
                  '&:hover': { backgroundColor: alpha('#3F51B5', 0.2) },
                }}
              >
                <ContentCopyIcon sx={{ fontSize: 13, color: '#3F51B5' }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1.5, fontSize: '0.7rem' }}>
          Criado em: {new Date(client.createdAt).toLocaleDateString('pt-BR')}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function ApplicationClientsTab({ applicationId, applicationName }: ApplicationClientsTabProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showRotateModal, setShowRotateModal] = useState(false);
  const [clientToRotate, setClientToRotate] = useState<Client | null>(null);
  const [isRotating, setIsRotating] = useState(false);

  const [showSecret, setShowSecret] = useState(false);
  const [secretData, setSecretData] = useState<ClientWithSecret | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await clientService.getByApplication(applicationId);
      setClients(data);
    } catch (error) {
      console.error('Erro ao carregar clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [applicationId]);

  const handleToggleStatus = async (client: Client) => {
    try {
      if (client.active) {
        await clientService.deactivate(client.publicId);
        toast.success(`Client "${client.name}" desativado`);
      } else {
        await clientService.activate(client.publicId);
        toast.success(`Client "${client.name}" ativado`);
      }
      fetchClients();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const confirmDelete = async () => {
    if (!clientToDelete?.publicId) return;
    try {
      setIsDeleting(true);
      await clientService.delete(clientToDelete.publicId);
      toast.success(`Client "${clientToDelete.name}" excluido`);
      setShowDeleteModal(false);
      setClientToDelete(null);
      fetchClients();
    } catch {
      toast.error('Erro ao excluir client');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmRotate = async () => {
    if (!clientToRotate?.publicId) return;
    try {
      setIsRotating(true);
      const result = await clientService.rotateSecret(clientToRotate.publicId);
      setShowRotateModal(false);
      setClientToRotate(null);
      setSecretData(result);
      setShowSecret(true);
    } catch {
      toast.error('Erro ao rotacionar secret');
    } finally {
      setIsRotating(false);
    }
  };

  const handleFormSuccess = (clientWithSecret?: ClientWithSecret) => {
    setShowForm(false);
    setEditingClient(null);
    fetchClients();
    if (clientWithSecret) {
      setSecretData(clientWithSecret);
      setShowSecret(true);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Client Credentials ({clients.length})
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingClient(null); setShowForm(true); }}>
          Novo Client
        </Button>
      </Stack>

      {clients.length > 0 ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
          {clients.map((client) => (
            <Box key={client.publicId} sx={{ flex: '1 1 340px', maxWidth: '100%' }}>
              <ClientCard
                client={client}
                onEdit={(c) => { setEditingClient(c); setShowForm(true); }}
                onToggleStatus={handleToggleStatus}
                onRotateSecret={(c) => { setClientToRotate(c); setShowRotateModal(true); }}
                onDelete={(c) => { setClientToDelete(c); setShowDeleteModal(true); }}
              />
            </Box>
          ))}
        </Box>
      ) : (
        <Card>
          <CardContent>
            <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
              <KeyIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
              <Typography color="text.secondary">Nenhum client credential cadastrado</Typography>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={() => { setEditingClient(null); setShowForm(true); }}>
                Criar Primeiro Client
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      <ClientFormDialog
        open={showForm}
        client={editingClient}
        applicationId={applicationId}
        onClose={() => { setShowForm(false); setEditingClient(null); }}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setClientToDelete(null); }}
        onConfirm={confirmDelete}
        title="Excluir Client"
        message={`Deseja excluir o client "${clientToDelete?.name}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={isDeleting}
      />

      <ConfirmDialog
        open={showRotateModal}
        onClose={() => { setShowRotateModal(false); setClientToRotate(null); }}
        onConfirm={confirmRotate}
        title="Rotacionar Secret"
        message={`Deseja rotacionar o secret do client "${clientToRotate?.name}"? O secret atual sera invalidado imediatamente.`}
        confirmLabel="Rotacionar"
        confirmColor="warning"
        loading={isRotating}
      />

      {secretData && (
        <ClientSecretDisplay
          open={showSecret}
          clientId={secretData.clientId}
          clientSecret={secretData.clientSecret}
          onClose={() => { setShowSecret(false); setSecretData(null); }}
        />
      )}
    </Box>
  );
}
