import { useState, useMemo } from 'react';
import { Box, Grid, TextField, InputAdornment, IconButton, Stack, Tooltip, Card, alpha, Typography } from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
import { PageHeader } from '../../components/cards/PageHeader';
import { LoadingState } from '../../components/cards/LoadingState';
import { ErrorState } from '../../components/cards/ErrorState';
import { EmptyState } from '../../components/cards/EmptyState';
import { StatusChip } from '../../components/cards/StatusChip';
import { ConfirmDialog } from '../../components/dialogs/ConfirmDialog';
import { RoleFormDialog } from '../../components/dialogs/RoleFormDialog';
import { RoleCard } from './RoleCard';
import {
  useRoles,
  useActivateRole,
  useDeactivateRole,
  useDeleteRole,
} from '../../hooks/useRoles';
import { useResponsive } from '../../hooks/useResponsive';
import type { Role } from '../../types';

export function RolesPage() {
  const { isMobile } = useResponsive();
  const { data: roles, isLoading, isError, refetch } = useRoles();
  const activateRole = useActivateRole();
  const deactivateRole = useDeactivateRole();
  const deleteRole = useDeleteRole();

  const [search, setSearch] = useState('');
  const [formDialog, setFormDialog] = useState<{ open: boolean; role: Role | null }>({
    open: false,
    role: null,
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    role: Role | null;
    action: 'enable' | 'disable' | 'delete';
  }>({ open: false, role: null, action: 'enable' });

  const filteredRoles = useMemo(() => {
    if (!roles) return [];
    if (!search) return roles;

    const searchLower = search.toLowerCase();
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(searchLower) ||
        role.description?.toLowerCase().includes(searchLower)
    );
  }, [roles, search]);

  const handleCreate = () => {
    setFormDialog({ open: true, role: null });
  };

  const handleEdit = (role: Role) => {
    setFormDialog({ open: true, role });
  };

  const handleToggleStatus = (role: Role) => {
    setConfirmDialog({
      open: true,
      role,
      action: role.active ? 'disable' : 'enable',
    });
  };

  const handleDelete = (role: Role) => {
    setConfirmDialog({
      open: true,
      role,
      action: 'delete',
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.role) return;

    switch (confirmDialog.action) {
      case 'enable':
        await activateRole.mutateAsync(confirmDialog.role.publicId);
        break;
      case 'disable':
        await deactivateRole.mutateAsync(confirmDialog.role.publicId);
        break;
      case 'delete':
        await deleteRole.mutateAsync(confirmDialog.role.publicId);
        break;
    }

    setConfirmDialog({ open: false, role: null, action: 'enable' });
  };

  const getConfirmDialogProps = () => {
    switch (confirmDialog.action) {
      case 'enable':
        return {
          title: 'Ativar Role',
          message: `Tem certeza que deseja ativar a role "${confirmDialog.role?.name.replace('ROLE_', '')}"?`,
          confirmText: 'Ativar',
          confirmColor: 'success' as const,
        };
      case 'disable':
        return {
          title: 'Desativar Role',
          message: `Tem certeza que deseja desativar a role "${confirmDialog.role?.name.replace('ROLE_', '')}"?`,
          confirmText: 'Desativar',
          confirmColor: 'warning' as const,
        };
      case 'delete':
        return {
          title: 'Excluir Role',
          message: `Tem certeza que deseja excluir a role "${confirmDialog.role?.name.replace('ROLE_', '')}"? Esta ação não pode ser desfeita.`,
          confirmText: 'Excluir',
          confirmColor: 'error' as const,
        };
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Nome',
      flex: 1,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams<Role>) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1,
              flexShrink: 0,
              background: params.row.active
                ? 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
                : (theme) => alpha(theme.palette.grey[500], 0.2),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SecurityIcon sx={{ fontSize: 16, color: params.row.active ? 'white' : 'grey.500' }} />
          </Box>
          <Typography variant="body2" fontWeight={500} noWrap sx={{ lineHeight: 1.2 }}>
            {params.row.name.replace('ROLE_', '')}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'description',
      headerName: 'Descrição',
      flex: 2,
      minWidth: 250,
      renderCell: (params: GridRenderCellParams<Role>) => (
        <Box sx={{ color: params.row.description ? 'text.primary' : 'text.disabled' }}>
          {params.row.description || 'Sem descrição'}
        </Box>
      ),
    },
    {
      field: 'active',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams<Role>) => (
        <StatusChip active={params.row.active} activeLabel="Ativa" inactiveLabel="Inativa" showIcon={false} />
      ),
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Role>) => (
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

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <Box>
      <PageHeader
        title="Roles"
        subtitle={`${roles?.length || 0} roles cadastradas`}
        actionLabel="Nova Role"
        onAction={handleCreate}
      />

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField
          placeholder="Buscar por nome ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          fullWidth
          sx={{ maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Card>

      {filteredRoles.length === 0 ? (
        <EmptyState
          title="Nenhuma role encontrada"
          message={search ? 'Tente buscar com outros termos.' : 'Clique em "Nova Role" para criar.'}
          actionLabel={!search ? 'Nova Role' : undefined}
          onAction={!search ? handleCreate : undefined}
        />
      ) : isMobile ? (
        <Grid container spacing={2}>
          {filteredRoles.map((role) => (
            <Grid item xs={12} key={role.publicId}>
              <RoleCard
                role={role}
                onToggleStatus={handleToggleStatus}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isToggling={activateRole.isPending || deactivateRole.isPending}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card sx={{ width: '100%', height: 550 }}>
          <DataGrid
            rows={filteredRoles}
            columns={columns}
            getRowId={(row) => row.publicId}
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: { paginationModel: { pageSize: 5 } },
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

      <RoleFormDialog
        open={formDialog.open}
        role={formDialog.role}
        onClose={() => setFormDialog({ open: false, role: null })}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        {...getConfirmDialogProps()}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog({ open: false, role: null, action: 'enable' })}
        isLoading={activateRole.isPending || deactivateRole.isPending || deleteRole.isPending}
      />
    </Box>
  );
}
