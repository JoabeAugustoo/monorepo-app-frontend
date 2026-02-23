import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  alpha,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonSearch as TutorPanelIcon,
  Description as DocumentsIcon,
  LocalHospital as AtendimentoIcon,
  People as PeopleIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { DataGrid, ConfirmDialog, StatusChip, SearchField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { formatPhone } from '@app/core';
import { customerService } from '../services';
import type { Customer, SearchRequest } from '../types';

// --- Avatar helpers ---
const AVATAR_PALETTE = ['#9C72D9', '#F48FB1', '#81C9C5', '#7EB3E0', '#C9A6E8', '#FFD6A5'];

function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const CustomersPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<(string | number)[]>([]);
  const [loading, setLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isInactivating, setIsInactivating] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [sortField, setSortField] = useState('active');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  const fetchCustomers = useCallback(async () => {
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

      const response = await customerService.searchCustomers(searchRequest);
      if (response?.data) {
        setCustomers(response.data);
        setTotalItems(response.total || 0);
      } else {
        setCustomers([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setCustomers([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortField, sortDirection]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete?.publicId) return;
    try {
      setIsInactivating(true);
      await customerService.deactivateCustomer(customerToDelete.publicId);
      toast.success(`Cliente "${customerToDelete.name}" foi inativado com sucesso!`);
      setShowDeleteModal(false);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (error) {
      console.error('Erro ao inativar cliente:', error);
    } finally {
      setIsInactivating(false);
    }
  };

  // --- Columns ---
  const columns: DataGridColumn<Customer>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (customer) => {
        const color = nameToColor(customer.name || '');
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.25 }}>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                fontSize: '0.78rem',
                fontWeight: 700,
                bgcolor: alpha(color, 0.14),
                color,
                letterSpacing: '0.02em',
              }}
            >
              {getInitials(customer.name || '?')}
            </Avatar>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {customer.name}
            </Typography>
          </Box>
        );
      },
    },
    {
      key: 'cpf',
      header: 'CPF',
      render: (customer) => (
        <Typography
          variant="body2"
          sx={{
            fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", monospace',
            fontSize: '0.78rem',
            color: 'text.secondary',
            letterSpacing: '0.03em',
          }}
        >
          {customer.cpf || '-'}
        </Typography>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (customer) =>
        customer.email ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <EmailIcon sx={{ fontSize: 14, color: '#7EB3E0', opacity: 0.7 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.84rem' }}>
              {customer.email}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.disabled">-</Typography>
        ),
    },
    {
      key: 'phone',
      header: 'Telefone',
      render: (customer) =>
        customer.phone ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <PhoneIcon sx={{ fontSize: 14, color: '#81C9C5', opacity: 0.7 }} />
            <Typography variant="body2" sx={{ fontSize: '0.84rem' }}>
              {formatPhone(customer.phone)}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.disabled">-</Typography>
        ),
    },
    {
      key: 'city',
      header: 'Cidade',
      render: (customer) =>
        customer.city ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <LocationIcon sx={{ fontSize: 14, color: '#F48FB1', opacity: 0.7 }} />
            <Typography variant="body2" sx={{ fontSize: '0.84rem' }}>
              {customer.city}{customer.state ? `/${customer.state}` : ''}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.disabled">-</Typography>
        ),
    },
    {
      key: 'active',
      header: 'Status',
      sortable: true,
      render: (customer) => <StatusChip active={customer.active ?? null} />,
    },
  ];

  // --- Header actions ---
  const headerActions = (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
      <SearchField
        value={searchInput}
        onChange={setSearchInput}
        placeholder="Buscar clientes..."
      />
      {selectedCustomers.length > 0 && (
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={async () => {
            const count = selectedCustomers.length;
            if (window.confirm(`Tem certeza que deseja inativar ${count} cliente${count > 1 ? 's' : ''}?`)) {
              await Promise.all(selectedCustomers.map((id) => customerService.deactivateCustomer(String(id))));
              toast.success(`${count} cliente${count > 1 ? 's inativados' : ' inativado'} com sucesso!`);
              setSelectedCustomers([]);
              fetchCustomers();
            }
          }}
        >
          Inativar ({selectedCustomers.length})
        </Button>
      )}
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/clientes/novo')}>
        Novo Cliente
      </Button>
    </Box>
  );

  // --- Row actions ---
  const actions = [
    {
      icon: <TutorPanelIcon fontSize="small" />,
      tooltip: 'Painel do Tutor',
      onClick: (customer: Customer) => navigate('/painel-tutor', { state: { cpf: customer.cpf } }),
      color: 'secondary',
    },
    {
      icon: <DocumentsIcon fontSize="small" />,
      tooltip: 'Documentos',
      onClick: (customer: Customer) => navigate('/documentos', { state: { cpf: customer.cpf, customerId: customer.publicId } }),
      color: 'info',
    },
    {
      icon: <AtendimentoIcon fontSize="small" />,
      tooltip: 'Iniciar Atendimento',
      onClick: (customer: Customer) => navigate(`/atendimentos/novo?customerId=${customer.publicId}`),
      color: 'success',
    },
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Editar',
      onClick: (customer: Customer) => navigate(`/clientes/${customer.publicId}/editar`),
      color: 'primary',
    },
    {
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Inativar',
      onClick: (customer: Customer) => handleDelete(customer),
      color: 'error',
    },
  ];

  return (
    <Box>
      {/* ── Page header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            background: 'linear-gradient(135deg, #9C72D9 0%, #7B5BBF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(156, 114, 217, 0.35)',
            flexShrink: 0,
          }}
        >
          <PeopleIcon />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
            Clientes
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Gerencie os tutores cadastrados na clínica
          </Typography>
        </Box>
      </Box>

      {/* ── DataGrid ── */}
      <DataGrid<Customer>
        data={customers}
        columns={columns}
        getRowId={(row) => row.publicId || row.id || ''}
        pageSize={pageSize}
        selectable
        headerActions={headerActions}
        actions={actions}
        emptyMessage="Nenhum cliente cadastrado"
        onSelectionChange={setSelectedCustomers}
        loading={loading}
        onRefresh={fetchCustomers}
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

      {/* ── Confirm dialog ── */}
      <ConfirmDialog
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setCustomerToDelete(null); }}
        onConfirm={confirmDelete}
        title="Confirmar Inativacao"
        titleIcon={<DeleteIcon sx={{ color: '#ef4444' }} />}
        message="Tem certeza que deseja inativar este cliente?"
        confirmLabel="Inativar Cliente"
        confirmIcon={<DeleteIcon />}
        loading={isInactivating}
        loadingLabel="Inativando..."
        footer="O cliente sera marcado como inativo."
      >
        {customerToDelete && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.error.main, 0.06)
                  : '#fef2f2',
              border: '1px solid',
              borderColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.error.main, 0.15)
                  : '#fecaca',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  bgcolor: alpha(nameToColor(customerToDelete.name || ''), 0.14),
                  color: nameToColor(customerToDelete.name || ''),
                }}
              >
                {getInitials(customerToDelete.name || '?')}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                  {customerToDelete.name}
                </Typography>
                {customerToDelete.email && (
                  <Typography variant="caption" color="text.secondary">
                    {customerToDelete.email}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </ConfirmDialog>
    </Box>
  );
};

export default CustomersPage;
