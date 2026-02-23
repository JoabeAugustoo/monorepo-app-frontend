import React, { useState, useEffect, useCallback } from 'react';
import { Button, TextField, Box, Stack, Typography, alpha, Grid2 as Grid, InputAdornment } from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  CheckCircle as ActivateIcon,
  Block as DeactivateIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { DataGrid, FormDialog, ConfirmDialog, StatusChip, SearchField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { roleService } from '../services';
import { useRefresh } from '../contexts/RefreshContext';
import { usePermissions } from '../hooks/usePermissions';
import type { Role, SearchRequest } from '../types';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const roleSchema = z.object({
  name: z.string().min(1, 'Nome obrigatorio'),
  description: z.string().optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

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

const RolesPage = () => {
  const { triggerMultipleRefresh } = useRefresh();
  const { canWriteRoles } = usePermissions();

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const where: Record<string, unknown> = { isAdministrative: true };
      if (searchTerm.trim()) {
        where.name = { contains: searchTerm.trim() };
      }
      const searchRequest: SearchRequest = {
        where,
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        sort: [{ field: sortField, direction: sortDirection }],
      };
      const response = await roleService.search(searchRequest);
      if (response?.data) {
        setRoles(response.data);
        setTotalItems(response.total || 0);
      } else {
        setRoles([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar roles:', error);
      setRoles([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, sortField, sortDirection]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleAddNew = () => {
    setEditingRole(null);
    reset({ name: '', description: '' });
    setShowForm(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    reset({ name: role.name, description: role.description || '' });
    setShowForm(true);
  };

  const handleDelete = (role: Role) => {
    setRoleToDelete(role);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!roleToDelete?.publicId) return;
    try {
      setIsDeleting(true);
      await roleService.delete(roleToDelete.publicId);
      toast.success(`Role "${roleToDelete.name}" excluida com sucesso!`);
      setShowDeleteModal(false);
      setRoleToDelete(null);
      fetchRoles();
    } catch (error) {
      console.error('Erro ao excluir role:', error);
      toast.error('Erro ao excluir role');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (role: Role) => {
    try {
      if (role.active) {
        await roleService.deactivate(role.publicId);
        toast.success(`Role "${role.name}" desativada`);
      } else {
        await roleService.activate(role.publicId);
        toast.success(`Role "${role.name}" ativada`);
      }
      fetchRoles();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const onSubmit = async (data: RoleFormData) => {
    try {
      if (editingRole?.publicId) {
        await roleService.update(editingRole.publicId, data);
        toast.success('Role atualizada com sucesso!');
      } else {
        await roleService.create(data);
        toast.success('Role criada com sucesso!');
      }
      triggerMultipleRefresh(['roles', 'dashboard']);
      setShowForm(false);
      setCurrentPage(1);
      fetchRoles();
    } catch (error) {
      console.error('Erro ao salvar role:', error);
      toast.error('Erro ao salvar role');
    }
  };

  const columns: DataGridColumn<Role>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (role: Role) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1,
              flexShrink: 0,
              background: role.active
                ? 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
                : alpha('#9e9e9e', 0.2),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SecurityIcon sx={{ fontSize: 16, color: role.active ? 'white' : '#9e9e9e' }} />
          </Box>
          <Typography variant="body2" fontWeight={500} noWrap>
            {role.name.replace('ROLE_', '')}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'description',
      header: 'Descricao',
      render: (role: Role) => (
        <Typography variant="body2" color={role.description ? 'text.primary' : 'text.disabled'} noWrap>
          {role.description || 'Sem descricao'}
        </Typography>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      sortable: true,
      render: (role: Role) => <StatusChip active={role.active ?? null} />,
    },
    {
      key: 'createdAt',
      header: 'Criado em',
      render: (role: Role) => (
        <span style={{ fontSize: '13px', color: '#6b7280' }}>
          {new Date(role.createdAt).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <SearchField value={searchInput} onChange={setSearchInput} placeholder="Buscar roles..." />
      {canWriteRoles && (
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNew}>
          Nova Role
        </Button>
      )}
    </div>
  );

  const actions = canWriteRoles
    ? [
        {
          icon: <EditIcon fontSize="small" />,
          tooltip: 'Editar',
          onClick: (role: Role) => handleEdit(role),
          color: 'primary',
        },
        {
          icon: <ActivateIcon fontSize="small" />,
          tooltip: 'Ativar',
          onClick: (role: Role) => handleToggleStatus(role),
          color: 'success' as const,
          hidden: (role: Role) => role.active,
        },
        {
          icon: <DeactivateIcon fontSize="small" />,
          tooltip: 'Desativar',
          onClick: (role: Role) => handleToggleStatus(role),
          color: 'warning' as const,
          hidden: (role: Role) => !role.active,
        },
        {
          icon: <DeleteIcon fontSize="small" />,
          tooltip: 'Excluir',
          onClick: (role: Role) => handleDelete(role),
          color: 'error',
        },
      ]
    : undefined;

  return (
    <>
      <DataGrid<Role>
        data={roles}
        columns={columns}
        getRowId={(row) => row.publicId}
        pageSize={pageSize}
        headerActions={headerActions}
        actions={actions}
        emptyMessage="Nenhuma role cadastrada"
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
        onRefresh={fetchRoles}
      />

      <FormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit(onSubmit)}
        title={editingRole ? 'Editar Role' : 'Nova Role'}
        titleIcon={<SecurityIcon sx={{ color: '#3F51B5' }} />}
        submitLabel={isSubmitting ? 'Salvando...' : editingRole ? 'Atualizar' : 'Criar'}
        loading={isSubmitting}
        maxWidth="md"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <Box sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: '16px', border: '1px solid', borderColor: (theme) => alpha(theme.palette.divider, 0.08), boxShadow: `0 1px 3px ${alpha('#000', 0.04)}` }}>
            <SectionHeader icon={<SecurityIcon sx={{ fontSize: 20 }} />} title="Informações da Role" subtitle="Nome e descricao da role" />
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Nome" required error={!!errors.name} helperText={errors.name?.message} InputProps={{ startAdornment: <InputAdornment position="start"><SecurityIcon sx={{ color: '#9C72D9', fontSize: 20 }} /></InputAdornment> }} />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Descricao" multiline rows={3} InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}><DescriptionIcon sx={{ color: '#9C72D9', fontSize: 20 }} /></InputAdornment> }} />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </Box>
      </FormDialog>

      <ConfirmDialog
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setRoleToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Confirmar Exclusao"
        titleIcon={<DeleteIcon sx={{ color: '#ef4444' }} />}
        message={`Tem certeza que deseja excluir a role "${roleToDelete?.name}"?`}
        confirmLabel="Excluir"
        confirmIcon={<DeleteIcon />}
        loading={isDeleting}
        loadingLabel="Excluindo..."
      />
    </>
  );
};

export default RolesPage;
