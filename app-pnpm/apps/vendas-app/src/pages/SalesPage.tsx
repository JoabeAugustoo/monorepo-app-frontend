import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DataGrid, CurrencyField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { salesService, productService, employeeService, authService } from '../services';
import { useRefresh } from '../contexts/RefreshContext';
import { usePermissions } from '../hooks/usePermissions';
import { formatCurrency } from '../utils/i18n';
import type { Sale, Product, Employee, SearchRequest } from '../types';

interface SaleFormData {
  productId: string;
  employeeId: string;
  clientName: string;
  quantity: string;
  salePrice: string;
  totalPrice: string;
  isNewClient: boolean;
  notes: string;
  date: string;
  active: boolean;
}

interface DailyStats {
  new_clients_count: number;
  total_sales_count: number;
  total_amount: number;
}

const initialFormData: SaleFormData = {
  productId: '',
  employeeId: '',
  clientName: '',
  quantity: '',
  salePrice: '',
  totalPrice: '',
  isNewClient: false,
  notes: '',
  date: new Date().toISOString().split('T')[0],
  active: true,
};

const SalesPage = () => {
  const { triggerMultipleRefresh } = useRefresh();
  const { canWriteSales, canReadDashboard } = usePermissions();
  const isEmployee = !!(
    authService.getCurrentUser()?.isEmployee || authService.getLoginData()?.is_employee
  );

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeProducts, setActiveProducts] = useState<Product[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<string[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [formData, setFormData] = useState<SaleFormData>(initialFormData);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    new_clients_count: 0,
    total_sales_count: 0,
    total_amount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Sort
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

  // Load active products and employees on mount
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

    const fetchActiveEmployees = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        const loginData = authService.getLoginData();
        const userIsEmployee = currentUser?.isEmployee || loginData?.is_employee;

        if (userIsEmployee) {
          const employeePublicId = currentUser?.employeePublicId || loginData?.public_id;
          if (employeePublicId) {
            const employee = await employeeService.getEmployeeById(employeePublicId);
            if (employee) {
              setActiveEmployees([employee]);
              setFormData((prev) => ({ ...prev, employeeId: employee.publicId || '' }));
            } else {
              setActiveEmployees([]);
            }
          }
        } else {
          const employees = await employeeService.getActiveEmployees();
          setActiveEmployees(employees || []);
        }
      } catch (error) {
        console.error('Erro ao carregar funcionarios ativos:', error);
        setActiveEmployees([]);
      }
    };

    fetchActiveProducts();
    fetchActiveEmployees();
  }, []);

  // Debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  const fetchDailyStats = useCallback(async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const stats = await salesService.getSalesStats(dateStr);
      setDailyStats({
        new_clients_count: stats.totalNewClients || 0,
        total_sales_count: stats.totalAttendances || 0,
        total_amount: stats.totalAmount || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar estatisticas:', error);
      setDailyStats({ new_clients_count: 0, total_sales_count: 0, total_amount: 0 });
    }
  }, [selectedDate]);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = format(nextDate, 'yyyy-MM-dd');

      const searchRequest: SearchRequest = {
        where: {
          date: {
            gte: new Date(dateStr + 'T00:00:00.000Z').toISOString(),
            lt: new Date(nextDateStr + 'T00:00:00.000Z').toISOString(),
          },
        },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        sort: [{ field: sortField, direction: sortDirection }],
      };

      if (searchTerm.trim()) {
        searchRequest.where = {
          ...searchRequest.where,
          clientName: { contains: searchTerm.trim() },
        };
      }

      const response = await salesService.searchSales(searchRequest);

      if (response?.data) {
        setSales(response.data);
        setTotalItems(response.total || 0);

        // If user doesn't have dashboard access, calculate stats from page data
        if (!canReadDashboard) {
          const salesData = response.data;
          const newClientsCount = salesData.filter((s) => s.isNewClient).length;
          const totalAmount = salesData.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
          setDailyStats({
            new_clients_count: newClientsCount,
            total_sales_count: response.total || salesData.length,
            total_amount: totalAmount,
          });
        }
      } else {
        setSales([]);
        setTotalItems(0);
        if (!canReadDashboard) {
          setDailyStats({ new_clients_count: 0, total_sales_count: 0, total_amount: 0 });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      setSales([]);
      setTotalItems(0);
      if (!canReadDashboard) {
        setDailyStats({ new_clients_count: 0, total_sales_count: 0, total_amount: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate, currentPage, pageSize, searchTerm, sortField, sortDirection, canReadDashboard]);

  useEffect(() => {
    if (selectedDate) {
      fetchSales();
      if (canReadDashboard) {
        fetchDailyStats();
      }
    }
  }, [selectedDate, fetchSales, fetchDailyStats, canReadDashboard]);

  const handleProductChange = (productId: string) => {
    const selectedProduct = activeProducts.find((p) => p.publicId === productId);
    const newFormData: SaleFormData = {
      ...formData,
      productId,
      salePrice: selectedProduct
        ? (selectedProduct.suggestedSalePrice || selectedProduct.price).toString()
        : '',
    };

    if (newFormData.quantity && selectedProduct) {
      const salePrice = selectedProduct.suggestedSalePrice || selectedProduct.price;
      newFormData.totalPrice = (parseFloat(newFormData.quantity) * salePrice).toString();
    }

    setFormData(newFormData);
  };

  const handleQuantityChange = (quantity: string) => {
    const newFormData: SaleFormData = { ...formData, quantity };

    if (formData.salePrice && quantity) {
      newFormData.totalPrice = (parseFloat(quantity) * parseFloat(formData.salePrice)).toString();
    } else {
      newFormData.totalPrice = '';
    }

    setFormData(newFormData);
  };

  const handleSalePriceChange = (salePrice: string) => {
    const newFormData: SaleFormData = { ...formData, salePrice };

    if (formData.quantity && salePrice) {
      newFormData.totalPrice = (parseFloat(formData.quantity) * parseFloat(salePrice)).toString();
    } else {
      newFormData.totalPrice = '';
    }

    setFormData(newFormData);
  };

  const handleClientSearch = (value: string) => {
    setFormData({ ...formData, clientName: value });
    setClients([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const saleData: Partial<Sale> = {
        employeePublicId: formData.employeeId,
        productPublicId: formData.productId,
        clientName: formData.clientName,
        quantity: parseInt(formData.quantity, 10),
        unitPrice: parseFloat(formData.salePrice),
        isNewClient: formData.isNewClient,
        date: dateStr,
      };

      await salesService.createSale(saleData);
      toast.success('Venda registrada com sucesso!');

      triggerMultipleRefresh(['products', 'sales']);

      setFormData((prev) => ({
        ...initialFormData,
        employeeId: isEmployee ? prev.employeeId : '',
      }));
      setClients([]);
      setShowForm(false);
      fetchDailyStats();
      fetchSales();
    } catch (error) {
      console.error('Erro ao registrar venda:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (sale: Sale) => {
    setViewingSale(sale);
    setShowViewModal(true);
  };

  const columns: DataGridColumn<Sale>[] = [
    {
      key: 'employeeName',
      header: 'Funcionario',
      render: (sale: Sale) => (
        <div style={{ fontWeight: '600', color: '#111827' }}>
          {sale.employeeName || '-'}
        </div>
      ),
    },
    {
      key: 'clientName',
      header: 'Cliente',
      render: (sale: Sale) => (
        <div style={{ fontWeight: '600', color: '#111827' }}>
          {sale.clientName || '-'}
        </div>
      ),
    },
    {
      key: 'productName',
      header: 'Produto',
      render: (sale: Sale) => (
        <div style={{ fontWeight: '600', color: '#111827' }}>
          {sale.productName || '-'}
        </div>
      ),
    },
    {
      key: 'isNewClient',
      header: 'Tipo',
      render: (sale: Sale) => (
        <Chip
          label={sale.isNewClient ? 'Novo' : 'Renovacao'}
          color={sale.isNewClient ? 'success' : 'primary'}
          size="small"
        />
      ),
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <TextField
        size="small"
        placeholder="Buscar por cliente..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        sx={{ minWidth: '200px' }}
      />

      {canWriteSales && (
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>
          Nova Venda
        </Button>
      )}
    </div>
  );

  const actions = [
    {
      icon: <VisibilityIcon fontSize="small" />,
      tooltip: 'Visualizar detalhes',
      onClick: (sale: Sale) => handleView(sale),
      color: 'info',
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <>
        {/* Header with date selector */}
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Vendas do Dia"
            action={
              <DatePicker
                label="Selecionar Data"
                value={selectedDate}
                onChange={(newValue: Date | null) => {
                  if (newValue) setSelectedDate(newValue);
                }}
                format="dd/MM/yyyy"
              />
            }
          />
        </Card>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
          <Box sx={{ flex: '1 1 280px' }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'primary.light',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PeopleIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Clientes Novos
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {dailyStats.new_clients_count}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 280px' }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'success.light',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShoppingCartIcon sx={{ color: 'success.main', fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Atendimentos
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {dailyStats.total_sales_count}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Sales DataGrid */}
        <Card>
          <CardHeader title="Vendas Registradas" />
          <CardContent>
            <DataGrid<Sale>
              data={sales}
              columns={columns}
              getRowId={(row) => row.publicId || row.id || ''}
              pageSize={pageSize}
              selectable={false}
              headerActions={headerActions}
              actions={actions}
              emptyMessage="Nenhuma venda registrada para esta data"
              loading={loading}
              serverSidePagination
              page={currentPage}
              totalRows={totalItems}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize: number) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              sortField={sortField}
              sortDirection={sortDirection === 'ASC' ? 'asc' : 'desc'}
              onSortChange={(field, direction) => {
                setSortField(field);
                setSortDirection(direction === 'asc' ? 'ASC' : 'DESC');
                setCurrentPage(1);
              }}
            />
          </CardContent>
        </Card>

        {/* New Sale Dialog */}
        <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <ShoppingCartIcon color="primary" />
              <Typography variant="h6">Lancar Nova Venda</Typography>
            </Box>
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                {/* Employee */}
                <FormControl fullWidth required>
                  <InputLabel>Funcionario Responsavel</InputLabel>
                  <Select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value as string })}
                    label="Funcionario Responsavel"
                    disabled={isEmployee}
                  >
                    {activeEmployees.map((emp) => (
                      <MenuItem key={emp.publicId} value={emp.publicId}>
                        {emp.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Product */}
                <FormControl fullWidth required>
                  <InputLabel>Produto</InputLabel>
                  <Select
                    value={formData.productId}
                    onChange={(e) => handleProductChange(e.target.value as string)}
                    label="Produto"
                  >
                    {activeProducts.map((product) => (
                      <MenuItem key={product.publicId} value={product.publicId}>
                        {product.name} - {formatCurrency(product.price)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Client */}
                <Autocomplete
                  freeSolo
                  options={clients}
                  value={formData.clientName}
                  onChange={(_event, newValue) => {
                    setFormData({ ...formData, clientName: newValue || '' });
                  }}
                  onInputChange={(_event, newInputValue) => {
                    handleClientSearch(newInputValue);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Nome do Cliente" required fullWidth />
                  )}
                />

                {/* Quantity, Sale Price, Total */}
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    flexWrap: { xs: 'wrap', md: 'nowrap' },
                    alignItems: 'flex-start',
                  }}
                >
                  <TextField
                    label="Quantidade"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    required
                    sx={{
                      flex: { xs: '1 1 100%', md: 1 },
                      minWidth: { xs: '100%', md: '150px' },
                    }}
                  />

                  <CurrencyField
                    label="Preco de Venda"
                    value={parseFloat(formData.salePrice) || 0}
                    onChange={(value: number) => handleSalePriceChange(value.toString())}
                    required
                    sx={{
                      flex: { xs: '1 1 100%', md: 1 },
                      minWidth: { xs: '100%', md: '150px' },
                    }}
                    helperText="Preco sugerido como padrao"
                  />

                  <CurrencyField
                    label="Valor Total"
                    value={parseFloat(formData.totalPrice) || 0}
                    onChange={(_value: number) => {}}
                    disabled
                    sx={{
                      flex: { xs: '1 1 100%', md: 1 },
                      minWidth: { xs: '100%', md: '150px' },
                      '& .MuiInputBase-input': {
                        backgroundColor: '#f5f5f5',
                        fontWeight: 'bold',
                        color: '#059669',
                      },
                    }}
                    helperText="Quantidade x Preco de Venda"
                  />
                </Box>

                {/* New Client */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 2,
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    backgroundColor: '#fafafa',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Cliente Novo
                  </Typography>
                  <Switch
                    checked={formData.isNewClient}
                    onChange={(e) => setFormData({ ...formData, isNewClient: e.target.checked })}
                    color="primary"
                    size="small"
                  />
                </Box>

                {/* Notes */}
                <TextField
                  label="Anotacoes (Opcional)"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  fullWidth
                  placeholder="Observacoes sobre a venda..."
                />
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setShowForm(false)} color="inherit">
                Cancelar
              </Button>
              <Button type="submit" variant="contained" disabled={loading} startIcon={<AddIcon />}>
                {loading ? 'Salvando...' : 'Salvar Venda'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* View Sale Dialog */}
        <Dialog
          open={showViewModal}
          onClose={() => setShowViewModal(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <VisibilityIcon color="primary" />
              <Typography variant="h6">Detalhes da Venda</Typography>
            </Box>
          </DialogTitle>

          <DialogContent>
            {viewingSale && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                <TextField
                  fullWidth
                  label="Funcionario Responsavel"
                  value={viewingSale.employeeName || '-'}
                  slotProps={{ input: { readOnly: true } }}
                  sx={{ '& .MuiInputBase-input': { backgroundColor: '#f5f5f5' } }}
                />

                <TextField
                  fullWidth
                  label="Produto"
                  value={viewingSale.productName || '-'}
                  slotProps={{ input: { readOnly: true } }}
                  sx={{ '& .MuiInputBase-input': { backgroundColor: '#f5f5f5' } }}
                />

                <TextField
                  fullWidth
                  label="Cliente"
                  value={viewingSale.clientName || '-'}
                  slotProps={{ input: { readOnly: true } }}
                  sx={{ '& .MuiInputBase-input': { backgroundColor: '#f5f5f5' } }}
                />

                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    flexWrap: { xs: 'wrap', md: 'nowrap' },
                    alignItems: 'flex-start',
                  }}
                >
                  <TextField
                    label="Quantidade"
                    value={`${viewingSale.quantity || 1} un.`}
                    slotProps={{ input: { readOnly: true } }}
                    sx={{
                      flex: { xs: '1 1 100%', md: 1 },
                      minWidth: { xs: '100%', md: '120px' },
                      '& .MuiInputBase-input': { backgroundColor: '#f5f5f5' },
                    }}
                  />

                  <TextField
                    label="Preco de Venda"
                    value={formatCurrency(viewingSale.unitPrice || 0)}
                    slotProps={{ input: { readOnly: true } }}
                    sx={{
                      flex: { xs: '1 1 100%', md: 1 },
                      minWidth: { xs: '100%', md: '120px' },
                      '& .MuiInputBase-input': { backgroundColor: '#f5f5f5' },
                    }}
                  />

                  <TextField
                    label="Valor Total"
                    value={formatCurrency(viewingSale.totalPrice || 0)}
                    slotProps={{ input: { readOnly: true } }}
                    sx={{
                      flex: { xs: '1 1 100%', md: 1 },
                      minWidth: { xs: '100%', md: '120px' },
                      '& .MuiInputBase-input': {
                        backgroundColor: '#f5f5f5',
                        fontWeight: 'bold',
                        color: '#059669',
                      },
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    backgroundColor: '#f5f5f5',
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    Tipo de Cliente:
                  </Typography>
                  <Chip
                    label={viewingSale.isNewClient ? 'Cliente Novo' : 'Renovacao'}
                    color={viewingSale.isNewClient ? 'success' : 'primary'}
                    size="medium"
                  />
                </Box>

                <TextField
                  fullWidth
                  label="Data da Venda"
                  value={
                    viewingSale.date
                      ? new Date(viewingSale.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                      : '-'
                  }
                  slotProps={{ input: { readOnly: true } }}
                  sx={{ '& .MuiInputBase-input': { backgroundColor: '#f5f5f5' } }}
                />
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setShowViewModal(false)} variant="contained" color="primary">
              Fechar
            </Button>
          </DialogActions>
        </Dialog>
      </>
    </LocalizationProvider>
  );
};

export default SalesPage;
