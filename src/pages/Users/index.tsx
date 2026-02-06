import { useState, useMemo } from 'react';
import { Box, Grid, TextField, InputAdornment, Card, Avatar, alpha } from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import EditIcon from '@mui/icons-material/Edit';
import { PageHeader } from '../../components/cards/PageHeader';
import { LoadingState } from '../../components/cards/LoadingState';
import { ErrorState } from '../../components/cards/ErrorState';
import { EmptyState } from '../../components/cards/EmptyState';
import { StatusChip } from '../../components/cards/StatusChip';
import { ConfirmDialog } from '../../components/dialogs/ConfirmDialog';
import { UserFormDialog } from '../../components/dialogs/UserFormDialog';
import { UserCard } from './UserCard';
import { ManageRolesDialog } from './ManageRolesDialog';
import { useUsers, useActivateUser, useDeactivateUser } from '../../hooks/useUsers';
import { useResponsive } from '../../hooks/useResponsive';
import type { User } from '../../types';
import { IconButton, Stack, Tooltip, Typography } from '@mui/material';

export function UsersPage() {
  const { isMobile } = useResponsive();
  const { data: users, isLoading, isError, refetch } = useUsers();
  const activateUser = useActivateUser();
  const deactivateUser = useDeactivateUser();

  const [search, setSearch] = useState('');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    user: User | null;
    action: 'enable' | 'disable';
  }>({ open: false, user: null, action: 'enable' });
  const [rolesDialog, setRolesDialog] = useState<{
    open: boolean;
    userGuid: string | null;
  }>({ open: false, userGuid: null });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!search) return users;

    const searchLower = search.toLowerCase();
    return users.filter(
      (user) =>
        user.userName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.firstName || '').toLowerCase().includes(searchLower) ||
        (user.lastName || '').toLowerCase().includes(searchLower)
    );
  }, [users, search]);

  const handleToggleStatus = (user: User) => {
    setConfirmDialog({
      open: true,
      user,
      action: user.enabled ? 'disable' : 'enable',
    });
  };

  const handleConfirmToggle = async () => {
    if (!confirmDialog.user) return;

    if (confirmDialog.action === 'enable') {
      await activateUser.mutateAsync(confirmDialog.user.publicId);
    } else {
      await deactivateUser.mutateAsync(confirmDialog.user.publicId);
    }

    setConfirmDialog({ open: false, user: null, action: 'enable' });
  };

  const handleManageRoles = (user: User) => {
    setRolesDialog({ open: true, userGuid: user.publicId ?? null });
  };

  const columns: GridColDef[] = [
    {
      field: 'userName',
      headerName: 'Usuário',
      flex: 1,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams<User>) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar
            sx={{
              width: 28,
              height: 28,
              fontSize: '0.7rem',
              fontWeight: 600,
              flexShrink: 0,
              background: params.row.enabled
                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                : (theme) => alpha(theme.palette.grey[500], 0.3),
            }}
          >
            {params.row.userName.slice(0, 2).toUpperCase()}
          </Avatar>
          <Typography variant="body2" fontWeight={500} noWrap sx={{ lineHeight: 1.2 }}>
            {params.row.userName}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.5,
      minWidth: 200,
    },
    {
      field: 'enabled',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams<User>) => (
        <StatusChip active={params.row.enabled} showIcon={false} />
      ),
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams<User>) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Gerenciar Roles">
            <IconButton
              size="small"
              onClick={() => handleManageRoles(params.row)}
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
          <Tooltip title={params.row.enabled ? 'Desativar' : 'Ativar'}>
            <IconButton
              size="small"
              onClick={() => handleToggleStatus(params.row)}
              sx={{
                backgroundColor: (theme) =>
                  params.row.enabled
                    ? alpha(theme.palette.error.main, 0.1)
                    : alpha(theme.palette.success.main, 0.1),
                '&:hover': {
                  backgroundColor: (theme) =>
                    params.row.enabled
                      ? alpha(theme.palette.error.main, 0.2)
                      : alpha(theme.palette.success.main, 0.2),
                },
              }}
            >
              {params.row.enabled ? (
                <BlockIcon fontSize="small" color="error" />
              ) : (
                <CheckCircleIcon fontSize="small" color="success" />
              )}
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
        title="Usuários"
        subtitle={`${users?.length || 0} usuários cadastrados`}
        actionLabel="Novo Usuário"
        onAction={() => setFormDialogOpen(true)}
      />

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField
          placeholder="Buscar por usuário, email ou nome..."
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

      {filteredUsers.length === 0 ? (
        <EmptyState
          title="Nenhum usuário encontrado"
          message={search ? 'Tente buscar com outros termos.' : 'Não há usuários cadastrados.'}
        />
      ) : isMobile ? (
        <Grid container spacing={2}>
          {filteredUsers.map((user) => (
            <Grid item xs={12} key={user.publicId}>
              <UserCard
                user={user}
                onToggleStatus={handleToggleStatus}
                onManageRoles={handleManageRoles}
                isToggling={activateUser.isPending || deactivateUser.isPending}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card sx={{ width: '100%', height: 550 }}>
          <DataGrid
            rows={filteredUsers}
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

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.action === 'enable' ? 'Ativar Usuário' : 'Desativar Usuário'}
        message={`Tem certeza que deseja ${
          confirmDialog.action === 'enable' ? 'ativar' : 'desativar'
        } o usuário "${confirmDialog.user?.userName}"?`}
        confirmText={confirmDialog.action === 'enable' ? 'Ativar' : 'Desativar'}
        confirmColor={confirmDialog.action === 'enable' ? 'success' : 'error'}
        onConfirm={handleConfirmToggle}
        onCancel={() => setConfirmDialog({ open: false, user: null, action: 'enable' })}
        isLoading={activateUser.isPending || deactivateUser.isPending}
      />

      <ManageRolesDialog
        open={rolesDialog.open}
        user={users?.find((u) => u.publicId === rolesDialog.userGuid) ?? null}
        onClose={() => setRolesDialog({ open: false, userGuid: null })}
      />

      <UserFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
      />
    </Box>
  );
}
