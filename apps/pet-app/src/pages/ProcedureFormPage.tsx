import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  MenuItem as MuiMenuItem,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  MedicalServices as MedicalIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MuiDatePicker } from '@app/ui';
import { medicalProcedureService, petService, employeeService, medicationService } from '../services';
import type {
  MedicalProcedureDto,
  ProcedureType,
  ProcedureLocation,
  ProcedureMedicationDto,
  MedicalNoteDto,
  Pet,
  Employee,
  Medication,
} from '../types';

const TYPE_LABELS: Record<ProcedureType, string> = {
  CONSULTATION: 'Consulta',
  SURGERY: 'Cirurgia',
  EXAM: 'Exame',
  VACCINATION: 'Vacinação',
  GROOMING: 'Banho/Tosa',
  OTHER: 'Outro',
};

const LOCATION_LABELS: Record<ProcedureLocation, string> = {
  IN_CLINIC: 'Na Clínica',
  HOME_VISIT: 'Visita Domiciliar',
  PARTNER: 'Parceiro',
  EXTERNAL: 'Externo',
};

const ProcedureFormPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPetId = searchParams.get('petId') || '';

  const [saving, setSaving] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [vets, setVets] = useState<Employee[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);

  const [formData, setFormData] = useState({
    type: '' as ProcedureType | '',
    location: 'IN_CLINIC' as ProcedureLocation,
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    cost: '',
    observations: '',
    petId: preselectedPetId,
    veterinarianId: '',
  });

  const [meds, setMeds] = useState<ProcedureMedicationDto[]>([]);
  const [notes, setNotes] = useState<MedicalNoteDto[]>([]);

  useEffect(() => {
    petService.getActivePets().then(setPets).catch(() => {});
    employeeService.getVeterinarians().then(setVets).catch(() => {});
    medicationService.getActive().then(setMedications).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!formData.type || !formData.description || !formData.date || !formData.cost || !formData.petId || !formData.veterinarianId) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      const dateTime = formData.time ? `${formData.date}T${formData.time}` : formData.date;
      const data: MedicalProcedureDto = {
        type: formData.type as ProcedureType,
        location: formData.location,
        description: formData.description,
        date: dateTime,
        cost: parseFloat(formData.cost),
        observations: formData.observations || undefined,
        petId: formData.petId,
        veterinarianId: formData.veterinarianId,
        medications: meds.length > 0 ? meds : undefined,
        notes: notes.filter(n => n.content.trim()).length > 0 ? notes.filter(n => n.content.trim()) : undefined,
      };
      await medicalProcedureService.create(data);
      toast.success('Procedimento agendado com sucesso!');
      navigate('/procedimentos');
    } catch (error) {
      console.error('Erro ao agendar procedimento:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/procedimentos')}>Voltar</Button>
        <Typography variant="h5" fontWeight={700}>Novo Procedimento</Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                select
                label="Tipo *"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ProcedureType | '' })}
              >
                <MuiMenuItem value="">Selecione...</MuiMenuItem>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <MuiMenuItem key={value} value={value}>{label}</MuiMenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                select
                label="Localização"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value as ProcedureLocation })}
              >
                {Object.entries(LOCATION_LABELS).map(([value, label]) => (
                  <MuiMenuItem key={value} value={value}>{label}</MuiMenuItem>
                ))}
              </TextField>
            </Box>

            <TextField
              fullWidth
              label="Descrição *"
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <MuiDatePicker
                mode="day"
                value={formData.date}
                onChange={(val) => setFormData({ ...formData, date: val })}
                placeholder="Data *"
              />
              <TextField
                fullWidth
                label="Hora"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                fullWidth
                label="Custo (R$) *"
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                slotProps={{ input: { inputProps: { min: '0', step: '0.01' } } }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                select
                label="Pet *"
                value={formData.petId}
                onChange={(e) => setFormData({ ...formData, petId: e.target.value })}
              >
                <MuiMenuItem value="">Selecione...</MuiMenuItem>
                {pets.map((p) => (
                  <MuiMenuItem key={p.publicId} value={p.publicId || ''}>{p.name}</MuiMenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                select
                label="Veterinário *"
                value={formData.veterinarianId}
                onChange={(e) => setFormData({ ...formData, veterinarianId: e.target.value })}
              >
                <MuiMenuItem value="">Selecione...</MuiMenuItem>
                {vets.map((v) => (
                  <MuiMenuItem key={v.publicId} value={v.publicId || ''}>{v.name}</MuiMenuItem>
                ))}
              </TextField>
            </Box>

            <TextField
              fullWidth
              label="Observações"
              multiline
              rows={2}
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Medications */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Medicamentos Iniciais
          </Typography>
          {meds.map((med, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
              <TextField
                select
                size="small"
                label="Medicamento"
                value={med.medicationId}
                onChange={(e) => {
                  const updated = [...meds];
                  updated[idx] = { ...updated[idx], medicationId: e.target.value };
                  setMeds(updated);
                }}
                sx={{ flex: 2 }}
              >
                {medications.map((m) => (
                  <MuiMenuItem key={m.publicId} value={m.publicId || ''}>{m.name}</MuiMenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                label="Qtd"
                type="number"
                value={med.quantity}
                onChange={(e) => {
                  const updated = [...meds];
                  updated[idx] = { ...updated[idx], quantity: parseFloat(e.target.value) || 0 };
                  setMeds(updated);
                }}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="Dosagem"
                value={med.dosage}
                onChange={(e) => {
                  const updated = [...meds];
                  updated[idx] = { ...updated[idx], dosage: e.target.value };
                  setMeds(updated);
                }}
                sx={{ flex: 2 }}
              />
              <IconButton size="small" color="error" onClick={() => setMeds(meds.filter((_, i) => i !== idx))}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setMeds([...meds, { medicationId: '', quantity: 1, dosage: '' }])}
          >
            Adicionar Medicamento
          </Button>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Notas Iniciais
          </Typography>
          {notes.map((note, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
              <TextField
                fullWidth
                size="small"
                label="Nota"
                value={note.content}
                onChange={(e) => {
                  const updated = [...notes];
                  updated[idx] = { content: e.target.value };
                  setNotes(updated);
                }}
              />
              <IconButton size="small" color="error" onClick={() => setNotes(notes.filter((_, i) => i !== idx))}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setNotes([...notes, { content: '' }])}
          >
            Adicionar Nota
          </Button>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
        >
          {saving ? 'Salvando...' : 'Agendar Procedimento'}
        </Button>
      </Box>
    </Box>
  );
};

export default ProcedureFormPage;
