import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Chip,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Medication as MedicationIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DataGrid, SearchField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { medicationService } from '../services';
import type { Medication, MedicationType, SearchRequest } from '../types';

const TYPE_LABELS: Record<MedicationType, string> = {
  INTERNAL: 'Interno',
  EXTERNAL: 'Externo',
  CONTROLLED: 'Controlado',
};

const MedicationsPage = () => {
  const navigate = useNavigate();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  const fetchMedications = useCallback(async () => {
    try {
      setLoading(true);

      if (lowStockFilter) {
        const data = await medicationService.getLowStock();
        setMedications(data);
        setTotalItems(data.length);
        return;
      }

      const searchRequest: SearchRequest = {
        where: {},
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        sort: [{ field: sortField, direction: sortDirection }],
      };

      if (searchTerm.trim()) {
        searchRequest.where = { name: { contains: searchTerm.trim() } };
      }

      const response = await medicationService.search(searchRequest);
      if (response?.data) {
        setMedications(response.data);
        setTotalItems(response.total || 0);
      } else {
        setMedications([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar medicamentos:', error);
      setMedications([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortField, sortDirection, lowStockFilter]);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  const columns: DataGridColumn<Medication>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (med) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.25 }}>
          <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: alpha('#9C72D9', 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MedicationIcon sx={{ fontSize: 16, color: '#9C72D9' }} />
          </Box>
          <Typography variant="body2" fontWeight={600} color="text.primary">{med.name}</Typography>
        </Box>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (med) => med.type ? (
        <Chip label={TYPE_LABELS[med.type] || med.type} size="small" variant="outlined" />
      ) : '-',
    },
    { key: 'manufacturer', header: 'Fabricante', render: (med) => (
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>{med.manufacturer || '-'}</Typography>
    ) },
    {
      key: 'currentStock',
      header: 'Estoque Atual',
      sortable: true,
      render: (med) => {
        const isLow = (med.currentStock ?? 0) < med.minimumStock;
        return (
          <Typography
            variant="body2"
            sx={{ color: isLow ? '#d32f2f' : 'inherit', fontWeight: isLow ? 700 : 400 }}
          >
            {med.currentStock ?? 0}
            {isLow && <WarningIcon sx={{ fontSize: 14, ml: 0.5, verticalAlign: 'middle' }} />}
          </Typography>
        );
      },
    },
    {
      key: 'minimumStock',
      header: 'Estoque Mínimo',
      render: (med) => med.minimumStock ?? 0,
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <SearchField value={searchInput} onChange={setSearchInput} placeholder="Buscar medicamentos..." />
      <Button
        variant={lowStockFilter ? 'contained' : 'outlined'}
        color="warning"
        size="small"
        startIcon={<WarningIcon />}
        onClick={() => { setLowStockFilter(!lowStockFilter); setCurrentPage(1); }}
      >
        Estoque baixo
      </Button>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/medicamentos/novo')}>
        Novo Medicamento
      </Button>
    </div>
  );

  const actions = [
    {
      icon: <InventoryIcon fontSize="small" />,
      tooltip: 'Estoque',
      onClick: (med: Medication) => navigate(`/medicamentos/${med.publicId}/estoque`),
      color: 'info',
    },
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Editar',
      onClick: (med: Medication) => navigate(`/medicamentos/${med.publicId}/editar`),
      color: 'primary',
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box sx={{ width: 48, height: 48, borderRadius: 2.5, background: 'linear-gradient(135deg, #9C72D9 0%, #7B5BBF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 14px rgba(156, 114, 217, 0.35)', flexShrink: 0 }}>
          <MedicationIcon />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>Medicamentos</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>Controle de medicamentos e estoque</Typography>
        </Box>
      </Box>

      <DataGrid<Medication>
        data={medications}
        columns={columns}
        getRowId={(row) => row.publicId || ''}
        pageSize={pageSize}
        headerActions={headerActions}
        actions={actions}
        emptyMessage="Nenhum medicamento cadastrado"
        loading={loading}
        onRefresh={fetchMedications}
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

export default MedicationsPage;
