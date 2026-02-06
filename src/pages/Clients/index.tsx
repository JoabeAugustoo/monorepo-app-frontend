import { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  TextField,
  InputAdornment,
  Card,
  alpha,
  Stack,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  Autocomplete,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import SecurityIcon from '@mui/icons-material/Security';
import KeyIcon from '@mui/icons-material/Key';
import { PageHeader } from '../../components/cards/PageHeader';
import { LoadingState } from '../../components/cards/LoadingState';
import { ErrorState } from '../../components/cards/ErrorState';
import { EmptyState } from '../../components/cards/EmptyState';
import { StatusChip } from '../../components/cards/StatusChip';
import { ConfirmDialog } from '../../components/dialogs/ConfirmDialog';
import { ClientFormDialog } from '../../components/dialogs/ClientFormDialog';
import { ManageClientRolesDialog } from '../../components/dialogs/ManageClientRolesDialog';
import { SecretDisplayDialog } from '../../components/dialogs/SecretDisplayDialog';
import { ClientCard } from './ClientCard';
import {
  useAllClients,
  useActivateClient,
  useDeactivateClient,
  useDeleteClient,
  useRotateClientSecret,
} from '../../hooks/useClients';
import { useApplications } from '../../hooks/useApplications';
import { useResponsive } from '../../hooks/useResponsive';
import type { Client, ClientWithSecret, Application } from '../../types';

export function ClientsPage() {
  const { isMobile } = useResponsive();
  const { data: clients, isLoading, isError, refetch } = useAllClients();
  const { data: applications } = useApplications();
  const activateClient = useActivateClient();
  const deactivateClient = useDeactivateClient();
  const deleteClient = useDeleteClient();
  const rotateSecret = useRotateClientSecret();

  const [search, setSearch] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    client: Client | null;
    applicationId: string;
  }>({ open: false, client: null, applicationId: '' });
  const [manageRolesDialog, setManageRolesDialog] = useState<{
    open: boolean;
    client: Client | null;
  }>({ open: false, client: null });
  const [secretDialog, setSecretDialog] = useState<{
    open: boolean;
    credentials: ClientWithSecret | null;
    title: string;
  }>({ open: false, credentials: null, title: '' });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    client: Client | null;
    action: 'enable' | 'disable' | 'delete' | 'rotate';
  }>({ open: false, client: null, action: 'enable' });

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    let filtered = clients;

    if (selectedApplication) {
      filtered = filtered.filter((client) => client.applicationId === selectedApplication.publicId);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchLower) ||
          client.clientId.toLowerCase().includes(searchLower) ||
          client.applicationName.toLowerCase().includes(searchLower) ||
          client.description?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [clients, search, selectedApplication]);

  const handleEdit = (client: Client) => {
    setFormDialog({ open: true, client, applicationId: client.applicationId });
  };

  const handleToggleStatus = (client: Client) => {
    setConfirmDialog({
      open: true,
      client,
      action: client.active ? 'disable' : 'enable',
    });
  };

  const handleRotateSecret = (client: Client) => {
    setConfirmDialog({
      open: true,
      client,
      action: 'rotate',
    });
  };

  const handleManageRoles = (client: Client) => {
    setManageRolesDialog({ open: true, client });
  };

  const handleDelete = (client: Client) => {
    setConfirmDialog({
      open: true,
      client,
      action: 'delete',
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.client) return;

    switch (confirmDialog.action) {
      case 'enable':
        await activateClient.mutateAsync(confirmDialog.client.publicId);
        break;
      case 'disable':
        await deactivateClient.mutateAsync(confirmDialog.client.publicId);
        break;
      case 'delete':
        await deleteClient.mutateAsync(confirmDialog.client.publicId);
        break;
      case 'rotate':
        const result = await rotateSecret.mutateAsync(confirmDialog.client.publicId);
        setSecretDialog({
          open: true,
          credentials: result,
          title: 'Secret Rotacionado',
        });
        break;
    }

    setConfirmDialog({ open: false, client: null, action: 'enable' });
  };

  const getConfirmDialogProps = () => {
    switch (confirmDialog.action) {
      case 'enable':
        return {
          title: 'Ativar Client',
          message: `Tem certeza que deseja ativar o client "${confirmDialog.client?.name}"?`,
          confirmText: 'Ativar',
          confirmColor: 'success' as const,
        };
      case 'disable':
        return {
          title: 'Desativar Client',
          message: `Tem certeza que deseja desativar o client "${confirmDialog.client?.name}"?`,
          confirmText: 'Desativar',
          confirmColor: 'warning' as const,
        };
      case 'delete':
        return {
          title: 'Excluir Client',
          message: `Tem certeza que deseja excluir o client "${confirmDialog.client?.name}"? Esta acao nao pode ser desfeita.`,
          confirmText: 'Excluir',
          confirmColor: 'error' as const,
        };
      case 'rotate':
        return {
          title: 'Rotacionar Secret',
          message: `Deseja rotacionar o secret do client "${confirmDialog.client?.name}"? O secret atual sera invalidado imediatamente.`,
          confirmText: 'Rotacionar',
          confirmColor: 'warning' as const,
        };
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Nome',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1,
              background: params.row.active
                ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                : (theme) => alpha(theme.palette.grey[500], 0.2),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <KeyIcon sx={{ fontSize: 16, color: params.row.active ? 'white' : 'grey.500' }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={500} noWrap sx={{ lineHeight: 1.2 }}>
              {params.row.name}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ fontFamily: 'monospace', fontSize: '0.65rem', lineHeight: 1, display: 'block' }}
            >
              {params.row.clientId}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      field: 'applicationName',
      headerName: 'Aplicacao',
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <Chip
          label={params.row.applicationName}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      field: 'roles',
      headerName: 'Roles',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
          {params.row.roles && params.row.roles.length > 0 ? (
            params.row.roles.slice(0, 2).map((role: string) => (
              <Chip
                key={role}
                label={role.replace('ROLE_', '')}
                size="small"
                variant="outlined"
              />
            ))
          ) : (
            <Typography variant="caption" color="text.disabled">
              Nenhuma
            </Typography>
          )}
          {params.row.roles && params.row.roles.length > 2 && (
            <Chip
              label={`+${params.row.roles.length - 2}`}
              size="small"
              variant="outlined"
            />
          )}
        </Stack>
      ),
    },
    {
      field: 'active',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <StatusChip active={params.row.active} showIcon={false} />
      ),
    },
    {
      field: 'actions',
      headerName: 'Acoes',
      width: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Editar">
            <IconButton
              size="small"
              onClick={() => handleEdit(params.row)}
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
          <Tooltip title="Gerenciar Roles">
            <IconButton
              size="small"
              onClick={() => handleManageRoles(params.row)}
              sx={{
                backgroundColor: (theme) => alpha(theme.palette.info.main, 0.1),
                '&:hover': {
                  backgroundColor: (theme) => alpha(theme.palette.info.main, 0.2),
                },
              }}
            >
              <SecurityIcon fontSize="small" color="info" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Rotacionar Secret">
            <IconButton
              size="small"
              onClick={() => handleRotateSecret(params.row)}
              sx={{
                backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.1),
                '&:hover': {
                  backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.2),
                },
              }}
            >
              <RefreshIcon fontSize="small" color="secondary" />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.active ? 'Desativar' : 'Ativar'}>
            <IconButton
              size="small"
              onClick={() => handleToggleStatus(params.row)}
              sx={{
                backgroundColor: (theme) =>
                  params.row.active
                    ? alpha(theme.palette.warning.main, 0.1)
                    : alpha(theme.palette.success.main, 0.1),
                '&:hover': {
                  backgroundColor: (theme) =>
                    params.row.active
                      ? alpha(theme.palette.warning.main, 0.2)
                      : alpha(theme.palette.success.main, 0.2),
                },
              }}
            >
              {params.row.active ? (
                <BlockIcon fontSize="small" color="warning" />
              ) : (
                <CheckCircleIcon fontSize="small" color="success" />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir">
            <IconButton
              size="small"
              onClick={() => handleDelete(params.row)}
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
        </Stack>
      ),
    },
  ];

  const isToggling =
    activateClient.isPending ||
    deactivateClient.isPending ||
    deleteClient.isPending ||
    rotateSecret.isPending;

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <Box>
      <PageHeader
        title="Client Credentials"
        subtitle={`${clients?.length || 0} clients cadastrados`}
      />

      <Card sx={{ mb: 3, p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            placeholder="Buscar por nome, client ID ou aplicacao..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ flex: 1, maxWidth: { sm: 400 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
          <Autocomplete
            value={selectedApplication}
            onChange={(_, newValue) => setSelectedApplication(newValue)}
            options={applications || []}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => (
              <TextField {...params} label="Filtrar por aplicacao" size="small" />
            )}
            sx={{ minWidth: 250 }}
            clearOnEscape
          />
        </Stack>
      </Card>

      {filteredClients.length === 0 ? (
        <EmptyState
          title="Nenhum client encontrado"
          message={
            search || selectedApplication
              ? 'Tente buscar com outros termos ou remova os filtros.'
              : 'Nao ha clients cadastrados.'
          }
        />
      ) : isMobile ? (
        <Grid container spacing={2}>
          {filteredClients.map((client) => (
            <Grid item xs={12} key={client.publicId}>
              <ClientCard
                client={client}
                onEdit={handleEdit}
                onToggleStatus={handleToggleStatus}
                onRotateSecret={handleRotateSecret}
                onManageRoles={handleManageRoles}
                onDelete={handleDelete}
                isToggling={isToggling}
                showApplication
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card sx={{ width: '100%', height: 550 }}>
          <DataGrid
            rows={filteredClients}
            columns={columns}
            getRowId={(row) => row.publicId}
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              height: '100%',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: (theme) => alpha(theme.palette.grey[500], 0.08),
                borderRadius: 0,
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 600,
                color: 'text.secondary',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              },
              '& .MuiDataGrid-cell': {
                display: 'flex',
                alignItems: 'center',
                borderColor: (theme) => alpha(theme.palette.divider, 0.5),
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
              },
            }}
          />
        </Card>
      )}

      <ClientFormDialog
        open={formDialog.open}
        client={formDialog.client}
        applicationId={formDialog.applicationId}
        onClose={() => setFormDialog({ open: false, client: null, applicationId: '' })}
      />

      {manageRolesDialog.client && (
        <ManageClientRolesDialog
          open={manageRolesDialog.open}
          client={manageRolesDialog.client}
          applicationId={manageRolesDialog.client.applicationId}
          onClose={() => setManageRolesDialog({ open: false, client: null })}
        />
      )}

      {secretDialog.credentials && (
        <SecretDisplayDialog
          open={secretDialog.open}
          clientId={secretDialog.credentials.clientId}
          clientSecret={secretDialog.credentials.clientSecret}
          title={secretDialog.title}
          onClose={() => setSecretDialog({ open: false, credentials: null, title: '' })}
        />
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        {...getConfirmDialogProps()}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog({ open: false, client: null, action: 'enable' })}
        isLoading={isToggling}
      />
    </Box>
  );
}
