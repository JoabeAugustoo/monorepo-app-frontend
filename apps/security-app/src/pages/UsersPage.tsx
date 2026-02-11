import { useState, useEffect, useCallback } from 'react';
import { Button, TextField, Box, Stack, Typography, alpha } from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  CheckCircle as ActivateIcon,
  Block as DeactivateIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { DataGrid, FormDialog, ConfirmDialog, StatusChip, SearchField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { userService } from '../services';
import { useRefresh } from '../contexts/RefreshContext';
import { usePermissions } from '../hooks/usePermissions';
import { UserRoleAssignment } from '../components/users/UserRoleAssignment';
import type { User, SearchRequest } from '../types';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const userSchema = z.object({
  userName: z.string().min(1, 'Username obrigatorio'),
  email: z.string().email('Email invalido'),
  password: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

const UsersPage = () => {
  const { triggerMultipleRefresh } = useRefresh();
  const { canWriteUsers } = usePermissions();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showRoleAssignment, setShowRoleAssignment] = useState(false);
  const [roleAssignmentUser, setRoleAssignmentUser] = useState<User | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [sortField, setSortField] = useState('userName');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { userName: '', email: '', password: '', firstName: '', lastName: '' },
  });

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
        sort: [{ field: sortField, direction: sortDirection }],
      };
      const response = await userService.search(searchRequest);
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
  }, [currentPage, pageSize, searchTerm, sortField, sortDirection]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddNew = () => {
    setEditingUser(null);
    reset({ userName: '', email: '', password: '', firstName: '', lastName: '' });
    setShowForm(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    reset({
      userName: user.userName,
      email: user.email,
      password: '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    });
    setShowForm(true);
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete?.publicId) return;
    try {
      setIsDeleting(true);
      await userService.deactivate(userToDelete.publicId);
      toast.success(`Usuario "${userToDelete.userName}" inativado com sucesso!`);
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Erro ao inativar usuario:', error);
      toast.error('Erro ao inativar usuario');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      if (user.active) {
        await userService.deactivate(user.publicId);
        toast.success(`Usuario "${user.userName}" desativado`);
      } else {
        await userService.activate(user.publicId);
        toast.success(`Usuario "${user.userName}" ativado`);
      }
      fetchUsers();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      if (editingUser?.publicId) {
        const updateData: Record<string, string | undefined> = {
          userName: data.userName,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
        };
        if (data.password) updateData.password = data.password;
        await userService.update(editingUser.publicId, updateData);
        toast.success('Usuario atualizado com sucesso!');
      } else {
        await userService.create({
          userName: data.userName,
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        });
        toast.success('Usuario criado com sucesso!');
      }
      triggerMultipleRefresh(['users', 'dashboard']);
      setShowForm(false);
      setCurrentPage(1);
      fetchUsers();
    } catch (error) {
      console.error('Erro ao salvar usuario:', error);
      toast.error('Erro ao salvar usuario');
    }
  };

  const handleManageRoles = (user: User) => {
    setRoleAssignmentUser(user);
    setShowRoleAssignment(true);
  };

  const columns: DataGridColumn<User>[] = [
    {
      key: 'userName',
      header: 'Usuario',
      sortable: true,
      render: (user: User) => {
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
              <Typography variant="caption" color="text.secondary" noWrap>
                {user.email}
              </Typography>
            </Box>
          </Stack>
        );
      },
    },
    {
      key: 'firstName',
      header: 'Nome',
      sortable: true,
      render: (user: User) => (
        <Typography variant="body2" color="text.primary" noWrap>
          {[user.firstName, user.lastName].filter(Boolean).join(' ') || '-'}
        </Typography>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      sortable: true,
      render: (user: User) => <StatusChip active={user.active ?? null} />,
    },
    {
      key: 'createdAt',
      header: 'Criado em',
      render: (user: User) => (
        <span style={{ fontSize: '13px', color: '#6b7280' }}>
          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <SearchField value={searchInput} onChange={setSearchInput} placeholder="Buscar usuarios..." />
      {canWriteUsers && (
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}>
          Novo Usuario
        </Button>
      )}
    </div>
  );

  const actions = canWriteUsers
    ? [
        {
          icon: <EditIcon fontSize="small" />,
          tooltip: 'Editar',
          onClick: (user: User) => handleEdit(user),
          color: 'primary',
        },
        {
          icon: <PersonIcon fontSize="small" />,
          tooltip: 'Gerenciar Roles',
          onClick: (user: User) => handleManageRoles(user),
          color: 'info' as const,
        },
        {
          icon: <ActivateIcon fontSize="small" />,
          tooltip: 'Ativar',
          onClick: (user: User) => handleToggleStatus(user),
          color: 'success' as const,
          hidden: (user: User) => user.active,
        },
        {
          icon: <DeactivateIcon fontSize="small" />,
          tooltip: 'Desativar',
          onClick: (user: User) => handleToggleStatus(user),
          color: 'warning' as const,
          hidden: (user: User) => !user.active,
        },
        {
          icon: <DeleteIcon fontSize="small" />,
          tooltip: 'Inativar',
          onClick: (user: User) => handleDelete(user),
          color: 'error',
        },
      ]
    : undefined;

  return (
    <>
      <DataGrid<User>
        data={users}
        columns={columns}
        getRowId={(row) => row.publicId}
        pageSize={pageSize}
        headerActions={headerActions}
        actions={actions}
        emptyMessage="Nenhum usuario cadastrado"
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

      <FormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit(onSubmit)}
        title={editingUser ? 'Editar Usuario' : 'Novo Usuario'}
        titleIcon={<PersonIcon sx={{ color: '#3F51B5' }} />}
        submitLabel={isSubmitting ? 'Salvando...' : editingUser ? 'Atualizar' : 'Criar'}
        loading={isSubmitting}
        maxWidth="sm"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Controller
            name="userName"
            control={control}
            render={({ field }) => (
              <TextField {...field} fullWidth label="Username" required error={!!errors.userName} helperText={errors.userName?.message} />
            )}
          />
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField {...field} fullWidth label="Email" type="email" required error={!!errors.email} helperText={errors.email?.message} />
            )}
          />
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Senha"
                type="password"
                helperText={editingUser ? 'Deixe em branco para manter a senha atual' : undefined}
              />
            )}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Nome" />
              )}
            />
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Sobrenome" />
              )}
            />
          </Box>
        </Box>
      </FormDialog>

      <ConfirmDialog
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setUserToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Confirmar Inativacao"
        titleIcon={<DeleteIcon sx={{ color: '#ef4444' }} />}
        message={`Tem certeza que deseja inativar o usuario "${userToDelete?.userName}"?`}
        confirmLabel="Inativar"
        confirmIcon={<DeleteIcon />}
        loading={isDeleting}
        loadingLabel="Inativando..."
      />

      {roleAssignmentUser && (
        <UserRoleAssignment
          open={showRoleAssignment}
          user={roleAssignmentUser}
          onClose={() => {
            setShowRoleAssignment(false);
            setRoleAssignmentUser(null);
          }}
        />
      )}
    </>
  );
};

export default UsersPage;
