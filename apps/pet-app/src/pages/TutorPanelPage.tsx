import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid2 as Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  CircularProgress,
  Alert,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonSearch as TutorPanelIcon,
  Pets as PetsIcon,
  Home as HomeIcon,
  Edit as EditIcon,
  MedicalServices as MedicalIcon,
  History as HistoryIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Scale as WeightIcon,
  Cake as BirthIcon,
  Palette as ColorIcon,
  LocalHospital as HospitalIcon,
} from '@mui/icons-material';
import { FaDog, FaCat, FaDove, FaFrog, FaPaw } from 'react-icons/fa6';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatCpf, formatPhone, formatDate } from '@app/core';
import { customerService, petService, medicalProcedureService, atendimentoService } from '../services';
import type { CustomerWithAddresses, Pet, MedicalProcedure, ClinicalVisit } from '../types';

const SPECIES_CONFIG: Record<string, { icon: React.ReactNode; color: string; gradient: string; label: string }> = {
  DOG: { icon: <FaDog size={22} />, color: '#9C72D9', gradient: 'linear-gradient(135deg, #9C72D9, #7B5BBF)', label: 'Cão' },
  CAT: { icon: <FaCat size={22} />, color: '#F48FB1', gradient: 'linear-gradient(135deg, #F48FB1, #E91E63)', label: 'Gato' },
  BIRD: { icon: <FaDove size={22} />, color: '#4DB6AC', gradient: 'linear-gradient(135deg, #4DB6AC, #00897B)', label: 'Ave' },
  REPTILE: { icon: <FaFrog size={22} />, color: '#7EB3E0', gradient: 'linear-gradient(135deg, #7EB3E0, #42A5F5)', label: 'Réptil' },
  OTHER: { icon: <FaPaw size={22} />, color: '#FFB74D', gradient: 'linear-gradient(135deg, #FFB74D, #FF9800)', label: 'Outro' },
};

const TutorPanelPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { cpf?: string } | null;
  const [cpfInput, setCpfInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [customer, setCustomer] = useState<CustomerWithAddresses | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [petProcedures, setPetProcedures] = useState<Record<string, MedicalProcedure[]>>({});
  const [petAtendimentos, setPetAtendimentos] = useState<Record<string, ClinicalVisit>>({});
  const [loadingPets, setLoadingPets] = useState(false);

  const handleSearchByCpf = useCallback(async (digits: string) => {
    if (digits.length !== 11) return;

    setSearching(true);
    setSearched(false);
    try {
      const found = await customerService.findByCpf(digits);
      setCustomer(found);
      setSearched(true);

      // Load pets
      if (found.publicId) {
        setLoadingPets(true);
        try {
          const customerPets = await petService.findByCustomer(found.publicId);
          setPets(customerPets);

          // Check active procedures and open atendimentos for each pet
          const procedureMap: Record<string, MedicalProcedure[]> = {};
          const atendimentoMap: Record<string, ClinicalVisit> = {};
          await Promise.all(
            customerPets.map(async (pet) => {
              if (!pet.publicId) return;
              try {
                const result = await medicalProcedureService.search({
                  where: { petId: pet.publicId, status: 'IN_PROGRESS' },
                  skip: 0,
                  take: 10,
                });
                if (result?.data?.length) {
                  procedureMap[pet.publicId] = result.data;
                }
              } catch {
                // ignore
              }
              try {
                const openAtendimento = await atendimentoService.getOpenByPet(pet.publicId);
                if (openAtendimento) {
                  atendimentoMap[pet.publicId] = openAtendimento;
                }
              } catch {
                // ignore
              }
            })
          );
          setPetProcedures(procedureMap);
          setPetAtendimentos(atendimentoMap);
        } finally {
          setLoadingPets(false);
        }
      }
    } catch {
      setCustomer(null);
      setPets([]);
      setPetProcedures({});
      setPetAtendimentos({});
      setSearched(true);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    const digits = cpfInput.replace(/\D/g, '');
    handleSearchByCpf(digits);
  }, [cpfInput, handleSearchByCpf]);

  // Auto-load from navigation state (e.g. after pet registration)
  useEffect(() => {
    if (locationState?.cpf) {
      setCpfInput(formatCpf(locationState.cpf));
      handleSearchByCpf(locationState.cpf);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box sx={{ width: 48, height: 48, borderRadius: 2.5, background: 'linear-gradient(135deg, #81C9C5 0%, #5FB8B3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 14px rgba(129, 201, 197, 0.35)', flexShrink: 0 }}>
          <TutorPanelIcon />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>Painel do Tutor</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>Busque o tutor e gerencie seus pets</Typography>
        </Box>
      </Box>

      {/* Search bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="Buscar por CPF"
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
              startIcon={searching ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
            >
              Buscar
            </Button>
          </Box>
        </CardContent>
      </Card>

      {searched && !customer && (
        <Alert severity="warning" sx={{ mb: 3 }}>Nenhum tutor encontrado com este CPF.</Alert>
      )}

      {customer && (
        <>
          {/* Customer card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Dados do Tutor
              </Typography>
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
                  <Typography variant="body1">{customer.phone ? formatPhone(customer.phone) : '-'}</Typography>
                </Grid>
                {customer.email && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{customer.email}</Typography>
                  </Grid>
                )}
                {customer.secondaryPhone && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">Tel. Secundário</Typography>
                    <Typography variant="body1">{formatPhone(customer.secondaryPhone)}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Addresses */}
          {customer.addresses && customer.addresses.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HomeIcon /> Endereços
                </Typography>
                {customer.addresses.map((addr, idx) => (
                  <Box key={addr.publicId || idx} sx={{ mb: idx < customer.addresses!.length - 1 ? 2 : 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1">
                        {addr.address.street}, {addr.number || 'S/N'} - {addr.address.neighborhood}
                      </Typography>
                      {addr.isDefault && (
                        <Chip label="Padrão" size="small" color="primary" variant="outlined" />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {addr.address.city}/{addr.address.state} - CEP: {addr.address.zipCode}
                      {addr.complement ? ` | ${addr.complement}` : ''}
                    </Typography>
                    {idx < customer.addresses!.length - 1 && <Divider sx={{ mt: 1 }} />}
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Pets */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PetsIcon /> Pets
              </Typography>
              {loadingPets ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : pets.length === 0 ? (
                <Typography color="text.secondary">Nenhum pet encontrado.</Typography>
              ) : (
                <Grid container spacing={2.5}>
                  {pets.map((pet) => {
                    const hasActiveProcedure = pet.publicId && petProcedures[pet.publicId]?.length > 0;
                    const openAtendimento = pet.publicId ? petAtendimentos[pet.publicId] : undefined;
                    const speciesCfg = SPECIES_CONFIG[pet.species || 'OTHER'] || SPECIES_CONFIG.OTHER;

                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={pet.publicId || pet.id}>
                        <Card
                          sx={{
                            borderRadius: '16px',
                            border: '1px solid',
                            borderColor: (t) => alpha(speciesCfg.color, t.palette.mode === 'dark' ? 0.3 : 0.15),
                            boxShadow: `0 2px 8px ${alpha(speciesCfg.color, 0.08)}`,
                            transition: 'all 0.25s ease',
                            overflow: 'visible',
                            '&:hover': {
                              transform: 'translateY(-3px)',
                              boxShadow: `0 8px 24px ${alpha(speciesCfg.color, 0.18)}`,
                              borderColor: alpha(speciesCfg.color, 0.35),
                            },
                          }}
                        >
                          {/* Top accent bar */}
                          <Box sx={{
                            height: 4,
                            borderRadius: '16px 16px 0 0',
                            background: speciesCfg.gradient,
                          }} />

                          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                            {/* Header: icon + name + status */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                              <Box sx={{
                                width: 48,
                                height: 48,
                                borderRadius: '14px',
                                background: speciesCfg.gradient,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                flexShrink: 0,
                                boxShadow: `0 4px 12px ${alpha(speciesCfg.color, 0.3)}`,
                              }}>
                                {speciesCfg.icon}
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="subtitle1" fontWeight={700} noWrap>
                                  {pet.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {speciesCfg.label}{pet.breed ? ` - ${pet.breed}` : ''}
                                </Typography>
                              </Box>
                              <Chip
                                size="small"
                                label={openAtendimento ? 'Em atendimento' : hasActiveProcedure ? 'Em procedimento' : 'Disponível'}
                                sx={{
                                  backgroundColor: openAtendimento ? '#FCE4EC' : hasActiveProcedure ? '#FFF3E0' : alpha(speciesCfg.color, 0.08),
                                  color: openAtendimento ? '#C2185B' : hasActiveProcedure ? '#E65100' : speciesCfg.color,
                                  fontWeight: 700,
                                  fontSize: '0.68rem',
                                  height: 24,
                                  animation: openAtendimento ? 'pulse 2s infinite' : 'none',
                                  '@keyframes pulse': {
                                    '0%, 100%': { opacity: 1 },
                                    '50%': { opacity: 0.6 },
                                  },
                                }}
                              />
                            </Box>

                            {/* Pet details */}
                            <Box sx={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 1,
                              mb: 2,
                              p: 1.5,
                              borderRadius: '10px',
                              bgcolor: (t) => t.palette.mode === 'dark' ? alpha(speciesCfg.color, 0.06) : alpha(speciesCfg.color, 0.03),
                            }}>
                              {pet.gender && pet.gender !== 'UNKNOWN' && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                  {pet.gender === 'MALE'
                                    ? <MaleIcon sx={{ fontSize: 16, color: '#42A5F5' }} />
                                    : <FemaleIcon sx={{ fontSize: 16, color: '#F48FB1' }} />
                                  }
                                  <Typography variant="caption" color="text.secondary">
                                    {pet.gender === 'MALE' ? 'Macho' : 'Fêmea'}
                                  </Typography>
                                </Box>
                              )}
                              {pet.birthDate && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                  <BirthIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDate(pet.birthDate)}
                                  </Typography>
                                </Box>
                              )}
                              {pet.weight != null && pet.weight > 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                  <WeightIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {pet.weight} kg
                                  </Typography>
                                </Box>
                              )}
                              {pet.color && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                  <ColorIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {pet.color}
                                  </Typography>
                                </Box>
                              )}
                              {!pet.gender && !pet.birthDate && !pet.weight && !pet.color && (
                                <Typography variant="caption" color="text.disabled">
                                  Sem detalhes adicionais
                                </Typography>
                              )}
                            </Box>

                            {/* Atendimento action */}
                            <Box sx={{ mb: 1 }}>
                              {openAtendimento ? (
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<HospitalIcon />}
                                  onClick={() => navigate(`/atendimentos/${openAtendimento.publicId}`)}
                                  sx={{
                                    backgroundColor: '#F48FB1',
                                    '&:hover': { backgroundColor: '#E91E63' },
                                    textTransform: 'none',
                                    fontSize: '0.75rem',
                                    width: '100%',
                                  }}
                                >
                                  Ver Atendimento
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<HospitalIcon />}
                                  onClick={() => navigate(`/atendimentos/novo?petId=${pet.publicId}&customerId=${customer?.publicId || ''}`)}
                                  sx={{
                                    borderColor: '#9C72D9',
                                    color: '#9C72D9',
                                    '&:hover': { borderColor: '#7B5BBF', backgroundColor: alpha('#9C72D9', 0.05) },
                                    textTransform: 'none',
                                    fontSize: '0.75rem',
                                    width: '100%',
                                  }}
                                >
                                  Iniciar Atendimento
                                </Button>
                              )}
                            </Box>

                            {/* Actions */}
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Histórico de Atendimentos">
                                <IconButton
                                  size="small"
                                  onClick={() => pet.publicId && navigate('/atendimentos', { state: { petId: pet.publicId, petName: pet.name } })}
                                  sx={{
                                    color: speciesCfg.color,
                                    '&:hover': { bgcolor: alpha(speciesCfg.color, 0.1) },
                                  }}
                                >
                                  <HistoryIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Novo Procedimento">
                                <IconButton
                                  size="small"
                                  onClick={() => navigate(`/procedimentos/novo?petId=${pet.publicId}`)}
                                  sx={{
                                    color: '#4CAF50',
                                    '&:hover': { bgcolor: alpha('#4CAF50', 0.1) },
                                  }}
                                >
                                  <MedicalIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Editar Pet">
                                <IconButton
                                  size="small"
                                  onClick={() => navigate(`/pets`)}
                                  sx={{
                                    color: 'text.secondary',
                                    '&:hover': { bgcolor: alpha(speciesCfg.color, 0.1) },
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default TutorPanelPage;
