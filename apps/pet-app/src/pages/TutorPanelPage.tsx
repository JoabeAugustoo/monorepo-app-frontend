import { useState, useCallback } from 'react';
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
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Pets as PetsIcon,
  Home as HomeIcon,
  Edit as EditIcon,
  MedicalServices as MedicalIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatCpf, formatPhone } from '@app/core';
import { customerService, petService, medicalProcedureService } from '../services';
import type { CustomerWithAddresses, Pet, MedicalProcedure } from '../types';

const TutorPanelPage = () => {
  const navigate = useNavigate();
  const [cpfInput, setCpfInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [customer, setCustomer] = useState<CustomerWithAddresses | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [petProcedures, setPetProcedures] = useState<Record<string, MedicalProcedure[]>>({});
  const [loadingPets, setLoadingPets] = useState(false);

  const handleSearch = useCallback(async () => {
    const digits = cpfInput.replace(/\D/g, '');
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

          // Check active procedures for each pet
          const procedureMap: Record<string, MedicalProcedure[]> = {};
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
            })
          );
          setPetProcedures(procedureMap);
        } finally {
          setLoadingPets(false);
        }
      }
    } catch {
      setCustomer(null);
      setPets([]);
      setPetProcedures({});
      setSearched(true);
    } finally {
      setSearching(false);
    }
  }, [cpfInput]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Painel do Tutor
      </Typography>

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
                <Grid container spacing={2}>
                  {pets.map((pet) => {
                    const hasActiveProcedure = pet.publicId && petProcedures[pet.publicId]?.length > 0;
                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={pet.publicId || pet.id}>
                        <Card variant="outlined" sx={{ borderColor: 'rgba(156, 114, 217, 0.2)' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box>
                                <Typography variant="subtitle1" fontWeight={600}>{pet.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {pet.species} {pet.breed ? `- ${pet.breed}` : ''}
                                </Typography>
                              </Box>
                              <Chip
                                label={hasActiveProcedure ? 'Em atendimento' : 'Sem atendimento'}
                                size="small"
                                sx={{
                                  backgroundColor: hasActiveProcedure ? '#FCE4EC' : '#f5f5f5',
                                  color: hasActiveProcedure ? '#C2185B' : '#9e9e9e',
                                  fontWeight: 600,
                                  animation: hasActiveProcedure ? 'pulse 2s infinite' : 'none',
                                  '@keyframes pulse': {
                                    '0%, 100%': { opacity: 1 },
                                    '50%': { opacity: 0.6 },
                                  },
                                }}
                              />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                              <IconButton
                                size="small"
                                color="primary"
                                title="Histórico"
                                onClick={() => pet.publicId && navigate(`/procedimentos?petId=${pet.publicId}`)}
                              >
                                <HistoryIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="success"
                                title="Novo Procedimento"
                                onClick={() => navigate(`/procedimentos/novo?petId=${pet.publicId}`)}
                              >
                                <MedicalIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="info"
                                title="Editar Pet"
                                onClick={() => navigate(`/pets`)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
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
