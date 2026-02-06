import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  Button,
  Avatar,
  alpha,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Autocomplete,
  TextField,
  Alert,
  InputAdornment,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import {
  useApplicationUsersSearch,
  useApplicationRolesSearch,
  useAssignUserRoleToApplication,
  useRemoveUserRoleFromApplication,
  useRemoveUserFromApplication,
} from '../../../hooks/useApplications';
import { AssignUserToApplicationDialog } from '../../../components/dialogs/AssignUserToApplicationDialog';
import { ConfirmDialog } from '../../../components/dialogs/ConfirmDialog';
import { StatusChip } from '../../../components/cards/StatusChip';
import type { ApplicationUserSearchResponse, ApplicationRoleSearchResponse, UserRoleItem } from '../../../types';

interface ApplicationUsersTabProps {
  applicationId: string;
  applicationName: string;
}

interface ManageUserRolesDialogProps {
  open: boolean;
  user: ApplicationUserSearchResponse | null;
  applicationId: string;
  availableRoles: ApplicationRoleSearchResponse[];
  rolesLoading: boolean;
  rolesError: boolean;
  onClose: () => void;
}

function ManageUserRolesDialog({
  open,
  user,
  applicationId,
  availableRoles,
  rolesLoading,
  rolesError,
  onClose,
}: ManageUserRolesDialogProps) {
  const assignRole = useAssignUserRoleToApplication();
  const removeRole = useRemoveUserRoleFromApplication();

  const [selectedRole, setSelectedRole] = useState<ApplicationRoleSearchResponse | null>(null);

  if (!user) return null;

  const userRoles = user.roles ?? [];
  const userRoleIds = userRoles.map((r) => r.publicId);

  const rolesNotAssigned = availableRoles.filter(
    (role) => role.active && !userRoleIds.includes(role.publicId)
  );

  const handleAddRole = async () => {
    if (!selectedRole || !user.publicId) return;

    try {
      await assignRole.mutateAsync({
        appPublicId: applicationId,
        userPublicId: user.publicId,
        rolePublicId: selectedRole.publicId,
      });
      setSelectedRole(null);
    } catch {
      // Error handled by mutation
    }
  };

  const handleRemoveRole = async (role: UserRoleItem) => {
    if (!user.publicId) return;

    try {
      await removeRole.mutateAsync({
        appPublicId: applicationId,
        userPublicId: user.publicId,
        rolePublicId: role.publicId,
      });
    } catch {
      // Error handled by mutation
    }
  };

  const getRoleInfo = (roleId: string): ApplicationRoleSearchResponse | undefined => {
    return availableRoles.find((r) => r.publicId === roleId);
  };

  const handleClose = () => {
    setSelectedRole(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Gerenciar Roles - {user.userName || 'Usuario'}</DialogTitle>
      <DialogContent>
        {rolesError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Erro ao carregar roles
          </Alert>
        )}

        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Roles atuais
        </Typography>

        {userRoles.length > 0 ? (
          <List dense>
            {userRoles.map((role) => {
              const roleInfo = getRoleInfo(role.publicId);
              return (
                <ListItem key={role.publicId}>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={role.name.replace('ROLE_', '')}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        {roleInfo?.isGlobal && (
                          <Chip
                            label="Global"
                            size="small"
                            color="secondary"
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        )}
                      </Stack>
                    }
                    secondary={roleInfo?.description || ''}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveRole(role)}
                      disabled={removeRole.isPending}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Typography variant="body2" color="text.disabled" sx={{ py: 2 }}>
            Nenhuma role atribuida
          </Typography>
        )}

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Adicionar nova role
          </Typography>

          {rolesLoading ? (
            <CircularProgress size={24} />
          ) : (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Autocomplete
                value={selectedRole}
                onChange={(_, newValue) => setSelectedRole(newValue)}
                options={rolesNotAssigned}
                getOptionLabel={(option) => option.name?.replace('ROLE_', '') || ''}
                isOptionEqualToValue={(option, value) => option.publicId === value.publicId}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li key={key} {...otherProps}>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2">
                            {option.name?.replace('ROLE_', '') || ''}
                          </Typography>
                          {option.isGlobal && (
                            <Chip
                              label="Global"
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          )}
                        </Stack>
                        {option.description && (
                          <Typography variant="caption" color="text.secondary">
                            {option.description}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Selecione uma role" size="small" />
                )}
                sx={{ flex: 1 }}
                noOptionsText="Nenhuma role disponivel"
              />
              <Button
                variant="contained"
                onClick={handleAddRole}
                disabled={!selectedRole || assignRole.isPending}
                startIcon={<AddIcon />}
              >
                Adicionar
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}

export function ApplicationUsersTab({
  applicationId,
  applicationName,
}: ApplicationUsersTabProps) {
  const { data: users, isLoading: usersLoading, isError: usersError, refetch } = useApplicationUsersSearch(applicationId);
  const { data: roles, isLoading: rolesLoading, isError: rolesError } = useApplicationRolesSearch(applicationId);
  const removeUser = useRemoveUserFromApplication();

  const [search, setSearch] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [manageRolesDialogOpen, setManageRolesDialogOpen] = useState(false);
  const [confirmRemoveDialogOpen, setConfirmRemoveDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ApplicationUserSearchResponse | null>(null);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!search) return users;

    const searchLower = search.toLowerCase();
    return users.filter(
      (user) =>
        user.userName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.roles?.some((role) => role.name.toLowerCase().includes(searchLower))
    );
  }, [users, search]);

  const handleManageRoles = (user: ApplicationUserSearchResponse) => {
    setSelectedUser(user);
    setManageRolesDialogOpen(true);
  };

  const handleRemoveClick = (user: ApplicationUserSearchResponse) => {
    setSelectedUser(user);
    setConfirmRemoveDialogOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!selectedUser) return;

    try {
      await removeUser.mutateAsync({
        appPublicId: applicationId,
        userPublicId: selectedUser.publicId,
      });

      setConfirmRemoveDialogOpen(false);
      setSelectedUser(null);
    } catch {
      // Error handled by mutation
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'userName',
      headerName: 'Usuario',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<ApplicationUserSearchResponse>) => {
        const userName = params.row.userName || 'Usuario';
        const initials = userName.slice(0, 2).toUpperCase();
        const fullName = [params.row.firstName, params.row.lastName].filter(Boolean).join(' ');
        return (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar
              sx={{
                width: 28,
                height: 28,
                fontSize: '0.7rem',
                fontWeight: 600,
                flexShrink: 0,
                background: params.row.active
                  ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                  : (theme) => alpha(theme.palette.grey[500], 0.3),
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={500} noWrap sx={{ lineHeight: 1.2 }}>
                {userName}
              </Typography>
              {fullName && (
                <Typography variant="caption" color="text.secondary" noWrap sx={{ lineHeight: 1, display: 'block', fontSize: '0.7rem' }}>
                  {fullName}
                </Typography>
              )}
            </Box>
          </Stack>
        );
      },
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams<ApplicationUserSearchResponse>) => (
        <Typography variant="body2" color="text.secondary" noWrap>
          {params.row.email || '-'}
        </Typography>
      ),
    },
    {
      field: 'roles',
      headerName: 'Roles',
      flex: 1.5,
      minWidth: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams<ApplicationUserSearchResponse>) => {
        const userRoles = params.row.roles || [];
        return (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
            {userRoles.length > 0 ? (
              userRoles.slice(0, 2).map((role) => (
                <Chip
                  key={role.publicId}
                  label={role.name.replace('ROLE_', '')}
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
            {userRoles.length > 2 && (
              <Chip
                label={`+${userRoles.length - 2}`}
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
        );
      },
    },
    {
      field: 'active',
      headerName: 'Status',
      width: 100,
      renderCell: (params: GridRenderCellParams<ApplicationUserSearchResponse>) => (
        <StatusChip active={params.row.active} showIcon={false} />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Criado em',
      width: 120,
      renderCell: (params: GridRenderCellParams<ApplicationUserSearchResponse>) => (
        <Typography variant="body2" color="text.secondary">
          {params.row.createdAt
            ? new Date(params.row.createdAt).toLocaleDateString('pt-BR')
            : '-'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Acoes',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams<ApplicationUserSearchResponse>) => (
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
          <Tooltip title="Remover da Aplicacao">
            <IconButton
              size="small"
              onClick={() => handleRemoveClick(params.row)}
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

  const isLoading = usersLoading;
  const allUsers = users || [];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (usersError) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Erro ao carregar usuarios. Verifique se o endpoint esta disponivel.
          </Alert>
          <Button onClick={() => refetch()} variant="outlined">
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
          Usuarios ({allUsers.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setAssignDialogOpen(true)}
        >
          Adicionar Usuario
        </Button>
      </Stack>

      {allUsers.length > 0 ? (
        <>
          <Card sx={{ mb: 2, p: 2 }}>
            <TextField
              placeholder="Buscar por usuario, email ou nome..."
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

          <Card sx={{ width: '100%', height: 450 }}>
            <DataGrid
              rows={filteredUsers}
              columns={columns}
              getRowId={(row) => row.publicId}
              pageSizeOptions={[5, 10, 25, 50]}
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
        </>
      ) : (
        <Card>
          <CardContent>
            <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
              <Typography color="text.secondary">
                Nenhum usuario vinculado a esta aplicacao
              </Typography>
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={() => setAssignDialogOpen(true)}
              >
                Adicionar Primeiro Usuario
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      <AssignUserToApplicationDialog
        open={assignDialogOpen}
        applicationId={applicationId}
        applicationName={applicationName}
        existingUserIds={allUsers.map((u) => u.publicId)}
        onClose={() => setAssignDialogOpen(false)}
      />

      <ManageUserRolesDialog
        open={manageRolesDialogOpen}
        user={selectedUser}
        applicationId={applicationId}
        availableRoles={roles || []}
        rolesLoading={rolesLoading}
        rolesError={rolesError}
        onClose={() => {
          setManageRolesDialogOpen(false);
          setSelectedUser(null);
        }}
      />

      <ConfirmDialog
        open={confirmRemoveDialogOpen}
        title="Remover Usuario"
        message={`Deseja remover o usuario "${selectedUser?.userName || 'selecionado'}" desta aplicacao? Todas as roles do usuario nesta aplicacao serao removidas.`}
        confirmText="Remover"
        onConfirm={handleConfirmRemove}
        onCancel={() => {
          setConfirmRemoveDialogOpen(false);
          setSelectedUser(null);
        }}
        isLoading={removeUser.isPending}
      />
    </Box>
  );
}
