import { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  Box,
  Button,
  Typography,
  MenuItem as MuiMenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Badge as BadgeIcon,
  MedicalServices as VetIcon,
  SupportAgent as AttendantIcon,
  Work as AdminIcon,
  SupervisorAccount as ManagerIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { DataGrid, FormDialog, ConfirmDialog, StatusChip, SearchField, MuiDatePicker } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { useSearchDebounce, formatPhone, formatCpf } from '@app/core';
import { employeeService } from '../services';
import type { Employee, EmployeeDto, EmployeeRole, SearchRequest } from '../types';

const ROLE_LABELS: Record<EmployeeRole, string> = {
  VETERINARIAN: 'Veterinário',
  ATTENDANT: 'Atendente',
  ADMINISTRATIVE: 'Administrativo',
  MANAGER: 'Gerente',
};

const ROLE_ICONS: Record<EmployeeRole, React.ReactNode> = {
  VETERINARIAN: <VetIcon sx={{ fontSize: 16 }} />,
  ATTENDANT: <AttendantIcon sx={{ fontSize: 16 }} />,
  ADMINISTRATIVE: <AdminIcon sx={{ fontSize: 16 }} />,
  MANAGER: <ManagerIcon sx={{ fontSize: 16 }} />,
};

const ROLE_COLORS: Record<EmployeeRole, string> = {
  VETERINARIAN: '#9C72D9',
  ATTENDANT: '#81C9C5',
  ADMINISTRATIVE: '#7EB3E0',
  MANAGER: '#F48FB1',
};

interface EmployeeFormData {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  role: EmployeeRole | '';
  crmv: string;
  hireDate: string;
}

const initialFormData: EmployeeFormData = {
  name: '',
  cpf: '',
  email: '',
  phone: '',
  role: '',
  crmv: '',
  hireDate: new Date().toISOString().split('T')[0],
};

const EmployeesPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<(string | number)[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isInactivating, setIsInactivating] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const { debouncedValue: searchTerm, inputValue: searchInput, setInputValue: setSearchInput } = useSearchDebounce('', 500);

  const [sortField, setSortField] = useState('active');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
      console.error('Erro ao carregar funcionários:', error);
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
      name: employee.name || '',
      cpf: employee.cpf || '',
      email: employee.email || '',
      phone: employee.phone || '',
      role: employee.role || '',
      crmv: employee.crmv || '',
      hireDate: employee.hireDate || '',
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
      await employeeService.deactivateEmployee(employeeToDelete.publicId);
      toast.success(`Funcionário "${employeeToDelete.name}" foi inativado com sucesso!`);
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
      fetchEmployees();
    } catch (error) {
      console.error('Erro ao inativar funcionário:', error);
    } finally {
      setIsInactivating(false);
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
      const employeeData: EmployeeDto = {
        name: formData.name,
        cpf: formData.cpf || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        role: formData.role as EmployeeRole || undefined,
        crmv: formData.crmv || undefined,
        hireDate: formData.hireDate || undefined,
      };

      if (editingEmployee?.publicId) {
        await employeeService.updateEmployee(editingEmployee.publicId, employeeData);
        toast.success('Funcionário atualizado com sucesso!');
      } else {
        await employeeService.createEmployee(employeeData);
        toast.success('Funcionário criado com sucesso!');
      }

      setShowForm(false);
      setCurrentPage(1);
      fetchEmployees();
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: DataGridColumn<Employee>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (employee) => (
        <div style={{ fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BadgeIcon sx={{ fontSize: 16, color: '#6b7280' }} />
          {employee.name}
        </div>
      ),
    },
    { key: 'cpf', header: 'CPF' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Telefone', render: (employee) => employee.phone ? formatPhone(employee.phone) : '-' },
    {
      key: 'role',
      header: 'Cargo',
      render: (employee) => employee.role ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: ROLE_COLORS[employee.role], display: 'flex' }}>{ROLE_ICONS[employee.role]}</span>
          {ROLE_LABELS[employee.role] || employee.role}
        </span>
      ) : '-',
    },
    {
      key: 'crmv',
      header: 'CRMV',
      render: (employee) => employee.crmv || '-',
    },
    {
      key: 'active',
      header: 'Status',
      sortable: true,
      render: (employee) => <StatusChip active={employee.active ?? null} />,
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <SearchField
        value={searchInput}
        onChange={setSearchInput}
        placeholder="Buscar funcionários..."
      />
      {selectedEmployees.length > 0 && (
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={async () => {
            const count = selectedEmployees.length;
            if (window.confirm(`Tem certeza que deseja inativar ${count} funcionário${count > 1 ? 's' : ''}?`)) {
              await Promise.all(selectedEmployees.map((id) => employeeService.deactivateEmployee(String(id))));
              toast.success(`${count} funcionário${count > 1 ? 's inativados' : ' inativado'} com sucesso!`);
              setSelectedEmployees([]);
              fetchEmployees();
            }
          }}
        >
          Inativar ({selectedEmployees.length})
        </Button>
      )}
      <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}>
        Novo Funcionário
      </Button>
    </div>
  );

  const actions = [
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
  ];

  return (
    <>
      <DataGrid<Employee>
        data={employees}
        columns={columns}
        getRowId={(row) => row.publicId || row.id || ''}
        pageSize={pageSize}
        selectable
        headerActions={headerActions}
        actions={actions}
        emptyMessage="Nenhum funcionário cadastrado"
        onSelectionChange={setSelectedEmployees}
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
        title={editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
        titleIcon={<BadgeIcon sx={{ color: '#9C72D9' }} />}
        submitLabel={loading ? 'Salvando...' : editingEmployee ? 'Atualizar' : 'Criar'}
        loading={loading}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField fullWidth label="Nome" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField fullWidth label="CPF" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: formatCpf(e.target.value) })} placeholder="000.000.000-00" />
            <TextField fullWidth label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </Box>
          <TextField fullWidth label="Telefone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" />
          <TextField
            fullWidth
            select
            label="Cargo"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as EmployeeRole | '' })}
          >
            <MuiMenuItem value="">Selecione...</MuiMenuItem>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <MuiMenuItem key={value} value={value}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: ROLE_COLORS[value as EmployeeRole], display: 'flex' }}>{ROLE_ICONS[value as EmployeeRole]}</span>
                  {label}
                </span>
              </MuiMenuItem>
            ))}
          </TextField>
          {formData.role === 'VETERINARIAN' && (
            <TextField fullWidth label="CRMV" value={formData.crmv} onChange={(e) => setFormData({ ...formData, crmv: e.target.value })} />
          )}
          <MuiDatePicker
            mode="day"
            value={formData.hireDate}
            onChange={(val) => setFormData({ ...formData, hireDate: val })}
            placeholder="Data de Contratação"
          />
        </Box>
      </FormDialog>

      <ConfirmDialog
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setEmployeeToDelete(null); }}
        onConfirm={confirmDelete}
        title="Confirmar Inativação"
        titleIcon={<DeleteIcon sx={{ color: '#ef4444' }} />}
        message="Tem certeza que deseja inativar este funcionário?"
        confirmLabel="Inativar Funcionário"
        confirmIcon={<DeleteIcon />}
        loading={isInactivating}
        loadingLabel="Inativando..."
        footer="O funcionário será marcado como inativo."
      >
        {employeeToDelete && (
          <Box sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 1, border: '1px solid #e5e7eb' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827' }}>
              {employeeToDelete.name}
            </Typography>
            {employeeToDelete.role && (
              <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                {ROLE_LABELS[employeeToDelete.role] || employeeToDelete.role}
              </Typography>
            )}
          </Box>
        )}
      </ConfirmDialog>
    </>
  );
};

export default EmployeesPage;
