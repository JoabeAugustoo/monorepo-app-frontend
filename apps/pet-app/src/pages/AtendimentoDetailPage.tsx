import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2 as Grid,
  TextField,
  Typography,
  CircularProgress,
  MenuItem as MuiMenuItem,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  NoteAdd as NoteAddIcon,
  MedicalServices as ProcIcon,
  Description as DocIcon,
  EventNote as EventIcon,
  Schedule as ScheduleIcon,
  Draw as SignIcon,
  Person as TutorIcon,
  LocalHospital as VetIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDateTime, formatCurrency } from '@app/core';
import { atendimentoService, documentService } from '../services';
import type {
  ClinicalVisit,
  ClinicalVisitStatus,
  ClinicalVisitType,
  MedicalProcedure,
  DocumentTemplate,
  TimelineEntry,
  ProcedureStatus,
  ProcedureType,
  ProcedureLocation,
  DocumentLifecycleStatus,
  DocumentTracking,
} from '../types';

const STATUS_CONFIG: Record<ClinicalVisitStatus, { label: string; color: string }> = {
  OPEN: { label: 'Aberto', color: '#7EB3E0' },
  IN_PROGRESS: { label: 'Em andamento', color: '#F48FB1' },
  COMPLETED: { label: 'Concluído', color: '#81C9C5' },
  CANCELLED: { label: 'Cancelado', color: '#BDBDBD' },
};

const VISIT_TYPE_LABELS: Record<ClinicalVisitType, string> = {
  CONSULTATION: 'Consulta',
  HOSPITALIZATION: 'Internação',
  FOLLOW_UP: 'Retorno',
  EMERGENCY: 'Emergência',
};

const PROC_STATUS_CONFIG: Record<ProcedureStatus, { label: string; color: string }> = {
  SCHEDULED: { label: 'Agendado', color: '#7EB3E0' },
  IN_PROGRESS: { label: 'Em andamento', color: '#F48FB1' },
  COMPLETED: { label: 'Concluído', color: '#81C9C5' },
  CANCELLED: { label: 'Cancelado', color: '#BDBDBD' },
};

const PROC_TYPE_LABELS: Record<ProcedureType, string> = {
  CONSULTATION: 'Consulta',
  SURGERY: 'Cirurgia',
  EXAM: 'Exame',
  VACCINATION: 'Vacinação',
  GROOMING: 'Banho/Tosa',
  OTHER: 'Outro',
};

const PROC_LOCATION_LABELS: Record<ProcedureLocation, string> = {
  IN_CLINIC: 'Na Clínica',
  HOME_VISIT: 'Visita Domiciliar',
  PARTNER: 'Parceiro',
  EXTERNAL: 'Externo',
};

const DOC_STATUS_CONFIG: Record<DocumentLifecycleStatus, { label: string; color: string }> = {
  GENERATING: { label: 'Gerando', color: '#7EB3E0' },
  REPORT_FAILED: { label: 'Falha no relatório', color: '#EF5350' },
  REPORT_COMPLETED: { label: 'Gerado', color: '#9C72D9' },
  NO_SIGNATURE_REQUIRED: { label: 'Sem assinatura', color: '#81C9C5' },
  UPLOADING_TO_SIGNATURE: { label: 'Enviando para assinatura', color: '#7EB3E0' },
  AWAITING_SIGNATURES: { label: 'Aguardando assinaturas', color: '#FFB74D' },
  PARTIALLY_SIGNED: { label: 'Parcialmente assinado', color: '#F48FB1' },
  COMPLETED: { label: 'Concluído', color: '#81C9C5' },
  EXPIRED: { label: 'Expirado', color: '#BDBDBD' },
  FAILED: { label: 'Falhou', color: '#EF5350' },
  CANCELLED: { label: 'Cancelado', color: '#BDBDBD' },
};

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description?: string;
  type: 'visit_created' | 'visit_started' | 'visit_completed' | 'visit_cancelled' | 'procedure' | 'document';
  icon: React.ReactNode;
  color: string;
  procedure?: MedicalProcedure;
  document?: DocumentTracking;
}

const VISIT_EVENT_CONFIG: Record<string, { icon: React.ReactNode; color: string; type: TimelineEvent['type'] }> = {
  VISIT_STARTED: { icon: <StartIcon fontSize="small" />, color: '#F48FB1', type: 'visit_started' },
  VISIT_COMPLETED: { icon: <CompleteIcon fontSize="small" />, color: '#81C9C5', type: 'visit_completed' },
  VISIT_CANCELLED: { icon: <CancelIcon fontSize="small" />, color: '#BDBDBD', type: 'visit_cancelled' },
};

const buildTimelineEvents = (
  entries: TimelineEntry[],
): TimelineEvent[] => {
  return entries.map((entry, idx) => {
    if (entry.entryType === 'PROCEDURE') {
      const proc = entry.procedure;
      const procStatusCfg = entry.status ? PROC_STATUS_CONFIG[entry.status as ProcedureStatus] : null;
      const procTypeLabel = proc?.type ? (PROC_TYPE_LABELS[proc.type] || proc.type) : '';
      return {
        id: `proc-${entry.publicId || idx}`,
        date: entry.date,
        title: entry.title,
        description: `${procTypeLabel}${procStatusCfg ? ` — ${procStatusCfg.label}` : ''}`,
        type: 'procedure' as const,
        icon: <ProcIcon fontSize="small" />,
        color: '#9C72D9',
        procedure: proc,
      };
    }

    if (entry.entryType === 'DOCUMENT') {
      const docStatusCfg = entry.status ? DOC_STATUS_CONFIG[entry.status as DocumentLifecycleStatus] : null;
      return {
        id: `doc-${entry.publicId || idx}`,
        date: entry.date,
        title: entry.title,
        description: docStatusCfg?.label || undefined,
        type: 'document' as const,
        icon: <DocIcon fontSize="small" />,
        color: docStatusCfg?.color || '#9C72D9',
        document: entry.document,
      };
    }

    // Visit lifecycle events (VISIT_STARTED, VISIT_COMPLETED, VISIT_CANCELLED)
    const visitCfg = VISIT_EVENT_CONFIG[entry.entryType] || VISIT_EVENT_CONFIG['VISIT_STARTED'];
    return {
      id: `visit-${entry.publicId || entry.entryType || idx}`,
      date: entry.date,
      title: entry.title,
      description: undefined,
      type: visitCfg.type,
      icon: visitCfg.icon,
      color: visitCfg.color,
    };
  });
};

const AtendimentoDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [visit, setVisit] = useState<ClinicalVisit | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Timeline
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  // Generate document dialog
  const [showDocDialog, setShowDocDialog] = useState(false);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('');
  const [docName, setDocName] = useState('');
  const [generatingDoc, setGeneratingDoc] = useState(false);

  // Detail dialogs
  const [selectedProc, setSelectedProc] = useState<MedicalProcedure | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentTracking | null>(null);

  const isActive = visit?.status === 'OPEN' || visit?.status === 'IN_PROGRESS';

  const loadVisit = useCallback(async () => {
    if (!id) return;
    try {
      const data = await atendimentoService.getById(id);
      setVisit(data);
    } catch {
      toast.error('Erro ao carregar atendimento');
    }
  }, [id]);

  const loadTimeline = useCallback(async () => {
    if (!id) return;
    try {
      const data = await atendimentoService.getTimeline(id);
      setTimelineEntries(data);
    } catch {
      setTimelineEntries([]);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadVisit(), loadTimeline()])
      .finally(() => setLoading(false));
  }, [loadVisit, loadTimeline]);

  // Rebuild timeline events when entries change
  useEffect(() => {
    setTimelineEvents(buildTimelineEvents(timelineEntries));
  }, [timelineEntries]);

  // --- Lifecycle ---
  const handleStart = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await atendimentoService.start(id);
      setVisit(updated);
      loadTimeline();
      toast.success('Atendimento iniciado!');
    } catch { /* interceptor */ } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!id || !window.confirm('Tem certeza que deseja concluir este atendimento?')) return;
    setActionLoading(true);
    try {
      const updated = await atendimentoService.complete(id);
      setVisit(updated);
      loadTimeline();
      toast.success('Atendimento concluído!');
    } catch { /* interceptor */ } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id || !window.confirm('Tem certeza que deseja cancelar este atendimento?')) return;
    setActionLoading(true);
    try {
      const updated = await atendimentoService.cancel(id);
      setVisit(updated);
      loadTimeline();
      toast.success('Atendimento cancelado!');
    } catch { /* interceptor */ } finally {
      setActionLoading(false);
    }
  };

  // --- Documents ---
  const openDocDialog = async () => {
    setShowDocDialog(true);
    try {
      const result = await documentService.searchTemplates({ status: 'PUBLISHED', take: 100 });
      setTemplates(result?.data || []);
    } catch {
      setTemplates([]);
    }
  };

  const handleGenerateDocument = async () => {
    if (!id || !visit || !selectedTemplateKey || !docName.trim()) {
      toast.error('Selecione um template e defina o nome do documento.');
      return;
    }
    setGeneratingDoc(true);
    try {
      await documentService.generateReport({
        templateKey: selectedTemplateKey,
        data: {},
        documentName: docName.trim(),
        petId: visit.petId,
        customerId: visit.customerId,
        clinicalVisitId: id,
      });
      setShowDocDialog(false);
      setSelectedTemplateKey('');
      setDocName('');
      toast.success('Documento gerado com sucesso!');
      loadTimeline();
    } catch { /* interceptor */ } finally {
      setGeneratingDoc(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (!visit) {
    return <Typography>Atendimento não encontrado.</Typography>;
  }

  const statusConfig = visit.status ? STATUS_CONFIG[visit.status] : null;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/atendimentos')}>Voltar</Button>
          <Typography variant="h5" fontWeight={700}>Atendimento</Typography>
          {statusConfig && (
            <Chip
              label={statusConfig.label}
              sx={{
                backgroundColor: statusConfig.color + '14',
                color: statusConfig.color,
                fontWeight: 600,
                ...((visit.status === 'OPEN' || visit.status === 'IN_PROGRESS') && {
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.6 },
                  },
                }),
              }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {visit.status === 'OPEN' && (
            <Button
              variant="contained"
              startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <StartIcon />}
              onClick={handleStart}
              disabled={actionLoading}
              sx={{
                background: 'linear-gradient(135deg, #9C72D9, #7B5BBF)',
                borderRadius: '10px',
                '&:hover': { background: 'linear-gradient(135deg, #8B63CC, #6A4AAE)' },
              }}
            >
              Iniciar
            </Button>
          )}
          {visit.status === 'IN_PROGRESS' && (
            <Button
              variant="contained"
              startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <CompleteIcon />}
              onClick={handleComplete}
              disabled={actionLoading}
              sx={{
                background: 'linear-gradient(135deg, #81C9C5, #00897B)',
                borderRadius: '10px',
                '&:hover': { background: 'linear-gradient(135deg, #6DB8B4, #00796B)' },
              }}
            >
              Concluir
            </Button>
          )}
          {isActive && (
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={actionLoading}
              sx={{
                borderColor: alpha('#9C72D9', 0.4),
                color: '#9C72D9',
                borderRadius: '10px',
                '&:hover': {
                  borderColor: '#9C72D9',
                  bgcolor: alpha('#9C72D9', 0.06),
                },
              }}
            >
              Cancelar
            </Button>
          )}
        </Box>
      </Box>

      {/* Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {visit.publicId && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="caption" color="text.secondary">ID</Typography>
              <Chip
                label={visit.publicId}
                size="small"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.7rem',
                  bgcolor: alpha('#9C72D9', 0.08),
                  color: '#7B5BBF',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: alpha('#9C72D9', 0.15) },
                }}
                onClick={() => {
                  navigator.clipboard.writeText(visit.publicId || '');
                  toast.success('ID copiado!');
                }}
              />
            </Box>
          )}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">Tipo</Typography>
              <Typography fontWeight={500}>{VISIT_TYPE_LABELS[visit.type] || visit.type}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">Pet</Typography>
              <Typography fontWeight={500}>{visit.petName || visit.petId}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">Tutor</Typography>
              <Typography>{visit.customerName || visit.customerId}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">Veterinário</Typography>
              <Typography>{visit.veterinarianName || visit.veterinarianId}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">Início</Typography>
              <Typography>{formatDateTime(visit.startedAt || visit.createdAt)}</Typography>
            </Grid>
            {visit.completedAt && (
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="body2" color="text.secondary">Concluído em</Typography>
                <Typography>{formatDateTime(visit.completedAt)}</Typography>
              </Grid>
            )}
            {visit.chiefComplaint && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">Queixa Principal</Typography>
                <Typography>{visit.chiefComplaint}</Typography>
              </Grid>
            )}
            {visit.notes && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary">Notas</Typography>
                <Typography>{visit.notes}</Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Summary KPIs */}
      {visit.summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Procedimentos', value: String(visit.summary.procedureCount), color: '#9C72D9' },
            { label: 'Medicamentos', value: String(visit.summary.medicationCount), color: '#F48FB1' },
            { label: 'Documentos', value: String(visit.summary.documentCount), color: '#7EB3E0' },
            { label: 'Custo Total', value: formatCurrency(visit.summary.totalCost), color: '#81C9C5' },
          ].map((kpi) => (
            <Grid size={{ xs: 6, md: 3 }} key={kpi.label}>
              <Card sx={{ borderTop: `3px solid ${kpi.color}` }}>
                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">{kpi.label}</Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ color: kpi.color }}>
                    {kpi.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Timeline */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon sx={{ color: 'text.secondary' }} />
              <Typography variant="h6" fontWeight={600}>Linha do Tempo</Typography>
            </Box>
            {isActive && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => navigate(`/procedimentos/novo?petId=${visit.petId}&clinicalVisitId=${id}`)}
                >
                  Novo Procedimento
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<NoteAddIcon />}
                  onClick={openDocDialog}
                >
                  Gerar Documento
                </Button>
              </Box>
            )}
          </Box>

          {timelineEvents.length === 0 ? (
            <Typography color="text.secondary" variant="body2">Nenhum evento registrado.</Typography>
          ) : (
            <Box sx={{ position: 'relative', pl: 4 }}>
              {/* Vertical line */}
              <Box sx={{
                position: 'absolute',
                left: 15,
                top: 8,
                bottom: 8,
                width: 2,
                backgroundColor: '#e0e0e0',
                borderRadius: 1,
              }} />

              {timelineEvents.map((event, index) => (
                <Box
                  key={event.id}
                  sx={{
                    position: 'relative',
                    pb: index === timelineEvents.length - 1 ? 0 : 3,
                    '&:hover .timeline-card': {
                      borderColor: alpha(event.color, 0.4),
                      boxShadow: `0 2px 12px ${alpha(event.color, 0.15)}`,
                    },
                  }}
                >
                  {/* Dot on the line */}
                  <Box sx={{
                    position: 'absolute',
                    left: -25,
                    top: 6,
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    backgroundColor: alpha(event.color, 0.12),
                    border: `2px solid ${event.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: event.color,
                    zIndex: 1,
                  }}>
                    {event.icon}
                  </Box>

                  {/* Event card */}
                  <Box
                    className="timeline-card"
                    onClick={() => {
                      if (event.type === 'procedure' && event.procedure) {
                        setSelectedProc(event.procedure);
                      } else if (event.type === 'document' && event.document) {
                        setSelectedDoc(event.document);
                      }
                    }}
                    sx={{
                      ml: 2,
                      p: 1.5,
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: 'transparent',
                      backgroundColor: alpha(event.color, 0.04),
                      transition: 'all 0.2s ease',
                      ...((event.type === 'procedure' || event.type === 'document') && {
                        cursor: 'pointer',
                      }),
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ color: event.color }}>
                          {event.title}
                        </Typography>
                        {(event.type === 'procedure' || event.type === 'document') && (
                          <ViewIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', ml: 2 }}>
                        {formatDateTime(event.date)}
                      </Typography>
                    </Box>
                    {event.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        {event.description}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Procedure Detail Dialog */}
      <Dialog open={!!selectedProc} onClose={() => setSelectedProc(null)} maxWidth="sm" fullWidth>
        {selectedProc && (() => {
          const procStatusCfg = selectedProc.status ? PROC_STATUS_CONFIG[selectedProc.status] : null;
          return (
            <>
              <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
                <Box sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #9C72D9, #7B5BBF)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                }}>
                  <ProcIcon fontSize="small" />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" fontWeight={700} noWrap>{selectedProc.description}</Typography>
                </Box>
                {procStatusCfg && (
                  <Chip
                    label={procStatusCfg.label}
                    size="small"
                    sx={{ backgroundColor: procStatusCfg.color + '14', color: procStatusCfg.color, fontWeight: 600 }}
                  />
                )}
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Tipo</Typography>
                    <Typography variant="body2" fontWeight={500}>{PROC_TYPE_LABELS[selectedProc.type] || selectedProc.type}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Localização</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedProc.location ? (PROC_LOCATION_LABELS[selectedProc.location] || selectedProc.location) : '—'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Data</Typography>
                    <Typography variant="body2" fontWeight={500}>{formatDateTime(selectedProc.date)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Custo</Typography>
                    <Typography variant="body2" fontWeight={500}>{formatCurrency(selectedProc.cost)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Pet</Typography>
                    <Typography variant="body2" fontWeight={500}>{selectedProc.petName || selectedProc.petId}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Veterinário</Typography>
                    <Typography variant="body2" fontWeight={500}>{selectedProc.veterinarianName || selectedProc.veterinarianId}</Typography>
                  </Grid>
                  {selectedProc.createdAt && (
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Criado em</Typography>
                      <Typography variant="body2" fontWeight={500}>{formatDateTime(selectedProc.createdAt)}</Typography>
                    </Grid>
                  )}
                  {selectedProc.updatedAt && (
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Atualizado em</Typography>
                      <Typography variant="body2" fontWeight={500}>{formatDateTime(selectedProc.updatedAt)}</Typography>
                    </Grid>
                  )}
                  {selectedProc.observations && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">Observações</Typography>
                      <Typography variant="body2">{selectedProc.observations}</Typography>
                    </Grid>
                  )}
                  {selectedProc.medications && selectedProc.medications.length > 0 && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Medicamentos</Typography>
                      {selectedProc.medications.map((med, idx) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5, p: 1, backgroundColor: alpha('#9C72D9', 0.04), borderRadius: 1 }}>
                          <Typography variant="body2" fontWeight={500} sx={{ flex: 2 }}>{med.medicationName || med.medicationId}</Typography>
                          <Chip label={`${med.quantity}x`} size="small" variant="outlined" />
                          <Typography variant="body2" color="text.secondary" sx={{ flex: 2 }}>{med.dosage}</Typography>
                        </Box>
                      ))}
                    </Grid>
                  )}
                  {selectedProc.notes && selectedProc.notes.length > 0 && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Notas</Typography>
                      {selectedProc.notes.map((note, idx) => (
                        <Box key={idx} sx={{ p: 1, mb: 0.5, backgroundColor: '#f8fafc', borderRadius: 1 }}>
                          <Typography variant="body2">{note.content}</Typography>
                          {note.createdAt && (
                            <Typography variant="caption" color="text.secondary">{formatDateTime(note.createdAt)}</Typography>
                          )}
                        </Box>
                      ))}
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSelectedProc(null)}>Fechar</Button>
                <Button
                  variant="contained"
                  startIcon={<ViewIcon />}
                  onClick={() => {
                    setSelectedProc(null);
                    navigate(`/procedimentos/${selectedProc.publicId}`);
                  }}
                >
                  Ver Completo
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      {/* Document Detail Dialog */}
      <Dialog
        open={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', overflow: 'hidden' },
        }}
      >
        {selectedDoc && (() => {
          const docStatusCfg = selectedDoc.status ? DOC_STATUS_CONFIG[selectedDoc.status] : null;
          return (
            <>
              <Box sx={{
                background: `linear-gradient(135deg, ${docStatusCfg?.color || '#9C72D9'}, ${alpha(docStatusCfg?.color || '#9C72D9', 0.7)})`,
                px: 3,
                py: 2.5,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}>
                <Box sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  bgcolor: 'rgba(255,255,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}>
                  <DocIcon />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" fontWeight={700} color="#fff" noWrap>
                    {selectedDoc.documentName || 'Documento'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                    {selectedDoc.templateKey}
                  </Typography>
                </Box>
                {docStatusCfg && (
                  <Chip
                    label={docStatusCfg.label}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      fontWeight: 600,
                      backdropFilter: 'blur(4px)',
                    }}
                  />
                )}
              </Box>
              <DialogContent sx={{ pt: 2.5 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    {docStatusCfg && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: docStatusCfg.color,
                        }} />
                        <Typography variant="body2" fontWeight={600} sx={{ color: docStatusCfg.color }}>
                          {docStatusCfg.label}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  {selectedDoc.reportId && (
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Report ID</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {selectedDoc.reportId}
                      </Typography>
                    </Grid>
                  )}
                  {selectedDoc.signatureDocumentId && (
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Assinatura ID</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {selectedDoc.signatureDocumentId}
                      </Typography>
                    </Grid>
                  )}
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Criado em</Typography>
                    <Typography variant="body2" fontWeight={500}>{formatDateTime(selectedDoc.createdAt)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Atualizado em</Typography>
                    <Typography variant="body2" fontWeight={500}>{formatDateTime(selectedDoc.updatedAt)}</Typography>
                  </Grid>
                  {selectedDoc.errorMessage && (
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{
                        p: 1.5,
                        borderRadius: '10px',
                        bgcolor: alpha('#EF5350', 0.06),
                        border: `1px solid ${alpha('#EF5350', 0.2)}`,
                      }}>
                        <Typography variant="caption" color="error" fontWeight={600}>Erro</Typography>
                        <Typography variant="body2" color="error.dark">{selectedDoc.errorMessage}</Typography>
                      </Box>
                    </Grid>
                  )}
                  {selectedDoc.publicId && (
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">ID</Typography>
                        <Chip
                          label={selectedDoc.publicId}
                          size="small"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.7rem',
                            bgcolor: alpha('#9C72D9', 0.08),
                            color: '#7B5BBF',
                            fontWeight: 600,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: alpha('#9C72D9', 0.15) },
                          }}
                          onClick={() => {
                            navigator.clipboard.writeText(selectedDoc.publicId || '');
                            toast.success('ID copiado!');
                          }}
                        />
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button
                  onClick={() => setSelectedDoc(null)}
                  sx={{ borderRadius: '10px' }}
                >
                  Fechar
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      {/* Generate Document Dialog */}
      <Dialog
        open={showDocDialog}
        onClose={() => setShowDocDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', overflow: 'hidden' },
        }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #9C72D9, #7B5BBF)',
          px: 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: '14px',
            bgcolor: 'rgba(255,255,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}>
            <NoteAddIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} color="#fff">
              Gerar Documento
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              Selecione o template e personalize o nome
            </Typography>
          </Box>
        </Box>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <TextField
            select
            fullWidth
            label="Template"
            value={selectedTemplateKey}
            onChange={(e) => {
              const key = e.target.value;
              setSelectedTemplateKey(key);
              const tpl = templates.find((t) => t.key === key);
              if (tpl) setDocName(tpl.name);
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#9C72D9',
                },
              },
              '& .MuiInputLabel-root.Mui-focused': { color: '#9C72D9' },
            }}
          >
            <MuiMenuItem value="">Selecione...</MuiMenuItem>
            {templates.map((t) => (
              <MuiMenuItem key={t.key} value={t.key}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DocIcon sx={{ fontSize: 18, color: '#9C72D9' }} />
                  {t.name}
                </Box>
              </MuiMenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Nome do Documento"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder="Ex: Atestado de Vacinação - Rex"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#9C72D9',
                },
              },
              '& .MuiInputLabel-root.Mui-focused': { color: '#9C72D9' },
            }}
          />
          {selectedTemplateKey && (() => {
            const tpl = templates.find((t) => t.key === selectedTemplateKey);
            if (!tpl) return null;
            const needsTutor = tpl.tutorSignature === 'YES' || tpl.tutorSignature === 'OPTIONAL';
            const needsVet = tpl.vetSignature === 'YES' || tpl.vetSignature === 'OPTIONAL';
            const hasSignature = needsTutor || needsVet;
            return (
              <Box sx={{
                mt: 2,
                p: 2,
                borderRadius: '12px',
                bgcolor: alpha('#9C72D9', 0.06),
                border: `1px solid ${alpha('#9C72D9', 0.15)}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DocIcon sx={{ fontSize: 18, color: '#9C72D9' }} />
                  <Typography variant="caption" color="text.secondary">
                    Template: <strong>{tpl.name}</strong>
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {hasSignature ? (
                    <>
                      <Chip
                        icon={<SignIcon sx={{ fontSize: '16px !important' }} />}
                        label="Requer assinatura"
                        size="small"
                        sx={{
                          bgcolor: alpha('#9C72D9', 0.1),
                          color: '#7B5BBF',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          '& .MuiChip-icon': { color: '#9C72D9' },
                        }}
                      />
                      {needsTutor && (
                        <Chip
                          icon={<TutorIcon sx={{ fontSize: '16px !important' }} />}
                          label={tpl.tutorSignature === 'OPTIONAL' ? 'Tutor (opcional)' : 'Tutor'}
                          size="small"
                          sx={{
                            bgcolor: alpha('#F48FB1', 0.1),
                            color: '#E91E63',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            '& .MuiChip-icon': { color: '#F48FB1' },
                          }}
                        />
                      )}
                      {needsVet && (
                        <Chip
                          icon={<VetIcon sx={{ fontSize: '16px !important' }} />}
                          label={tpl.vetSignature === 'OPTIONAL' ? 'Veterinário (opcional)' : 'Veterinário'}
                          size="small"
                          sx={{
                            bgcolor: alpha('#81C9C5', 0.15),
                            color: '#00897B',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            '& .MuiChip-icon': { color: '#81C9C5' },
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <Chip
                      icon={<DocIcon sx={{ fontSize: '16px !important' }} />}
                      label="Sem assinatura"
                      size="small"
                      sx={{
                        bgcolor: alpha('#BDBDBD', 0.15),
                        color: '#757575',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        '& .MuiChip-icon': { color: '#BDBDBD' },
                      }}
                    />
                  )}
                </Box>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setShowDocDialog(false)}
            sx={{ borderRadius: '10px', color: 'text.secondary' }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleGenerateDocument}
            disabled={generatingDoc || !selectedTemplateKey || !docName.trim()}
            startIcon={generatingDoc ? <CircularProgress size={20} color="inherit" /> : <NoteAddIcon />}
            sx={{
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #9C72D9, #7B5BBF)',
              boxShadow: `0 4px 12px ${alpha('#9C72D9', 0.3)}`,
              px: 3,
              '&:hover': {
                background: 'linear-gradient(135deg, #8B63CC, #6A4AAE)',
              },
            }}
          >
            {generatingDoc ? 'Gerando...' : 'Gerar Documento'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AtendimentoDetailPage;
