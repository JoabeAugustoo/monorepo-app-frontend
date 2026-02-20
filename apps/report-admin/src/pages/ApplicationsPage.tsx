import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Block as DeactivateIcon,
} from '@mui/icons-material';
import { DataGrid, SearchField, ConfirmDialog } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { useSearchDebounce, formatDate } from '@app/core';
import { applicationService } from '../services';
import type { Application, ApplicationDto, SearchRequest } from '../types';
import { toast } from 'sonner';

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const ApplicationsPage = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const { debouncedValue: searchTerm, inputValue: searchInput, setInputValue: setSearchInput } = useSearchDebounce('', 500);

  const [sortField, setSortField] = useState('updatedAt');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [formData, setFormData] = useState<ApplicationDto>({ name: '', code: '', description: '' });
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  // Deactivate
  const [deactivateTarget, setDeactivateTarget] = useState<Application | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const where: Record<string, unknown> = {};

      if (searchTerm.trim()) {
        where.name = { contains: searchTerm.trim() };
      }

      const searchRequest: SearchRequest = {
        where,
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
      console.error('Erro ao carregar aplicações:', error);
      setApplications([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortField, sortDirection]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const openCreateDialog = () => {
    setEditingApp(null);
    setFormData({ name: '', code: '', externalId: '', description: '' });
    setCodeManuallyEdited(false);
    setDialogOpen(true);
  };

  const openEditDialog = (app: Application) => {
    setEditingApp(app);
    setFormData({ name: app.name, code: app.code, externalId: app.externalId || '', description: app.description || '' });
    setCodeManuallyEdited(true);
    setDialogOpen(true);
  };

  const handleNameChange = (value: string) => {
    const newData = { ...formData, name: value };
    if (!codeManuallyEdited) {
      newData.code = slugify(value);
    }
    setFormData(newData);
  };

  const handleCodeChange = (value: string) => {
    setCodeManuallyEdited(true);
    setFormData({ ...formData, code: value });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Preencha os campos obrigatórios (Nome e Código).');
      return;
    }

    setSaving(true);
    try {
      const dto: ApplicationDto = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        externalId: formData.externalId?.trim() || undefined,
        description: formData.description?.trim() || undefined,
      };

      if (editingApp) {
        await applicationService.update(editingApp.publicId, dto);
        toast.success('Aplicação atualizada com sucesso!');
      } else {
        await applicationService.create(dto);
        toast.success('Aplicação criada com sucesso!');
      }

      setDialogOpen(false);
      fetchApplications();
    } catch {
      // error handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget?.publicId) return;
    try {
      await applicationService.deactivate(deactivateTarget.publicId);
      toast.success('Aplicação desativada com sucesso!');
      setDeactivateTarget(null);
      fetchApplications();
    } catch {
      // error handled by interceptor
    }
  };

  const columns: DataGridColumn<Application>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (a) => a.name,
    },
    {
      key: 'code',
      header: 'Código',
      sortable: true,
      render: (a) => (
        <Chip label={a.code} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }} />
      ),
    },
    {
      key: 'externalId',
      header: 'External ID',
      render: (a) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {a.externalId || '-'}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Descrição',
      render: (a) => a.description
        ? (a.description.length > 60 ? a.description.substring(0, 60) + '...' : a.description)
        : '-',
    },
    {
      key: 'active',
      header: 'Status',
      render: (a) => (
        <Chip
          label={a.active ? 'Ativo' : 'Inativo'}
          size="small"
          sx={{
            backgroundColor: a.active ? '#22C55E14' : '#EF444414',
            color: a.active ? '#22C55E' : '#EF4444',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      key: 'updatedAt',
      header: 'Atualizado em',
      sortable: true,
      render: (a) => formatDate(a.updatedAt),
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <SearchField value={searchInput} onChange={setSearchInput} placeholder="Buscar por nome..." />
      <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
        Nova Aplicação
      </Button>
    </div>
  );

  const actions = [
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Editar',
      onClick: (a: Application) => openEditDialog(a),
      color: 'primary',
    },
    {
      icon: <DeactivateIcon fontSize="small" />,
      tooltip: 'Desativar',
      onClick: (a: Application) => setDeactivateTarget(a),
      color: 'error',
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
        emptyMessage="Nenhuma aplicação encontrada"
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
        onRefresh={fetchApplications}
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingApp ? 'Editar Aplicação' : 'Nova Aplicação'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Nome *"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              autoFocus
            />
            <TextField
              fullWidth
              label="Código *"
              value={formData.code}
              onChange={(e) => handleCodeChange(e.target.value)}
              helperText="Identificador único (slug)"
              slotProps={{ input: { sx: { fontFamily: 'monospace' } } }}
            />
            <TextField
              fullWidth
              label="External ID"
              value={formData.externalId}
              onChange={(e) => setFormData({ ...formData, externalId: e.target.value })}
              helperText="Identificador externo (opcional)"
              slotProps={{ input: { sx: { fontFamily: 'monospace' } } }}
            />
            <TextField
              fullWidth
              label="Descrição"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : undefined}
          >
            {saving ? 'Salvando...' : (editingApp ? 'Salvar' : 'Criar')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Desativar Aplicação"
        message={`Tem certeza que deseja desativar a aplicação "${deactivateTarget?.name}"?`}
        onConfirm={handleDeactivate}
        onClose={() => setDeactivateTarget(null)}
      />
    </>
  );
};

export default ApplicationsPage;
