import { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  Box,
  Button,
  Typography,
  CircularProgress,
  MenuItem as MuiMenuItem,
  Grid2 as Grid,
  alpha,
  InputAdornment,
  Chip,
  Dialog,
  DialogContent,
  DialogActions,
  Avatar,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Pets as PetsIcon,
  Tune as TuneIcon,
  People as PeopleIcon,
  Notes as NotesIcon,
  Label as LabelIcon,
  Palette as PaletteIcon,
  FitnessCenter as WeightIcon,
  Person as PersonIcon,
  SwapHoriz as SwapIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { FaDog, FaCat, FaDove, FaFrog, FaPaw, FaMars, FaVenus, FaGenderless } from 'react-icons/fa6';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { MuiDatePicker } from '@app/ui';
import { formatCpf, formatPhone } from '@app/core';
import { petService, customerService } from '../services';
import type { PetDto, PetSpecies, PetGender, Customer } from '../types';

const SPECIES_LABELS: Record<PetSpecies, string> = {
  DOG: 'Cão',
  CAT: 'Gato',
  BIRD: 'Ave',
  REPTILE: 'Réptil',
  OTHER: 'Outro',
};

const SPECIES_COLORS: Record<PetSpecies, string> = {
  DOG: '#9C72D9',
  CAT: '#F48FB1',
  BIRD: '#81C9C5',
  REPTILE: '#7EB3E0',
  OTHER: '#FFD6A5',
};

const SPECIES_ICONS: Record<PetSpecies, React.ReactNode> = {
  DOG: <FaDog />,
  CAT: <FaCat />,
  BIRD: <FaDove />,
  REPTILE: <FaFrog />,
  OTHER: <FaPaw />,
};

const GENDER_LABELS: Record<PetGender, string> = {
  MALE: 'Macho',
  FEMALE: 'Fêmea',
  UNKNOWN: 'Indefinido',
};

const GENDER_ICONS: Record<PetGender, React.ReactNode> = {
  MALE: <FaMars />,
  FEMALE: <FaVenus />,
  UNKNOWN: <FaGenderless />,
};

const GENDER_COLORS: Record<PetGender, string> = {
  MALE: '#7EB3E0',
  FEMALE: '#F48FB1',
  UNKNOWN: '#BDBDBD',
};

const SectionHeader = ({ icon, title, subtitle, gradient }: { icon: React.ReactNode; title: string; subtitle?: string; gradient?: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
    <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: gradient || 'linear-gradient(135deg, #9C72D9, #7B5BBF)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>{title}</Typography>
      {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
    </Box>
  </Box>
);

interface PetFormData {
  name: string;
  species: PetSpecies | '';
  breed: string;
  gender: PetGender | '';
  birthDate: string;
  weight: string;
  color: string;
  observations: string;
  primaryTutorId: string;
  primaryTutorName: string;
}

const initialFormData: PetFormData = {
  name: '',
  species: '',
  breed: '',
  gender: '',
  birthDate: new Date().toISOString().split('T')[0],
  weight: '',
  color: '',
  observations: '',
  primaryTutorId: '',
  primaryTutorName: '',
};

const PetFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [formData, setFormData] = useState<PetFormData>(initialFormData);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Tutor details (for edit mode)
  const [tutorDetails, setTutorDetails] = useState<Customer | null>(null);
  const [loadingTutor, setLoadingTutor] = useState(false);

  // Change tutor dialog
  const [showChangeTutor, setShowChangeTutor] = useState(false);
  const [tutorSearchInput, setTutorSearchInput] = useState('');
  const [tutorSearchResults, setTutorSearchResults] = useState<Customer[]>([]);
  const [searchingTutors, setSearchingTutors] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      customerService.getActiveCustomers().then(setCustomers).catch(() => setCustomers([]));
    }
  }, [isEditing]);

  // Load tutor details when editing and tutorId is available
  const loadTutorDetails = useCallback(async (tutorId: string) => {
    if (!tutorId) return;
    setLoadingTutor(true);
    try {
      const tutor = await customerService.getCustomerById(tutorId);
      setTutorDetails(tutor);
    } catch {
      setTutorDetails(null);
    } finally {
      setLoadingTutor(false);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    const loadPet = async () => {
      setLoadingData(true);
      try {
        const full = await petService.getPetById(id);
        const tutorName =
          full.primaryTutorName
          || full.tutors?.find((t) => t.role === 'PRIMARY')?.customerName
          || '';
        setFormData({
          name: full.name || '',
          species: full.species || '',
          breed: full.breed || '',
          gender: full.gender || '',
          birthDate: full.birthDate ? full.birthDate.split('T')[0] : '',
          weight: full.weight?.toString() || '',
          color: full.color || '',
          observations: full.observations || '',
          primaryTutorId: full.primaryTutorId || '',
          primaryTutorName: tutorName,
        });
        if (full.primaryTutorId) {
          loadTutorDetails(full.primaryTutorId);
        }
      } catch {
        toast.error('Erro ao carregar dados do pet.');
        navigate('/pets');
      } finally {
        setLoadingData(false);
      }
    };
    loadPet();
  }, [id, navigate, loadTutorDetails]);

  // Debounced tutor search
  useEffect(() => {
    if (!showChangeTutor) return;
    const term = tutorSearchInput.trim();
    if (!term) {
      setTutorSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingTutors(true);
      try {
        const isCpf = /^\d/.test(term);
        const where = isCpf
          ? { cpf: { contains: term.replace(/\D/g, '') } }
          : { name: { contains: term } };
        const result = await customerService.searchCustomers({
          where,
          take: 10,
          sort: [{ field: 'name', direction: 'ASC' }],
        });
        setTutorSearchResults(result?.data || []);
      } catch {
        setTutorSearchResults([]);
      } finally {
        setSearchingTutors(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [tutorSearchInput, showChangeTutor]);

  const handleSelectNewTutor = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      primaryTutorId: customer.publicId || customer.id || '',
      primaryTutorName: customer.name,
    }));
    setTutorDetails(customer);
    setShowChangeTutor(false);
    setTutorSearchInput('');
    setTutorSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const petData: PetDto = {
        name: formData.name,
        species: formData.species as PetSpecies || undefined,
        breed: formData.breed || undefined,
        gender: formData.gender as PetGender || undefined,
        birthDate: formData.birthDate || undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        color: formData.color || undefined,
        observations: formData.observations || undefined,
        primaryTutorId: formData.primaryTutorId || undefined,
      };

      if (id) {
        await petService.updatePet(id, petData);
        toast.success('Pet atualizado com sucesso!');
      } else {
        await petService.createPet(petData);
        toast.success('Pet criado com sucesso!');
      }

      navigate('/pets');
    } catch (error) {
      console.error('Erro ao salvar pet:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/pets')} color="inherit">
          Voltar
        </Button>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            background: 'linear-gradient(135deg, #9C72D9 0%, #7B5BBF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(156, 114, 217, 0.35)',
            flexShrink: 0,
          }}
        >
          <PetsIcon />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
            {isEditing ? 'Editar Pet' : 'Novo Pet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {isEditing ? 'Atualize os dados do pet' : 'Cadastre um novo paciente na clínica'}
          </Typography>
        </Box>
      </Box>

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* --- Identificação --- */}
          <Box sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: '16px', border: '1px solid', borderColor: (theme) => alpha(theme.palette.divider, 0.08), boxShadow: `0 1px 3px ${alpha('#000', 0.04)}` }}>
            <SectionHeader icon={<PetsIcon fontSize="small" />} title="Identificação" subtitle="Nome, especie e raca do pet" />
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PetsIcon sx={{ color: '#9C72D9' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Espécie"
                  value={formData.species}
                  onChange={(e) => setFormData({ ...formData, species: e.target.value as PetSpecies | '' })}
                >
                  <MuiMenuItem value="">Selecione...</MuiMenuItem>
                  {Object.entries(SPECIES_LABELS).map(([value, label]) => (
                    <MuiMenuItem key={value} value={value}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: SPECIES_COLORS[value as PetSpecies], display: 'flex' }}>{SPECIES_ICONS[value as PetSpecies]}</span>
                        {label}
                      </span>
                    </MuiMenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Raça"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LabelIcon sx={{ color: '#9C72D9' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* --- Características --- */}
          <Box sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: '16px', border: '1px solid', borderColor: (theme) => alpha(theme.palette.divider, 0.08), boxShadow: `0 1px 3px ${alpha('#000', 0.04)}` }}>
            <SectionHeader icon={<TuneIcon fontSize="small" />} title="Características" subtitle="Sexo, cor, peso e data de nascimento" gradient="linear-gradient(135deg, #F48FB1, #E57399)" />
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Sexo"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as PetGender | '' })}
                >
                  <MuiMenuItem value="">Selecione...</MuiMenuItem>
                  {Object.entries(GENDER_LABELS).map(([value, label]) => (
                    <MuiMenuItem key={value} value={value}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: GENDER_COLORS[value as PetGender], display: 'flex' }}>{GENDER_ICONS[value as PetGender]}</span>
                        {label}
                      </span>
                    </MuiMenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Cor"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PaletteIcon sx={{ color: '#F48FB1' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <MuiDatePicker
                  mode="day"
                  label="Data de Nascimento"
                  value={formData.birthDate}
                  onChange={(val) => setFormData({ ...formData, birthDate: val })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Peso (kg)"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  slotProps={{ input: { inputProps: { step: '0.1', min: '0' } } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <WeightIcon sx={{ color: '#F48FB1' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* --- Tutor --- */}
          <Box sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: '16px', border: '1px solid', borderColor: (theme) => alpha(theme.palette.divider, 0.08), boxShadow: `0 1px 3px ${alpha('#000', 0.04)}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <SectionHeader icon={<PeopleIcon fontSize="small" />} title="Tutor" subtitle="Tutor responsavel pelo pet" gradient="linear-gradient(135deg, #7EB3E0, #5A9BD5)" />
              {isEditing && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<SwapIcon />}
                  onClick={() => setShowChangeTutor(true)}
                  sx={{
                    borderColor: alpha('#7EB3E0', 0.4),
                    color: '#5A9BD5',
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600,
                    flexShrink: 0,
                    '&:hover': {
                      borderColor: '#7EB3E0',
                      bgcolor: alpha('#7EB3E0', 0.06),
                    },
                  }}
                >
                  Trocar Tutor
                </Button>
              )}
            </Box>
            {isEditing ? (
              loadingTutor ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : tutorDetails ? (
                <Box sx={{
                  p: 2.5,
                  borderRadius: '12px',
                  bgcolor: alpha('#7EB3E0', 0.04),
                  border: `1px solid ${alpha('#7EB3E0', 0.12)}`,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{
                      width: 44,
                      height: 44,
                      bgcolor: alpha('#7EB3E0', 0.14),
                      color: '#5A9BD5',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                    }}>
                      {(tutorDetails.name || '?').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={700} noWrap>
                        {tutorDetails.name}
                      </Typography>
                      {tutorDetails.active !== undefined && (
                        <Chip
                          label={tutorDetails.active ? 'Ativo' : 'Inativo'}
                          size="small"
                          sx={{
                            mt: 0.25,
                            height: 20,
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            bgcolor: tutorDetails.active ? alpha('#81C9C5', 0.12) : alpha('#BDBDBD', 0.12),
                            color: tutorDetails.active ? '#00897B' : '#757575',
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                  <Grid container spacing={2}>
                    {tutorDetails.cpf && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BadgeIcon sx={{ fontSize: 16, color: '#7EB3E0', opacity: 0.7 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">CPF</Typography>
                            <Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                              {formatCpf(tutorDetails.cpf)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                    {tutorDetails.email && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon sx={{ fontSize: 16, color: '#7EB3E0', opacity: 0.7 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Email</Typography>
                            <Typography variant="body2" fontWeight={500} noWrap>{tutorDetails.email}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                    {tutorDetails.phone && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon sx={{ fontSize: 16, color: '#81C9C5', opacity: 0.7 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Telefone</Typography>
                            <Typography variant="body2" fontWeight={500}>{formatPhone(tutorDetails.phone)}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                    {tutorDetails.city && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon sx={{ fontSize: 16, color: '#F48FB1', opacity: 0.7 }} />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Cidade</Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {tutorDetails.city}{tutorDetails.state ? `/${tutorDetails.state}` : ''}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {formData.primaryTutorName || 'Nenhum tutor vinculado'}
                </Typography>
              )
            ) : (
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Tutor Principal"
                    value={formData.primaryTutorId}
                    onChange={(e) => setFormData({ ...formData, primaryTutorId: e.target.value })}
                  >
                    <MuiMenuItem value="">Nenhum</MuiMenuItem>
                    {customers.map((c) => (
                      <MuiMenuItem key={c.publicId || c.id} value={c.publicId || c.id || ''}>
                        {c.name}
                      </MuiMenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            )}
          </Box>

          {/* --- Observações --- */}
          <Box sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: '16px', border: '1px solid', borderColor: (theme) => alpha(theme.palette.divider, 0.08), boxShadow: `0 1px 3px ${alpha('#000', 0.04)}` }}>
            <SectionHeader icon={<NotesIcon fontSize="small" />} title="Observações" subtitle="Anotacoes internas" gradient="linear-gradient(135deg, #81C9C5, #5FB8B3)" />
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Observações"
                  multiline
                  rows={3}
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <NotesIcon sx={{ color: '#81C9C5', alignSelf: 'flex-start', mt: 1 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
            <Button variant="outlined" onClick={() => navigate('/pets')}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            >
              {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Salvar'}
            </Button>
          </Box>
        </Box>
      </form>

      {/* Change Tutor Dialog */}
      <Dialog
        open={showChangeTutor}
        onClose={() => {
          setShowChangeTutor(false);
          setTutorSearchInput('');
          setTutorSearchResults([]);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', overflow: 'hidden' },
        }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #7EB3E0, #5A9BD5)',
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
            <SwapIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} color="#fff">
              Trocar Tutor
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              Busque por nome ou CPF para selecionar o novo tutor
            </Typography>
          </Box>
        </Box>
        <DialogContent sx={{ pt: 2.5 }}>
          <TextField
            fullWidth
            placeholder="Digite o nome ou CPF do tutor..."
            value={tutorSearchInput}
            onChange={(e) => setTutorSearchInput(e.target.value)}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#7EB3E0' }} />
                </InputAdornment>
              ),
              endAdornment: searchingTutors ? (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ) : null,
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#7EB3E0',
                },
              },
            }}
          />

          {tutorSearchInput.trim() && !searchingTutors && tutorSearchResults.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Nenhum tutor encontrado para "{tutorSearchInput}"
              </Typography>
            </Box>
          )}

          {!tutorSearchInput.trim() && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <SearchIcon sx={{ fontSize: 40, color: alpha('#7EB3E0', 0.3), mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Digite o nome ou CPF para buscar
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {tutorSearchResults.map((customer) => {
              const isCurrentTutor = (customer.publicId || customer.id) === formData.primaryTutorId;
              return (
                <Box
                  key={customer.publicId || customer.id}
                  onClick={() => !isCurrentTutor && handleSelectNewTutor(customer)}
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: isCurrentTutor ? alpha('#81C9C5', 0.4) : alpha('#000', 0.06),
                    bgcolor: isCurrentTutor ? alpha('#81C9C5', 0.04) : 'transparent',
                    cursor: isCurrentTutor ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    ...(!isCurrentTutor && {
                      '&:hover': {
                        borderColor: alpha('#7EB3E0', 0.4),
                        bgcolor: alpha('#7EB3E0', 0.04),
                        boxShadow: `0 2px 8px ${alpha('#7EB3E0', 0.12)}`,
                      },
                    }),
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{
                      width: 40,
                      height: 40,
                      bgcolor: alpha('#7EB3E0', 0.14),
                      color: '#5A9BD5',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                    }}>
                      {(customer.name || '?').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                          {customer.name}
                        </Typography>
                        {isCurrentTutor && (
                          <Chip
                            icon={<CheckIcon sx={{ fontSize: '14px !important' }} />}
                            label="Tutor atual"
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              bgcolor: alpha('#81C9C5', 0.12),
                              color: '#00897B',
                              '& .MuiChip-icon': { color: '#81C9C5' },
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.25 }}>
                        {customer.cpf && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            {formatCpf(customer.cpf)}
                          </Typography>
                        )}
                        {customer.phone && (
                          <Typography variant="caption" color="text.secondary">
                            {formatPhone(customer.phone)}
                          </Typography>
                        )}
                        {customer.email && (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {customer.email}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => {
              setShowChangeTutor(false);
              setTutorSearchInput('');
              setTutorSearchResults([]);
            }}
            sx={{ borderRadius: '10px' }}
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PetFormPage;
