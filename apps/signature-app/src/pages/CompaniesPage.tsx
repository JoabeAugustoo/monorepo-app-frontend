import { useState, useEffect, useCallback } from 'react';
import { Button, Stack, Box, Typography, alpha, TextField, MenuItem } from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  CheckCircle as ActivateIcon,
  Block as DeactivateIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { DataGrid, ConfirmDialog, StatusChip, SearchField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { useSearchDebounce } from '@app/core';
import { companyService, applicationService } from '../services';
import { useRefresh } from '../contexts/RefreshContext';
import { CompanyFormDialog } from '../components/companies/CompanyFormDialog';
import { formatCnpj } from '../utils/format';
import type { Company, Application, SearchRequest } from '../types';

const CompaniesPage = () => {
  const { triggerMultipleRefresh } = useRefresh();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const { inputValue: searchInput, setInputValue: setSearchInput, debouncedValue: searchTerm } = useSearchDebounce();

  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');

  const [applicationsList, setApplicationsList] = useState<Application[]>([]);
  const [applicationsMap, setApplicationsMap] = useState<Record<string, string>>({});
  const [filterApplication, setFilterApplication] = useState('');

  useEffect(() => {
    applicationService.findActive().then((apps) => {
      setApplicationsList(apps);
      const map: Record<string, string> = {};
      apps.forEach((a: Application) => { map[a.publicId] = a.name; });
      setApplicationsMap(map);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const where: Record<string, unknown> = {};
      if (searchTerm.trim()) where.name = { contains: searchTerm.trim() };
      if (filterApplication) where.applicationPublicId = filterApplication;
      const searchRequest: SearchRequest = {
        where,
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        sort: [{ field: sortField, direction: sortDirection }],
      };
      const response = await companyService.search(searchRequest);
      if (response?.data) {
        setCompanies(response.data);
        setTotalItems(response.total || 0);
      } else {
        setCompanies([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      setCompanies([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, filterApplication, sortField, sortDirection]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleDelete = (company: Company) => {
    setCompanyToDelete(company);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete?.publicId) return;
    try {
      setIsDeleting(true);
      await companyService.delete(companyToDelete.publicId);
      toast.success(`Empresa "${companyToDelete.name}" excluida com sucesso!`);
      setShowDeleteModal(false);
      setCompanyToDelete(null);
      triggerMultipleRefresh(['companies', 'dashboard']);
      fetchCompanies();
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      toast.error('Erro ao excluir empresa');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (company: Company) => {
    try {
      if (company.active) {
        await companyService.deactivate(company.publicId);
        toast.success(`Empresa "${company.name}" desativada`);
      } else {
        await companyService.activate(company.publicId);
        toast.success(`Empresa "${company.name}" ativada`);
      }
      fetchCompanies();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCompany(null);
    triggerMultipleRefresh(['companies', 'dashboard']);
    fetchCompanies();
  };

  const columns: DataGridColumn<Company>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (company: Company) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1,
              flexShrink: 0,
              background: company.active
                ? 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)'
                : alpha('#9e9e9e', 0.2),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BusinessIcon sx={{ fontSize: 16, color: company.active ? 'white' : '#9e9e9e' }} />
          </Box>
          <Typography variant="body2" fontWeight={500} noWrap>
            {company.name}
          </Typography>
        </Stack>
      ),
    },
    {
      key: 'cnpj',
      header: 'CNPJ',
      render: (company: Company) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
          {formatCnpj(company.cnpj)}
        </Typography>
      ),
    },
    {
      key: 'applicationPublicId',
      header: 'Aplicacao',
      render: (company: Company) => (
        <Typography variant="body2" noWrap>
          {company.applicationPublicId ? applicationsMap[company.applicationPublicId] || '-' : '-'}
        </Typography>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      sortable: true,
      render: (company: Company) => <StatusChip active={company.active ?? null} />,
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <SearchField value={searchInput} onChange={setSearchInput} placeholder="Buscar empresas..." />
      <TextField
        select
        size="small"
        value={filterApplication}
        onChange={(e) => { setFilterApplication(e.target.value); setCurrentPage(1); }}
        label="Aplicacao"
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="">Todas</MenuItem>
        {applicationsList.map((a) => (
          <MenuItem key={a.publicId} value={a.publicId}>{a.name}</MenuItem>
        ))}
      </TextField>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingCompany(null); setShowForm(true); }}>
        Nova Empresa
      </Button>
    </div>
  );

  const actions = [
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Editar',
      onClick: (company: Company) => { setEditingCompany(company); setShowForm(true); },
      color: 'primary' as const,
    },
    {
      icon: <ActivateIcon fontSize="small" />,
      tooltip: 'Ativar',
      onClick: (company: Company) => handleToggleStatus(company),
      color: 'success' as const,
      hidden: (company: Company) => company.active,
    },
    {
      icon: <DeactivateIcon fontSize="small" />,
      tooltip: 'Desativar',
      onClick: (company: Company) => handleToggleStatus(company),
      color: 'warning' as const,
      hidden: (company: Company) => !company.active,
    },
    {
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Excluir',
      onClick: (company: Company) => handleDelete(company),
      color: 'error' as const,
    },
  ];

  return (
    <>
      <DataGrid<Company>
        data={companies}
        columns={columns}
        getRowId={(row) => row.publicId}
        pageSize={pageSize}
        headerActions={headerActions}
        actions={actions}
        emptyMessage="Nenhuma empresa cadastrada"
        loading={loading}
        onRefresh={fetchCompanies}
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

      <CompanyFormDialog
        open={showForm}
        company={editingCompany}
        onClose={() => { setShowForm(false); setEditingCompany(null); }}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setCompanyToDelete(null); }}
        onConfirm={confirmDelete}
        title="Confirmar Exclusao"
        titleIcon={<DeleteIcon sx={{ color: '#ef4444' }} />}
        message={`Tem certeza que deseja excluir a empresa "${companyToDelete?.name}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmIcon={<DeleteIcon />}
        loading={isDeleting}
        loadingLabel="Excluindo..."
      />
    </>
  );
};

export default CompaniesPage;
