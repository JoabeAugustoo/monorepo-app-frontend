import { useState, useEffect, useCallback } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ShoppingBag as ShoppingBagIcon,
  Inventory as PackageIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { DataGrid, CurrencyField, FormDialog, ConfirmDialog, StatusChip, SearchField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { purchaseService, productService } from '../services';
import { useRefresh } from '../contexts/RefreshContext';
import { usePermissions } from '../hooks/usePermissions';
import { formatCurrency } from '../utils/i18n';
import type { Purchase, Product, SearchRequest } from '../types';

interface PurchaseFormData {
  productId: string;
  quantity: string;
  unit_price: string;
  total_price: string;
  date: string;
  paymentType: boolean; // true = A Vista, false = A Prazo
}

const initialFormData: PurchaseFormData = {
  productId: '',
  quantity: '',
  unit_price: '',
  total_price: '',
  date: new Date().toISOString().split('T')[0],
  paymentType: true,
};

const formatPaymentType = (paymentType: string | boolean | number | undefined): string => {
  if (typeof paymentType === 'string') {
    return paymentType === 'A_VISTA' ? 'A Vista' : 'A Prazo';
  }
  const isVista = paymentType === true || paymentType === 1;
  return isVista ? 'A Vista' : 'A Prazo';
};

const isPaymentVista = (paymentType: string | boolean | number | undefined): boolean => {
  if (typeof paymentType === 'string') {
    return paymentType === 'A_VISTA';
  }
  return paymentType === true || paymentType === 1;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const PurchasesPage = () => {
  const { triggerMultipleRefresh } = useRefresh();
  const { canWritePurchases } = usePermissions();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedPurchases, setSelectedPurchases] = useState<(string | number)[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PurchaseFormData>(initialFormData);

  // Active products for the dropdown
  const [activeProducts, setActiveProducts] = useState<Product[]>([]);

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  const [isInactivating, setIsInactivating] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Sort
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

  // Debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  // Fetch active products on mount
  useEffect(() => {
    const fetchActiveProducts = async () => {
      try {
        const products = await productService.getActiveProducts();
        setActiveProducts(products || []);
      } catch (error) {
        console.error('Erro ao carregar produtos ativos:', error);
        setActiveProducts([]);
      }
    };
    fetchActiveProducts();
  }, []);

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);

      const searchRequest: SearchRequest = {
        where: {},
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        sort: [{ field: sortField, direction: sortDirection }],
      };

      if (searchTerm.trim()) {
        searchRequest.where = { productName: { contains: searchTerm.trim() } };
      }

      const response = await purchaseService.searchPurchases(searchRequest);

      if (response?.data) {
        setPurchases(response.data);
        setTotalItems(response.total || 0);
      } else {
        setPurchases([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar compras:', error);
      setPurchases([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortField, sortDirection]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleProductChange = (productId: string) => {
    const selectedProduct = activeProducts.find((p) => p.publicId === productId);
    const newFormData: PurchaseFormData = {
      ...formData,
      productId,
      unit_price: selectedProduct ? selectedProduct.price.toString() : '',
    };

    if (newFormData.quantity && selectedProduct) {
      newFormData.total_price = (parseFloat(newFormData.quantity) * selectedProduct.price).toString();
    }

    setFormData(newFormData);
  };

  const handleQuantityChange = (quantity: string) => {
    const selectedProduct = activeProducts.find((p) => p.publicId === formData.productId);
    const newFormData: PurchaseFormData = {
      ...formData,
      quantity,
    };

    if (selectedProduct && quantity) {
      newFormData.total_price = (parseFloat(quantity) * selectedProduct.price).toString();
    } else {
      newFormData.total_price = '';
    }

    setFormData(newFormData);
  };

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setFormData({
      productId: purchase.productPublicId || '',
      quantity: (purchase.quantity ?? '').toString(),
      unit_price: (purchase.unitPrice ?? '').toString(),
      total_price: (purchase.totalPrice ?? '').toString(),
      date: purchase.date || new Date().toISOString().split('T')[0],
      paymentType: purchase.paymentType !== undefined
        ? isPaymentVista(purchase.paymentType)
        : true,
    });
    setShowForm(true);
  };

  const handleDelete = (purchase: Purchase) => {
    setPurchaseToDelete(purchase);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!purchaseToDelete?.publicId) return;

    try {
      setIsInactivating(true);
      await purchaseService.softDeletePurchase(purchaseToDelete.publicId);
      const productName = purchaseToDelete.productName || 'Produto';
      toast.success(`Compra "${productName}" foi inativada com sucesso!`);
      setShowDeleteModal(false);
      setPurchaseToDelete(null);
      fetchPurchases();
    } catch (error) {
      console.error('Erro ao inativar compra:', error);
    } finally {
      setIsInactivating(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPurchaseToDelete(null);
  };

  const handleBulkDelete = async () => {
    if (selectedPurchases.length === 0) return;

    const count = selectedPurchases.length;
    if (window.confirm(`Tem certeza que deseja inativar ${count} compra${count > 1 ? 's' : ''}?`)) {
      try {
        await Promise.all(
          selectedPurchases.map((publicId) => purchaseService.softDeletePurchase(String(publicId)))
        );
        toast.success(`${count} compra${count > 1 ? 's inativadas' : ' inativada'} com sucesso!`);
        setSelectedPurchases([]);
        fetchPurchases();
      } catch (error) {
        console.error('Erro ao inativar compras:', error);
      }
    }
  };

  const handleAddNew = () => {
    setEditingPurchase(null);
    setFormData(initialFormData);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const purchaseData: Partial<Purchase> = {
        productPublicId: formData.productId,
        quantity: parseInt(formData.quantity, 10),
        unitPrice: parseFloat(formData.unit_price),
        date: formData.date,
        paymentType: formData.paymentType ? 'CASH' : 'CREDIT',
      };

      if (editingPurchase?.publicId) {
        await purchaseService.updatePurchase(editingPurchase.publicId, purchaseData);
        toast.success('Compra atualizada com sucesso!');
      } else {
        await purchaseService.createPurchase(purchaseData);
        toast.success('Compra criada com sucesso!');
      }

      triggerMultipleRefresh(['products', 'purchases']);
      setShowForm(false);
      setCurrentPage(1);
      fetchPurchases();
    } catch (error) {
      console.error('Erro ao salvar compra:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const columns: DataGridColumn<Purchase>[] = [
    {
      key: 'productName',
      header: 'Produto',
      render: (purchase: Purchase) => {
        const productName = purchase.productName || 'Produto nao encontrado';
        return (
          <div>
            <div style={{ fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PackageIcon sx={{ fontSize: 16, color: '#6b7280' }} />
              {productName}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CalendarIcon sx={{ fontSize: 12, color: '#6b7280' }} />
              {purchase.date ? formatDate(purchase.date) : '-'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'quantity',
      header: 'Quantidade',
      render: (purchase: Purchase) => (
        <div>
          <div style={{ fontWeight: '600', color: '#111827' }}>{purchase.quantity} un.</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {formatCurrency(purchase.unitPrice || 0)} / un.
          </div>
        </div>
      ),
    },
    {
      key: 'paymentType',
      header: 'Pagamento',
      render: (purchase: Purchase) => {
        const paymentType = purchase.paymentType;
        const isVista = isPaymentVista(paymentType);

        return (
          <span
            style={{
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: isVista ? '#dcfce7' : '#fef3c7',
              color: isVista ? '#166534' : '#92400e',
            }}
          >
            {formatPaymentType(paymentType)}
          </span>
        );
      },
    },
    {
      key: 'totalPrice',
      header: 'Valor Total',
      render: (purchase: Purchase) => (
        <span style={{ fontWeight: '600', color: '#059669' }}>
          {formatCurrency(purchase.totalPrice || 0)}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      render: (purchase: Purchase) => <StatusChip active={purchase.active ?? null} />,
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <SearchField
        value={searchInput}
        onChange={setSearchInput}
        placeholder="Buscar compras..."
      />

      {canWritePurchases && selectedPurchases.length > 0 && (
        <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleBulkDelete}>
          Inativar Selecionadas ({selectedPurchases.length})
        </Button>
      )}

      {canWritePurchases && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddNew}
        >
          Nova Compra
        </Button>
      )}
    </div>
  );

  const actions = canWritePurchases
    ? [
        {
          icon: <EditIcon fontSize="small" />,
          tooltip: 'Editar',
          onClick: (purchase: Purchase) => handleEdit(purchase),
          color: 'primary',
        },
        {
          icon: <DeleteIcon fontSize="small" />,
          tooltip: 'Inativar',
          onClick: (purchase: Purchase) => handleDelete(purchase),
          color: 'error',
        },
      ]
    : undefined;

  return (
    <>
      <DataGrid<Purchase>
        data={purchases}
        columns={columns}
        getRowId={(row) => row.publicId || row.id || ''}
        pageSize={pageSize}
        selectable={canWritePurchases}
        headerActions={headerActions}
        actions={actions}
        emptyMessage="Nenhuma compra cadastrada"
        onSelectionChange={setSelectedPurchases}
        loading={loading}
        serverSidePagination
        page={currentPage}
        totalRows={totalItems}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        sortField={sortField}
        sortDirection={sortDirection === 'ASC' ? 'asc' : 'desc'}
        onSortChange={(field, direction) => {
          setSortField(field);
          setSortDirection(direction === 'asc' ? 'ASC' : 'DESC');
          setCurrentPage(1);
        }}
      />

      {/* Form Dialog */}
      <FormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        title={editingPurchase ? 'Editar Compra' : 'Nova Compra'}
        titleIcon={<ShoppingBagIcon sx={{ color: '#059669' }} />}
        submitLabel={loading ? 'Salvando...' : editingPurchase ? 'Atualizar' : 'Criar'}
        loading={loading}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          {/* Product Selection */}
          <FormControl fullWidth>
            <InputLabel>Produto</InputLabel>
            <Select
              value={formData.productId}
              label="Produto"
              onChange={(e) => handleProductChange(e.target.value as string)}
              required
            >
              {activeProducts.map((product) => (
                <MenuItem key={product.publicId} value={product.publicId}>
                  {product.name} - {formatCurrency(product.price)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Quantity */}
          <TextField
            fullWidth
            label="Quantidade"
            type="number"
            value={formData.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            required
          />

          {/* Unit Price (read-only) */}
          <CurrencyField
            fullWidth
            label="Preco Unitario"
            value={parseFloat(formData.unit_price) || 0}
            onChange={(_value: number) => {}}
            disabled
            helperText="Preco carregado automaticamente do produto selecionado"
          />

          {/* Total Price (read-only) */}
          <CurrencyField
            fullWidth
            label="Valor Total"
            value={parseFloat(formData.total_price) || 0}
            onChange={(_value: number) => {}}
            disabled
            helperText="Calculado automaticamente: Quantidade x Preco Unitario"
          />

          {/* Purchase Date */}
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
            <DatePicker
              label="Data da Compra"
              value={formData.date ? new Date(formData.date + 'T12:00:00') : null}
              onChange={(newDate: Date | null) => {
                if (newDate) {
                  const year = newDate.getFullYear();
                  const month = String(newDate.getMonth() + 1).padStart(2, '0');
                  const day = String(newDate.getDate()).padStart(2, '0');
                  setFormData({ ...formData, date: `${year}-${month}-${day}` });
                }
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                },
              }}
            />
          </LocalizationProvider>

          {/* Payment Type */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              backgroundColor: '#fafafa',
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Tipo de Pagamento:
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.paymentType}
                  onChange={(e) => setFormData({ ...formData, paymentType: e.target.checked })}
                  color="primary"
                />
              }
              label={formData.paymentType ? 'A Vista' : 'A Prazo'}
              labelPlacement="end"
            />
          </Box>
        </Box>
      </FormDialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Confirmar Inativacao"
        titleIcon={<DeleteIcon sx={{ color: '#ef4444' }} />}
        message="Tem certeza que deseja inativar esta compra?"
        confirmLabel="Inativar Compra"
        confirmIcon={<DeleteIcon />}
        loading={isInactivating}
        loadingLabel="Inativando..."
        footer="A compra sera marcada como inativa e nao aparecera mais nas listagens principais."
      >
        {purchaseToDelete && (
          <Box
            sx={{
              p: 2,
              backgroundColor: '#f8fafc',
              borderRadius: 1,
              border: '1px solid #e5e7eb',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827' }}>
              {purchaseToDelete.productName || 'Produto nao encontrado'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              Valor Total: {formatCurrency(purchaseToDelete.totalPrice || 0)}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <CalendarIcon sx={{ fontSize: 12 }} />
              {purchaseToDelete.date ? formatDate(purchaseToDelete.date) : '-'}
            </Typography>
          </Box>
        )}
      </ConfirmDialog>
    </>
  );
};

export default PurchasesPage;
