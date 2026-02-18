import { useState, useEffect, useCallback } from 'react';
import { Typography } from '@mui/material';
import { ContentCopy as CopyIcon } from '@mui/icons-material';
import { toast } from 'sonner';
import { DataGrid } from '@app/ui';
import type { DataGridColumn, DataGridAction } from '@app/ui';
import { SignerStatusChip } from '../shared/SignerStatusChip';
import { signerService } from '../../services';
import { SignerStatus, type Signer, type SearchRequest } from '../../types';

interface DocumentSignersTabProps {
  documentPublicId: string;
  refreshKey?: number;
}

export function DocumentSignersTab({ documentPublicId, refreshKey }: DocumentSignersTabProps) {
  const [signers, setSigners] = useState<Signer[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const fetchSigners = useCallback(async () => {
    try {
      setLoading(true);
      const searchRequest: SearchRequest = {
        where: { documentPublicId },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        sort: [{ field: 'signOrder', direction: 'ASC' }],
      };
      const response = await signerService.search(searchRequest);
      if (response?.data) {
        setSigners(response.data);
        setTotalItems(response.total || 0);
      } else {
        setSigners([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar signatarios:', error);
      setSigners([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [documentPublicId, currentPage, pageSize]);

  useEffect(() => {
    fetchSigners();
  }, [fetchSigners, refreshKey]);

  const copySignLink = (token: string) => {
    const link = `${window.location.origin}/sign/${token}`;
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Link copiado!');
    });
  };

  const columns: DataGridColumn<Signer>[] = [
    {
      key: 'name',
      header: 'Nome',
      render: (signer: Signer) => (
        <Typography variant="body2" fontWeight={500}>{signer.name}</Typography>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (signer: Signer) => (
        <Typography variant="body2">{signer.email}</Typography>
      ),
    },
    {
      key: 'document',
      header: 'Documento',
      render: (signer: Signer) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
          {signer.documentType}: {signer.document}
        </Typography>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (signer: Signer) => <SignerStatusChip status={signer.status} />,
    },
    {
      key: 'signOrder',
      header: 'Ordem',
      render: (signer: Signer) => (
        <Typography variant="body2">{signer.signOrder}</Typography>
      ),
    },
  ];

  const actions: DataGridAction<Signer>[] = [
    {
      icon: <CopyIcon fontSize="small" />,
      tooltip: 'Copiar link de assinatura',
      onClick: (signer: Signer) => copySignLink(signer.token),
      color: 'primary' as const,
      hidden: (signer: Signer) => signer.status !== SignerStatus.PENDING,
    },
  ];

  return (
    <DataGrid<Signer>
      data={signers}
      columns={columns}
      actions={actions}
      getRowId={(row) => row.publicId}
      emptyMessage="Nenhum signatario adicionado"
      loading={loading}
      serverSidePagination
      page={currentPage}
      pageSize={pageSize}
      totalRows={totalItems}
      onPageChange={setCurrentPage}
      onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
    />
  );
}
