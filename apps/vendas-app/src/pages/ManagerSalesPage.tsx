import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';
import { DataGrid, DateRangeField } from '@app/ui';
import type { DataGridColumn, DateRange } from '@app/ui';
import { salesService } from '../services';
import { useRefresh } from '../contexts/RefreshContext';
import { formatCurrency } from '../utils/i18n';
import type { Sale, SearchRequest } from '../types';

// Shape returned by the employee-summary endpoint
interface EmployeeSummary {
  employeePublicId: string;
  employeeName: string;
  totalSales: number;
  totalAmount: number;
  newClients: number;
}

const ManagerSalesPage = () => {
  const { refreshTriggers } = useRefresh();

  // Date range: start = today, end = tomorrow
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { start: today, end: tomorrow };
  });

  // Main grid
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog - employee sales
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummary | null>(null);
  const [employeeSales, setEmployeeSales] = useState<Sale[]>([]);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogPage, setDialogPage] = useState(1);
  const [dialogPageSize, setDialogPageSize] = useState(10);
  const [dialogTotalItems, setDialogTotalItems] = useState(0);
  const [dialogSortField, setDialogSortField] = useState('date');
  const [dialogSortDirection, setDialogSortDirection] = useState<'ASC' | 'DESC'>('DESC');

  // Dialog - sale details
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Date range helpers
  const { start: startDate, end: endDate } = dateRange;

  const getDateFilter = useCallback(() => {
    if (!startDate || !endDate) return {};
    return {
      gte: new Date(format(startDate, 'yyyy-MM-dd') + 'T00:00:00.000Z').toISOString(),
      lt: new Date(format(addDays(endDate, 1), 'yyyy-MM-dd') + 'T00:00:00.000Z').toISOString(),
    };
  }, [startDate, endDate]);

  // Fetch employee summary
  const fetchEmployeeSummary = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const where: Record<string, unknown> = {
        date: getDateFilter(),
      };

      if (searchTerm.trim()) {
        where.employeeName = { contains: searchTerm.trim() };
      }

      const response = await salesService.getEmployeeSummary({
        where,
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      });

      if (response?.data) {
        setEmployees(response.data);
        setTotalItems(response.total || 0);
      } else {
        setEmployees([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar resumo por funcionario:', error);
      toast.error('Erro ao carregar resumo de vendas');
      setEmployees([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, currentPage, pageSize, searchTerm, getDateFilter]);

  useEffect(() => {
    fetchEmployeeSummary();
  }, [fetchEmployeeSummary, refreshTriggers.sales]);

  // Open dialog
  const handleViewEmployeeSales = (employee: EmployeeSummary) => {
    setSelectedEmployee(employee);
    setDialogPage(1);
    setDialogSortField('date');
    setDialogSortDirection('DESC');
    setDialogOpen(true);
  };

  // Fetch employee sales in dialog
  const fetchEmployeeSales = useCallback(async () => {
    if (!selectedEmployee?.employeePublicId) return;
    setDialogLoading(true);
    try {
      const searchRequest: SearchRequest = {
        where: {
          employeePublicId: selectedEmployee.employeePublicId,
          date: getDateFilter(),
        },
        skip: (dialogPage - 1) * dialogPageSize,
        take: dialogPageSize,
        sort: [{ field: dialogSortField, direction: dialogSortDirection }],
      };

      const response = await salesService.searchSales(searchRequest);
      if (response?.data) {
        setEmployeeSales(response.data);
        setDialogTotalItems(response.total || 0);
      } else {
        setEmployeeSales([]);
        setDialogTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar vendas do funcionario:', error);
      toast.error('Erro ao carregar vendas do funcionario');
      setEmployeeSales([]);
    } finally {
      setDialogLoading(false);
    }
  }, [selectedEmployee, dialogPage, dialogPageSize, dialogSortField, dialogSortDirection, getDateFilter]);

  useEffect(() => {
    if (dialogOpen && selectedEmployee) {
      fetchEmployeeSales();
    }
  }, [dialogOpen, selectedEmployee, fetchEmployeeSales]);

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedEmployee(null);
    setEmployeeSales([]);
  };

  const handleDialogSort = (field: string) => {
    if (dialogSortField === field) {
      setDialogSortDirection(dialogSortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setDialogSortField(field);
      setDialogSortDirection('ASC');
    }
    setDialogPage(1);
  };

  const handleViewSale = (sale: Sale) => {
    setViewingSale(sale);
    setShowViewModal(true);
  };

  // Summary grid columns
  const summaryColumns: DataGridColumn<EmployeeSummary>[] = [
    {
      key: 'employeeName',
      header: 'Funcionario',
      render: (emp: EmployeeSummary) => (
        <div style={{ fontWeight: '600', color: '#111827' }}>{emp.employeeName}</div>
      ),
    },
    {
      key: 'totalSales',
      header: 'Qtd Vendas',
      render: (emp: EmployeeSummary) => <span>{emp.totalSales}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Valor Total',
      render: (emp: EmployeeSummary) => (
        <span style={{ color: '#059669', fontWeight: '600' }}>
          {formatCurrency(emp.totalAmount)}
        </span>
      ),
    },
    {
      key: 'newClients',
      header: 'Clientes Novos',
      render: (emp: EmployeeSummary) => <span>{emp.newClients}</span>,
    },
  ];

  const summaryActions = [
    {
      icon: <VisibilityIcon fontSize="small" />,
      tooltip: 'Ver vendas do funcionario',
      onClick: (emp: EmployeeSummary) => handleViewEmployeeSales(emp),
      color: 'info',
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <TextField
        size="small"
        placeholder="Buscar funcionario..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        sx={{ minWidth: '200px' }}
      />
    </div>
  );

  // Sales dialog columns
  const salesColumns: DataGridColumn<Sale>[] = [
    {
      key: 'clientName',
      header: 'Cliente',
      render: (sale: Sale) => (
        <div style={{ fontWeight: '600', color: '#111827' }}>{sale.clientName || '-'}</div>
      ),
    },
    {
      key: 'productName',
      header: 'Produto',
      render: (sale: Sale) => (
        <div style={{ fontWeight: '600', color: '#111827' }}>{sale.productName || '-'}</div>
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
    {
      key: 'quantity',
      header: 'Qtd',
      render: (sale: Sale) => <span>{sale.quantity || 1}</span>,
    },
    {
      key: 'salePrice',
      header: 'Preco Unit.',
      render: (sale: Sale) => <span>{formatCurrency(sale.salePrice || 0)}</span>,
    },
    {
      key: 'totalPrice',
      header: 'Valor Total',
      render: (sale: Sale) => (
        <span style={{ color: '#059669', fontWeight: '600' }}>
          {formatCurrency(sale.totalPrice || 0)}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Data',
      render: (sale: Sale) => (
        <span>
          {sale.date
            ? new Date(sale.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
            : '-'}
        </span>
      ),
    },
  ];

  const salesActions = [
    {
      icon: <VisibilityIcon fontSize="small" />,
      tooltip: 'Visualizar detalhes',
      onClick: (sale: Sale) => handleViewSale(sale),
      color: 'info',
    },
  ];

  return (
    <>
      {/* Date Filters */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Gerencia de Vendas - Resumo por Funcionario" />
        <CardContent>
          <DateRangeField
            value={dateRange}
            onChange={(newRange: DateRange) => {
              setDateRange(newRange);
              setCurrentPage(1);
            }}
          />
        </CardContent>
      </Card>

      {/* Employee Summary Grid */}
      <Card>
        <CardContent>
          {loading && employees.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid<EmployeeSummary>
              data={employees}
              columns={summaryColumns}
              getRowId={(row) => row.employeePublicId}
              pageSize={pageSize}
              selectable={false}
              headerActions={headerActions}
              actions={summaryActions}
              emptyMessage="Nenhum funcionario encontrado para este periodo"
              loading={loading && employees.length > 0}
              serverSidePagination
              page={currentPage}
              totalRows={totalItems}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize: number) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              onRefresh={fetchEmployeeSummary}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog - Employee Sales */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth maxWidth="lg">
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <VisibilityIcon color="primary" />
            <Typography variant="h6">
              Vendas de {selectedEmployee?.employeeName || ''}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {dialogLoading && employeeSales.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <DataGrid<Sale>
                data={employeeSales}
                columns={salesColumns}
                getRowId={(row) => row.publicId || row.id || ''}
                pageSize={dialogPageSize}
                selectable={false}
                actions={salesActions}
                emptyMessage="Nenhuma venda encontrada para este funcionario no periodo"
                loading={dialogLoading && employeeSales.length > 0}
                serverSidePagination
                page={dialogPage}
                totalRows={dialogTotalItems}
                onPageChange={setDialogPage}
                onPageSizeChange={(newSize: number) => {
                  setDialogPageSize(newSize);
                  setDialogPage(1);
                }}
                sortField={dialogSortField}
                sortDirection={dialogSortDirection === 'ASC' ? 'asc' : 'desc'}
                onSortChange={(field, direction) => {
                  setDialogSortField(field);
                  setDialogSortDirection(direction === 'asc' ? 'ASC' : 'DESC');
                  setDialogPage(1);
                }}
                onRefresh={fetchEmployeeSales}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDialogClose} variant="contained" color="primary">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog - Sale Details */}
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
                  value={formatCurrency(viewingSale.salePrice || 0)}
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
  );
};

export default ManagerSalesPage;
