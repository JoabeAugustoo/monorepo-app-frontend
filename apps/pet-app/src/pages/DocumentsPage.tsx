import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2 as Grid,
  IconButton,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  Draw as SignIcon,
  Vaccines as VaccineIcon,
} from '@mui/icons-material';
import { DataGrid } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { formatCpf, formatPhone, formatDateTime } from '@app/core';
import { toast } from 'sonner';
import { customerService, petService, documentService } from '../services';
import type {
  CustomerWithAddresses,
  Pet,
  DocumentTemplate,
  DocumentRecord,
  DocumentType,
  DocumentStatus,
} from '../types';

const TYPE_CONFIG: Record<DocumentType, { label: string; color: string; bg: string }> = {
  SIGNATURE_REQUIRED: { label: 'Requer Assinatura', color: '#E65100', bg: '#FFF3E0' },
  SEND_ONLY: { label: 'Envio Simples', color: '#2E7D32', bg: '#E8F5E9' },
};

const STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pendente', color: '#757575', bg: '#F5F5F5' },
  SENT: { label: 'Enviado', color: '#1565C0', bg: '#E3F2FD' },
  AWAITING_SIGNATURE: { label: 'Aguardando Assinatura', color: '#E65100', bg: '#FFF3E0' },
  SIGNED: { label: 'Assinado', color: '#2E7D32', bg: '#E8F5E9' },
  EXPIRED: { label: 'Expirado', color: '#C62828', bg: '#FFEBEE' },
  CANCELLED: { label: 'Cancelado', color: '#9E9E9E', bg: '#FAFAFA' },
};

// --- Signature Pad Component ---
const SignaturePad = ({
  onSignatureChange,
}: {
  onSignatureChange: (data: string | null) => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = getCtx();
    if (!ctx) return;
    isDrawingRef.current = true;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      onSignatureChange(canvas.toDataURL('image/png'));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onSignatureChange(null);
    }
  };

  useEffect(() => {
    const ctx = getCtx();
    if (ctx) {
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  return (
    <Box>
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          touchAction: 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          width={460}
          height={180}
          style={{ display: 'block', width: '100%', cursor: 'crosshair', background: '#fafafa' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
        <Button size="small" onClick={clear}>
          Limpar
        </Button>
      </Box>
    </Box>
  );
};

// --- Helpers ---
function triggerBlobDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// --- Main Page ---
const DocumentsPage = () => {
  // --- Tutor search ---
  const [cpfInput, setCpfInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [customer, setCustomer] = useState<CustomerWithAddresses | null>(null);

  // --- Pet selection ---
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  // --- Documents ---
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [sentDocuments, setSentDocuments] = useState<DocumentRecord[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // --- Preview dialog ---
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // --- Signature dialog ---
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signingDoc, setSigningDoc] = useState<DocumentRecord | null>(null);
  const [signedBy, setSignedBy] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signingLoading, setSigning] = useState(false);

  // --- Action states ---
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // --- Vaccination auth ---
  const [generatingVaccAuth, setGeneratingVaccAuth] = useState(false);

  const refreshDocuments = useCallback(async () => {
    if (!customer?.publicId || !selectedPet?.publicId) return;
    try {
      const docs = await documentService.getDocumentsByCustomerAndPet(
        customer.publicId,
        selectedPet.publicId,
      );
      setSentDocuments(docs);
    } catch {
      // error handled by interceptor
    }
  }, [customer, selectedPet]);

  const handleSearch = useCallback(async () => {
    const digits = cpfInput.replace(/\D/g, '');
    if (digits.length !== 11) return;

    setSearching(true);
    setSearched(false);
    setCustomer(null);
    setPets([]);
    setSelectedPet(null);
    setTemplates([]);
    setSentDocuments([]);

    try {
      const found = await customerService.findByCpf(digits);
      setCustomer(found);
      setSearched(true);

      if (found.publicId) {
        setLoadingPets(true);
        try {
          const customerPets = await petService.findByCustomer(found.publicId);
          setPets(customerPets);
        } finally {
          setLoadingPets(false);
        }
      }
    } catch {
      setCustomer(null);
      setSearched(true);
    } finally {
      setSearching(false);
    }
  }, [cpfInput]);

  const handleSelectPet = useCallback((pet: Pet) => {
    setSelectedPet(pet);
  }, []);

  // Load templates and history when pet is selected
  useEffect(() => {
    if (!selectedPet?.publicId || !customer?.publicId) {
      setTemplates([]);
      setSentDocuments([]);
      return;
    }

    const load = async () => {
      setLoadingTemplates(true);
      setLoadingDocuments(true);
      try {
        const [tpls, docs] = await Promise.all([
          documentService.getTemplates(),
          documentService.getDocumentsByCustomerAndPet(customer.publicId!, selectedPet.publicId!),
        ]);
        setTemplates(tpls);
        setSentDocuments(docs);
      } catch {
        toast.error('Erro ao carregar documentos.');
      } finally {
        setLoadingTemplates(false);
        setLoadingDocuments(false);
      }
    };
    load();
  }, [selectedPet, customer]);

  const handlePreview = useCallback(
    async (templateId: string, templateName: string) => {
      setPreviewTitle(templateName);
      setPreviewOpen(true);
      setPreviewLoading(true);
      setPreviewHtml('');
      try {
        const html = await documentService.getTemplateRaw(templateId);
        setPreviewHtml(html);
      } catch {
        toast.error('Erro ao carregar preview.');
        setPreviewOpen(false);
      } finally {
        setPreviewLoading(false);
      }
    },
    [],
  );

  const handleSend = useCallback(
    async (template: DocumentTemplate) => {
      if (!customer?.publicId || !selectedPet?.publicId) return;
      setSendingId(template.publicId);
      try {
        await documentService.sendDocument({
          templateId: template.publicId,
          petId: selectedPet.publicId,
          petName: selectedPet.name,
          customerId: customer.publicId,
          customerName: customer.name,
          data: {},
        });
        toast.success(
          template.documentType === 'SIGNATURE_REQUIRED'
            ? 'Documento enviado para assinatura!'
            : 'Documento enviado com sucesso!',
        );
        await refreshDocuments();
      } catch {
        toast.error('Erro ao enviar documento.');
      } finally {
        setSendingId(null);
      }
    },
    [customer, selectedPet, refreshDocuments],
  );

  const handleReprocess = useCallback(
    async (doc: DocumentRecord) => {
      if (!customer?.publicId || !selectedPet?.publicId) return;
      setReprocessingId(doc.publicId);
      try {
        await documentService.reprocessDocument(doc.publicId);
        toast.success('Documento reprocessado com sucesso!');
        await refreshDocuments();
      } catch {
        toast.error('Erro ao reprocessar documento.');
      } finally {
        setReprocessingId(null);
      }
    },
    [customer, selectedPet, refreshDocuments],
  );

  const handleDownload = useCallback(async (doc: DocumentRecord) => {
    setDownloadingId(doc.publicId);
    try {
      const blob = await documentService.downloadDocument(doc.publicId);
      triggerBlobDownload(blob, `${doc.templateKey}-${doc.petName}.pdf`);
    } catch {
      toast.error('Erro ao baixar documento. O PDF pode ainda estar sendo gerado.');
    } finally {
      setDownloadingId(null);
    }
  }, []);

  // --- Signature ---
  const openSignDialog = useCallback((doc: DocumentRecord) => {
    setSigningDoc(doc);
    setSignedBy('');
    setSignatureData(null);
    setSignDialogOpen(true);
  }, []);

  const handleSign = useCallback(async () => {
    if (!signingDoc || !signedBy.trim() || !signatureData) {
      toast.error('Preencha o nome e desenhe a assinatura.');
      return;
    }

    setSigning(true);
    try {
      // Remove the data:image/png;base64, prefix
      const base64 = signatureData.split(',')[1] || signatureData;
      await documentService.signDocument(signingDoc.publicId, {
        signatureData: base64,
        signedBy: signedBy.trim(),
      });
      toast.success('Documento assinado com sucesso!');
      setSignDialogOpen(false);
      await refreshDocuments();
    } catch {
      toast.error('Erro ao assinar documento.');
    } finally {
      setSigning(false);
    }
  }, [signingDoc, signedBy, signatureData, refreshDocuments]);

  // --- Vaccination Auth ---
  const handleGenerateVaccinationAuth = useCallback(async () => {
    if (!selectedPet?.publicId) return;

    setGeneratingVaccAuth(true);
    try {
      await petService.generateVaccinationAuth(selectedPet.publicId);
      toast.success('Autorização de vacinação solicitada com sucesso!');
      await refreshDocuments();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar autorização de vacinação.';
      toast.error(message);
    } finally {
      setGeneratingVaccAuth(false);
    }
  }, [selectedPet, refreshDocuments]);

  // --- Template columns ---
  const templateColumns: DataGridColumn<DocumentTemplate>[] = [
    { key: 'name', header: 'Nome', render: (t) => t.name },
    {
      key: 'category',
      header: 'Categoria',
      render: (t) =>
        t.category ? <Chip label={t.category} size="small" variant="outlined" /> : '-',
    },
    {
      key: 'documentType',
      header: 'Tipo',
      render: (t) => {
        const cfg = TYPE_CONFIG[t.documentType];
        return (
          <Chip
            label={cfg.label}
            size="small"
            sx={{ backgroundColor: cfg.bg, color: cfg.color, fontWeight: 600 }}
          />
        );
      },
    },
  ];

  const templateActions = [
    {
      icon: <ViewIcon fontSize="small" />,
      tooltip: 'Visualizar Template',
      onClick: (t: DocumentTemplate) => handlePreview(t.publicId, t.name),
      color: 'primary',
    },
    {
      icon: <SendIcon fontSize="small" />,
      tooltip: 'Enviar',
      onClick: (t: DocumentTemplate) => handleSend(t),
      disabled: (t: DocumentTemplate) => sendingId === t.publicId,
      color: 'success',
    },
  ];

  // --- Sent document columns ---
  const sentColumns: DataGridColumn<DocumentRecord>[] = [
    { key: 'templateName', header: 'Documento', render: (d) => d.templateName },
    {
      key: 'documentType',
      header: 'Tipo',
      render: (d) => {
        const cfg = TYPE_CONFIG[d.documentType];
        return (
          <Chip
            label={cfg.label}
            size="small"
            sx={{ backgroundColor: cfg.bg, color: cfg.color, fontWeight: 600 }}
          />
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (d) => {
        const cfg = STATUS_CONFIG[d.status];
        return cfg ? (
          <Chip
            label={cfg.label}
            size="small"
            sx={{ backgroundColor: cfg.bg, color: cfg.color, fontWeight: 600 }}
          />
        ) : (
          <Chip label={d.status} size="small" />
        );
      },
    },
    {
      key: 'sentAt',
      header: 'Enviado em',
      render: (d) => formatDateTime(d.sentAt),
    },
    {
      key: 'signedAt',
      header: 'Assinado em',
      render: (d) => formatDateTime(d.signedAt),
    },
  ];

  const sentActions = [
    {
      icon: <DownloadIcon fontSize="small" />,
      tooltip: 'Baixar PDF',
      onClick: (d: DocumentRecord) => handleDownload(d),
      disabled: (d: DocumentRecord) => downloadingId === d.publicId,
      color: 'primary',
    },
    {
      icon: <SignIcon fontSize="small" />,
      tooltip: 'Assinar',
      onClick: (d: DocumentRecord) => openSignDialog(d),
      hidden: (d: DocumentRecord) => d.status !== 'AWAITING_SIGNATURE',
      color: 'success',
    },
    {
      icon: <RefreshIcon fontSize="small" />,
      tooltip: 'Reprocessar',
      onClick: (d: DocumentRecord) => handleReprocess(d),
      disabled: (d: DocumentRecord) => reprocessingId === d.publicId,
      color: 'warning',
    },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Documentos & Assinaturas
      </Typography>

      {/* Section 1: Search Tutor */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Buscar Tutor
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="CPF do Tutor"
              value={cpfInput}
              onChange={(e) => setCpfInput(formatCpf(e.target.value))}
              placeholder="000.000.000-00"
              sx={{ flex: 1 }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={searching || cpfInput.replace(/\D/g, '').length !== 11}
              startIcon={
                searching ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />
              }
            >
              Buscar
            </Button>
          </Box>

          {searched && !customer && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Nenhum tutor encontrado com este CPF.
            </Alert>
          )}

          {customer && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">Nome</Typography>
                  <Typography variant="body1" fontWeight={500}>{customer.name}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Typography variant="body2" color="text.secondary">CPF</Typography>
                  <Typography variant="body1">{customer.cpf || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Typography variant="body2" color="text.secondary">Telefone</Typography>
                  <Typography variant="body1">
                    {customer.phone ? formatPhone(customer.phone) : '-'}
                  </Typography>
                </Grid>
                {customer.email && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{customer.email}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Select Pet */}
      {customer && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Selecionar Pet
            </Typography>
            {loadingPets ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : pets.length === 0 ? (
              <Typography color="text.secondary">Nenhum pet encontrado para este tutor.</Typography>
            ) : (
              <Grid container spacing={2}>
                {pets.map((pet) => {
                  const isSelected = selectedPet?.publicId === pet.publicId;
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={pet.publicId || pet.id}>
                      <Card
                        variant="outlined"
                        onClick={() => handleSelectPet(pet)}
                        sx={{
                          cursor: 'pointer',
                          borderColor: isSelected ? '#9C72D9' : 'divider',
                          borderWidth: isSelected ? 2 : 1,
                          backgroundColor: isSelected ? 'rgba(156, 114, 217, 0.04)' : 'transparent',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: '#9C72D9',
                            backgroundColor: 'rgba(156, 114, 217, 0.06)',
                          },
                        }}
                      >
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {pet.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {pet.species || 'N/A'} {pet.breed ? `- ${pet.breed}` : ''}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section 3: Documents */}
      {selectedPet && customer && (
        <>
          {/* Quick Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Ações Rápidas
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={
                    generatingVaccAuth
                      ? <CircularProgress size={20} color="inherit" />
                      : <VaccineIcon />
                  }
                  onClick={handleGenerateVaccinationAuth}
                  disabled={generatingVaccAuth}
                >
                  {generatingVaccAuth ? 'Gerando...' : 'Gerar Autorização de Vacinação'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* 3a: Available Templates */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Modelos Disponíveis
              </Typography>
              <DataGrid<DocumentTemplate>
                data={templates}
                columns={templateColumns}
                getRowId={(row) => row.publicId}
                actions={templateActions}
                loading={loadingTemplates}
                emptyMessage="Nenhum modelo disponível"
                pageSize={10}
              />
            </CardContent>
          </Card>

          {/* 3b: Sent Documents */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Documentos Enviados
              </Typography>
              <DataGrid<DocumentRecord>
                data={sentDocuments}
                columns={sentColumns}
                getRowId={(row) => row.publicId}
                actions={sentActions}
                loading={loadingDocuments}
                emptyMessage="Nenhum documento enviado ainda"
                pageSize={10}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {previewTitle}
          <IconButton onClick={() => setPreviewOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <iframe
              srcDoc={previewHtml}
              title="Preview do documento"
              style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 4 }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog
        open={signDialogOpen}
        onClose={() => !signingLoading && setSignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Assinar Documento
        </DialogTitle>
        <DialogContent>
          {signingDoc && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Alert severity="info" sx={{ mb: 1 }}>
                <strong>{signingDoc.templateName}</strong>
                <br />
                Pet: {signingDoc.petName} | Tutor: {signingDoc.customerName}
              </Alert>

              <TextField
                label="Nome completo do assinante"
                value={signedBy}
                onChange={(e) => setSignedBy(e.target.value)}
                fullWidth
                autoFocus
              />

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Desenhe sua assinatura abaixo:
              </Typography>
              <SignaturePad onSignatureChange={setSignatureData} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setSignDialogOpen(false)}
            disabled={signingLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSign}
            disabled={signingLoading || !signedBy.trim() || !signatureData}
            startIcon={
              signingLoading ? <CircularProgress size={20} color="inherit" /> : <SignIcon />
            }
          >
            {signingLoading ? 'Assinando...' : 'Confirmar Assinatura'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentsPage;
