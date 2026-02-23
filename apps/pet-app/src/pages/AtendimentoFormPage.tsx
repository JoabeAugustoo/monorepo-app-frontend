import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid2 as Grid,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Typography,
  MenuItem as MuiMenuItem,
  CircularProgress,
  Alert,
  alpha,
} from '@mui/material';
import {
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Save as SaveIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { FaDog, FaCat, FaDove, FaFrog, FaPaw } from 'react-icons/fa6';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatCpf, formatPhone, formatDate } from '@app/core';
import { atendimentoService, customerService, petService, employeeService } from '../services';
import type { ClinicalVisitDto, ClinicalVisitType, Customer, CustomerWithAddresses, Pet, Employee } from '../types';

const TYPE_LABELS: Record<ClinicalVisitType, string> = {
  CONSULTATION: 'Consulta',
  HOSPITALIZATION: 'Internação',
  FOLLOW_UP: 'Retorno',
  EMERGENCY: 'Emergência',
};

const SPECIES_CONFIG: Record<string, { icon: React.ReactNode; color: string; gradient: string; label: string }> = {
  DOG: { icon: <FaDog size={20} />, color: '#9C72D9', gradient: 'linear-gradient(135deg, #9C72D9, #7B5BBF)', label: 'Cão' },
  CAT: { icon: <FaCat size={20} />, color: '#F48FB1', gradient: 'linear-gradient(135deg, #F48FB1, #E91E63)', label: 'Gato' },
  BIRD: { icon: <FaDove size={20} />, color: '#4DB6AC', gradient: 'linear-gradient(135deg, #4DB6AC, #00897B)', label: 'Ave' },
  REPTILE: { icon: <FaFrog size={20} />, color: '#7EB3E0', gradient: 'linear-gradient(135deg, #7EB3E0, #42A5F5)', label: 'Réptil' },
  OTHER: { icon: <FaPaw size={20} />, color: '#FFB74D', gradient: 'linear-gradient(135deg, #FFB74D, #FF9800)', label: 'Outro' },
};

const steps = ['Tutor', 'Pet', 'Detalhes'];

const AtendimentoFormPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPetId = searchParams.get('petId') || '';
  const preselectedCustomerId = searchParams.get('customerId') || '';
  const preselectedCpf = searchParams.get('cpf') || '';

  const hasPreselection = !!(preselectedCustomerId || preselectedCpf);
  const [activeStep, setActiveStep] = useState(hasPreselection ? (preselectedPetId ? 2 : 1) : 0);
  const [saving, setSaving] = useState(false);

  // Step 0: Tutor
  const [cpfInput, setCpfInput] = useState(preselectedCpf ? formatCpf(preselectedCpf) : '');
  const [searchingCpf, setSearchingCpf] = useState(false);
  const [cpfSearched, setCpfSearched] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);

  // Step 1: Pet
  const [customerPets, setCustomerPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState(preselectedPetId);

  // Step 2: Details
  const [vets, setVets] = useState<Employee[]>([]);
  const [type, setType] = useState<ClinicalVisitType | ''>('');
  const [veterinarianId, setVeterinarianId] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [notes, setNotes] = useState('');

  // Load vets on mount
  useEffect(() => {
    employeeService.getVeterinarians().then(setVets).catch(() => {});
  }, []);

  // If preselected customerId or cpf, load customer data
  useEffect(() => {
    if (preselectedCustomerId) {
      customerService.getCustomerById(preselectedCustomerId)
        .then((c) => {
          setCustomer(c);
          setCpfSearched(true);
          if (c.cpf) setCpfInput(formatCpf(c.cpf));
          loadPetsForCustomer(preselectedCustomerId);
        })
        .catch(() => {});
    } else if (preselectedCpf) {
      const digits = preselectedCpf.replace(/\D/g, '');
      setSearchingCpf(true);
      customerService.findByCpf(digits)
        .then((found) => {
          setCustomer(found);
          setCpfSearched(true);
          if (found.publicId) loadPetsForCustomer(found.publicId);
        })
        .catch(() => { setCpfSearched(true); })
        .finally(() => setSearchingCpf(false));
    }
  }, [preselectedCustomerId, preselectedCpf]);

  // CPF auto-search
  useEffect(() => {
    if (hasPreselection) return; // skip if pre-selected
    const digits = cpfInput.replace(/\D/g, '');
    if (digits.length === 11) {
      setSearchingCpf(true);
      customerService.findByCpf(digits)
        .then((found) => {
          setCustomer(found);
          setCpfSearched(true);
        })
        .catch(() => {
          setCustomer(null);
          setCpfSearched(true);
        })
        .finally(() => setSearchingCpf(false));
    } else if (cpfSearched) {
      setCustomer(null);
      setCustomerPets([]);
      setSelectedPetId('');
      setCpfSearched(false);
    }
  }, [cpfInput]);

  const loadPetsForCustomer = async (customerId: string) => {
    setLoadingPets(true);
    try {
      const pets = await petService.findByCustomer(customerId);
      setCustomerPets(pets);
    } catch {
      setCustomerPets([]);
    } finally {
      setLoadingPets(false);
    }
  };

  // Load pets when advancing to step 1
  const handleNext = () => {
    if (activeStep === 0 && customer?.publicId) {
      loadPetsForCustomer(customer.publicId);
    }
    setActiveStep((prev) => prev + 1);
  };
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const canAdvanceStep0 = !!customer;
  const canAdvanceStep1 = !!selectedPetId;
  const canSubmit = !!type && !!veterinarianId;

  const handleSave = async () => {
    if (!customer?.publicId || !selectedPetId || !type || !veterinarianId) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      const data: ClinicalVisitDto = {
        type: type as ClinicalVisitType,
        petId: selectedPetId,
        customerId: customer.publicId,
        veterinarianId,
        chiefComplaint: chiefComplaint || undefined,
        notes: notes || undefined,
      };
      const created = await atendimentoService.create(data);
      toast.success('Atendimento iniciado com sucesso!');
      navigate(`/atendimentos/${created.publicId}`);
    } catch (error) {
      console.error('Erro ao iniciar atendimento:', error);
    } finally {
      setSaving(false);
    }
  };

  const selectedPet = customerPets.find((p) => p.publicId === selectedPetId);

  // --- Step renderers ---

  const renderTutorStep = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        fullWidth
        label="CPF do Tutor"
        value={cpfInput}
        onChange={(e) => setCpfInput(formatCpf(e.target.value))}
        placeholder="000.000.000-00"
        disabled={!!preselectedCustomerId}
        slotProps={{
          input: {
            endAdornment: searchingCpf ? <CircularProgress size={20} /> : null,
          },
        }}
      />
      {cpfSearched && customer && (
        <Alert severity="success" icon={<CheckIcon />}>
          Tutor encontrado: <strong>{customer.name}</strong>
          {customer.phone && ` — ${formatPhone(customer.phone)}`}
          {customer.email && ` — ${customer.email}`}
        </Alert>
      )}
      {cpfSearched && !customer && (
        <Alert severity="warning">Nenhum tutor encontrado com este CPF.</Alert>
      )}
    </Box>
  );

  const renderPetStep = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {customer && (
        <Alert severity="info" sx={{ mb: 1 }}>
          Tutor: <strong>{customer.name}</strong> — Selecione o pet para o atendimento
        </Alert>
      )}
      {loadingPets ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : customerPets.length === 0 ? (
        <Alert severity="warning">Nenhum pet encontrado para este tutor.</Alert>
      ) : (
        <Grid container spacing={2}>
          {customerPets.map((pet) => {
            const isSelected = pet.publicId === selectedPetId;
            const speciesCfg = SPECIES_CONFIG[pet.species || 'OTHER'] || SPECIES_CONFIG.OTHER;

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={pet.publicId}>
                <Card
                  onClick={() => setSelectedPetId(pet.publicId || '')}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: '14px',
                    border: '2px solid',
                    borderColor: isSelected ? speciesCfg.color : 'transparent',
                    boxShadow: isSelected
                      ? `0 0 0 1px ${speciesCfg.color}, 0 4px 16px ${alpha(speciesCfg.color, 0.25)}`
                      : `0 2px 8px ${alpha(speciesCfg.color, 0.08)}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: alpha(speciesCfg.color, 0.5),
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '12px',
                        background: speciesCfg.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        flexShrink: 0,
                      }}>
                        {speciesCfg.icon}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap>
                          {pet.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {speciesCfg.label}{pet.breed ? ` — ${pet.breed}` : ''}
                          {pet.birthDate ? ` — ${formatDate(pet.birthDate)}` : ''}
                        </Typography>
                      </Box>
                      {isSelected && (
                        <CheckIcon sx={{ color: speciesCfg.color, fontSize: 22 }} />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );

  const renderDetailsStep = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {customer && selectedPet && (
        <Alert severity="info" sx={{ mb: 1 }}>
          Tutor: <strong>{customer.name}</strong> — Pet: <strong>{selectedPet.name}</strong>
        </Alert>
      )}

      <TextField
        fullWidth
        select
        label="Tipo de Atendimento *"
        value={type}
        onChange={(e) => setType(e.target.value as ClinicalVisitType | '')}
      >
        <MuiMenuItem value="">Selecione...</MuiMenuItem>
        {Object.entries(TYPE_LABELS).map(([value, label]) => (
          <MuiMenuItem key={value} value={value}>{label}</MuiMenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        select
        label="Veterinário *"
        value={veterinarianId}
        onChange={(e) => setVeterinarianId(e.target.value)}
      >
        <MuiMenuItem value="">Selecione...</MuiMenuItem>
        {vets.map((v) => (
          <MuiMenuItem key={v.publicId} value={v.publicId || ''}>{v.name}</MuiMenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        label="Queixa Principal"
        multiline
        rows={2}
        value={chiefComplaint}
        onChange={(e) => setChiefComplaint(e.target.value)}
      />

      <TextField
        fullWidth
        label="Notas"
        multiline
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
    </Box>
  );

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Novo Atendimento
      </Typography>

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && renderTutorStep()}
          {activeStep === 1 && renderPetStep()}
          {activeStep === 2 && renderDetailsStep()}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<PrevIcon />}
            >
              Voltar
            </Button>
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<NextIcon />}
                disabled={
                  (activeStep === 0 && !canAdvanceStep0) ||
                  (activeStep === 1 && !canAdvanceStep1)
                }
              >
                Próximo
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                disabled={saving || !canSubmit}
              >
                {saving ? 'Salvando...' : 'Iniciar Atendimento'}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AtendimentoFormPage;
