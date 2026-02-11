import { useState, useEffect, useCallback } from 'react';
import { Box, Chip, Stack, Typography, alpha } from '@mui/material';
import {
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { DataGrid, ConfirmDialog, StatusChip, SearchField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { applicationService } from '../../services';
import { usePermissions } from '../../hooks/usePermissions';
import type { ApplicationUserSearchResponse, SearchRequest } from '../../types';

interface ApplicationUsersTabProps {
  applicationId: string;
  applicationName: string;
}

export function ApplicationUsersTab({ applicationId, applicationName }: ApplicationUsersTabProps) {
  const { canWriteApps } = usePermissions();
  const [users, setUsers] = useState<ApplicationUserSearchResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [userToRemove, setUserToRemove] = useState<ApplicationUserSearchResponse | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const searchRequest: SearchRequest = {
        where: searchTerm.trim() ? { userName: { contains: searchTerm.trim() } } : {},
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        sort: [{ field: 'userName', direction: 'ASC' }],
      };
      const response = await applicationService.searchApplicationUsers(applicationId, searchRequest);
      if (response?.data) {
        setUsers(response.data);
        setTotalItems(response.total || 0);
      } else {
        setUsers([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar usuarios:', error);
      setUsers([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [applicationId, currentPage, pageSize, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRemoveUser = (user: ApplicationUserSearchResponse) => {
    setUserToRemove(user);
    setShowRemoveModal(true);
  };

  const confirmRemove = async () => {
    if (!userToRemove?.publicId) return;
    try {
      setIsRemoving(true);
      await applicationService.removeUserFromApplication(applicationId, userToRemove.publicId);
      toast.success(`Usuario "${userToRemove.userName}" removido da aplicacao`);
      setShowRemoveModal(false);
      setUserToRemove(null);
      fetchUsers();
    } catch (error) {
      console.error('Erro ao remover usuario:', error);
      toast.error('Erro ao remover usuario');
    } finally {
      setIsRemoving(false);
    }
  };

  const columns: DataGridColumn<ApplicationUserSearchResponse>[] = [
    {
      key: 'userName',
      header: 'Usuario',
      sortable: true,
      render: (user) => {
        const initials = (user.userName || '?').substring(0, 2).toUpperCase();
        return (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1,
                flexShrink: 0,
                background: user.active
                  ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                  : alpha('#9e9e9e', 0.3),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: user.active ? 'white' : '#9e9e9e',
              }}
            >
              {initials}
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={500} noWrap>
                {user.userName}
              </Typography>
              {(user.firstName || user.lastName) && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {[user.firstName, user.lastName].filter(Boolean).join(' ')}
                </Typography>
              )}
            </Box>
          </Stack>
        );
      },
    },
    {
      key: 'email',
      header: 'Email',
      render: (user) => (
        <Typography variant="body2" color="text.secondary" noWrap>
          {user.email}
        </Typography>
      ),
    },
    {
      key: 'roles',
      header: 'Roles',
      render: (user) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
          {user.roles && user.roles.length > 0 ? (
            <>
              {user.roles.slice(0, 2).map((role) => (
                <Chip key={role.publicId} label={role.name.replace('ROLE_', '')} size="small" color="primary" variant="outlined" />
              ))}
              {user.roles.length > 2 && (
                <Chip label={`+${user.roles.length - 2}`} size="small" variant="outlined" />
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
      render: (user) => <StatusChip active={user.active} />,
    },
  ];

  const headerActions = (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <SearchField value={searchInput} onChange={setSearchInput} placeholder="Buscar usuarios..." />
    </Box>
  );

  const actions = canWriteApps
    ? [
        {
          icon: <DeleteIcon fontSize="small" />,
          tooltip: 'Remover da aplicacao',
          onClick: (user: ApplicationUserSearchResponse) => handleRemoveUser(user),
          color: 'error' as const,
        },
      ]
    : undefined;

  return (
    <>
      <DataGrid<ApplicationUserSearchResponse>
        data={users}
        columns={columns}
        getRowId={(row) => row.publicId}
        pageSize={pageSize}
        headerActions={headerActions}
        actions={actions}
        emptyMessage="Nenhum usuario nesta aplicacao"
        loading={loading}
        serverSidePagination
        page={currentPage}
        totalRows={totalItems}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
      />

      <ConfirmDialog
        open={showRemoveModal}
        onClose={() => {
          setShowRemoveModal(false);
          setUserToRemove(null);
        }}
        onConfirm={confirmRemove}
        title="Remover Usuario"
        message={`Deseja remover o usuario "${userToRemove?.userName}" da aplicacao "${applicationName}"?`}
        confirmLabel="Remover"
        confirmIcon={<DeleteIcon />}
        loading={isRemoving}
        loadingLabel="Removendo..."
      />
    </>
  );
}
