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
  MenuItem as MuiMenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Block as DeactivateIcon,
  CheckCircle as ActivateIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DataGrid, SearchField, ConfirmDialog } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { useSearchDebounce, formatDate } from '@app/core';
import { templateCategoryService, applicationService } from '../services';
import type { TemplateCategory, TemplateCategoryDto, Application, SearchRequest } from '../types';
import { toast } from 'sonner';

const TemplateCategoriesPage = () => {
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const { debouncedValue: searchTerm, inputValue: searchInput, setInputValue: setSearchInput } = useSearchDebounce('', 500);

  const [sortField, setSortField] = useState('updatedAt');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

  const [appFilter, setAppFilter] = useState('');
  const [apps, setApps] = useState<Application[]>([]);

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TemplateCategory | null>(null);
  const [formData, setFormData] = useState<TemplateCategoryDto>({ name: '', description: '', applicationId: '' });
  const [saving, setSaving] = useState(false);

  // Confirm actions
  const [deactivateTarget, setDeactivateTarget] = useState<TemplateCategory | null>(null);
  const [activateTarget, setActivateTarget] = useState<TemplateCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TemplateCategory | null>(null);

  useEffect(() => {
    applicationService.getActive()
      .then(setApps)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, appFilter]);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const where: Record<string, unknown> = {};

      if (searchTerm.trim()) {
        where.name = { contains: searchTerm.trim() };
      }
      if (appFilter) where.applicationId = appFilter;

      const searchRequest: SearchRequest = {
        where,
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        sort: [{ field: sortField, direction: sortDirection }],
      };

      const response = await templateCategoryService.search(searchRequest);
      if (response?.data) {
        const items = Array.isArray(response.data) ? response.data : [];
        setCategories(items);
        setTotalItems(response.total ?? items.length);
      } else {
        setCategories([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setCategories([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortField, sortDirection, appFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', applicationId: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (cat: TemplateCategory) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      applicationId: cat.applicationId,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      toast.error('O nome deve ter pelo menos 2 caracteres.');
      return;
    }
    if (!formData.applicationId) {
      toast.error('Selecione uma aplicação.');
      return;
    }

    setSaving(true);
    try {
      const dto: TemplateCategoryDto = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        applicationId: formData.applicationId,
      };

      if (editingCategory) {
        await templateCategoryService.update(editingCategory.publicId, dto);
        toast.success('Categoria atualizada com sucesso!');
      } else {
        await templateCategoryService.create(dto);
        toast.success('Categoria criada com sucesso!');
      }

      setDialogOpen(false);
      fetchCategories();
    } catch {
      // error handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget?.publicId) return;
    try {
      await templateCategoryService.deactivate(deactivateTarget.publicId);
      toast.success('Categoria desativada com sucesso!');
      setDeactivateTarget(null);
      fetchCategories();
    } catch {
      // error handled by interceptor
    }
  };

  const handleActivate = async () => {
    if (!activateTarget?.publicId) return;
    try {
      await templateCategoryService.activate(activateTarget.publicId);
      toast.success('Categoria ativada com sucesso!');
      setActivateTarget(null);
      fetchCategories();
    } catch {
      // error handled by interceptor
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.publicId) return;
    try {
      await templateCategoryService.delete(deleteTarget.publicId);
      toast.success('Categoria excluída com sucesso!');
      setDeleteTarget(null);
      fetchCategories();
    } catch {
      // error handled by interceptor
    }
  };

  const columns: DataGridColumn<TemplateCategory>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (c) => c.name,
    },
    {
      key: 'description',
      header: 'Descrição',
      render: (c) => c.description
        ? (c.description.length > 60 ? c.description.substring(0, 60) + '...' : c.description)
        : '-',
    },
    {
      key: 'applicationName',
      header: 'Aplicação',
      render: (c) => c.applicationName ? (
        <Chip label={c.applicationName} size="small" variant="outlined" sx={{ fontWeight: 500 }} />
      ) : '-',
    },
    {
      key: 'active',
      header: 'Status',
      render: (c) => (
        <Chip
          label={c.active ? 'Ativo' : 'Inativo'}
          size="small"
          sx={{
            backgroundColor: c.active ? '#22C55E14' : '#EF444414',
            color: c.active ? '#22C55E' : '#EF4444',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      key: 'updatedAt',
      header: 'Atualizado em',
      sortable: true,
      render: (c) => formatDate(c.updatedAt),
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <SearchField value={searchInput} onChange={setSearchInput} placeholder="Buscar por nome..." />
      <TextField
        select
        size="small"
        label="Aplicação"
        value={appFilter}
        onChange={(e) => setAppFilter(e.target.value)}
        sx={{ minWidth: 160 }}
      >
        <MuiMenuItem value="">Todas</MuiMenuItem>
        {apps.map((app) => (
          <MuiMenuItem key={app.publicId} value={app.publicId}>{app.name}</MuiMenuItem>
        ))}
      </TextField>
      <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
        Nova Categoria
      </Button>
    </div>
  );

  const actions = [
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Editar',
      onClick: (c: TemplateCategory) => openEditDialog(c),
      color: 'primary',
    },
    {
      icon: <ActivateIcon fontSize="small" />,
      tooltip: 'Ativar',
      onClick: (c: TemplateCategory) => setActivateTarget(c),
      color: 'success',
      hidden: (c: TemplateCategory) => c.active,
    },
    {
      icon: <DeactivateIcon fontSize="small" />,
      tooltip: 'Desativar',
      onClick: (c: TemplateCategory) => setDeactivateTarget(c),
      color: 'warning',
      hidden: (c: TemplateCategory) => !c.active,
    },
    {
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Excluir',
      onClick: (c: TemplateCategory) => setDeleteTarget(c),
      color: 'error',
    },
  ];

  return (
    <>
      <DataGrid<TemplateCategory>
        data={categories}
        columns={columns}
        getRowId={(row) => row.publicId}
        pageSize={pageSize}
        headerActions={headerActions}
        actions={actions}
        emptyMessage="Nenhuma categoria encontrada"
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
        onRefresh={fetchCategories}
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Nome *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoFocus
              helperText="Mínimo 2 caracteres"
            />
            <TextField
              fullWidth
              label="Descrição"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              fullWidth
              select
              label="Aplicação *"
              value={formData.applicationId}
              onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
            >
              <MuiMenuItem value="" disabled>Selecione uma aplicação</MuiMenuItem>
              {apps.map((app) => (
                <MuiMenuItem key={app.publicId} value={app.publicId}>{app.name}</MuiMenuItem>
              ))}
            </TextField>
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
            {saving ? 'Salvando...' : (editingCategory ? 'Salvar' : 'Criar')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Desativar Categoria"
        message={`Tem certeza que deseja desativar a categoria "${deactivateTarget?.name}"?`}
        onConfirm={handleDeactivate}
        onClose={() => setDeactivateTarget(null)}
      />

      <ConfirmDialog
        open={!!activateTarget}
        title="Ativar Categoria"
        message={`Tem certeza que deseja ativar a categoria "${activateTarget?.name}"?`}
        onConfirm={handleActivate}
        onClose={() => setActivateTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir Categoria"
        message={`Tem certeza que deseja excluir a categoria "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default TemplateCategoriesPage;
