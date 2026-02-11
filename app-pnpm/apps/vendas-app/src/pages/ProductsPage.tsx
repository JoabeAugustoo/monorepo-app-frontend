import { useState, useEffect, useCallback } from 'react';
import {
  Switch,
  FormControlLabel,
  Typography,
  Button,
  TextField,
  Box,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Inventory as PackageIcon } from '@mui/icons-material';
import { toast } from 'sonner';
import { DataGrid, CurrencyField, FormDialog, ConfirmDialog, StatusChip, SearchField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { productService } from '../services';
import { useRefresh } from '../contexts/RefreshContext';
import { usePermissions } from '../hooks/usePermissions';
import { formatCurrency } from '../utils/i18n';
import type { Product, SearchRequest } from '../types';

interface ProductFormData {
  name: string;
  price: string;
  suggestedSalePrice: string;
  active: boolean;
}

const initialFormData: ProductFormData = {
  name: '',
  price: '',
  suggestedSalePrice: '',
  active: true,
};

const ProductsPage = () => {
  const { refreshTriggers, triggerMultipleRefresh } = useRefresh();
  const { canWriteProducts } = usePermissions();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<(string | number)[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);

  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isInactivating, setIsInactivating] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Sort state
  const [sortField, setSortField] = useState('active');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

  // Debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      const searchRequest: SearchRequest = {
        where: {},
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        sort: [{ field: sortField, direction: sortDirection }],
      };

      if (searchTerm.trim()) {
        searchRequest.where = { name: { contains: searchTerm.trim() } };
      }

      const response = await productService.searchProducts(searchRequest);

      if (response?.data) {
        setProducts(response.data);
        setTotalItems(response.total || 0);
      } else {
        setProducts([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProducts([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortField, sortDirection]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, refreshTriggers.products]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      suggestedSalePrice: product.suggestedSalePrice ? product.suggestedSalePrice.toString() : '',
      active: product.active ?? true,
    });
    setShowForm(true);
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete?.publicId) return;

    try {
      setIsInactivating(true);
      await productService.softDeleteProduct(productToDelete.publicId);
      toast.success(`Produto "${productToDelete.name}" foi inativado com sucesso!`);
      setShowDeleteModal(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      console.error('Erro ao inativar produto:', error);
    } finally {
      setIsInactivating(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    const count = selectedProducts.length;
    if (window.confirm(`Tem certeza que deseja inativar ${count} produto${count > 1 ? 's' : ''}?`)) {
      try {
        await Promise.all(
          selectedProducts.map((publicId) => productService.softDeleteProduct(String(publicId)))
        );
        toast.success(`${count} produto${count > 1 ? 's inativados' : ' inativado'} com sucesso!`);
        setSelectedProducts([]);
        fetchProducts();
      } catch (error) {
        console.error('Erro ao inativar produtos:', error);
      }
    }
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const productData: Partial<Product> = {
        name: formData.name,
        price: parseFloat(formData.price),
        suggestedSalePrice: formData.suggestedSalePrice
          ? parseFloat(formData.suggestedSalePrice)
          : undefined,
        active: formData.active,
      };

      if (editingProduct?.publicId) {
        await productService.updateProduct(editingProduct.publicId, productData);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await productService.createProduct(productData);
        toast.success('Produto criado com sucesso!');
      }

      triggerMultipleRefresh(['products']);
      setShowForm(false);
      setCurrentPage(1);
      fetchProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
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

  const handleSortChange = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortField(field);
      setSortDirection('ASC');
    }
    setCurrentPage(1);
  };

  const columns: DataGridColumn<Product>[] = [
    {
      key: 'name',
      header: 'Produto',
      sortable: true,
      render: (product: Product) => (
        <div style={{ fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PackageIcon sx={{ fontSize: 16, color: '#6b7280' }} />
          {product.name}
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Preco',
      sortable: true,
      render: (product: Product) => (
        <span style={{ fontWeight: '600', color: '#059669' }}>
          {formatCurrency(product.price)}
        </span>
      ),
    },
    {
      key: 'suggestedSalePrice',
      header: 'Preco Sugerido',
      render: (product: Product) => (
        <span style={{ fontWeight: '600', color: '#0ea5e9' }}>
          {product.suggestedSalePrice ? formatCurrency(product.suggestedSalePrice) : '-'}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      sortable: true,
      render: (product: Product) => <StatusChip active={product.active ?? null} />,
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <SearchField
        value={searchInput}
        onChange={setSearchInput}
        placeholder="Buscar produtos..."
      />

      {canWriteProducts && selectedProducts.length > 0 && (
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleBulkDelete}
        >
          Inativar Selecionados ({selectedProducts.length})
        </Button>
      )}

      {canWriteProducts && (
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}>
          Novo Produto
        </Button>
      )}
    </div>
  );

  const actions = canWriteProducts
    ? [
        {
          icon: <EditIcon fontSize="small" />,
          tooltip: 'Editar',
          onClick: (product: Product) => handleEdit(product),
          color: 'primary',
        },
        {
          icon: <DeleteIcon fontSize="small" />,
          tooltip: 'Inativar',
          onClick: (product: Product) => handleDelete(product),
          color: 'error',
        },
      ]
    : undefined;

  return (
    <>
      <DataGrid<Product>
        data={products}
        columns={columns}
        getRowId={(row) => row.publicId || row.id || ''}
        pageSize={pageSize}
        selectable={canWriteProducts}
        headerActions={headerActions}
        actions={actions}
        emptyMessage="Nenhum produto cadastrado"
        onSelectionChange={setSelectedProducts}
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
        title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
        titleIcon={<PackageIcon sx={{ color: '#3b82f6' }} />}
        submitLabel={loading ? 'Salvando...' : editingProduct ? 'Atualizar' : 'Criar'}
        loading={loading}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          <TextField
            fullWidth
            label="Nome do Produto"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <CurrencyField
            fullWidth
            label="Preco do Produto"
            value={parseFloat(formData.price) || 0}
            onChange={(value: number) => setFormData({ ...formData, price: value.toString() })}
            required
          />

          <CurrencyField
            fullWidth
            label="Preco Sugerido de Venda"
            value={parseFloat(formData.suggestedSalePrice) || 0}
            onChange={(value: number) => setFormData({ ...formData, suggestedSalePrice: value.toString() })}
          />

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 2,
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              backgroundColor: '#fafafa',
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  color="primary"
                />
              }
              label="Produto Ativo"
              sx={{ margin: 0 }}
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
        message="Tem certeza que deseja inativar o produto?"
        confirmLabel="Inativar Produto"
        confirmIcon={<DeleteIcon />}
        loading={isInactivating}
        loadingLabel="Inativando..."
        footer="O produto sera marcado como inativo e nao aparecera mais nas listagens principais."
      >
        {productToDelete && (
          <Box
            sx={{
              p: 2,
              backgroundColor: '#f8fafc',
              borderRadius: 1,
              border: '1px solid #e5e7eb',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827' }}>
              {productToDelete.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
              Preco: {formatCurrency(productToDelete.price)}
            </Typography>
          </Box>
        )}
      </ConfirmDialog>
    </>
  );
};

export default ProductsPage;
