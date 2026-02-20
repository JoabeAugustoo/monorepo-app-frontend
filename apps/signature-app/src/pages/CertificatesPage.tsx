import { useState, useEffect, useCallback } from 'react';
import { Button, Typography, TextField, MenuItem } from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { DataGrid, ConfirmDialog, SearchField } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { formatDate, useSearchDebounce } from '@app/core';
import { certificateService, applicationService, companyService } from '../services';
import { useRefresh } from '../contexts/RefreshContext';
import { CertificateUploadDialog } from '../components/certificates/CertificateUploadDialog';
import { formatCnpj } from '../utils/format';
import type { Certificate, Application, SearchRequest } from '../types';

const CertificatesPage = () => {
  const { triggerMultipleRefresh } = useRefresh();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [certToDelete, setCertToDelete] = useState<Certificate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const { inputValue: searchInput, setInputValue: setSearchInput, debouncedValue: searchTerm } = useSearchDebounce();

  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');

  const [applicationsList, setApplicationsList] = useState<Application[]>([]);
  const [uniqueCnpjs, setUniqueCnpjs] = useState<{ cnpj: string; name: string }[]>([]);
  const [filterApplication, setFilterApplication] = useState('');
  const [filterCnpj, setFilterCnpj] = useState('');

  useEffect(() => {
    applicationService.findActive().then(setApplicationsList).catch(() => {});
    companyService.findActive().then((companies) => {
      const seen = new Map<string, string>();
      companies.forEach((c) => { if (!seen.has(c.cnpj)) seen.set(c.cnpj, c.name); });
      setUniqueCnpjs(Array.from(seen, ([cnpj, name]) => ({ cnpj, name })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);
      const where: Record<string, unknown> = {};
      if (searchTerm.trim()) where.name = { contains: searchTerm.trim() };
      if (filterApplication) where.applicationPublicId = filterApplication;
      if (filterCnpj) where.companyCnpj = filterCnpj;
      const searchRequest: SearchRequest = {
        where,
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        sort: [{ field: sortField, direction: sortDirection }],
      };
      const response = await certificateService.search(searchRequest);
      if (response?.data) {
        setCertificates(response.data);
        setTotalItems(response.total || 0);
      } else {
        setCertificates([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar certificados:', error);
      setCertificates([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, filterApplication, filterCnpj, sortField, sortDirection]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const confirmDelete = async () => {
    if (!certToDelete?.publicId) return;
    try {
      setIsDeleting(true);
      await certificateService.delete(certToDelete.publicId);
      toast.success(`Certificado "${certToDelete.name}" excluido com sucesso!`);
      setShowDeleteModal(false);
      setCertToDelete(null);
      triggerMultipleRefresh(['certificates', 'dashboard']);
      fetchCertificates();
    } catch (error) {
      console.error('Erro ao excluir certificado:', error);
      toast.error('Erro ao excluir certificado');
    } finally {
      setIsDeleting(false);
    }
  };

  const isExpired = (validTo: string) => new Date(validTo) < new Date();

  const columns: DataGridColumn<Certificate>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (cert: Certificate) => (
        <Typography variant="body2" fontWeight={500} noWrap>
          {cert.name}
        </Typography>
      ),
    },
    {
      key: 'subjectCn',
      header: 'Titular',
      render: (cert: Certificate) => (
        <Typography variant="body2" noWrap>{cert.subjectCn}</Typography>
      ),
    },
    {
      key: 'issuerCn',
      header: 'Emissor',
      render: (cert: Certificate) => (
        <Typography variant="body2" noWrap>{cert.issuerCn}</Typography>
      ),
    },
    {
      key: 'validFrom',
      header: 'Valido De',
      render: (cert: Certificate) => (
        <Typography variant="body2">{formatDate(cert.validFrom)}</Typography>
      ),
    },
    {
      key: 'validTo',
      header: 'Valido Ate',
      render: (cert: Certificate) => (
        <Typography variant="body2" sx={{ color: isExpired(cert.validTo) ? '#ef4444' : 'inherit', fontWeight: isExpired(cert.validTo) ? 600 : 400 }}>
          {formatDate(cert.validTo)}
          {isExpired(cert.validTo) && ' (Expirado)'}
        </Typography>
      ),
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <SearchField value={searchInput} onChange={setSearchInput} placeholder="Buscar certificados..." />
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
      <TextField
        select
        size="small"
        value={filterCnpj}
        onChange={(e) => { setFilterCnpj(e.target.value); setCurrentPage(1); }}
        label="Empresa (CNPJ)"
        sx={{ minWidth: 220 }}
      >
        <MenuItem value="">Todas</MenuItem>
        {uniqueCnpjs.map((c) => (
          <MenuItem key={c.cnpj} value={c.cnpj}>{c.name} - {formatCnpj(c.cnpj)}</MenuItem>
        ))}
      </TextField>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowUpload(true)}>
        Upload Certificado
      </Button>
    </div>
  );

  const actions = [
    {
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Excluir',
      onClick: (cert: Certificate) => { setCertToDelete(cert); setShowDeleteModal(true); },
      color: 'error' as const,
    },
  ];

  return (
    <>
      <DataGrid<Certificate>
        data={certificates}
        columns={columns}
        getRowId={(row) => row.publicId}
        pageSize={pageSize}
        headerActions={headerActions}
        actions={actions}
        emptyMessage="Nenhum certificado cadastrado"
        loading={loading}
        onRefresh={fetchCertificates}
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

      <CertificateUploadDialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={() => {
          setShowUpload(false);
          triggerMultipleRefresh(['certificates', 'dashboard']);
          fetchCertificates();
        }}
      />

      <ConfirmDialog
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setCertToDelete(null); }}
        onConfirm={confirmDelete}
        title="Confirmar Exclusao"
        titleIcon={<DeleteIcon sx={{ color: '#ef4444' }} />}
        message={`Tem certeza que deseja excluir o certificado "${certToDelete?.name}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmIcon={<DeleteIcon />}
        loading={isDeleting}
        loadingLabel="Excluindo..."
      />
    </>
  );
};

export default CertificatesPage;
