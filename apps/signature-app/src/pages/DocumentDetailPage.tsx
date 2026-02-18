import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
  Button,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoIcon from '@mui/icons-material/Info';
import PeopleIcon from '@mui/icons-material/People';
import TimelineIcon from '@mui/icons-material/Timeline';
import DrawIcon from '@mui/icons-material/Draw';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { toast } from 'sonner';
import { formatDateTime } from '@app/core';
import { documentService } from '../services';
import { DocumentStatusChip } from '../components/shared/DocumentStatusChip';
import { SignCompanyDialog } from '../components/documents/SignCompanyDialog';
import { AddSignerDialog } from '../components/documents/AddSignerDialog';
import { DocumentSignersTab } from '../components/documents/DocumentSignersTab';
import { DocumentTimelineTab } from '../components/documents/DocumentTimelineTab';
import { DocumentStatus, type DocumentDetail } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </Box>
  );
}

const DocumentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [showAddSigner, setShowAddSigner] = useState(false);
  const [signersRefreshKey, setSignersRefreshKey] = useState(0);

  const fetchDocument = async () => {
    if (!id) return;
    try {
      const data = await documentService.getById(id);
      setDoc(data);
    } catch (error) {
      console.error('Erro ao carregar documento:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!doc) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="error">Documento nao encontrado</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/documentos')} sx={{ mt: 2 }}>
          Voltar
        </Button>
      </Box>
    );
  }

  const canSign = doc.status === DocumentStatus.PENDING || doc.status === DocumentStatus.SIGNING;
  const hasSigned = doc.status === DocumentStatus.COMPLETED || doc.status === DocumentStatus.SIGNING;

  const handleDownload = async (version: 'original' | 'current') => {
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

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Tooltip title="Voltar">
          <IconButton onClick={() => navigate('/documentos')}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h5" fontWeight={700}>
              {doc.fileName}
            </Typography>
            <DocumentStatusChip status={doc.status} />
            {doc.status === DocumentStatus.COMPLETED && (
              doc.chainValid
                ? <Chip icon={<CheckCircleIcon />} label="Cadeia Valida" size="small" color="success" variant="outlined" />
                : <Chip icon={<CancelIcon />} label="Cadeia Invalida" size="small" color="error" variant="outlined" />
            )}
          </Stack>
          {doc.companyName && (
            <Typography variant="body2" color="text.secondary">
              {doc.companyName}
            </Typography>
          )}
        </Box>
      </Stack>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<InfoIcon />} iconPosition="start" label="Informacoes" />
          <Tab icon={<PeopleIcon />} iconPosition="start" label="Signatarios" />
          <Tab icon={<TimelineIcon />} iconPosition="start" label="Timeline" />
        </Tabs>
      </Box>

      {/* Tab: Info */}
      <TabPanel value={tabValue} index={0}>
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Detalhes do Arquivo
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>Arquivo:</Typography>
                  <Typography variant="body2" fontWeight={500}>{doc.fileName}</Typography>
                </Box>
                {doc.companyName && (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>Empresa:</Typography>
                    <Typography variant="body2">{doc.companyName}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>Criado em:</Typography>
                  <Typography variant="body2">{formatDateTime(doc.createdAt)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>Hash Original:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                    {doc.originalHash}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>Hash Atual:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                    {doc.currentHash}
                  </Typography>
                </Box>
                {doc.status === DocumentStatus.COMPLETED && (
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>Integridade:</Typography>
                    {doc.chainValid
                      ? <Chip icon={<CheckCircleIcon />} label="Cadeia de evidencias valida" size="small" color="success" variant="outlined" />
                      : <Chip icon={<CancelIcon />} label="Cadeia de evidencias comprometida" size="small" color="error" variant="outlined" />
                    }
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {canSign && (
              <>
                <Button
                  variant="contained"
                  startIcon={<DrawIcon />}
                  onClick={() => setShowSignDialog(true)}
                >
                  Assinar pela Empresa
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setShowAddSigner(true)}
                >
                  Adicionar Signatario
                </Button>
              </>
            )}
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={() => handleDownload('original')}
            >
              Baixar Original
            </Button>
            {hasSigned && (
              <Button
                variant="outlined"
                color="success"
                startIcon={<DownloadDoneIcon />}
                onClick={() => handleDownload('current')}
              >
                Baixar Assinado
              </Button>
            )}
          </Stack>
        </Stack>
      </TabPanel>

      {/* Tab: Signers */}
      <TabPanel value={tabValue} index={1}>
        <DocumentSignersTab documentPublicId={doc.publicId} refreshKey={signersRefreshKey} />
      </TabPanel>

      {/* Tab: Timeline */}
      <TabPanel value={tabValue} index={2}>
        <DocumentTimelineTab documentPublicId={doc.publicId} />
      </TabPanel>

      {/* Dialogs */}
      <SignCompanyDialog
        open={showSignDialog}
        documentId={doc.publicId}
        companyPublicId={doc.companyPublicId}
        onClose={() => setShowSignDialog(false)}
        onSuccess={() => {
          setShowSignDialog(false);
          fetchDocument();
        }}
      />
      <AddSignerDialog
        open={showAddSigner}
        documentPublicId={doc.publicId}
        onClose={() => setShowAddSigner(false)}
        onSuccess={() => {
          setShowAddSigner(false);
          setTabValue(1);
          setSignersRefreshKey((k) => k + 1);
          fetchDocument();
        }}
      />
    </Box>
  );
};

export default DocumentDetailPage;
