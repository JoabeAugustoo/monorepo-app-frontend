import { useState, useEffect, useCallback } from 'react';
import { Button, Box, Stack, Typography, Chip, alpha } from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Key as KeyIcon,
  Refresh as RotateIcon,
  CheckCircle as ActivateIcon,
  Block as DeactivateIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { DataGrid, ConfirmDialog, StatusChip, SearchField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { clientService } from '../services';
import { useRefresh } from '../contexts/RefreshContext';
import { usePermissions } from '../hooks/usePermissions';
import { ClientFormDialog } from '../components/clients/ClientFormDialog';
import { ClientSecretDisplay } from '../components/clients/ClientSecretDisplay';
import type { Client, ClientWithSecret, SearchRequest } from '../types';

const ClientsPage = () => {
  const { triggerMultipleRefresh } = useRefresh();
  const { canWriteClients } = usePermissions();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showRotateModal, setShowRotateModal] = useState(false);
  const [clientToRotate, setClientToRotate] = useState<Client | null>(null);
  const [isRotating, setIsRotating] = useState(false);

  const [showSecret, setShowSecret] = useState(false);
  const [secretData, setSecretData] = useState<ClientWithSecret | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const searchRequest: SearchRequest = {
        where: searchTerm.trim() ? { name: { contains: searchTerm.trim() } } : {},
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        sort: [{ field: sortField, direction: sortDirection }],
      };
      const response = await clientService.search(searchRequest);
      if (response?.data) {
        setClients(response.data);
        setTotalItems(response.total || 0);
      } else {
        setClients([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar clients:', error);
      setClients([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortField, sortDirection]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleAddNew = () => {
    setEditingClient(null);
    setShowForm(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDelete = (client: Client) => {
    setClientToDelete(client);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete?.publicId) return;
    try {
      setIsDeleting(true);
      await clientService.delete(clientToDelete.publicId);
      toast.success(`Client "${clientToDelete.name}" excluido com sucesso!`);
      setShowDeleteModal(false);
      setClientToDelete(null);
      triggerMultipleRefresh(['clients', 'dashboard']);
      fetchClients();
    } catch (error) {
      console.error('Erro ao excluir client:', error);
      toast.error('Erro ao excluir client');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRotateSecret = (client: Client) => {
    setClientToRotate(client);
    setShowRotateModal(true);
  };

  const confirmRotate = async () => {
    if (!clientToRotate?.publicId) return;
    try {
      setIsRotating(true);
      const result = await clientService.rotateSecret(clientToRotate.publicId);
      setShowRotateModal(false);
      setClientToRotate(null);
      setSecretData(result);
      setShowSecret(true);
      toast.success('Secret rotacionado com sucesso!');
    } catch (error) {
      console.error('Erro ao rotacionar secret:', error);
      toast.error('Erro ao rotacionar secret');
    } finally {
      setIsRotating(false);
    }
  };

  const handleToggleStatus = async (client: Client) => {
    try {
      if (client.active) {
        await clientService.deactivate(client.publicId);
        toast.success(`Client "${client.name}" desativado`);
      } else {
        await clientService.activate(client.publicId);
        toast.success(`Client "${client.name}" ativado`);
      }
      fetchClients();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const handleFormSuccess = (clientWithSecret?: ClientWithSecret) => {
    setShowForm(false);
    setEditingClient(null);
    triggerMultipleRefresh(['clients', 'dashboard']);
    fetchClients();
    if (clientWithSecret) {
      setSecretData(clientWithSecret);
      setShowSecret(true);
    }
  };

  const columns: DataGridColumn<Client>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (client: Client) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1,
              flexShrink: 0,
              background: client.active
                ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                : alpha('#9e9e9e', 0.2),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <KeyIcon sx={{ fontSize: 16, color: client.active ? 'white' : '#9e9e9e' }} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={500} noWrap>
              {client.name}
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#6b7280' }} noWrap>
              {client.clientId}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      key: 'applicationName',
      header: 'Aplicacao',
      sortable: true,
      render: (client: Client) => (
        <Chip label={client.applicationName} size="small" color="primary" variant="outlined" />
      ),
    },
    {
      key: 'roles',
      header: 'Roles',
      render: (client: Client) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
          {client.roles && client.roles.length > 0 ? (
            <>
              {client.roles.slice(0, 2).map((role) => (
                <Chip key={role} label={role.replace('ROLE_', '')} size="small" variant="outlined" />
              ))}
              {client.roles.length > 2 && (
                <Chip label={`+${client.roles.length - 2}`} size="small" variant="outlined" />
              )}
            </>
          ) : (
            <Typography variant="caption" color="text.disabled">Sem roles</Typography>
          )}
        </Stack>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      sortable: true,
      render: (client: Client) => <StatusChip active={client.active ?? null} />,
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <SearchField value={searchInput} onChange={setSearchInput} placeholder="Buscar clients..." />
      {canWriteClients && (
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}>
          Novo Client
        </Button>
      )}
    </div>
  );

  const actions = canWriteClients
    ? [
        {
          icon: <EditIcon fontSize="small" />,
          tooltip: 'Editar',
          onClick: (client: Client) => handleEdit(client),
          color: 'primary' as const,
        },
        {
          icon: <RotateIcon fontSize="small" />,
          tooltip: 'Rotacionar Secret',
          onClick: (client: Client) => handleRotateSecret(client),
          color: 'info' as const,
        },
        {
          icon: <ActivateIcon fontSize="small" />,
          tooltip: 'Ativar',
          onClick: (client: Client) => handleToggleStatus(client),
          color: 'success' as const,
          hidden: (client: Client) => client.active,
        },
        {
          icon: <DeactivateIcon fontSize="small" />,
          tooltip: 'Desativar',
          onClick: (client: Client) => handleToggleStatus(client),
          color: 'warning' as const,
          hidden: (client: Client) => !client.active,
        },
        {
          icon: <DeleteIcon fontSize="small" />,
          tooltip: 'Excluir',
          onClick: (client: Client) => handleDelete(client),
          color: 'error' as const,
        },
      ]
    : undefined;

  return (
    <>
      <DataGrid<Client>
        data={clients}
        columns={columns}
        getRowId={(row) => row.publicId}
        pageSize={pageSize}
        headerActions={headerActions}
        actions={actions}
        emptyMessage="Nenhum client cadastrado"
        loading={loading}
        serverSidePagination
        page={currentPage}
        totalRows={totalItems}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
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

      <ClientFormDialog
        open={showForm}
        client={editingClient}
        onClose={() => {
          setShowForm(false);
          setEditingClient(null);
        }}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setClientToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Confirmar Exclusao"
        titleIcon={<DeleteIcon sx={{ color: '#ef4444' }} />}
        message={`Tem certeza que deseja excluir o client "${clientToDelete?.name}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmIcon={<DeleteIcon />}
        loading={isDeleting}
        loadingLabel="Excluindo..."
      />

      <ConfirmDialog
        open={showRotateModal}
        onClose={() => {
          setShowRotateModal(false);
          setClientToRotate(null);
        }}
        onConfirm={confirmRotate}
        title="Rotacionar Secret"
        titleIcon={<KeyIcon sx={{ color: '#3F51B5' }} />}
        message={`Deseja rotacionar o secret do client "${clientToRotate?.name}"? O secret atual sera invalidado imediatamente.`}
        confirmLabel="Rotacionar"
        confirmColor="warning"
        loading={isRotating}
        loadingLabel="Rotacionando..."
      />

      {secretData && (
        <ClientSecretDisplay
          open={showSecret}
          clientId={secretData.clientId}
          clientSecret={secretData.clientSecret}
          onClose={() => {
            setShowSecret(false);
            setSecretData(null);
          }}
        />
      )}
    </>
  );
};

export default ClientsPage;
