import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  MenuItem as MuiMenuItem,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Block as DeactivateIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DataGrid, SearchField, ConfirmDialog } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { useSearchDebounce, formatDate } from '@app/core';
import { templateService, applicationService } from '../services';
import type { Template, TemplateStatus, Application, SearchRequest } from '../types';
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
  const [apps, setApps] = useState<Application[]>([]);

  const [deactivateTarget, setDeactivateTarget] = useState<Template | null>(null);

  // Load active applications for filter
  useEffect(() => {
    applicationService.getActive()
      .then(setApps)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, appFilter]);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const where: Record<string, unknown> = {};

      if (searchTerm.trim()) {
        where.name = { contains: searchTerm.trim() };
      }
      if (statusFilter) where.status = statusFilter;
      if (appFilter) where.applicationId = appFilter;

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
  }, [currentPage, pageSize, searchTerm, sortField, sortDirection, statusFilter, appFilter]);

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
      />
      <ConfirmDialog
        open={!!deactivateTarget}
        title="Desativar Template"
        message={`Tem certeza que deseja desativar o template "${deactivateTarget?.name}"?`}
        onConfirm={handleDeactivate}
        onClose={() => setDeactivateTarget(null)}
      />
    </>
  );
};

export default TemplatesPage;
