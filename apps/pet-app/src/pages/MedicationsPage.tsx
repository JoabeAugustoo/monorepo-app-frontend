import { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  Box,
  Button,
  Typography,
  Chip,
  MenuItem as MuiMenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Medication as MedicationIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { DataGrid, FormDialog, SearchField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { medicationService } from '../services';
import type { Medication, MedicationDto, MedicationType, SearchRequest } from '../types';

const TYPE_LABELS: Record<MedicationType, string> = {
  INTERNAL: 'Interno',
  EXTERNAL: 'Externo',
  CONTROLLED: 'Controlado',
};

interface MedicationFormData {
  name: string;
  type: MedicationType | '';
  defaultDosage: string;
  manufacturer: string;
  description: string;
  minimumStock: string;
}

const initialFormData: MedicationFormData = {
  name: '', type: '', defaultDosage: '', manufacturer: '', description: '', minimumStock: '0',
};

const MedicationsPage = () => {
  const navigate = useNavigate();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MedicationFormData>(initialFormData);

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

  const handleEdit = (med: Medication) => {
    setEditingMed(med);
    setFormData({
      name: med.name || '',
      type: med.type || '',
      defaultDosage: med.defaultDosage || '',
      manufacturer: med.manufacturer || '',
      description: med.description || '',
      minimumStock: med.minimumStock?.toString() || '0',
    });
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingMed(null);
    setFormData(initialFormData);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data: MedicationDto = {
        name: formData.name,
        type: formData.type as MedicationType,
        defaultDosage: formData.defaultDosage || undefined,
        manufacturer: formData.manufacturer || undefined,
        description: formData.description || undefined,
        minimumStock: formData.minimumStock ? parseInt(formData.minimumStock) : undefined,
      };

      if (editingMed?.publicId) {
        await medicationService.update(editingMed.publicId, data);
        toast.success('Medicamento atualizado com sucesso!');
      } else {
        await medicationService.create(data);
        toast.success('Medicamento criado com sucesso!');
      }

      setShowForm(false);
      setCurrentPage(1);
      fetchMedications();
    } catch (error) {
      console.error('Erro ao salvar medicamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: DataGridColumn<Medication>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (med) => (
        <div style={{ fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MedicationIcon sx={{ fontSize: 16, color: '#6b7280' }} />
          {med.name}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (med) => med.type ? (
        <Chip label={TYPE_LABELS[med.type] || med.type} size="small" variant="outlined" />
      ) : '-',
    },
    { key: 'manufacturer', header: 'Fabricante', render: (med) => med.manufacturer || '-' },
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
      <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}>
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
      onClick: (med: Medication) => handleEdit(med),
      color: 'primary',
    },
  ];

  return (
    <>
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
      />

      <FormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        title={editingMed ? 'Editar Medicamento' : 'Novo Medicamento'}
        titleIcon={<MedicationIcon sx={{ color: '#9C72D9' }} />}
        submitLabel={loading ? 'Salvando...' : editingMed ? 'Atualizar' : 'Criar'}
        loading={loading}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField fullWidth label="Nome *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <TextField
            fullWidth
            select
            label="Tipo *"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as MedicationType | '' })}
          >
            <MuiMenuItem value="">Selecione...</MuiMenuItem>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <MuiMenuItem key={value} value={value}>{label}</MuiMenuItem>
            ))}
          </TextField>
          <TextField fullWidth label="Dosagem Padrão" value={formData.defaultDosage} onChange={(e) => setFormData({ ...formData, defaultDosage: e.target.value })} />
          <TextField fullWidth label="Fabricante" value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} />
          <TextField fullWidth label="Descrição" multiline rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          <TextField fullWidth label="Estoque Mínimo" type="number" value={formData.minimumStock} onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })} slotProps={{ input: { inputProps: { min: '0' } } }} />
        </Box>
      </FormDialog>
    </>
  );
};

export default MedicationsPage;
