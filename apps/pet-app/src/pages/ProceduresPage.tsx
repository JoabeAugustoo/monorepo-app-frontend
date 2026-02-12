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
  MedicalServices as MedicalIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DataGrid, SearchField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { medicalProcedureService } from '../services';
import type { MedicalProcedure, ProcedureStatus, ProcedureType, SearchRequest } from '../types';

const STATUS_CONFIG: Record<ProcedureStatus, { label: string; color: string }> = {
  SCHEDULED: { label: 'Agendado', color: '#7EB3E0' },
  IN_PROGRESS: { label: 'Em andamento', color: '#F48FB1' },
  COMPLETED: { label: 'Concluído', color: '#81C9C5' },
  CANCELLED: { label: 'Cancelado', color: '#BDBDBD' },
};

const TYPE_LABELS: Record<ProcedureType, string> = {
  CONSULTATION: 'Consulta',
  SURGERY: 'Cirurgia',
  EXAM: 'Exame',
  VACCINATION: 'Vacinação',
  GROOMING: 'Banho/Tosa',
  OTHER: 'Outro',
};

const ProceduresPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const petIdFilter = searchParams.get('petId');

  const [procedures, setProcedures] = useState<MedicalProcedure[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  const fetchProcedures = useCallback(async () => {
    try {
      setLoading(true);
      const where: Record<string, unknown> = {};

      if (searchTerm.trim()) {
        where.description = { contains: searchTerm.trim() };
      }
      if (statusFilter) where.status = statusFilter;
      if (typeFilter) where.type = typeFilter;
      if (petIdFilter) where.petId = petIdFilter;

      const searchRequest: SearchRequest = {
        where,
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        sort: [{ field: sortField, direction: sortDirection }],
      };

      const response = await medicalProcedureService.search(searchRequest);
      if (response?.data) {
        setProcedures(response.data);
        setTotalItems(response.total || 0);
      } else {
        setProcedures([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar procedimentos:', error);
      setProcedures([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortField, sortDirection, statusFilter, typeFilter, petIdFilter]);

  useEffect(() => {
    fetchProcedures();
  }, [fetchProcedures]);

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value?: number) => {
    if (value == null) return '-';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const columns: DataGridColumn<MedicalProcedure>[] = [
    {
      key: 'date',
      header: 'Data',
      sortable: true,
      render: (proc) => formatDate(proc.date),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (proc) => (
        <Chip label={TYPE_LABELS[proc.type] || proc.type} size="small" variant="outlined" />
      ),
    },
    {
      key: 'petName',
      header: 'Pet',
      render: (proc) => proc.petName || '-',
    },
    {
      key: 'veterinarianName',
      header: 'Veterinário',
      render: (proc) => proc.veterinarianName || '-',
    },
    {
      key: 'status',
      header: 'Status',
      render: (proc) => {
        const config = proc.status ? STATUS_CONFIG[proc.status] : null;
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
      key: 'cost',
      header: 'Custo',
      sortable: true,
      render: (proc) => formatCurrency(proc.cost),
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <SearchField value={searchInput} onChange={setSearchInput} placeholder="Buscar procedimentos..." />
      <TextField
        select
        size="small"
        label="Status"
        value={statusFilter}
        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
        sx={{ minWidth: 140 }}
      >
        <MuiMenuItem value="">Todos</MuiMenuItem>
        {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
          <MuiMenuItem key={value} value={value}>{label}</MuiMenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Tipo"
        value={typeFilter}
        onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
        sx={{ minWidth: 140 }}
      >
        <MuiMenuItem value="">Todos</MuiMenuItem>
        {Object.entries(TYPE_LABELS).map(([value, label]) => (
          <MuiMenuItem key={value} value={value}>{label}</MuiMenuItem>
        ))}
      </TextField>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/procedimentos/novo')}>
        Novo Procedimento
      </Button>
    </div>
  );

  const actions = [
    {
      icon: <ViewIcon fontSize="small" />,
      tooltip: 'Detalhes',
      onClick: (proc: MedicalProcedure) => navigate(`/procedimentos/${proc.publicId}`),
      color: 'primary',
    },
  ];

  return (
    <DataGrid<MedicalProcedure>
      data={procedures}
      columns={columns}
      getRowId={(row) => row.publicId || ''}
      pageSize={pageSize}
      headerActions={headerActions}
      actions={actions}
      emptyMessage="Nenhum procedimento encontrado"
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

export default ProceduresPage;
