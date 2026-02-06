import { useState, useMemo } from 'react';
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
  Tooltip,
  TextField,
  InputAdornment,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import SecurityIcon from '@mui/icons-material/Security';
import PublicIcon from '@mui/icons-material/Public';
import SearchIcon from '@mui/icons-material/Search';
import {
  useActivateRole,
  useDeactivateRole,
  useDeleteRole,
} from '../../../hooks/useRoles';
import { useApplicationRolesSearch } from '../../../hooks/useApplications';
import { useDisableGlobalRole } from '../../../hooks/useApplicationGlobalRoles';
import { RoleFormDialog } from '../../../components/dialogs/RoleFormDialog';
import { EnableGlobalRoleDialog } from '../../../components/dialogs/EnableGlobalRoleDialog';
import { ConfirmDialog } from '../../../components/dialogs/ConfirmDialog';
import { StatusChip } from '../../../components/cards/StatusChip';
import type { ApplicationRoleSearchResponse } from '../../../types';

interface ApplicationRolesTabProps {
  applicationId: string;
  applicationName: string;
}

export function ApplicationRolesTab({
  applicationId,
  applicationName,
}: ApplicationRolesTabProps) {
  const { data: roles, isLoading, isError, refetch } = useApplicationRolesSearch(applicationId);
  const activateRole = useActivateRole();
  const deactivateRole = useDeactivateRole();
  const deleteRole = useDeleteRole();
  const disableGlobalRole = useDisableGlobalRole();

  const [search, setSearch] = useState('');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ApplicationRoleSearchResponse | null>(null);
  const [enableGlobalRoleDialogOpen, setEnableGlobalRoleDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    role: ApplicationRoleSearchResponse | null;
    action: 'enable' | 'disable' | 'delete' | 'disableGlobal';
  }>({ open: false, role: null, action: 'enable' });

  const filteredRoles = useMemo(() => {
    if (!roles) return [];
    if (!search) return roles;

    const searchLower = search.toLowerCase();
    return roles.filter(
      (role) =>
        role.name?.toLowerCase().includes(searchLower) ||
        role.description?.toLowerCase().includes(searchLower)
    );
  }, [roles, search]);

  const handleCreateRole = () => {
    setSelectedRole(null);
    setFormDialogOpen(true);
  };

  const handleEditRole = (role: ApplicationRoleSearchResponse) => {
    setSelectedRole(role);
    setFormDialogOpen(true);
  };

  const handleToggleStatus = (role: ApplicationRoleSearchResponse) => {
    setConfirmDialog({
      open: true,
      role,
      action: role.active ? 'disable' : 'enable',
    });
  };

  const handleDeleteRole = (role: ApplicationRoleSearchResponse) => {
    setConfirmDialog({
      open: true,
      role,
      action: 'delete',
    });
  };

  const handleDisableGlobalRole = (role: ApplicationRoleSearchResponse) => {
    setConfirmDialog({
      open: true,
      role,
      action: 'disableGlobal',
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
      case 'disableGlobal':
        await disableGlobalRole.mutateAsync({
          appPublicId: applicationId,
          rolePublicId: confirmDialog.role.publicId,
        });
        break;
    }

    setConfirmDialog({ open: false, role: null, action: 'enable' });
  };

  const getConfirmDialogProps = () => {
    const roleName = confirmDialog.role?.name?.replace('ROLE_', '') || 'selecionada';

    switch (confirmDialog.action) {
      case 'enable':
        return {
          title: 'Ativar Role',
          message: `Tem certeza que deseja ativar a role "${roleName}"?`,
          confirmText: 'Ativar',
          confirmColor: 'success' as const,
        };
      case 'disable':
        return {
          title: 'Desativar Role',
          message: `Tem certeza que deseja desativar a role "${roleName}"?`,
          confirmText: 'Desativar',
          confirmColor: 'warning' as const,
        };
      case 'delete':
        return {
          title: 'Excluir Role',
          message: `Tem certeza que deseja excluir a role "${roleName}"? Esta acao nao pode ser desfeita.`,
          confirmText: 'Excluir',
          confirmColor: 'error' as const,
        };
      case 'disableGlobal':
        return {
          title: 'Desabilitar Role Global',
          message: `Tem certeza que deseja desabilitar a role global "${roleName}" desta aplicacao? Usuarios e clients que possuem esta role perderao o acesso.`,
          confirmText: 'Desabilitar',
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
      renderCell: (params: GridRenderCellParams<ApplicationRoleSearchResponse>) => {
        const roleName = params.row.name?.replace('ROLE_', '') || '';
        return (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1,
                flexShrink: 0,
                background: params.row.active
                  ? params.row.isGlobal
                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                    : 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
                  : (theme) => alpha(theme.palette.grey[500], 0.2),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {params.row.isGlobal ? (
                <PublicIcon sx={{ fontSize: 16, color: params.row.active ? 'white' : 'grey.500' }} />
              ) : (
                <SecurityIcon sx={{ fontSize: 16, color: params.row.active ? 'white' : 'grey.500' }} />
              )}
            </Box>
            <Typography variant="body2" fontWeight={500} noWrap sx={{ lineHeight: 1.2 }}>
              {roleName}
            </Typography>
          </Stack>
        );
      },
    },
    {
      field: 'isGlobal',
      headerName: 'Tipo',
      width: 130,
      renderCell: (params: GridRenderCellParams<ApplicationRoleSearchResponse>) => (
        <Chip
          label={params.row.isGlobal ? 'Global' : 'Dominio'}
          size="small"
          color={params.row.isGlobal ? 'primary' : 'secondary'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'description',
      headerName: 'Descricao',
      flex: 2,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<ApplicationRoleSearchResponse>) => (
        <Typography variant="body2" color={params.row.description ? 'text.primary' : 'text.disabled'} noWrap>
          {params.row.description || 'Sem descricao'}
        </Typography>
      ),
    },
    {
      field: 'active',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams<ApplicationRoleSearchResponse>) => (
        <StatusChip active={params.row.active} showIcon={false} />
      ),
    },
    {
      field: 'actions',
      headerName: 'Acoes',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams<ApplicationRoleSearchResponse>) => {
        const isGlobal = params.row.isGlobal;

        return (
          <Stack direction="row" spacing={0.5}>
            {!isGlobal && (
              <>
                <Tooltip title="Editar">
                  <IconButton
                    size="small"
                    onClick={() => handleEditRole(params.row)}
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
                    onClick={() => handleDeleteRole(params.row)}
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
              </>
            )}
            {isGlobal && (
              <Tooltip title="Desabilitar desta aplicacao">
                <IconButton
                  size="small"
                  onClick={() => handleDisableGlobalRole(params.row)}
                  sx={{
                    backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
                    '&:hover': {
                      backgroundColor: (theme) => alpha(theme.palette.error.main, 0.2),
                    },
                  }}
                >
                  <BlockIcon fontSize="small" color="error" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        );
      },
    },
  ];

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
          <Typography color="error">Erro ao carregar roles</Typography>
          <Button onClick={() => refetch()} sx={{ mt: 1 }}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const allRoles = roles || [];
  const domainCount = allRoles.filter((r) => !r.isGlobal).length;
  const globalCount = allRoles.filter((r) => r.isGlobal).length;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Roles ({allRoles.length})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {domainCount} de dominio, {globalCount} globais habilitadas
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<PublicIcon />}
            onClick={() => setEnableGlobalRoleDialogOpen(true)}
          >
            Habilitar Global
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateRole}>
            Nova Role
          </Button>
        </Stack>
      </Stack>

      {allRoles.length > 0 ? (
        <>
          <Card sx={{ mb: 2, p: 2 }}>
            <TextField
              placeholder="Buscar por nome ou descricao..."
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
              rows={filteredRoles}
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
        </>
      ) : (
        <Card>
          <CardContent>
            <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
              <SecurityIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
              <Typography color="text.secondary">
                Nenhuma role cadastrada ou habilitada
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<PublicIcon />}
                  onClick={() => setEnableGlobalRoleDialogOpen(true)}
                >
                  Habilitar Role Global
                </Button>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateRole}>
                  Criar Role de Dominio
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <RoleFormDialog
        open={formDialogOpen}
        role={selectedRole}
        applicationId={applicationId}
        applicationName={applicationName}
        onClose={() => {
          setFormDialogOpen(false);
          setSelectedRole(null);
        }}
      />

      <EnableGlobalRoleDialog
        open={enableGlobalRoleDialogOpen}
        applicationId={applicationId}
        applicationName={applicationName}
        enabledGlobalRoleIds={allRoles.filter((r) => r.isGlobal).map((r) => r.publicId)}
        onClose={() => setEnableGlobalRoleDialogOpen(false)}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        {...getConfirmDialogProps()}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog({ open: false, role: null, action: 'enable' })}
        isLoading={
          activateRole.isPending ||
          deactivateRole.isPending ||
          deleteRole.isPending ||
          disableGlobalRole.isPending
        }
      />
    </Box>
  );
}
