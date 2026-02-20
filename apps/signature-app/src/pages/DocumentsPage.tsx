import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, TextField, MenuItem, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  FileDownload as DownloadOriginalIcon,
  VerifiedUser as DownloadSignedIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { DataGrid, SearchField } from '@app/ui';
import type { DataGridColumn, DataGridAction } from '@app/ui';
import { formatDateTime, useSearchDebounce } from '@app/core';
import { documentService, applicationService, companyService } from '../services';
import { useRefresh } from '../contexts/RefreshContext';
import { DocumentUploadDialog } from '../components/documents/DocumentUploadDialog';
import { DocumentStatusChip } from '../components/shared/DocumentStatusChip';
import { formatCnpj } from '../utils/format';
import { DocumentStatus, type Document, type Application, type SearchRequest } from '../types';

const DocumentsPage = () => {
  const navigate = useNavigate();
  const { triggerMultipleRefresh } = useRefresh();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const { inputValue: searchInput, setInputValue: setSearchInput, debouncedValue: searchTerm } = useSearchDebounce();

  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

  const [applicationsList, setApplicationsList] = useState<Application[]>([]);
  const [uniqueCnpjs, setUniqueCnpjs] = useState<{ cnpj: string; name: string }[]>([]);
  const [filterApplication, setFilterApplication] = useState('');
  const [filterCnpj, setFilterCnpj] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

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

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const where: Record<string, unknown> = {};
      if (searchTerm.trim()) where.fileName = { contains: searchTerm.trim() };
      if (filterApplication) where.applicationPublicId = filterApplication;
      if (filterCnpj) where.companyCnpj = filterCnpj;
      if (filterStatus) where.status = filterStatus;
      const searchRequest: SearchRequest = {
        where,
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        sort: [{ field: sortField, direction: sortDirection }],
      };
      const response = await documentService.search(searchRequest);
      if (response?.data) {
        setDocuments(response.data);
        setTotalItems(response.total || 0);
      } else {
        setDocuments([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      setDocuments([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, filterApplication, filterCnpj, filterStatus, sortField, sortDirection]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const columns: DataGridColumn<Document>[] = [
    {
      key: 'trackingPublicId',
      header: 'ID',
      render: (doc: Document) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }} noWrap>
          {doc.trackingPublicId || doc.publicId}
        </Typography>
      ),
    },
    {
      key: 'fileName',
      header: 'Arquivo',
      sortable: true,
      render: (doc: Document) => (
        <Typography variant="body2" fontWeight={500} noWrap>
          {doc.fileName}
        </Typography>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (doc: Document) => <DocumentStatusChip status={doc.status} />,
    },
    {
      key: 'chainValid',
      header: 'Integridade',
      render: (doc: Document) => {
        if (doc.status !== DocumentStatus.COMPLETED) return <Typography variant="body2" color="text.disabled">-</Typography>;
        return doc.chainValid
          ? <Chip icon={<CheckCircleIcon />} label="Valido" size="small" color="success" variant="outlined" />
          : <Chip icon={<CancelIcon />} label="Invalido" size="small" color="error" variant="outlined" />;
      },
    },
    {
      key: 'createdAt',
      header: 'Criado em',
      sortable: true,
      render: (doc: Document) => (
        <Typography variant="body2">{formatDateTime(doc.createdAt)}</Typography>
      ),
    },
  ];

  const handleDownload = async (doc: Document, version: 'original' | 'current') => {
    try {
      const blob = await documentService.download(doc.publicId, version);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = version === 'original' ? doc.fileName : `signed_${doc.fileName}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  const actions: DataGridAction<Document>[] = [
    {
      icon: <ViewIcon fontSize="small" />,
      tooltip: 'Visualizar',
      onClick: (doc: Document) => navigate(`/documentos/${doc.publicId}`),
      color: 'primary' as const,
    },
    {
      icon: <DownloadOriginalIcon fontSize="small" />,
      tooltip: 'Baixar Original',
      onClick: (doc: Document) => handleDownload(doc, 'original'),
      color: 'default' as const,
    },
    {
      icon: <DownloadSignedIcon fontSize="small" />,
      tooltip: 'Baixar Assinado',
      onClick: (doc: Document) => handleDownload(doc, 'current'),
      color: 'success' as const,
      hidden: (doc: Document) => doc.status !== DocumentStatus.COMPLETED && doc.status !== DocumentStatus.SIGNING,
    },
  ];

  const headerActions = (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <SearchField value={searchInput} onChange={setSearchInput} placeholder="Buscar documentos..." />
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
      <TextField
        select
        size="small"
        value={filterStatus}
        onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
        label="Status"
        sx={{ minWidth: 160 }}
      >
        <MenuItem value="">Todos</MenuItem>
        <MenuItem value={DocumentStatus.PENDING}>Pendente</MenuItem>
        <MenuItem value={DocumentStatus.SIGNING}>Assinando</MenuItem>
        <MenuItem value={DocumentStatus.COMPLETED}>Concluido</MenuItem>
        <MenuItem value={DocumentStatus.CANCELLED}>Cancelado</MenuItem>
        <MenuItem value={DocumentStatus.EXPIRED}>Expirado</MenuItem>
      </TextField>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowUpload(true)}>
        Upload Documento
      </Button>
    </div>
  );

  return (
    <>
      <DataGrid<Document>
        data={documents}
        columns={columns}
        getRowId={(row) => row.publicId}
        pageSize={pageSize}
        headerActions={headerActions}
        actions={actions}
        emptyMessage="Nenhum documento cadastrado"
        loading={loading}
        onRefresh={fetchDocuments}
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

      <DocumentUploadDialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={() => {
          setShowUpload(false);
          triggerMultipleRefresh(['documents', 'dashboard']);
          fetchDocuments();
        }}
      />
    </>
  );
};

export default DocumentsPage;
