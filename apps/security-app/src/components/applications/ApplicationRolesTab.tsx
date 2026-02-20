import { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, Stack, Chip, alpha } from '@mui/material';
import {
  Add as AddIcon,
  Security as SecurityIcon,
  Public as PublicIcon,
} from '@mui/icons-material';
import { DataGrid, StatusChip, SearchField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { applicationService } from '../../services';
import { usePermissions } from '../../hooks/usePermissions';
import type { ApplicationRoleSearchResponse, SearchRequest } from '../../types';

interface ApplicationRolesTabProps {
  applicationId: string;
  applicationName: string;
}

export function ApplicationRolesTab({ applicationId }: ApplicationRolesTabProps) {
  const { canWriteApps } = usePermissions();
  const [roles, setRoles] = useState<ApplicationRoleSearchResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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
      const searchRequest: SearchRequest = {
        where: searchTerm.trim() ? { name: { contains: searchTerm.trim() } } : {},
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        sort: [{ field: 'name', direction: 'ASC' }],
      };
      const response = await applicationService.searchApplicationRoles(applicationId, searchRequest);
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
  }, [applicationId, currentPage, pageSize, searchTerm]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const columns: DataGridColumn<ApplicationRoleSearchResponse>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (role) => {
        const roleName = role.name?.replace('ROLE_', '') || '';
        const isActive = role.active;
        const isGlobal = role.isGlobal;
        return (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1,
                flexShrink: 0,
                background: isActive
                  ? isGlobal
                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                    : 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
                  : alpha('#9e9e9e', 0.2),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isGlobal ? (
                <PublicIcon sx={{ fontSize: 16, color: isActive ? 'white' : '#9e9e9e' }} />
              ) : (
                <SecurityIcon sx={{ fontSize: 16, color: isActive ? 'white' : '#9e9e9e' }} />
              )}
            </Box>
            <Typography variant="body2" fontWeight={500} noWrap sx={{ lineHeight: 1.2 }}>
              {roleName}
            </Typography>
          </Stack>
        );
      },
    },
    {
      key: 'isGlobal',
      header: 'Tipo',
      render: (role) => (
        <Chip
          label={role.isGlobal ? 'Global' : 'Dominio'}
          size="small"
          color={role.isGlobal ? 'primary' : 'secondary'}
          variant="outlined"
        />
      ),
    },
    {
      key: 'description',
      header: 'Descricao',
      render: (role) => (
        <Typography variant="body2" color={role.description ? 'text.primary' : 'text.disabled'} noWrap>
          {role.description || 'Sem descricao'}
        </Typography>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      render: (role) => <StatusChip active={role.active} />,
    },
  ];

  const headerActions = (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <SearchField value={searchInput} onChange={setSearchInput} placeholder="Buscar roles..." />
    </Box>
  );

  return (
    <DataGrid<ApplicationRoleSearchResponse>
      data={roles}
      columns={columns}
      getRowId={(row) => row.publicId}
      pageSize={pageSize}
      headerActions={headerActions}
      emptyMessage="Nenhuma role nesta aplicacao"
      loading={loading}
      serverSidePagination
      page={currentPage}
      totalRows={totalItems}
      onPageChange={setCurrentPage}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setCurrentPage(1);
      }}
      onRefresh={fetchRoles}
    />
  );
}
