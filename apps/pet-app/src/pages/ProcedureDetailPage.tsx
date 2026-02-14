import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid2 as Grid,
  TextField,
  Typography,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { formatCurrency, formatDateTime } from '@app/core';
import { medicalProcedureService, medicationService } from '../services';
import type {
  MedicalProcedure,
  ProcedureStatus,
  ProcedureType,
  ProcedureMedicationDto,
  MedicalNoteDto,
  Medication,
} from '../types';

const STATUS_CONFIG: Record<ProcedureStatus, { label: string; color: string }> = {
  SCHEDULED: { label: 'Agendado', color: '#7EB3E0' },
  IN_PROGRESS: { label: 'Em andamento', color: '#F48FB1' },
  COMPLETED: { label: 'Concluído', color: '#81C9C5' },
  CANCELLED: { label: 'Cancelado', color: '#BDBDBD' },
};

const TYPE_LABELS: Record<ProcedureType, string> = {
  CONSULTATION: 'Consulta',
  SURGERY: 'Cirurgia',
  EXAM: 'Exame',
  VACCINATION: 'Vacinação',
  GROOMING: 'Banho/Tosa',
  OTHER: 'Outro',
};

const ProcedureDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [procedure, setProcedure] = useState<MedicalProcedure | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);

  // Completion form
  const [completeMeds, setCompleteMeds] = useState<ProcedureMedicationDto[]>([]);
  const [completeNotes, setCompleteNotes] = useState<MedicalNoteDto[]>([]);
  const [completeObs, setCompleteObs] = useState('');
  const [showCompleteForm, setShowCompleteForm] = useState(false);

  // Add note
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    medicalProcedureService.getById(id)
      .then(setProcedure)
      .catch(() => toast.error('Erro ao carregar procedimento'))
      .finally(() => setLoading(false));

    medicationService.getActive().then(setMedications).catch(() => {});
  }, [id]);

  const handleStart = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await medicalProcedureService.start(id);
      setProcedure(updated);
      toast.success('Procedimento iniciado!');
    } catch {
      // error handled by interceptor
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id || !window.confirm('Tem certeza que deseja cancelar este procedimento?')) return;
    setActionLoading(true);
    try {
      const updated = await medicalProcedureService.cancel(id);
      setProcedure(updated);
      toast.success('Procedimento cancelado!');
    } catch {
      // error handled by interceptor
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await medicalProcedureService.complete(id, {
        medications: completeMeds.length > 0 ? completeMeds : undefined,
        notes: completeNotes.length > 0 ? completeNotes : undefined,
        observations: completeObs || undefined,
      });
      setProcedure(updated);
      setShowCompleteForm(false);
      toast.success('Procedimento concluído!');
    } catch {
      // error handled by interceptor
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!id || !noteContent.trim()) return;
    setActionLoading(true);
    try {
      const updated = await medicalProcedureService.addNote(id, { content: noteContent.trim() });
      setProcedure(updated);
      setNoteContent('');
      toast.success('Nota adicionada!');
    } catch {
      // error handled by interceptor
    } finally {
      setActionLoading(false);
    }
  };

  const addCompleteMed = () => {
    setCompleteMeds([...completeMeds, { medicationId: '', quantity: 1, dosage: '' }]);
  };

  const removeCompleteMed = (index: number) => {
    setCompleteMeds(completeMeds.filter((_, i) => i !== index));
  };

  const updateCompleteMed = (index: number, field: keyof ProcedureMedicationDto, value: string | number) => {
    const updated = [...completeMeds];
    updated[index] = { ...updated[index], [field]: value };
    setCompleteMeds(updated);
  };

  const addCompleteNote = () => {
    setCompleteNotes([...completeNotes, { content: '' }]);
  };

  const removeCompleteNote = (index: number) => {
    setCompleteNotes(completeNotes.filter((_, i) => i !== index));
  };

  const fmtCurrency = (value?: number) => value != null ? formatCurrency(value, 'BRL') : '-';

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (!procedure) {
    return <Typography>Procedimento não encontrado.</Typography>;
  }

  const statusConfig = procedure.status ? STATUS_CONFIG[procedure.status] : null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/procedimentos')}>Voltar</Button>
          <Typography variant="h5" fontWeight={700}>Procedimento</Typography>
          {statusConfig && (
            <Chip
              label={statusConfig.label}
              sx={{ backgroundColor: statusConfig.color + '14', color: statusConfig.color, fontWeight: 600 }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {procedure.status === 'SCHEDULED' && (
            <Button
              variant="contained"
              color="warning"
              startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <StartIcon />}
              onClick={handleStart}
              disabled={actionLoading}
            >
              Iniciar
            </Button>
          )}
          {procedure.status === 'IN_PROGRESS' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CompleteIcon />}
              onClick={() => setShowCompleteForm(true)}
              disabled={actionLoading}
            >
              Concluir
            </Button>
          )}
          {(procedure.status === 'SCHEDULED' || procedure.status === 'IN_PROGRESS') && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
          )}
        </Box>
      </Box>

      {/* Procedure info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">Tipo</Typography>
              <Typography fontWeight={500}>{TYPE_LABELS[procedure.type] || procedure.type}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">Data</Typography>
              <Typography>{formatDateTime(procedure.date)}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">Custo</Typography>
              <Typography>{fmtCurrency(procedure.cost)}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">Localização</Typography>
              <Typography>{procedure.location || '-'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">Pet</Typography>
              <Typography fontWeight={500}>{procedure.petName || procedure.petId}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">Veterinário</Typography>
              <Typography>{procedure.veterinarianName || procedure.veterinarianId}</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" color="text.secondary">Descrição</Typography>
              <Typography>{procedure.description}</Typography>
            </Grid>
            {procedure.observations && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary">Observações</Typography>
                <Typography>{procedure.observations}</Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Medications used */}
      {procedure.medications && procedure.medications.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Medicamentos Utilizados</Typography>
            {procedure.medications.map((med, idx) => (
              <Box key={idx} sx={{ mb: 1 }}>
                <Typography variant="body1">
                  {med.medicationName || med.medicationId} — Qtd: {med.quantity}, Dosagem: {med.dosage}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>Notas Médicas</Typography>
          {procedure.notes && procedure.notes.length > 0 ? (
            procedure.notes.map((note, idx) => (
              <Box key={idx} sx={{ mb: 1, p: 1.5, backgroundColor: '#f8fafc', borderRadius: 1 }}>
                <Typography variant="body2">{note.content}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDateTime(note.createdAt)}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography color="text.secondary" variant="body2">Nenhuma nota registrada.</Typography>
          )}

          {(procedure.status === 'IN_PROGRESS' || procedure.status === 'SCHEDULED') && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Adicionar nota"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <Button variant="contained" onClick={handleAddNote} disabled={!noteContent.trim() || actionLoading}>
                  Adicionar
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* History link */}
      <Button
        variant="outlined"
        onClick={() => navigate(`/procedimentos?petId=${procedure.petId}`)}
      >
        Ver histórico do pet
      </Button>

      {/* Complete form dialog - inline */}
      {showCompleteForm && (
        <Card sx={{ mt: 3, border: '2px solid #9C72D9' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom color="success.main">
              Concluir Procedimento
            </Typography>

            {/* Medications */}
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Medicamentos Utilizados</Typography>
            {completeMeds.map((med, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                <TextField
                  select
                  size="small"
                  label="Medicamento"
                  value={med.medicationId}
                  onChange={(e) => updateCompleteMed(idx, 'medicationId', e.target.value)}
                  sx={{ flex: 2 }}
                >
                  {medications.map((m) => (
                    <option key={m.publicId} value={m.publicId}>{m.name}</option>
                  ))}
                </TextField>
                <TextField
                  size="small"
                  label="Qtd"
                  type="number"
                  value={med.quantity}
                  onChange={(e) => updateCompleteMed(idx, 'quantity', parseFloat(e.target.value) || 0)}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label="Dosagem"
                  value={med.dosage}
                  onChange={(e) => updateCompleteMed(idx, 'dosage', e.target.value)}
                  sx={{ flex: 2 }}
                />
                <IconButton size="small" color="error" onClick={() => removeCompleteMed(idx)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button size="small" startIcon={<AddIcon />} onClick={addCompleteMed}>
              Adicionar Medicamento
            </Button>

            {/* Notes */}
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Notas Finais</Typography>
            {completeNotes.map((note, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nota"
                  value={note.content}
                  onChange={(e) => {
                    const updated = [...completeNotes];
                    updated[idx] = { content: e.target.value };
                    setCompleteNotes(updated);
                  }}
                />
                <IconButton size="small" color="error" onClick={() => removeCompleteNote(idx)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button size="small" startIcon={<AddIcon />} onClick={addCompleteNote}>
              Adicionar Nota
            </Button>

            <TextField
              fullWidth
              label="Observações finais"
              multiline
              rows={2}
              value={completeObs}
              onChange={(e) => setCompleteObs(e.target.value)}
              sx={{ mt: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowCompleteForm(false)}>Cancelar</Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleComplete}
                disabled={actionLoading}
                startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <CompleteIcon />}
              >
                Concluir Procedimento
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ProcedureDetailPage;
