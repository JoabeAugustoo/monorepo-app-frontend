import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Stack,
  Tooltip,
  Card,
  alpha,
  Typography,
  Chip,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AppsIcon from '@mui/icons-material/Apps';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { PageHeader } from '../../components/cards/PageHeader';
import { LoadingState } from '../../components/cards/LoadingState';
import { ErrorState } from '../../components/cards/ErrorState';
import { EmptyState } from '../../components/cards/EmptyState';
import { StatusChip } from '../../components/cards/StatusChip';
import { ConfirmDialog } from '../../components/dialogs/ConfirmDialog';
import { ApplicationCard } from './ApplicationCard';
import { ApplicationFormDialog } from './ApplicationFormDialog';
import {
  useApplications,
  useActivateApplication,
  useDeactivateApplication,
  useDeleteApplication,
} from '../../hooks/useApplications';
import { useResponsive } from '../../hooks/useResponsive';
import { copyToClipboard } from '../../utils/format';
import { toast } from 'sonner';
import type { Application } from '../../types';

export function ApplicationsPage() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const { data: applications, isLoading, isError, refetch } = useApplications();
  const activateApplication = useActivateApplication();
  const deactivateApplication = useDeactivateApplication();
  const deleteApplication = useDeleteApplication();

  const [search, setSearch] = useState('');
  const [formDialog, setFormDialog] = useState<{ open: boolean; application: Application | null }>({
    open: false,
    application: null,
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    application: Application | null;
    action: 'enable' | 'disable' | 'delete';
  }>({ open: false, application: null, action: 'enable' });

  const filteredApplications = useMemo(() => {
    if (!applications) return [];
    if (!search) return applications;

    const searchLower = search.toLowerCase();
    return applications.filter(
      (app) =>
        app.name.toLowerCase().includes(searchLower) ||
        app.description?.toLowerCase().includes(searchLower) ||
        app.publicId.toLowerCase().includes(searchLower)
    );
  }, [applications, search]);

  const handleCreate = () => {
    setFormDialog({ open: true, application: null });
  };

  const handleEdit = (application: Application) => {
    setFormDialog({ open: true, application });
  };

  const handleToggleStatus = (application: Application) => {
    setConfirmDialog({
      open: true,
      application,
      action: application.active ? 'disable' : 'enable',
    });
  };

  const handleDelete = (application: Application) => {
    setConfirmDialog({
      open: true,
      application,
      action: 'delete',
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.application) return;

    switch (confirmDialog.action) {
      case 'enable':
        await activateApplication.mutateAsync(confirmDialog.application.publicId);
        break;
      case 'disable':
        await deactivateApplication.mutateAsync(confirmDialog.application.publicId);
        break;
      case 'delete':
        await deleteApplication.mutateAsync(confirmDialog.application.publicId);
        break;
    }

    setConfirmDialog({ open: false, application: null, action: 'enable' });
  };

  const handleCopyGuid = async (guid: string) => {
    const success = await copyToClipboard(guid);
    if (success) {
      toast.success('ID copiado!');
    }
  };

  const handleViewDetails = (application: Application) => {
    navigate(`/applications/${application.publicId}`);
  };

  const getConfirmDialogProps = () => {
    const name = confirmDialog.application?.name;
    switch (confirmDialog.action) {
      case 'enable':
        return {
          title: 'Ativar Aplicação',
          message: `Tem certeza que deseja ativar a aplicação "${name}"?`,
          confirmText: 'Ativar',
          confirmColor: 'success' as const,
        };
      case 'disable':
        return {
          title: 'Desativar Aplicação',
          message: `Tem certeza que deseja desativar a aplicação "${name}"?`,
          confirmText: 'Desativar',
          confirmColor: 'warning' as const,
        };
      case 'delete':
        return {
          title: 'Excluir Aplicação',
          message: `Tem certeza que deseja excluir a aplicação "${name}"? Esta ação não pode ser desfeita.`,
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
      renderCell: (params: GridRenderCellParams<Application>) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1,
              flexShrink: 0,
              background: params.row.active
                ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                : (theme) => alpha(theme.palette.grey[500], 0.2),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppsIcon sx={{ fontSize: 16, color: params.row.active ? 'white' : 'grey.500' }} />
          </Box>
          <Typography variant="body2" fontWeight={500} noWrap sx={{ lineHeight: 1.2 }}>
            {params.row.name}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'publicId',
      headerName: 'ID',
      flex: 1.5,
      minWidth: 280,
      renderCell: (params: GridRenderCellParams<Application>) => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Chip
            label={params.row.publicId}
            size="small"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              backgroundColor: (theme) => alpha(theme.palette.grey[500], 0.1),
              maxWidth: 220,
              '& .MuiChip-label': {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
            }}
          />
          <Tooltip title="Copiar ID">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyGuid(params.row.publicId);
              }}
              sx={{
                width: 28,
                height: 28,
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                },
              }}
            >
              <ContentCopyIcon sx={{ fontSize: 14 }} color="primary" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
    {
      field: 'active',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams<Application>) => (
        <StatusChip active={params.row.active} showIcon={false} />
      ),
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 180,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Application>) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Ver Detalhes">
            <IconButton
              size="small"
              onClick={() => handleViewDetails(params.row)}
              sx={{
                backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.1),
                '&:hover': {
                  backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.2),
                },
              }}
            >
              <VisibilityIcon fontSize="small" color="secondary" />
            </IconButton>
          </Tooltip>
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
        title="Aplicações"
        subtitle={`${applications?.length || 0} aplicações cadastradas`}
        actionLabel="Nova Aplicação"
        onAction={handleCreate}
      />

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField
          placeholder="Buscar por nome, descrição ou ID..."
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

      {filteredApplications.length === 0 ? (
        <EmptyState
          title="Nenhuma aplicação encontrada"
          message={
            search
              ? 'Tente buscar com outros termos.'
              : 'Clique em "Nova Aplicação" para criar.'
          }
          actionLabel={!search ? 'Nova Aplicação' : undefined}
          onAction={!search ? handleCreate : undefined}
        />
      ) : isMobile ? (
        <Grid container spacing={2}>
          {filteredApplications.map((application) => (
            <Grid item xs={12} key={application.publicId}>
              <ApplicationCard
                application={application}
                onToggleStatus={handleToggleStatus}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDetails={handleViewDetails}
                isToggling={activateApplication.isPending || deactivateApplication.isPending}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card sx={{ width: '100%', height: 550 }}>
          <DataGrid
            rows={filteredApplications}
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

      <ApplicationFormDialog
        open={formDialog.open}
        application={formDialog.application}
        onClose={() => setFormDialog({ open: false, application: null })}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        {...getConfirmDialogProps()}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog({ open: false, application: null, action: 'enable' })}
        isLoading={
          activateApplication.isPending ||
          deactivateApplication.isPending ||
          deleteApplication.isPending
        }
      />
    </Box>
  );
}
