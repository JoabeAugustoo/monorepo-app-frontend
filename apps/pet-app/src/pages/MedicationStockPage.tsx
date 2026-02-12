import { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  Box,
  Button,
  Typography,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as BackIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { DataGrid, FormDialog } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { stockBatchService, medicationService } from '../services';
import type { StockBatch, StockBatchDto, Medication, SearchRequest } from '../types';

const MedicationStockPage = () => {
  const { id: medicationId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [medication, setMedication] = useState<Medication | null>(null);
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [expiringBatches, setExpiringBatches] = useState<StockBatch[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

  const [formData, setFormData] = useState({
    batchNumber: '',
    quantity: '',
    unitCost: '',
    expirationDate: '',
  });

  useEffect(() => {
    if (medicationId) {
      medicationService.getById(medicationId).then(setMedication).catch(() => {});
      stockBatchService.getExpiring(30).then((data) => {
        setExpiringBatches(data.filter(b => b.medicationId === medicationId));
      }).catch(() => {});
    }
  }, [medicationId]);

  const fetchBatches = useCallback(async () => {
    if (!medicationId) return;
    try {
      setLoading(true);
      const searchRequest: SearchRequest = {
        where: { medicationId },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        sort: [{ field: sortField, direction: sortDirection }],
      };

      const response = await stockBatchService.search(searchRequest);
      if (response?.data) {
        setBatches(response.data);
        setTotalItems(response.total || 0);
      } else {
        setBatches([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar lotes:', error);
      setBatches([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [medicationId, currentPage, pageSize, sortField, sortDirection]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleAddNew = () => {
    setFormData({ batchNumber: '', quantity: '', unitCost: '', expirationDate: '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicationId) return;
    try {
      setLoading(true);
      const data: StockBatchDto = {
        medicationId,
        batchNumber: formData.batchNumber,
        quantity: parseFloat(formData.quantity),
        unitCost: parseFloat(formData.unitCost),
        expirationDate: formData.expirationDate,
      };
      await stockBatchService.create(data);
      toast.success('Lote criado com sucesso!');
      setShowForm(false);
      setCurrentPage(1);
      fetchBatches();
    } catch (error) {
      console.error('Erro ao salvar lote:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value?: number) => {
    if (value == null) return '-';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const isExpiringSoon = (date?: string) => {
    if (!date) return false;
    const exp = new Date(date);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 30);
    return exp <= threshold;
  };

  const columns: DataGridColumn<StockBatch>[] = [
    {
      key: 'batchNumber',
      header: 'Nº Lote',
      sortable: true,
      render: (batch) => (
        <div style={{ fontWeight: '600', color: '#111827' }}>{batch.batchNumber}</div>
      ),
    },
    {
      key: 'quantity',
      header: 'Qtd Atual / Inicial',
      render: (batch) => `${batch.quantity} / ${batch.initialQuantity}`,
    },
    {
      key: 'unitCost',
      header: 'Custo Unit.',
      render: (batch) => formatCurrency(batch.unitCost),
    },
    {
      key: 'entryDate',
      header: 'Data Entrada',
      sortable: true,
      render: (batch) => formatDate(batch.entryDate),
    },
    {
      key: 'expirationDate',
      header: 'Validade',
      sortable: true,
      render: (batch) => {
        const expiring = isExpiringSoon(batch.expirationDate);
        return (
          <Typography
            variant="body2"
            sx={{ color: expiring ? '#d32f2f' : 'inherit', fontWeight: expiring ? 700 : 400 }}
          >
            {formatDate(batch.expirationDate)}
            {expiring && <WarningIcon sx={{ fontSize: 14, ml: 0.5, verticalAlign: 'middle' }} />}
          </Typography>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (batch) => (
        <Chip
          label={batch.status || 'AVAILABLE'}
          size="small"
          color={batch.status === 'AVAILABLE' ? 'success' : batch.status === 'EXPIRED' ? 'error' : 'default'}
          variant="outlined"
        />
      ),
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button variant="outlined" startIcon={<BackIcon />} onClick={() => navigate('/medicamentos')}>
        Voltar
      </Button>
      <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}>
        Novo Lote
      </Button>
    </div>
  );

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Estoque: {medication?.name || '...'}
        </Typography>
        {medication && (
          <Typography variant="body2" color="text.secondary">
            Tipo: {medication.type} | Estoque atual: {medication.currentStock ?? 0} | Mínimo: {medication.minimumStock}
          </Typography>
        )}
      </Box>

      {expiringBatches.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }} icon={<WarningIcon />}>
          {expiringBatches.length} lote(s) vencendo nos próximos 30 dias!
        </Alert>
      )}

      <DataGrid<StockBatch>
        data={batches}
        columns={columns}
        getRowId={(row) => row.publicId || ''}
        pageSize={pageSize}
        headerActions={headerActions}
        emptyMessage="Nenhum lote encontrado"
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

      <FormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        title="Novo Lote"
        titleIcon={<InventoryIcon sx={{ color: '#9C72D9' }} />}
        submitLabel={loading ? 'Salvando...' : 'Criar'}
        loading={loading}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField fullWidth label="Número do Lote *" value={formData.batchNumber} onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })} required />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField fullWidth label="Quantidade *" type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required slotProps={{ input: { inputProps: { min: '1' } } }} />
            <TextField fullWidth label="Custo Unitário *" type="number" value={formData.unitCost} onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })} required slotProps={{ input: { inputProps: { min: '0', step: '0.01' } } }} />
          </Box>
          <TextField
            fullWidth
            label="Data de Validade *"
            type="date"
            value={formData.expirationDate}
            onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
      </FormDialog>
    </>
  );
};

export default MedicationStockPage;
