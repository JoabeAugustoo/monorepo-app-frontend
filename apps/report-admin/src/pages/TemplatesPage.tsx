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
  IconButton,
  MenuItem as MuiMenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Code as CodeIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  Web as WebIcon,
  Block as DeactivateIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DataGrid, SearchField, ConfirmDialog } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { useSearchDebounce, formatDate } from '@app/core';
import { templateService, applicationService, templateCategoryService } from '../services';
import type { Template, TemplateCategory, TemplateStatus, Application, SearchRequest } from '../types';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<TemplateStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Rascunho', color: '#F59E0B' },
  PUBLISHED: { label: 'Publicado', color: '#22C55E' },
  ARCHIVED: { label: 'Arquivado', color: '#BDBDBD' },
};

const ENGINE_LABELS: Record<string, string> = {
  HANDLEBARS: 'Handlebars',
  HTML: 'HTML',
};

const TemplatesPage = () => {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const { debouncedValue: searchTerm, inputValue: searchInput, setInputValue: setSearchInput } = useSearchDebounce('', 500);

  const [sortField, setSortField] = useState('updatedAt');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

  const [statusFilter, setStatusFilter] = useState('');
  const [appFilter, setAppFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [apps, setApps] = useState<Application[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);

  const [deactivateTarget, setDeactivateTarget] = useState<Template | null>(null);

  // Raw preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewContent, setPreviewContent] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<'page' | 'html'>('page');

  // Load active applications for filter
  useEffect(() => {
    applicationService.getActive()
      .then(setApps)
      .catch(() => {});
  }, []);

  // Load categories when appFilter changes
  useEffect(() => {
    setCategoryFilter('');
    if (appFilter) {
      templateCategoryService.getActiveByApplication(appFilter)
        .then(setCategories)
        .catch(() => setCategories([]));
    } else {
      templateCategoryService.getActive()
        .then(setCategories)
        .catch(() => setCategories([]));
    }
  }, [appFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, appFilter, categoryFilter]);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const where: Record<string, unknown> = {};

      if (searchTerm.trim()) {
        where.name = { contains: searchTerm.trim() };
      }
      if (statusFilter) where.status = statusFilter;
      if (appFilter) where.applicationId = appFilter;
      if (categoryFilter) where.categoryId = categoryFilter;

      const searchRequest: SearchRequest = {
        where,
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        sort: [{ field: sortField, direction: sortDirection }],
      };

      const response = await templateService.search(searchRequest);
      if (response?.data) {
        setTemplates(response.data);
        setTotalItems(response.total || 0);
      } else {
        setTemplates([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      setTemplates([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortField, sortDirection, statusFilter, appFilter, categoryFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDeactivate = async () => {
    if (!deactivateTarget?.publicId) return;
    try {
      await templateService.deactivate(deactivateTarget.publicId);
      toast.success('Template desativado com sucesso!');
      setDeactivateTarget(null);
      fetchTemplates();
    } catch {
      // error handled by interceptor
    }
  };

  const handlePreview = async (t: Template) => {
    setPreviewTemplate(t);
    setPreviewContent('');
    setPreviewMode('page');
    setPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const raw = await templateService.getRaw(t.publicId);
      setPreviewContent(typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2));
    } catch {
      setPreviewContent('Erro ao carregar conteúdo do template.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(previewContent);
    toast.success('Conteúdo copiado!');
  };

  const columns: DataGridColumn<Template>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (t) => t.name,
    },
    {
      key: 'key',
      header: 'Chave',
      render: (t) => (
        <Chip label={t.key} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }} />
      ),
    },
    {
      key: 'applicationName',
      header: 'Aplicação',
      sortable: true,
      render: (t) => (
        <Chip label={t.applicationName} size="small" variant="outlined" sx={{ fontWeight: 500 }} />
      ),
    },
    {
      key: 'categoryName',
      header: 'Categoria',
      render: (t) => t.categoryName ? (
        <Chip label={t.categoryName} size="small" variant="outlined" sx={{ fontWeight: 500 }} />
      ) : (
        <Chip label="Global" size="small" sx={{ backgroundColor: '#9E9E9E14', color: '#9E9E9E', fontWeight: 500 }} />
      ),
    },
    {
      key: 'engine',
      header: 'Engine',
      render: (t) => ENGINE_LABELS[t.engine] || t.engine,
    },
    {
      key: 'activeVersion',
      header: 'Versão Ativa',
      render: (t) => t.activeVersion != null ? `v${t.activeVersion}` : '-',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (t) => {
        const config = STATUS_CONFIG[t.status];
        return config ? (
          <Chip
            label={config.label}
            size="small"
            sx={{
              backgroundColor: config.color + '14',
              color: config.color,
              fontWeight: 600,
            }}
          />
        ) : '-';
      },
    },
    {
      key: 'updatedAt',
      header: 'Atualizado em',
      sortable: true,
      render: (t) => formatDate(t.updatedAt),
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <SearchField value={searchInput} onChange={setSearchInput} placeholder="Buscar por nome ou chave..." />
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
      <TextField
        select
        size="small"
        label="Categoria"
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        sx={{ minWidth: 160 }}
      >
        <MuiMenuItem value="">Todas</MuiMenuItem>
        {categories.map((cat) => (
          <MuiMenuItem key={cat.publicId} value={cat.publicId}>{cat.name}</MuiMenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Status"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        sx={{ minWidth: 140 }}
      >
        <MuiMenuItem value="">Todos</MuiMenuItem>
        {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
          <MuiMenuItem key={value} value={value}>{label}</MuiMenuItem>
        ))}
      </TextField>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/templates/novo')}>
        Novo Template
      </Button>
    </div>
  );

  const actions = [
    {
      icon: <CodeIcon fontSize="small" />,
      tooltip: 'Visualizar Template',
      onClick: (t: Template) => handlePreview(t),
      color: 'info',
    },
    {
      icon: <ViewIcon fontSize="small" />,
      tooltip: 'Detalhes',
      onClick: (t: Template) => navigate(`/templates/${t.publicId}`),
      color: 'primary',
    },
    {
      icon: <DeactivateIcon fontSize="small" />,
      tooltip: 'Desativar',
      onClick: (t: Template) => setDeactivateTarget(t),
      color: 'error',
    },
  ];

  return (
    <>
      <DataGrid<Template>
        data={templates}
        columns={columns}
        getRowId={(row) => row.publicId}
        pageSize={pageSize}
        headerActions={headerActions}
        actions={actions}
        emptyMessage="Nenhum template encontrado"
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
        onRefresh={fetchTemplates}
      />
      <ConfirmDialog
        open={!!deactivateTarget}
        title="Desativar Template"
        message={`Tem certeza que deseja desativar o template "${deactivateTarget?.name}"?`}
        onConfirm={handleDeactivate}
        onClose={() => setDeactivateTarget(null)}
      />

      {/* Raw Template Preview */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon />
            {previewTemplate?.name}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ToggleButtonGroup
              value={previewMode}
              exclusive
              onChange={(_, v) => v && setPreviewMode(v)}
              size="small"
            >
              <ToggleButton value="page">
                <WebIcon fontSize="small" sx={{ mr: 0.5 }} /> Página
              </ToggleButton>
              <ToggleButton value="html">
                <CodeIcon fontSize="small" sx={{ mr: 0.5 }} /> HTML
              </ToggleButton>
            </ToggleButtonGroup>
            {previewMode === 'html' && (
              <IconButton size="small" onClick={handleCopyContent} disabled={previewLoading || !previewContent} title="Copiar">
                <CopyIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton size="small" onClick={() => setPreviewOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: previewMode === 'page' ? 0 : undefined }}>
          {previewLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : previewMode === 'page' ? (
            <iframe
              srcDoc={previewContent}
              title="Preview"
              style={{ width: '100%', height: '60vh', border: 'none' }}
              sandbox="allow-same-origin"
            />
          ) : (
            <Box
              component="pre"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                m: 0,
                p: 1,
                backgroundColor: 'grey.50',
                borderRadius: 1,
                maxHeight: '60vh',
                overflow: 'auto',
              }}
            >
              {previewContent}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TemplatesPage;
