import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Grid2 as Grid,
  alpha,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as UserIcon,
  Schedule as ClockIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  AttachMoney as MoneyIcon,
  AccessTime as TimeIcon,
  CalendarViewDay as DaysIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { DataGrid, CurrencyField, FormDialog, ConfirmDialog, StatusChip, SearchField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { employeeService } from '../services';
import { useRefresh } from '../contexts/RefreshContext';
import { usePermissions } from '../hooks/usePermissions';
import { formatCurrency } from '../utils/i18n';
import type { Employee, SearchRequest } from '../types';

interface EmployeeFormData {
  name: string;
  email: string;
  password: string;
  monthlySalary: string;
  startTime: string;
  endTime: string;
  hoursPerDay: string;
  daysPerWeek: string;
}

const initialFormData: EmployeeFormData = {
  name: '',
  email: '',
  password: '',
  monthlySalary: '',
  startTime: '09:00',
  endTime: '18:00',
  hoursPerDay: '8',
  daysPerWeek: '5',
};

const SectionHeader = ({ icon, title, subtitle, gradient }: { icon: React.ReactNode; title: string; subtitle?: string; gradient?: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
    <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: gradient || 'linear-gradient(135deg, #9C72D9, #7B5BBF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>{title}</Typography>
      {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
    </Box>
  </Box>
);

const EmployeesPage = () => {
  const { triggerMultipleRefresh } = useRefresh();
  const { canWriteEmployees } = usePermissions();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<(string | number)[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isInactivating, setIsInactivating] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Sort
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');

  // Debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  const fetchEmployees = useCallback(async () => {
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

      const response = await employeeService.searchEmployees(searchRequest);

      if (response?.data) {
        setEmployees(response.data);
        setTotalItems(response.total || 0);
      } else {
        setEmployees([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar funcionarios:', error);
      setEmployees([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortField, sortDirection]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email || '',
      password: '', // Blank on edit
      monthlySalary: (employee.monthlySalary ?? '').toString(),
      startTime: employee.startTime || '09:00',
      endTime: employee.endTime || '18:00',
      hoursPerDay: (employee.hoursPerDay ?? '8').toString(),
      daysPerWeek: (employee.daysPerWeek ?? '5').toString(),
    });
    setShowForm(true);
  };

  const handleDelete = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete?.publicId) return;

    try {
      setIsInactivating(true);
      await employeeService.softDeleteEmployee(employeeToDelete.publicId);
      toast.success(`Funcionario "${employeeToDelete.name}" foi inativado com sucesso!`);
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
      fetchEmployees();
    } catch (error) {
      console.error('Erro ao inativar funcionario:', error);
    } finally {
      setIsInactivating(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setEmployeeToDelete(null);
  };

  const handleBulkDelete = async () => {
    if (selectedEmployees.length === 0) return;

    const count = selectedEmployees.length;
    if (
      window.confirm(
        `Tem certeza que deseja inativar ${count} funcionario${count > 1 ? 's' : ''}?`
      )
    ) {
      try {
        await Promise.all(
          selectedEmployees.map((publicId) =>
            employeeService.softDeleteEmployee(String(publicId))
          )
        );
        toast.success(
          `${count} funcionario${count > 1 ? 's inativados' : ' inativado'} com sucesso!`
        );
        setSelectedEmployees([]);
        fetchEmployees();
      } catch (error) {
        console.error('Erro ao inativar funcionarios:', error);
      }
    }
  };

  const handleAddNew = () => {
    setEditingEmployee(null);
    setFormData(initialFormData);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const employeeData: Partial<Employee> = {
        name: formData.name,
        email:
          formData.email ||
          `${formData.name.toLowerCase().replace(' ', '.')}@exemplo.com`,
        monthlySalary: parseFloat(formData.monthlySalary),
        startTime: formData.startTime,
        endTime: formData.endTime,
        hoursPerDay: parseInt(formData.hoursPerDay, 10),
        daysPerWeek: parseInt(formData.daysPerWeek, 10),
      };

      if (editingEmployee?.publicId) {
        await employeeService.updateEmployee(editingEmployee.publicId, employeeData);
        toast.success('Funcionario atualizado com sucesso!');
      } else {
        await employeeService.createEmployee(employeeData);
        toast.success('Funcionario criado com sucesso!');
      }

      triggerMultipleRefresh(['employees']);
      setShowForm(false);
      setCurrentPage(1);
      fetchEmployees();
    } catch (error) {
      console.error('Erro ao salvar funcionario:', error);
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

  const columns: DataGridColumn<Employee>[] = [
    {
      key: 'name',
      header: 'Funcionario',
      sortable: true,
      render: (employee: Employee) => (
        <div
          style={{
            fontWeight: '600',
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <UserIcon sx={{ fontSize: 16, color: '#6b7280' }} />
          <div>
            <div>{employee.name}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{employee.email}</div>
            {employee.password && (
              <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' }}>
                Senha: {employee.password}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'salary',
      header: 'Salario',
      sortable: true,
      render: (employee: Employee) => (
        <span style={{ fontWeight: '600', color: '#059669' }}>
          {formatCurrency(employee.monthlySalary ?? 0)}
        </span>
      ),
    },
    {
      key: 'startTime',
      header: 'Horario',
      render: (employee: Employee) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#374151' }}>
          <ClockIcon sx={{ fontSize: 14, color: '#6b7280' }} />
          <span style={{ fontSize: '14px' }}>
            {employee.startTime || '-'} - {employee.endTime || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      sortable: true,
      render: (employee: Employee) => <StatusChip active={employee.active ?? null} />,
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <SearchField
        value={searchInput}
        onChange={setSearchInput}
        placeholder="Buscar funcionarios..."
      />

      {canWriteEmployees && selectedEmployees.length > 0 && (
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleBulkDelete}
        >
          Inativar Selecionados ({selectedEmployees.length})
        </Button>
      )}

      {canWriteEmployees && (
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}>
          Novo Funcionario
        </Button>
      )}
    </div>
  );

  const actions = canWriteEmployees
    ? [
        {
          icon: <EditIcon fontSize="small" />,
          tooltip: 'Editar',
          onClick: (employee: Employee) => handleEdit(employee),
          color: 'primary',
        },
        {
          icon: <DeleteIcon fontSize="small" />,
          tooltip: 'Inativar',
          onClick: (employee: Employee) => handleDelete(employee),
          color: 'error',
        },
      ]
    : undefined;

  return (
    <>
      <DataGrid<Employee>
        data={employees}
        columns={columns}
        getRowId={(row) => row.publicId || row.id || ''}
        pageSize={pageSize}
        selectable={canWriteEmployees}
        headerActions={headerActions}
        actions={actions}
        emptyMessage="Nenhum funcionario cadastrado"
        onSelectionChange={setSelectedEmployees}
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
        onRefresh={fetchEmployees}
      />

      {/* Form Dialog */}
      <FormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        title={editingEmployee ? 'Editar Funcionario' : 'Novo Funcionario'}
        titleIcon={<UserIcon sx={{ color: '#3b82f6' }} />}
        submitLabel={loading ? 'Salvando...' : editingEmployee ? 'Atualizar' : 'Criar'}
        loading={loading}
        disabled={!formData.name || !formData.monthlySalary}
        maxWidth="md"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {/* Section 1 - Dados Pessoais */}
          <Box sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: '16px', border: '1px solid', borderColor: (theme) => alpha(theme.palette.divider, 0.08), boxShadow: `0 1px 3px ${alpha('#000', 0.04)}` }}>
            <SectionHeader icon={<UserIcon />} title="Dados Pessoais" subtitle="Informacoes do funcionario" />
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Nome Completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon sx={{ color: '#9C72D9' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  helperText="Se nao informado, sera gerado automaticamente"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: '#9C72D9' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Section 2 - Remuneracao */}
          <Box sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: '16px', border: '1px solid', borderColor: (theme) => alpha(theme.palette.divider, 0.08), boxShadow: `0 1px 3px ${alpha('#000', 0.04)}` }}>
            <SectionHeader icon={<MoneyIcon />} title="Remuneração" subtitle="Salario mensal do funcionario" gradient="linear-gradient(135deg, #F48FB1, #E57399)" />
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <CurrencyField
                  fullWidth
                  label="Salario Mensal"
                  value={parseFloat(formData.monthlySalary) || 0}
                  onChange={(value: number) => setFormData({ ...formData, monthlySalary: value.toString() })}
                  required
                />
              </Grid>
            </Grid>
          </Box>

          {/* Section 3 - Horario de Trabalho */}
          <Box sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: '16px', border: '1px solid', borderColor: (theme) => alpha(theme.palette.divider, 0.08), boxShadow: `0 1px 3px ${alpha('#000', 0.04)}` }}>
            <SectionHeader icon={<TimeIcon />} title="Horário de Trabalho" subtitle="Jornada e expediente" gradient="linear-gradient(135deg, #7EB3E0, #5A9BD5)" />
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Horario de Entrada"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TimeIcon sx={{ color: '#7EB3E0' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Horario de Saida"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TimeIcon sx={{ color: '#7EB3E0' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Horas por Dia"
                  type="number"
                  value={formData.hoursPerDay}
                  onChange={(e) => setFormData({ ...formData, hoursPerDay: e.target.value })}
                  slotProps={{ htmlInput: { min: 1, max: 12, step: 0.5 } }}
                  helperText="Quantidade de horas trabalhadas por dia"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DaysIcon sx={{ color: '#7EB3E0' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Dias por Semana"
                  type="number"
                  value={formData.daysPerWeek}
                  onChange={(e) => setFormData({ ...formData, daysPerWeek: e.target.value })}
                  slotProps={{ htmlInput: { min: 1, max: 7 } }}
                  helperText="Quantos dias trabalha por semana"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DaysIcon sx={{ color: '#7EB3E0' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
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
        message="Tem certeza que deseja inativar o funcionario?"
        confirmLabel="Inativar Funcionario"
        confirmIcon={<DeleteIcon />}
        loading={isInactivating}
        loadingLabel="Inativando..."
        footer="O funcionario sera marcado como inativo e nao aparecera mais nas listagens principais."
      >
        {employeeToDelete && (
          <Box
            sx={{
              p: 2,
              backgroundColor: '#f8fafc',
              borderRadius: 1,
              border: '1px solid #e5e7eb',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827' }}>
              {employeeToDelete.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
              Salario: {formatCurrency(employeeToDelete.monthlySalary ?? 0)}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              Email: {employeeToDelete.email}
            </Typography>
          </Box>
        )}
      </ConfirmDialog>
    </>
  );
};

export default EmployeesPage;
