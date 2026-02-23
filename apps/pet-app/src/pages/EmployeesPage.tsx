import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Chip,
  alpha,
  Avatar,
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
  Email as EmailIcon,
  Phone as PhoneIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { DataGrid, ConfirmDialog, StatusChip, SearchField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { useSearchDebounce, formatPhone } from '@app/core';
import { employeeService } from '../services';
import type { Employee, EmployeeRole, SearchRequest } from '../types';

const ROLE_LABELS: Record<EmployeeRole, string> = {
  VETERINARIAN: 'Veterinario',
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

const AVATAR_PALETTE = ['#9C72D9', '#F48FB1', '#81C9C5', '#7EB3E0', '#C9A6E8', '#FFD6A5'];

function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

const EmployeesPage = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<(string | number)[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleDelete = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete?.publicId) return;
    try {
      setIsInactivating(true);
      await employeeService.deactivateEmployee(employeeToDelete.publicId);
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

  const handleToggleAccess = async (employee: Employee) => {
    if (!employee.publicId) return;
    try {
      if (employee.hasAuthAccess) {
        await employeeService.deactivateEmployee(employee.publicId);
        toast.success(`Acesso de "${employee.name}" desativado`);
      } else {
        await employeeService.activateEmployee(employee.publicId);
        toast.success(`Acesso de "${employee.name}" ativado`);
      }
      fetchEmployees();
    } catch (error) {
      console.error('Erro ao alterar acesso:', error);
    }
  };

  const columns: DataGridColumn<Employee>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (employee) => {
        const color = nameToColor(employee.name || '');
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.25 }}>
            <Avatar sx={{ width: 34, height: 34, fontSize: '0.78rem', fontWeight: 700, bgcolor: alpha(color, 0.14), color, letterSpacing: '0.02em' }}>
              {getInitials(employee.name || '?')}
            </Avatar>
            <Typography variant="body2" fontWeight={600} color="text.primary">{employee.name}</Typography>
          </Box>
        );
      },
    },
    { key: 'cpf', header: 'CPF', render: (employee) => (
      <Typography variant="body2" sx={{ fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", monospace', fontSize: '0.78rem', color: 'text.secondary', letterSpacing: '0.03em' }}>
        {employee.cpf || '-'}
      </Typography>
    ) },
    { key: 'email', header: 'Email', render: (employee) => employee.email ? (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <EmailIcon sx={{ fontSize: 14, color: '#7EB3E0', opacity: 0.7 }} />
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>{employee.email}</Typography>
      </Box>
    ) : <Typography variant="body2" color="text.disabled">-</Typography> },
    { key: 'phone', header: 'Telefone', render: (employee) => employee.phone ? (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <PhoneIcon sx={{ fontSize: 14, color: '#81C9C5', opacity: 0.7 }} />
        <Typography variant="body2" sx={{ fontSize: '0.84rem' }}>{formatPhone(employee.phone)}</Typography>
      </Box>
    ) : <Typography variant="body2" color="text.disabled">-</Typography> },
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
      key: 'hasAuthAccess',
      header: 'Acesso',
      render: (employee) => {
        if (employee.hasAuthAccess === undefined || employee.hasAuthAccess === null) {
          return <Chip label="Sem usuario" size="small" variant="outlined" sx={{ fontSize: 12 }} />;
        }
        return employee.hasAuthAccess ? (
          <Chip label="Ativo" size="small" color="success" sx={{ fontSize: 12 }} />
        ) : (
          <Chip label="Inativo" size="small" color="default" sx={{ fontSize: 12 }} />
        );
      },
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
        placeholder="Buscar funcionarios..."
      />
      {selectedEmployees.length > 0 && (
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={async () => {
            const count = selectedEmployees.length;
            if (window.confirm(`Tem certeza que deseja inativar ${count} funcionario${count > 1 ? 's' : ''}?`)) {
              await Promise.all(selectedEmployees.map((id) => employeeService.deactivateEmployee(String(id))));
              toast.success(`${count} funcionario${count > 1 ? 's inativados' : ' inativado'} com sucesso!`);
              setSelectedEmployees([]);
              fetchEmployees();
            }
          }}
        >
          Inativar ({selectedEmployees.length})
        </Button>
      )}
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/funcionarios/novo')}>
        Novo Funcionario
      </Button>
    </div>
  );

  const actions = [
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Editar',
      onClick: (employee: Employee) => navigate(`/funcionarios/${employee.publicId}/editar`),
      color: 'primary',
    },
    {
      icon: <BlockIcon fontSize="small" />,
      tooltip: 'Desativar Acesso',
      onClick: (employee: Employee) => handleToggleAccess(employee),
      color: 'warning',
      hidden: (employee: Employee) => !employee.hasAuthAccess,
    },
    {
      icon: <CheckCircleIcon fontSize="small" />,
      tooltip: 'Ativar Acesso',
      onClick: (employee: Employee) => handleToggleAccess(employee),
      color: 'success',
      hidden: (employee: Employee) => employee.hasAuthAccess !== false,
    },
    {
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Inativar',
      onClick: (employee: Employee) => handleDelete(employee),
      color: 'error',
    },
  ];

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box sx={{ width: 48, height: 48, borderRadius: 2.5, background: 'linear-gradient(135deg, #9C72D9 0%, #7B5BBF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 14px rgba(156, 114, 217, 0.35)', flexShrink: 0 }}>
          <BadgeIcon />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>Funcionários</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>Equipe da clínica veterinária</Typography>
        </Box>
      </Box>

      <DataGrid<Employee>
        data={employees}
        columns={columns}
        getRowId={(row) => row.publicId || row.id || ''}
        pageSize={pageSize}
        selectable
        headerActions={headerActions}
        actions={actions}
        emptyMessage="Nenhum funcionario cadastrado"
        onSelectionChange={setSelectedEmployees}
        loading={loading}
        onRefresh={fetchEmployees}
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

      <ConfirmDialog
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setEmployeeToDelete(null); }}
        onConfirm={confirmDelete}
        title="Confirmar Inativacao"
        titleIcon={<DeleteIcon sx={{ color: '#ef4444' }} />}
        message="Tem certeza que deseja inativar este funcionario?"
        confirmLabel="Inativar Funcionario"
        confirmIcon={<DeleteIcon />}
        loading={isInactivating}
        loadingLabel="Inativando..."
        footer="O funcionario sera marcado como inativo."
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
    </Box>
  );
};

export default EmployeesPage;
