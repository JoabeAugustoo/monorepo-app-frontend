import { useState, useEffect, useCallback } from 'react';
import { Button, Stack, Box, Typography, Chip, alpha } from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Apps as AppsIcon,
  CheckCircle as ActivateIcon,
  Block as DeactivateIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { DataGrid, ConfirmDialog, StatusChip, SearchField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { formatDateTime, useSearchDebounce } from '@app/core';
import { applicationService } from '../services';
import { useRefresh } from '../contexts/RefreshContext';
import { ApplicationFormDialog } from '../components/applications/ApplicationFormDialog';
import type { Application, SearchRequest } from '../types';

const ApplicationsPage = () => {
  const { triggerMultipleRefresh } = useRefresh();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const { inputValue: searchInput, setInputValue: setSearchInput, debouncedValue: searchTerm } = useSearchDebounce();

  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchApplications = useCallback(async () => {
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
        setApplications(response.data);
        setTotalItems(response.total || 0);
      } else {
        setApplications([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar aplicacoes:', error);
      setApplications([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortField, sortDirection]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleDelete = (app: Application) => {
    setApplicationToDelete(app);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!applicationToDelete?.publicId) return;
    try {
      setIsDeleting(true);
      await applicationService.delete(applicationToDelete.publicId);
      toast.success(`Aplicacao "${applicationToDelete.name}" excluida com sucesso!`);
      setShowDeleteModal(false);
      setApplicationToDelete(null);
      triggerMultipleRefresh(['applications', 'dashboard']);
      fetchApplications();
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
      fetchApplications();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingApplication(null);
    triggerMultipleRefresh(['applications', 'dashboard']);
    fetchApplications();
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
                ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
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
      key: 'code',
      header: 'Slug',
      render: (app: Application) => (
        <Chip
          label={app.code}
          variant="outlined"
          size="small"
          sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
        />
      ),
    },
    {
      key: 'externalId',
      header: 'External ID',
      render: (app: Application) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }} noWrap>
          {app.externalId || '-'}
        </Typography>
      ),
    },
    {
      key: 'description',
      header: 'Descricao',
      render: (app: Application) => (
        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
          {app.description ? (app.description.length > 60 ? `${app.description.slice(0, 60)}...` : app.description) : '-'}
        </Typography>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      sortable: true,
      render: (app: Application) => <StatusChip active={app.active ?? null} />,
    },
    {
      key: 'updatedAt',
      header: 'Atualizado em',
      sortable: true,
      render: (app: Application) => (
        <Typography variant="body2">{formatDateTime(app.updatedAt)}</Typography>
      ),
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <SearchField value={searchInput} onChange={setSearchInput} placeholder="Buscar aplicacoes..." />
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingApplication(null); setShowForm(true); }}>
        Nova Aplicacao
      </Button>
    </div>
  );

  const actions = [
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Editar',
      onClick: (app: Application) => { setEditingApplication(app); setShowForm(true); },
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
  ];

  return (
    <>
      <DataGrid<Application>
        data={applications}
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
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
        sortField={sortField}
        sortDirection={sortDirection === 'ASC' ? 'asc' : 'desc'}
        onSortChange={(field, direction) => {
          setSortField(field);
          setSortDirection(direction === 'asc' ? 'ASC' : 'DESC');
          setCurrentPage(1);
        }}
      />

      <ApplicationFormDialog
        open={showForm}
        application={editingApplication}
        onClose={() => { setShowForm(false); setEditingApplication(null); }}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setApplicationToDelete(null); }}
        onConfirm={confirmDelete}
        title="Confirmar Exclusao"
        titleIcon={<DeleteIcon sx={{ color: '#ef4444' }} />}
        message={`Tem certeza que deseja excluir a aplicacao "${applicationToDelete?.name}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmIcon={<DeleteIcon />}
        loading={isDeleting}
        loadingLabel="Excluindo..."
      />
    </>
  );
};

export default ApplicationsPage;
