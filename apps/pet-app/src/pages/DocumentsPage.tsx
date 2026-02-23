import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid2 as Grid,
  IconButton,
  MenuItem as MuiMenuItem,
  TextField,
  Tooltip,
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
  VerifiedUser as SignedIcon,
  Vaccines as VaccineIcon,
  Pets as PetsIcon,
  Person as TutorIcon,
  LocalHospital as VetIcon,
} from '@mui/icons-material';
import { DataGrid } from '@app/ui';
import type { DataGridColumn } from '@app/ui';
import { formatCpf, formatPhone, formatDateTime } from '@app/core';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { customerService, petService, documentService } from '../services';
import type {
  CustomerWithAddresses,
  Pet,
  DocumentTemplate,
  DocumentTracking,
  DocumentType,
  DocumentLifecycleStatus,
  TemplateCategory,
} from '../types';

const TYPE_CONFIG: Record<DocumentType, { label: string; color: string; bg: string }> = {
  SIGNATURE_REQUIRED: { label: 'Requer Assinatura', color: '#E65100', bg: '#FFF3E0' },
  SEND_ONLY: { label: 'Envio Simples', color: '#2E7D32', bg: '#E8F5E9' },
};

const STATUS_CONFIG: Record<DocumentLifecycleStatus, { label: string; color: string; bg: string }> = {
  GENERATING: { label: 'Gerando', color: '#1565C0', bg: '#E3F2FD' },
  REPORT_FAILED: { label: 'Falha no Relatório', color: '#C62828', bg: '#FFEBEE' },
  REPORT_COMPLETED: { label: 'Relatório Pronto', color: '#2E7D32', bg: '#E8F5E9' },
  NO_SIGNATURE_REQUIRED: { label: 'Sem Assinatura', color: '#558B2F', bg: '#F1F8E9' },
  UPLOADING_TO_SIGNATURE: { label: 'Enviando p/ Assinatura', color: '#E65100', bg: '#FFF3E0' },
  AWAITING_SIGNATURES: { label: 'Aguardando Assinaturas', color: '#E65100', bg: '#FFF3E0' },
  PARTIALLY_SIGNED: { label: 'Parcialmente Assinado', color: '#F57F17', bg: '#FFFDE7' },
  COMPLETED: { label: 'Concluído', color: '#2E7D32', bg: '#E8F5E9' },
  EXPIRED: { label: 'Expirado', color: '#C62828', bg: '#FFEBEE' },
  FAILED: { label: 'Falha', color: '#C62828', bg: '#FFEBEE' },
  CANCELLED: { label: 'Cancelado', color: '#9E9E9E', bg: '#FAFAFA' },
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
  const location = useLocation();
  const locationState = location.state as { customerId?: string; petId?: string; cpf?: string } | null;

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
  const [tplPage, setTplPage] = useState(1);
  const [tplPageSize, setTplPageSize] = useState(10);
  const [tplTotal, setTplTotal] = useState(0);
  const [sentDocuments, setSentDocuments] = useState<DocumentTracking[]>([]);
  const [docPage, setDocPage] = useState(1);
  const [docPageSize, setDocPageSize] = useState(10);
  const [docTotal, setDocTotal] = useState(0);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // --- Preview dialog ---
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // --- Action states ---
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingSignedId, setDownloadingSignedId] = useState<string | null>(null);

  // --- Category filter ---
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');

  // --- Vaccination auth ---
  const [generatingVaccAuth, setGeneratingVaccAuth] = useState(false);

  // Load categories on mount
  useEffect(() => {
    documentService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const refreshDocuments = useCallback(async () => {
    if (!customer?.publicId || !selectedPet?.publicId) return;
    try {
      const response = await documentService.searchDocuments({
        customerId: customer.publicId,
        petId: selectedPet.publicId,
        skip: (docPage - 1) * docPageSize,
        take: docPageSize,
      });
      setSentDocuments(response.data || []);
      setDocTotal(response.total ?? (response.data || []).length);
    } catch {
      // error handled by interceptor
    }
  }, [customer, selectedPet, docPage, docPageSize]);

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
    setTplPage(1);
    setDocPage(1);
  }, []);

  // Deep-link: auto-load customer (and optionally pet) from navigation state
  useEffect(() => {
    const cpf = locationState?.cpf?.replace(/\D/g, '');
    const customerId = locationState?.customerId;
    if (!cpf && !customerId) return;

    const load = async () => {
      setSearching(true);
      try {
        let found: CustomerWithAddresses | null = null;

        if (cpf) {
          setCpfInput(formatCpf(cpf));
          found = await customerService.findByCpf(cpf);
        } else if (customerId) {
          const c = await customerService.getCustomerById(customerId);
          found = c as CustomerWithAddresses;
          setCpfInput(c.cpf ? formatCpf(c.cpf) : '');
        }

        if (!found) {
          setSearched(true);
          return;
        }

        setCustomer(found);
        setSearched(true);

        if (found.publicId) {
          setLoadingPets(true);
          const customerPets = await petService.findByCustomer(found.publicId);
          setPets(customerPets);
          setLoadingPets(false);

          if (locationState?.petId) {
            const target = customerPets.find((p) => p.publicId === locationState.petId);
            if (target) {
              setSelectedPet(target);
            }
          }
        }
      } catch {
        toast.error('Erro ao carregar dados.');
      } finally {
        setSearching(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // Load templates with pagination
  const fetchTemplates = useCallback(async () => {
    if (!selectedPet?.publicId || !customer?.publicId) {
      setTemplates([]);
      setTplTotal(0);
      return;
    }
    setLoadingTemplates(true);
    try {
      const request: Record<string, unknown> = {
        status: 'PUBLISHED',
        skip: (tplPage - 1) * tplPageSize,
        take: tplPageSize,
      };
      if (categoryFilter) request.categoryId = categoryFilter;
      const response = await documentService.searchTemplates(request as any);
      setTemplates(response.data || []);
      setTplTotal(response.total ?? (response.data || []).length);
    } catch {
      setTemplates([]);
      setTplTotal(0);
    } finally {
      setLoadingTemplates(false);
    }
  }, [selectedPet, customer, tplPage, tplPageSize, categoryFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Reset docs when pet changes
  useEffect(() => {
    if (!selectedPet?.publicId || !customer?.publicId) {
      setSentDocuments([]);
      setDocTotal(0);
      return;
    }
    refreshDocuments();
  }, [refreshDocuments]);

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
        await documentService.generateReport({
          templateKey: template.key,
          data: {},
          documentName: `${template.name} - ${selectedPet.name}`,
          petId: selectedPet.publicId,
          customerId: customer.publicId,
        });
        toast.success('Documento solicitado! Acompanhe o status abaixo.');
        await refreshDocuments();
      } catch {
        toast.error('Erro ao gerar documento.');
      } finally {
        setSendingId(null);
      }
    },
    [customer, selectedPet, refreshDocuments],
  );

  const handleReprocess = useCallback(
    async (doc: DocumentTracking) => {
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

  const handleDownload = useCallback(async (doc: DocumentTracking) => {
    setDownloadingId(doc.publicId);
    try {
      const blob = await documentService.downloadDocument(doc.publicId);
      triggerBlobDownload(blob, `${doc.documentName || doc.templateKey}.pdf`);
    } catch {
      toast.error('Erro ao baixar documento. O PDF pode ainda estar sendo gerado.');
    } finally {
      setDownloadingId(null);
    }
  }, []);

  // --- Download signed ---
  const handleDownloadSigned = useCallback(async (doc: DocumentTracking) => {
    setDownloadingSignedId(doc.publicId);
    try {
      const blob = await documentService.downloadSignedDocument(doc.publicId);
      triggerBlobDownload(blob, `${doc.documentName || doc.templateKey}-assinado.pdf`);
    } catch {
      toast.error('Erro ao baixar documento assinado.');
    } finally {
      setDownloadingSignedId(null);
    }
  }, []);

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
      key: 'categoryName',
      header: 'Categoria',
      render: (t) =>
        t.categoryName ? <Chip label={t.categoryName} size="small" variant="outlined" /> : '-',
    },
    {
      key: 'documentType',
      header: 'Tipo',
      render: (t) => {
        const cfg = TYPE_CONFIG[t.documentType];
        return cfg ? (
          <Chip
            label={cfg.label}
            size="small"
            sx={{ backgroundColor: cfg.bg, color: cfg.color, fontWeight: 600 }}
          />
        ) : (
          <Chip label={t.documentType || '-'} size="small" variant="outlined" />
        );
      },
    },
    {
      key: 'speciesSpecific',
      header: 'Espécie',
      render: (t) => {
        if (t.speciesSpecific === 'YES') return <Chip icon={<PetsIcon sx={{ fontSize: 16 }} />} label="Sim" size="small" sx={{ backgroundColor: '#E3F2FD', color: '#1565C0', fontWeight: 600 }} />;
        if (t.speciesSpecific === 'DEPENDS') return <Chip icon={<PetsIcon sx={{ fontSize: 16 }} />} label="Depende" size="small" sx={{ backgroundColor: '#FFF3E0', color: '#E65100', fontWeight: 600 }} />;
        return <Chip label="Não" size="small" sx={{ backgroundColor: '#F5F5F5', color: '#757575', fontWeight: 600 }} />;
      },
    },
    {
      key: 'signatures',
      header: 'Assinaturas',
      render: (t) => {
        const tutor = t.tutorSignature !== 'NO';
        const vet = t.vetSignature !== 'NO';
        if (!tutor && !vet) return <Typography variant="body2" color="text.secondary">-</Typography>;
        return (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {tutor && (
              <Tooltip title={`Tutor: ${t.tutorSignature === 'YES' ? 'Obrigatória' : 'Opcional'}`}>
                <TutorIcon sx={{ fontSize: 20, color: t.tutorSignature === 'YES' ? '#E65100' : '#9E9E9E' }} />
              </Tooltip>
            )}
            {vet && (
              <Tooltip title={`Veterinário: ${t.vetSignature === 'YES' ? 'Obrigatória' : 'Opcional'}`}>
                <VetIcon sx={{ fontSize: 20, color: t.vetSignature === 'YES' ? '#1565C0' : '#9E9E9E' }} />
              </Tooltip>
            )}
          </Box>
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
  const sentColumns: DataGridColumn<DocumentTracking>[] = [
    {
      key: 'publicId',
      header: 'ID',
      render: (d) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }} noWrap>
          {d.publicId}
        </Typography>
      ),
    },
    { key: 'documentName', header: 'Documento', render: (d) => d.documentName || d.templateKey },
    {
      key: 'templateKey',
      header: 'Template',
      render: (d) => (
        <Chip label={d.templateKey} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }} />
      ),
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
      key: 'createdAt',
      header: 'Criado em',
      render: (d) => formatDateTime(d.createdAt),
    },
  ];

  const sentActions = [
    {
      icon: <DownloadIcon fontSize="small" />,
      tooltip: 'Baixar PDF',
      onClick: (d: DocumentTracking) => handleDownload(d),
      disabled: (d: DocumentTracking) => downloadingId === d.publicId || ['GENERATING', 'REPORT_FAILED'].includes(d.status),
      color: 'primary',
    },
    {
      icon: <SignedIcon fontSize="small" />,
      tooltip: 'Baixar Assinado',
      onClick: (d: DocumentTracking) => handleDownloadSigned(d),
      disabled: (d: DocumentTracking) => downloadingSignedId === d.publicId,
      hidden: (d: DocumentTracking) => d.status !== 'COMPLETED',
      color: 'success',
    },
    {
      icon: <RefreshIcon fontSize="small" />,
      tooltip: 'Reprocessar',
      onClick: (d: DocumentTracking) => handleReprocess(d),
      disabled: (d: DocumentTracking) => reprocessingId === d.publicId,
      hidden: (d: DocumentTracking) => d.status !== 'REPORT_FAILED' && d.status !== 'FAILED',
      color: 'warning',
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box sx={{ width: 48, height: 48, borderRadius: 2.5, background: 'linear-gradient(135deg, #7EB3E0 0%, #5A9BD5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 14px rgba(126, 179, 224, 0.35)', flexShrink: 0 }}>
          <SendIcon />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>Documentos & Assinaturas</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>Gere e acompanhe documentos dos pacientes</Typography>
        </Box>
      </Box>

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
                onRefresh={fetchTemplates}
                pageSize={tplPageSize}
                serverSidePagination
                page={tplPage}
                totalRows={tplTotal}
                onPageChange={setTplPage}
                onPageSizeChange={(size) => { setTplPageSize(size); setTplPage(1); }}
                headerActions={
                  <TextField
                    select
                    size="small"
                    label="Categoria"
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setTplPage(1); }}
                    sx={{ minWidth: 180 }}
                  >
                    <MuiMenuItem value="">Todas</MuiMenuItem>
                    {categories.map((cat) => (
                      <MuiMenuItem key={cat.publicId} value={cat.publicId}>{cat.name}</MuiMenuItem>
                    ))}
                  </TextField>
                }
              />
            </CardContent>
          </Card>

          {/* 3b: Sent Documents */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Documentos Enviados
              </Typography>
              <DataGrid<DocumentTracking>
                data={sentDocuments}
                columns={sentColumns}
                getRowId={(row) => row.publicId}
                actions={sentActions}
                loading={loadingDocuments}
                emptyMessage="Nenhum documento enviado ainda"
                onRefresh={refreshDocuments}
                pageSize={docPageSize}
                serverSidePagination
                page={docPage}
                totalRows={docTotal}
                onPageChange={setDocPage}
                onPageSizeChange={(size) => { setDocPageSize(size); setDocPage(1); }}
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

    </Box>
  );
};

export default DocumentsPage;
