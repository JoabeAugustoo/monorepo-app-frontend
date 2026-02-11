import { useState, useEffect, useCallback } from 'react';
import { Button, TextField, Box, Stack, Typography, Chip, alpha, IconButton, Tooltip } from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Apps as AppsIcon,
  Visibility as ViewIcon,
  CheckCircle as ActivateIcon,
  Block as DeactivateIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { DataGrid, FormDialog, ConfirmDialog, StatusChip, SearchField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { applicationService } from '../services';
import { useRefresh } from '../contexts/RefreshContext';
import { usePermissions } from '../hooks/usePermissions';
import type { Application, SearchRequest } from '../types';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const appSchema = z.object({
  name: z.string().min(1, 'Nome obrigatorio'),
  code: z.string().min(1, 'Codigo obrigatorio'),
  description: z.string().optional(),
});

type AppFormData = z.infer<typeof appSchema>;

const ApplicationsPage = () => {
  const navigate = useNavigate();
  const { triggerMultipleRefresh } = useRefresh();
  const { canWriteApps } = usePermissions();

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appToDelete, setAppToDelete] = useState<Application | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AppFormData>({
    resolver: zodResolver(appSchema),
    defaultValues: { name: '', code: '', description: '' },
  });

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  const fetchApps = useCallback(async () => {
    try {
      setLoading(true);
      const searchRequest: SearchRequest = {
        where: searchTerm.trim() ? { name: { contains: searchTerm.trim() } } : {},
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        sort: [{ field: sortField, direction: sortDirection }],
      };
      const response = await applicationService.search(searchRequest);
      if (response?.data) {
        setApps(response.data);
        setTotalItems(response.total || 0);
      } else {
        setApps([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar aplicacoes:', error);
      setApps([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortField, sortDirection]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleAddNew = () => {
    setEditingApp(null);
    reset({ name: '', code: '', description: '' });
    setShowForm(true);
  };

  const handleEdit = (app: Application) => {
    setEditingApp(app);
    reset({ name: app.name, code: app.code, description: app.description || '' });
    setShowForm(true);
  };

  const handleDelete = (app: Application) => {
    setAppToDelete(app);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!appToDelete?.publicId) return;
    try {
      setIsDeleting(true);
      await applicationService.delete(appToDelete.publicId);
      toast.success(`Aplicacao "${appToDelete.name}" excluida com sucesso!`);
      setShowDeleteModal(false);
      setAppToDelete(null);
      fetchApps();
    } catch (error) {
      console.error('Erro ao excluir aplicacao:', error);
      toast.error('Erro ao excluir aplicacao');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (app: Application) => {
    try {
      if (app.active) {
        await applicationService.deactivate(app.publicId);
        toast.success(`Aplicacao "${app.name}" desativada`);
      } else {
        await applicationService.activate(app.publicId);
        toast.success(`Aplicacao "${app.name}" ativada`);
      }
      fetchApps();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const onSubmit = async (data: AppFormData) => {
    try {
      if (editingApp?.publicId) {
        await applicationService.update(editingApp.publicId, {
          name: data.name,
          description: data.description,
        });
        toast.success('Aplicacao atualizada com sucesso!');
      } else {
        await applicationService.create(data);
        toast.success('Aplicacao criada com sucesso!');
      }
      triggerMultipleRefresh(['applications', 'dashboard']);
      setShowForm(false);
      setCurrentPage(1);
      fetchApps();
    } catch (error) {
      console.error('Erro ao salvar aplicacao:', error);
      toast.error('Erro ao salvar aplicacao');
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      toast.success('ID copiado!');
    });
  };

  const columns: DataGridColumn<Application>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (app: Application) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1,
              flexShrink: 0,
              background: app.active
                ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                : alpha('#9e9e9e', 0.2),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppsIcon sx={{ fontSize: 16, color: app.active ? 'white' : '#9e9e9e' }} />
          </Box>
          <Typography variant="body2" fontWeight={500} noWrap>
            {app.name}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'publicId',
      header: 'ID',
      render: (app: Application) => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Chip
            label={app.publicId}
            size="small"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              backgroundColor: alpha('#9e9e9e', 0.1),
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
                handleCopyId(app.publicId);
              }}
              sx={{
                width: 28,
                height: 28,
                backgroundColor: alpha('#3F51B5', 0.1),
                '&:hover': { backgroundColor: alpha('#3F51B5', 0.2) },
              }}
            >
              <ContentCopyIcon sx={{ fontSize: 14, color: '#3F51B5' }} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      sortable: true,
      render: (app: Application) => <StatusChip active={app.active ?? null} />,
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <SearchField value={searchInput} onChange={setSearchInput} placeholder="Buscar aplicacoes..." />
      {canWriteApps && (
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}>
          Nova Aplicacao
        </Button>
      )}
    </div>
  );

  const actions = [
    {
      icon: <ViewIcon fontSize="small" />,
      tooltip: 'Detalhes',
      onClick: (app: Application) => navigate(`/aplicacoes/${app.publicId}`),
      color: 'info' as const,
    },
    ...(canWriteApps
      ? [
          {
            icon: <EditIcon fontSize="small" />,
            tooltip: 'Editar',
            onClick: (app: Application) => handleEdit(app),
            color: 'primary' as const,
          },
          {
            icon: <ActivateIcon fontSize="small" />,
            tooltip: 'Ativar',
            onClick: (app: Application) => handleToggleStatus(app),
            color: 'success' as const,
            hidden: (app: Application) => app.active,
          },
          {
            icon: <DeactivateIcon fontSize="small" />,
            tooltip: 'Desativar',
            onClick: (app: Application) => handleToggleStatus(app),
            color: 'warning' as const,
            hidden: (app: Application) => !app.active,
          },
          {
            icon: <DeleteIcon fontSize="small" />,
            tooltip: 'Excluir',
            onClick: (app: Application) => handleDelete(app),
            color: 'error' as const,
          },
        ]
      : []),
  ];

  return (
    <>
      <DataGrid<Application>
        data={apps}
        columns={columns}
        getRowId={(row) => row.publicId}
        pageSize={pageSize}
        headerActions={headerActions}
        actions={actions}
        emptyMessage="Nenhuma aplicacao cadastrada"
        loading={loading}
        serverSidePagination
        page={currentPage}
        totalRows={totalItems}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        sortField={sortField}
        sortDirection={sortDirection === 'ASC' ? 'asc' : 'desc'}
        onSortChange={(field, direction) => {
          setSortField(field);
          setSortDirection(direction === 'asc' ? 'ASC' : 'DESC');
          setCurrentPage(1);
        }}
      />

      <FormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit(onSubmit)}
        title={editingApp ? 'Editar Aplicacao' : 'Nova Aplicacao'}
        titleIcon={<AppsIcon sx={{ color: '#3F51B5' }} />}
        submitLabel={isSubmitting ? 'Salvando...' : editingApp ? 'Atualizar' : 'Criar'}
        loading={isSubmitting}
        maxWidth="sm"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField {...field} fullWidth label="Nome" required error={!!errors.name} helperText={errors.name?.message} />
            )}
          />
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Codigo"
                required
                disabled={!!editingApp}
                error={!!errors.code}
                helperText={errors.code?.message || (editingApp ? 'Codigo nao pode ser alterado' : undefined)}
              />
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField {...field} fullWidth label="Descricao" multiline rows={3} />
            )}
          />
        </Box>
      </FormDialog>

      <ConfirmDialog
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setAppToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Confirmar Exclusao"
        titleIcon={<DeleteIcon sx={{ color: '#ef4444' }} />}
        message={`Tem certeza que deseja excluir a aplicacao "${appToDelete?.name}"?`}
        confirmLabel="Excluir"
        confirmIcon={<DeleteIcon />}
        loading={isDeleting}
        loadingLabel="Excluindo..."
      />
    </>
  );
};

export default ApplicationsPage;
