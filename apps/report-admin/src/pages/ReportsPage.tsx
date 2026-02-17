import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  MenuItem as MuiMenuItem,
  TextField,
} from '@mui/material';
import {
  Download as DownloadIcon,
} from '@mui/icons-material';
import { DataGrid, SearchField, DateRangeField } from '@app/ui';
import type { DataGridColumn, DateRange } from '@app/ui';
import { useSearchDebounce, formatDateTime } from '@app/core';
import { reportService, applicationService, templateCategoryService } from '../services';
import type { GeneratedReport, ReportSearchRequest, ReportStatus, Application, TemplateCategory } from '../types';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: '#F59E0B' },
  PROCESSING: { label: 'Processando', color: '#3B82F6' },
  COMPLETED: { label: 'Concluído', color: '#22C55E' },
  FAILED: { label: 'Falhou', color: '#EF4444' },
};

const FORMAT_COLORS: Record<string, string> = {
  pdf: '#EF4444',
  html: '#2563EB',
  csv: '#22C55E',
  xlsx: '#16A34A',
  json: '#F59E0B',
};

const getDefaultDateRange = (): DateRange => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return { start: yesterday, end: today };
};

const ReportsPage = () => {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const { debouncedValue: searchTerm, inputValue: searchInput, setInputValue: setSearchInput } = useSearchDebounce('', 500);

  const [appFilter, setAppFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);

  const [apps, setApps] = useState<Application[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);

  // Load active applications
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
      setCategories([]);
    }
  }, [appFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, appFilter, statusFilter, categoryFilter, dateRange]);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);

      const searchRequest: ReportSearchRequest = {
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      };

      if (searchTerm.trim()) {
        searchRequest.templateKey = searchTerm.trim();
      }
      if (appFilter) {
        searchRequest.applicationId = appFilter;
      }
      if (statusFilter) {
        searchRequest.status = statusFilter as ReportStatus;
      }
      if (categoryFilter) {
        searchRequest.categoryId = categoryFilter;
      }
      if (dateRange.start) {
        searchRequest.dateFrom = dateRange.start.toISOString();
      }
      if (dateRange.end) {
        const endOfDay = new Date(dateRange.end);
        endOfDay.setHours(23, 59, 59, 999);
        searchRequest.dateTo = endOfDay.toISOString();
      }

      const response = await reportService.search(searchRequest);
      if (response?.data) {
        setReports(response.data);
        setTotalItems(response.total || 0);
      } else {
        setReports([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      setReports([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, appFilter, statusFilter, categoryFilter, dateRange]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDownload = async (report: GeneratedReport) => {
    try {
      await reportService.download(report.publicId);
      toast.success('Download iniciado!');
    } catch {
      // error handled by interceptor
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (bytes == null) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const columns: DataGridColumn<GeneratedReport>[] = [
    {
      key: 'templateKey',
      header: 'Template',
      render: (r) => (
        <Box>
          <Box sx={{ fontWeight: 500 }}>{r.templateName || r.templateKey}</Box>
          {r.templateName && (
            <Chip
              label={r.templateKey}
              size="small"
              variant="outlined"
              sx={{ fontFamily: 'monospace', fontSize: '0.7rem', mt: 0.3 }}
            />
          )}
        </Box>
      ),
    },
    {
      key: 'applicationName',
      header: 'Aplicação',
      render: (r) => (
        <Chip
          label={r.applicationName}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />
      ),
    },
    {
      key: 'categoryName',
      header: 'Categoria',
      render: (r) => r.categoryName ? (
        <Chip label={r.categoryName} size="small" variant="outlined" sx={{ fontWeight: 500 }} />
      ) : (
        <Chip label="Global" size="small" sx={{ backgroundColor: '#9E9E9E14', color: '#9E9E9E', fontWeight: 500 }} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const config = STATUS_CONFIG[r.status];
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
        ) : (
          <Chip label={r.status} size="small" variant="outlined" />
        );
      },
    },
    {
      key: 'format',
      header: 'Formato',
      render: (r) => {
        const fmt = (r.fileExtension || r.format || r.contentType?.split('/').pop() || '').toUpperCase();
        const color = FORMAT_COLORS[(r.fileExtension || r.format || '').toLowerCase()] || '#6B7280';
        return (
          <Chip
            label={fmt}
            size="small"
            sx={{
              backgroundColor: color + '14',
              color,
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        );
      },
    },
    {
      key: 'fileSize',
      header: 'Tamanho',
      render: (r) => formatFileSize(r.fileSize),
    },
    {
      key: 'createdAt',
      header: 'Gerado em',
      render: (r) => formatDateTime(r.createdAt),
    },
  ];

  const handleClearFilters = () => {
    setSearchInput('');
    setAppFilter('');
    setStatusFilter('');
    setCategoryFilter('');
    setDateRange(getDefaultDateRange());
  };

  const defaultRange = getDefaultDateRange();
  const hasFilters = searchInput || appFilter || statusFilter || categoryFilter
    || dateRange.start?.getTime() !== defaultRange.start?.getTime()
    || dateRange.end?.getTime() !== defaultRange.end?.getTime();

  const headerActions = (
    <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <SearchField
        value={searchInput}
        onChange={setSearchInput}
        placeholder="Buscar por template..."
      />
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
        disabled={!appFilter}
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
      <DateRangeField
        value={dateRange}
        onChange={setDateRange}
        label="Período"
        size="small"
        sx={{ minWidth: 220 }}
      />
      {hasFilters && (
        <Button size="small" onClick={handleClearFilters}>
          Limpar filtros
        </Button>
      )}
    </Box>
  );

  const actions = [
    {
      icon: <DownloadIcon fontSize="small" />,
      tooltip: 'Baixar',
      onClick: (r: GeneratedReport) => handleDownload(r),
      color: 'primary',
      hidden: (r: GeneratedReport) => r.status !== 'COMPLETED',
    },
  ];

  return (
    <DataGrid<GeneratedReport>
      data={reports}
      columns={columns}
      getRowId={(row) => row.publicId}
      pageSize={pageSize}
      headerActions={headerActions}
      actions={actions}
      emptyMessage="Nenhum relatório encontrado"
      loading={loading}
      serverSidePagination
      page={currentPage}
      totalRows={totalItems}
      onPageChange={setCurrentPage}
      onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
    />
  );
};

export default ReportsPage;
