import { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  Box,
  Button,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { DataGrid, FormDialog, ConfirmDialog, StatusChip, SearchField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { formatPhone, formatCpf, formatCep } from '@app/core';
import { customerService } from '../services';
import type { Customer, CustomerDto, SearchRequest } from '../types';

interface CustomerFormData {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  secondaryPhone: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  notes: string;
}

const initialFormData: CustomerFormData = {
  name: '',
  cpf: '',
  email: '',
  phone: '',
  secondaryPhone: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
  notes: '',
};

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<(string | number)[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);

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

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      cpf: customer.cpf || '',
      email: customer.email || '',
      phone: customer.phone || '',
      secondaryPhone: customer.secondaryPhone || '',
      street: customer.street || '',
      number: customer.number || '',
      complement: customer.complement || '',
      neighborhood: customer.neighborhood || '',
      city: customer.city || '',
      state: customer.state || '',
      zipCode: customer.zipCode || '',
      notes: customer.notes || '',
    });
    setShowForm(true);
  };

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

  const handleAddNew = () => {
    setEditingCustomer(null);
    setFormData(initialFormData);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const customerData: CustomerDto = {
        name: formData.name,
        cpf: formData.cpf || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        secondaryPhone: formData.secondaryPhone || undefined,
        street: formData.street || undefined,
        number: formData.number || undefined,
        complement: formData.complement || undefined,
        neighborhood: formData.neighborhood || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        notes: formData.notes || undefined,
      };

      if (editingCustomer?.publicId) {
        await customerService.updateCustomer(editingCustomer.publicId, customerData);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await customerService.createCustomer(customerData);
        toast.success('Cliente criado com sucesso!');
      }

      setShowForm(false);
      setCurrentPage(1);
      fetchCustomers();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: DataGridColumn<Customer>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (customer) => (
        <div style={{ fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PersonIcon sx={{ fontSize: 16, color: '#6b7280' }} />
          {customer.name}
        </div>
      ),
    },
    { key: 'cpf', header: 'CPF' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Telefone', render: (customer) => customer.phone ? formatPhone(customer.phone) : '-' },
    {
      key: 'city',
      header: 'Cidade',
      render: (customer) => customer.city ? `${customer.city}/${customer.state || ''}` : '-',
    },
    {
      key: 'active',
      header: 'Status',
      sortable: true,
      render: (customer) => <StatusChip active={customer.active ?? null} />,
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
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
      <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}>
        Novo Cliente
      </Button>
    </div>
  );

  const actions = [
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Editar',
      onClick: (customer: Customer) => handleEdit(customer),
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
    <>
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
      />

      <FormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        title={editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
        titleIcon={<PersonIcon sx={{ color: '#9C72D9' }} />}
        submitLabel={loading ? 'Salvando...' : editingCustomer ? 'Atualizar' : 'Criar'}
        loading={loading}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">Dados Pessoais</Typography>
          <TextField fullWidth label="Nome" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <TextField fullWidth label="CPF" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: formatCpf(e.target.value) })} placeholder="000.000.000-00" />
          <TextField fullWidth label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField fullWidth label="Telefone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" />
            <TextField fullWidth label="Telefone Secundário" value={formData.secondaryPhone} onChange={(e) => setFormData({ ...formData, secondaryPhone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" />
          </Box>

          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Endereço</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField sx={{ flex: 3 }} label="Rua" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} />
            <TextField sx={{ flex: 1 }} label="Número" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} />
          </Box>
          <TextField fullWidth label="Complemento" value={formData.complement} onChange={(e) => setFormData({ ...formData, complement: e.target.value })} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField fullWidth label="Bairro" value={formData.neighborhood} onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })} />
            <TextField fullWidth label="Cidade" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField fullWidth label="Estado" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
            <TextField fullWidth label="CEP" value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: formatCep(e.target.value) })} placeholder="00000-000" />
          </Box>

          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Observações</Typography>
          <TextField fullWidth label="Notas" multiline rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
        </Box>
      </FormDialog>

      <ConfirmDialog
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setCustomerToDelete(null); }}
        onConfirm={confirmDelete}
        title="Confirmar Inativação"
        titleIcon={<DeleteIcon sx={{ color: '#ef4444' }} />}
        message="Tem certeza que deseja inativar este cliente?"
        confirmLabel="Inativar Cliente"
        confirmIcon={<DeleteIcon />}
        loading={isInactivating}
        loadingLabel="Inativando..."
        footer="O cliente será marcado como inativo."
      >
        {customerToDelete && (
          <Box sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 1, border: '1px solid #e5e7eb' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827' }}>
              {customerToDelete.name}
            </Typography>
            {customerToDelete.email && (
              <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                {customerToDelete.email}
              </Typography>
            )}
          </Box>
        )}
      </ConfirmDialog>
    </>
  );
};

export default CustomersPage;
