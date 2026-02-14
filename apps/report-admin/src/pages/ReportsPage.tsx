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
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { DataGrid, SearchField, DateRangeField } from '@app/ui';
import type { DataGridColumn, DateRange } from '@app/ui';
import { useSearchDebounce, formatDateTime } from '@app/core';
import { reportService } from '../services';
import type { GeneratedReport, SearchRequest } from '../types';
import { toast } from 'sonner';

const FORMAT_COLORS: Record<string, string> = {
  pdf: '#EF4444',
  html: '#2563EB',
  csv: '#22C55E',
  xlsx: '#16A34A',
  json: '#F59E0B',
};

const ReportsPage = () => {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const { debouncedValue: searchTerm, inputValue: searchInput, setInputValue: setSearchInput } = useSearchDebounce('', 500);

  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

  const [appFilter, setAppFilter] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });

  // Collect unique app names for filter
  const [appNames, setAppNames] = useState<string[]>([]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, appFilter, dateRange]);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const where: Record<string, unknown> = {};

      if (searchTerm.trim()) {
        where.templateKey = { contains: searchTerm.trim() };
      }
      if (appFilter) {
        where.applicationName = appFilter;
      }
      if (dateRange.start) {
        where.createdAt = {
          ...(typeof where.createdAt === 'object' && where.createdAt !== null ? where.createdAt as Record<string, unknown> : {}),
          gte: dateRange.start.toISOString(),
        };
      }
      if (dateRange.end) {
        const endOfDay = new Date(dateRange.end);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt = {
          ...(typeof where.createdAt === 'object' && where.createdAt !== null ? where.createdAt as Record<string, unknown> : {}),
          lte: endOfDay.toISOString(),
        };
      }

      const searchRequest: SearchRequest = {
        where,
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        sort: [{ field: sortField, direction: sortDirection }],
      };

      const response = await reportService.search(searchRequest);
      if (response?.data) {
        setReports(response.data);
        setTotalItems(response.total || 0);

        // Collect unique app names
        const names = new Set(appNames);
        response.data.forEach((r) => {
          if (r.applicationName) names.add(r.applicationName);
        });
        setAppNames(Array.from(names).sort());
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
  }, [currentPage, pageSize, searchTerm, sortField, sortDirection, appFilter, dateRange]);

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
      sortable: true,
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
      sortable: true,
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
      key: 'version',
      header: 'Versão',
      render: (r) => `v${r.version}`,
    },
    {
      key: 'format',
      header: 'Formato',
      render: (r) => {
        const fmt = (r.format || r.contentType?.split('/').pop() || '').toUpperCase();
        const color = FORMAT_COLORS[(r.format || '').toLowerCase()] || '#6B7280';
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
      sortable: true,
      render: (r) => formatDateTime(r.createdAt),
    },
  ];

  const handleClearFilters = () => {
    setSearchInput('');
    setAppFilter('');
    setDateRange({ start: null, end: null });
  };

  const hasFilters = searchInput || appFilter || dateRange.start || dateRange.end;

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
        {appNames.map((name) => (
          <MuiMenuItem key={name} value={name}>{name}</MuiMenuItem>
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
      sortField={sortField}
      sortDirection={sortDirection === 'ASC' ? 'asc' : 'desc'}
      onSortChange={(field, direction) => {
        setSortField(field);
        setSortDirection(direction === 'asc' ? 'ASC' : 'DESC');
        setCurrentPage(1);
      }}
    />
  );
};

export default ReportsPage;
