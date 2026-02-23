import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Chip,
  MenuItem as MuiMenuItem,
  TextField,
  Box,
  Typography,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Pets as PetsIcon,
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  MedicalServices as MedicalIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { DataGrid, SearchField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { useSearchDebounce, formatDateTime } from '@app/core';
import { atendimentoService } from '../services';
import type { ClinicalVisit, ClinicalVisitStatus, ClinicalVisitType, SearchRequest } from '../types';

const STATUS_CONFIG: Record<ClinicalVisitStatus, { label: string; color: string }> = {
  OPEN: { label: 'Aberto', color: '#7EB3E0' },
  IN_PROGRESS: { label: 'Em andamento', color: '#F48FB1' },
  COMPLETED: { label: 'Concluído', color: '#81C9C5' },
  CANCELLED: { label: 'Cancelado', color: '#BDBDBD' },
};

const TYPE_LABELS: Record<ClinicalVisitType, string> = {
  CONSULTATION: 'Consulta',
  HOSPITALIZATION: 'Internação',
  FOLLOW_UP: 'Retorno',
  EMERGENCY: 'Emergência',
};

const AtendimentosPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { petId?: string; petName?: string } | null;

  const [visits, setVisits] = useState<ClinicalVisit[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const { debouncedValue: searchTerm, inputValue: searchInput, setInputValue: setSearchInput } = useSearchDebounce('', 500);

  const [sortField, setSortField] = useState('startedAt');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

  const [statusFilter, setStatusFilter] = useState('');
  const [petIdFilter, setPetIdFilter] = useState(locationState?.petId || '');
  const [petNameFilter, setPetNameFilter] = useState(locationState?.petName || '');

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchVisits = useCallback(async () => {
    try {
      setLoading(true);
      const where: Record<string, unknown> = {};

      if (searchTerm.trim()) {
        where.chiefComplaint = { contains: searchTerm.trim() };
      }
      if (statusFilter) where.status = statusFilter;
      if (petIdFilter) where.petId = petIdFilter;

      const searchRequest: SearchRequest = {
        where,
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        sort: [{ field: sortField, direction: sortDirection }],
      };

      const response = await atendimentoService.search(searchRequest);
      if (response?.data) {
        setVisits(response.data);
        setTotalItems(response.total || 0);
      } else {
        setVisits([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar atendimentos:', error);
      setVisits([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortField, sortDirection, statusFilter, petIdFilter]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const columns: DataGridColumn<ClinicalVisit>[] = [
    {
      key: 'startedAt',
      header: 'Data',
      sortable: true,
      render: (v) => formatDateTime(v.startedAt || v.createdAt),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (v) => (
        <Chip label={TYPE_LABELS[v.type] || v.type} size="small" variant="outlined" />
      ),
    },
    {
      key: 'petName',
      header: 'Pet',
      render: (v) => v.petName ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <PetsIcon sx={{ fontSize: 14, color: '#9C72D9', opacity: 0.7 }} />
          <Typography variant="body2" sx={{ fontSize: '0.84rem' }}>{v.petName}</Typography>
        </Box>
      ) : <Typography variant="body2" color="text.disabled">-</Typography>,
    },
    {
      key: 'customerName',
      header: 'Tutor',
      render: (v) => v.customerName ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <PersonIcon sx={{ fontSize: 14, color: '#7EB3E0', opacity: 0.7 }} />
          <Typography variant="body2" sx={{ fontSize: '0.84rem' }}>{v.customerName}</Typography>
        </Box>
      ) : <Typography variant="body2" color="text.disabled">-</Typography>,
    },
    {
      key: 'veterinarianName',
      header: 'Veterinário',
      render: (v) => v.veterinarianName ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <MedicalIcon sx={{ fontSize: 14, color: '#81C9C5', opacity: 0.7 }} />
          <Typography variant="body2" sx={{ fontSize: '0.84rem' }}>{v.veterinarianName}</Typography>
        </Box>
      ) : <Typography variant="body2" color="text.disabled">-</Typography>,
    },
    {
      key: 'chiefComplaint',
      header: 'Queixa',
      render: (v) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }} noWrap>{v.chiefComplaint || '-'}</Typography>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (v) => {
        const config = v.status ? STATUS_CONFIG[v.status] : null;
        return config ? (
          <Chip
            label={config.label}
            size="small"
            sx={{
              backgroundColor: config.color + '14',
              color: config.color,
              fontWeight: 600,
              ...((v.status === 'OPEN' || v.status === 'IN_PROGRESS') && {
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.6 },
                },
              }),
            }}
          />
        ) : '-';
      },
    },
  ];

  const headerActions = (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
      {petNameFilter && (
        <Chip
          label={`Pet: ${petNameFilter}`}
          onDelete={() => { setPetIdFilter(''); setPetNameFilter(''); setCurrentPage(1); }}
          size="small"
          sx={{ fontWeight: 600, backgroundColor: '#9C72D914', color: '#9C72D9' }}
        />
      )}
      <SearchField value={searchInput} onChange={setSearchInput} placeholder="Buscar atendimentos..." />
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
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/atendimentos/novo')}>
        Novo Atendimento
      </Button>
    </Box>
  );

  const actions = [
    {
      icon: <ViewIcon fontSize="small" />,
      tooltip: 'Ver',
      onClick: (v: ClinicalVisit) => navigate(`/atendimentos/${v.publicId}`),
      color: 'primary',
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box sx={{ width: 48, height: 48, borderRadius: 2.5, background: 'linear-gradient(135deg, #F48FB1 0%, #E57399 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 14px rgba(244, 143, 177, 0.35)', flexShrink: 0 }}>
          <HospitalIcon />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>Atendimentos</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>Consultas e atendimentos clínicos</Typography>
        </Box>
      </Box>

      <DataGrid<ClinicalVisit>
        data={visits}
        columns={columns}
        getRowId={(row) => row.publicId || ''}
        pageSize={pageSize}
        headerActions={headerActions}
        actions={actions}
        emptyMessage="Nenhum atendimento encontrado"
        loading={loading}
        onRefresh={fetchVisits}
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
        sx={{ borderRadius: 3, overflow: 'hidden' }}
      />
    </Box>
  );
};

export default AtendimentosPage;
