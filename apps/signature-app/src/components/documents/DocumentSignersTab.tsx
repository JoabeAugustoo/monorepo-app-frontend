import { useState, useEffect, useCallback } from 'react';
import { Typography, Button, Box } from '@mui/material';
import {
  ContentCopy as CopyIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as FinalizeIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { DataGrid } from '@app/ui';
import type { DataGridColumn, DataGridAction } from '@app/ui';
import { SignerStatusChip } from '../shared/SignerStatusChip';
import { AddSignerDialog } from './AddSignerDialog';
import { signerService, documentService } from '../../services';
import { SignerStatus, type Signer, type SearchRequest } from '../../types';

interface DocumentSignersTabProps {
  documentPublicId: string;
  signersFinalized: boolean;
  canAddSigners: boolean;
  onDocumentRefresh: () => void;
}

export function DocumentSignersTab({
  documentPublicId,
  signersFinalized,
  canAddSigners,
  onDocumentRefresh,
}: DocumentSignersTabProps) {
  const [signers, setSigners] = useState<Signer[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [showAddSigner, setShowAddSigner] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

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
  }, [fetchSigners]);

  const copySignLink = (token: string) => {
    const link = `${window.location.origin}/sign/${token}`;
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Link copiado!');
    });
  };

  const handleFinalizeSigners = async () => {
    try {
      setFinalizing(true);
      const result = await documentService.finalizeSigners(documentPublicId);
      if (result.completed) {
        toast.success('Signatarios finalizados! Todos ja assinaram.');
      } else {
        toast.success('Adicao de signatarios finalizada! Aguardando assinaturas.');
      }
      onDocumentRefresh();
    } catch (error: unknown) {
      console.error('Erro ao finalizar signatarios:', error);
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao finalizar signatarios';
      toast.error(message);
    } finally {
      setFinalizing(false);
    }
  };

  const handleSignerAdded = () => {
    setShowAddSigner(false);
    fetchSigners();
    onDocumentRefresh();
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

  const headerActions = canAddSigners && !signersFinalized ? (
    <Box sx={{ display: 'flex', gap: 1.5 }}>
      <Button
        variant="outlined"
        startIcon={<PersonAddIcon />}
        onClick={() => setShowAddSigner(true)}
      >
        Adicionar Signatario
      </Button>
      <Button
        variant="contained"
        startIcon={<FinalizeIcon />}
        onClick={handleFinalizeSigners}
        disabled={finalizing || totalItems === 0}
      >
        {finalizing ? 'Finalizando...' : 'Finalizar Signatarios'}
      </Button>
    </Box>
  ) : undefined;

  return (
    <>
      <DataGrid<Signer>
        data={signers}
        columns={columns}
        actions={actions}
        getRowId={(row) => row.publicId}
        headerActions={headerActions}
        emptyMessage="Nenhum signatario adicionado"
        loading={loading}
        serverSidePagination
        page={currentPage}
        pageSize={pageSize}
        totalRows={totalItems}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
      />

      <AddSignerDialog
        open={showAddSigner}
        documentPublicId={documentPublicId}
        onClose={() => setShowAddSigner(false)}
        onSuccess={handleSignerAdded}
      />
    </>
  );
}
