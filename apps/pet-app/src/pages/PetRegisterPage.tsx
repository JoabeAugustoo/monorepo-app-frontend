import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Typography,
  MenuItem as MuiMenuItem,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Save as SaveIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { MuiDatePicker } from '@app/ui';
import { customerService, addressService, petService } from '../services';
import type {
  CustomerWithAddresses,
  CustomerAddress,
  CustomerDto,
  AddressDto,
  PetDto,
  PetSpecies,
  PetGender,
  CepResponse,
} from '../types';
import { FaDog, FaCat, FaDove, FaFrog, FaPaw, FaMars, FaVenus, FaGenderless } from 'react-icons/fa6';
import { formatCpf, formatCep, formatPhone } from '@app/core';

const SPECIES_LABELS: Record<PetSpecies, string> = {
  DOG: 'Cão', CAT: 'Gato', BIRD: 'Ave', REPTILE: 'Réptil', OTHER: 'Outro',
};

const SPECIES_COLORS: Record<PetSpecies, string> = {
  DOG: '#9C72D9', CAT: '#F48FB1', BIRD: '#81C9C5', REPTILE: '#7EB3E0', OTHER: '#FFD6A5',
};

const SPECIES_ICONS: Record<PetSpecies, React.ReactNode> = {
  DOG: <FaDog />, CAT: <FaCat />, BIRD: <FaDove />, REPTILE: <FaFrog />, OTHER: <FaPaw />,
};

const GENDER_LABELS: Record<PetGender, string> = {
  MALE: 'Macho', FEMALE: 'Fêmea', UNKNOWN: 'Indefinido',
};

const GENDER_ICONS: Record<PetGender, React.ReactNode> = {
  MALE: <FaMars />, FEMALE: <FaVenus />, UNKNOWN: <FaGenderless />,
};

const GENDER_COLORS: Record<PetGender, string> = {
  MALE: '#7EB3E0', FEMALE: '#F48FB1', UNKNOWN: '#BDBDBD',
};

const steps = ['Tutor', 'Endereço', 'Pet'];

interface TutorFormData {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  secondaryPhone: string;
  notes: string;
}

interface AddressFormData {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  number: string;
  complement: string;
  notes: string;
  isDefault: boolean;
}

interface PetFormData {
  name: string;
  species: PetSpecies | '';
  breed: string;
  gender: PetGender | '';
  birthDate: string;
  weight: string;
  color: string;
  observations: string;
}

const PetRegisterPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Tutor state
  const [tutorForm, setTutorForm] = useState<TutorFormData>({
    name: '', cpf: '', email: '', phone: '', secondaryPhone: '', notes: '',
  });
  const [existingCustomer, setExistingCustomer] = useState<CustomerWithAddresses | null>(null);
  const [searchingCpf, setSearchingCpf] = useState(false);
  const [cpfSearched, setCpfSearched] = useState(false);

  // Address state
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    zipCode: '', street: '', neighborhood: '', city: '', state: '', number: '', complement: '', notes: '', isDefault: true,
  });
  const [existingAddresses, setExistingAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | ''>('');
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);

  // Pet state
  const [petForm, setPetForm] = useState<PetFormData>({
    name: '', species: '', breed: '', gender: '', birthDate: new Date().toISOString().split('T')[0], weight: '', color: '', observations: '',
  });

  // CPF auto-search
  useEffect(() => {
    const digits = tutorForm.cpf.replace(/\D/g, '');
    if (digits.length === 11) {
      setSearchingCpf(true);
      customerService.findByCpf(digits)
        .then((customer) => {
          setExistingCustomer(customer);
          setTutorForm({
            name: customer.name || '',
            cpf: tutorForm.cpf,
            email: customer.email || '',
            phone: customer.phone || '',
            secondaryPhone: customer.secondaryPhone || '',
            notes: customer.notes || '',
          });
          setExistingAddresses(customer.addresses || []);
          if (customer.addresses && customer.addresses.length > 0) {
            const defaultAddr = customer.addresses.find(a => a.isDefault);
            setSelectedAddressId(defaultAddr?.publicId || customer.addresses[0]?.publicId || '');
            setUseNewAddress(false);
          } else {
            setUseNewAddress(true);
          }
          setCpfSearched(true);
        })
        .catch(() => {
          setExistingCustomer(null);
          setExistingAddresses([]);
          setUseNewAddress(true);
          setCpfSearched(true);
        })
        .finally(() => setSearchingCpf(false));
    } else {
      if (cpfSearched) {
        setExistingCustomer(null);
        setExistingAddresses([]);
        setCpfSearched(false);
      }
    }
  }, [tutorForm.cpf]);

  // CEP auto-search
  useEffect(() => {
    const digits = addressForm.zipCode.replace(/\D/g, '');
    if (digits.length === 8 && useNewAddress) {
      setSearchingCep(true);
      addressService.getCep(digits)
        .then((data: CepResponse) => {
          if (!data.erro) {
            setAddressForm(prev => ({
              ...prev,
              street: data.logradouro || prev.street,
              neighborhood: data.bairro || prev.neighborhood,
              city: data.localidade || prev.city,
              state: data.uf || prev.state,
            }));
          }
        })
        .catch(() => {})
        .finally(() => setSearchingCep(false));
    }
  }, [addressForm.zipCode, useNewAddress]);

  const canAdvanceStep0 = tutorForm.name.trim() && tutorForm.phone.trim();
  const canAdvanceStep1 = !useNewAddress ? !!selectedAddressId : addressForm.zipCode.replace(/\D/g, '').length > 0;
  const canAdvanceStep2 = petForm.name.trim() && petForm.species;

  const handleNext = () => setActiveStep(prev => prev + 1);
  const handleBack = () => setActiveStep(prev => prev - 1);

  const handleSave = async () => {
    try {
      setSaving(true);
      let customerId = existingCustomer?.publicId;

      // Step 1: Create customer if new
      if (!customerId) {
        const customerData: CustomerDto = {
          name: tutorForm.name,
          cpf: tutorForm.cpf.replace(/\D/g, '') || undefined,
          email: tutorForm.email || undefined,
          phone: tutorForm.phone || undefined,
          secondaryPhone: tutorForm.secondaryPhone || undefined,
          notes: tutorForm.notes || undefined,
        };
        const created = await customerService.createCustomer(customerData);
        customerId = created.publicId;
      }

      // Step 2: Create address if new
      if (useNewAddress && customerId) {
        const addressData: AddressDto = {
          zipCode: addressForm.zipCode.replace(/\D/g, ''),
          number: addressForm.number || undefined,
          complement: addressForm.complement || undefined,
          notes: addressForm.notes || undefined,
          isDefault: addressForm.isDefault,
        };
        await addressService.addAddress(customerId, addressData);
      }

      // Step 3: Create pet
      const petData: PetDto = {
        name: petForm.name,
        species: petForm.species as PetSpecies || undefined,
        breed: petForm.breed || undefined,
        gender: petForm.gender as PetGender || undefined,
        birthDate: petForm.birthDate || undefined,
        weight: petForm.weight ? parseFloat(petForm.weight) : undefined,
        color: petForm.color || undefined,
        observations: petForm.observations || undefined,
        primaryTutorId: customerId,
      };
      await petService.createPet(petData);

      toast.success('Pet cadastrado com sucesso!');
      const cpfDigits = tutorForm.cpf.replace(/\D/g, '');
      navigate('/painel-tutor', { state: { cpf: cpfDigits } });
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderTutorStep = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        fullWidth
        label="CPF"
        value={tutorForm.cpf}
        onChange={(e) => setTutorForm({ ...tutorForm, cpf: formatCpf(e.target.value) })}
        placeholder="000.000.000-00"
        slotProps={{
          input: {
            endAdornment: searchingCpf ? <CircularProgress size={20} /> : null,
          },
        }}
      />
      {cpfSearched && existingCustomer && (
        <Alert severity="info">Tutor encontrado: {existingCustomer.name}</Alert>
      )}
      {cpfSearched && !existingCustomer && (
        <Alert severity="warning">CPF não encontrado. Preencha os dados do novo tutor.</Alert>
      )}
      <TextField
        fullWidth
        label="Nome *"
        value={tutorForm.name}
        onChange={(e) => setTutorForm({ ...tutorForm, name: e.target.value })}
        required
        slotProps={{ input: { readOnly: !!existingCustomer } }}
      />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={tutorForm.email}
          onChange={(e) => setTutorForm({ ...tutorForm, email: e.target.value })}
          slotProps={{ input: { readOnly: !!existingCustomer } }}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          label="Telefone *"
          value={tutorForm.phone}
          onChange={(e) => setTutorForm({ ...tutorForm, phone: formatPhone(e.target.value) })}
          placeholder="(00) 00000-0000"
          required
          slotProps={{ input: { readOnly: !!existingCustomer } }}
        />
        <TextField
          fullWidth
          label="Telefone Secundário"
          value={tutorForm.secondaryPhone}
          onChange={(e) => setTutorForm({ ...tutorForm, secondaryPhone: formatPhone(e.target.value) })}
          slotProps={{ input: { readOnly: !!existingCustomer } }}
        />
      </Box>
      <TextField
        fullWidth
        label="Observações"
        multiline
        rows={2}
        value={tutorForm.notes}
        onChange={(e) => setTutorForm({ ...tutorForm, notes: e.target.value })}
        slotProps={{ input: { readOnly: !!existingCustomer } }}
      />
    </Box>
  );

  const renderAddressStep = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {existingAddresses.length > 0 && (
        <>
          <Typography variant="subtitle2" color="text.secondary">Endereços existentes</Typography>
          <RadioGroup
            value={useNewAddress ? 'new' : selectedAddressId}
            onChange={(e) => {
              if (e.target.value === 'new') {
                setUseNewAddress(true);
                setSelectedAddressId('');
              } else {
                setUseNewAddress(false);
                setSelectedAddressId(e.target.value);
              }
            }}
          >
            {existingAddresses.map((addr) => (
              <FormControlLabel
                key={addr.publicId}
                value={addr.publicId}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2">
                      {addr.address.street}, {addr.number || 'S/N'} - {addr.address.neighborhood}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {addr.address.city}/{addr.address.state} - CEP: {addr.address.zipCode}
                      {addr.isDefault && ' (Padrão)'}
                    </Typography>
                  </Box>
                }
              />
            ))}
            <FormControlLabel value="new" control={<Radio />} label="Adicionar novo endereço" />
          </RadioGroup>
        </>
      )}

      {useNewAddress && (
        <>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Novo Endereço</Typography>
          <TextField
            fullWidth
            label="CEP *"
            value={addressForm.zipCode}
            onChange={(e) => setAddressForm({ ...addressForm, zipCode: formatCep(e.target.value) })}
            placeholder="00000-000"
            slotProps={{
              input: {
                endAdornment: searchingCep ? <CircularProgress size={20} /> : null,
              },
            }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              sx={{ flex: 3 }}
              label="Rua"
              value={addressForm.street}
              slotProps={{ input: { readOnly: true } }}
            />
            <TextField
              sx={{ flex: 1 }}
              label="Número"
              value={addressForm.number}
              onChange={(e) => setAddressForm({ ...addressForm, number: e.target.value })}
            />
          </Box>
          <TextField
            fullWidth
            label="Complemento"
            value={addressForm.complement}
            onChange={(e) => setAddressForm({ ...addressForm, complement: e.target.value })}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField fullWidth label="Bairro" value={addressForm.neighborhood} slotProps={{ input: { readOnly: true } }} />
            <TextField fullWidth label="Cidade" value={addressForm.city} slotProps={{ input: { readOnly: true } }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField fullWidth label="Estado" value={addressForm.state} slotProps={{ input: { readOnly: true } }} />
          </Box>
          <TextField
            fullWidth
            label="Observações"
            value={addressForm.notes}
            onChange={(e) => setAddressForm({ ...addressForm, notes: e.target.value })}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={addressForm.isDefault}
                onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
              />
            }
            label="Endereço padrão"
          />
        </>
      )}
    </Box>
  );

  const renderPetStep = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        fullWidth
        label="Nome *"
        value={petForm.name}
        onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
        required
      />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          select
          label="Espécie *"
          value={petForm.species}
          onChange={(e) => setPetForm({ ...petForm, species: e.target.value as PetSpecies | '' })}
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
        <TextField
          fullWidth
          label="Raça"
          value={petForm.breed}
          onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          select
          label="Sexo"
          value={petForm.gender}
          onChange={(e) => setPetForm({ ...petForm, gender: e.target.value as PetGender | '' })}
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
        <TextField
          fullWidth
          label="Cor/Pelagem"
          value={petForm.color}
          onChange={(e) => setPetForm({ ...petForm, color: e.target.value })}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <MuiDatePicker
          mode="day"
          value={petForm.birthDate}
          onChange={(val) => setPetForm({ ...petForm, birthDate: val })}
          placeholder="Data de Nascimento"
        />
        <TextField
          fullWidth
          label="Peso (kg)"
          type="number"
          value={petForm.weight}
          onChange={(e) => setPetForm({ ...petForm, weight: e.target.value })}
          slotProps={{ input: { inputProps: { step: '0.1', min: '0' } } }}
        />
      </Box>
      <TextField
        fullWidth
        label="Observações"
        multiline
        rows={3}
        value={petForm.observations}
        onChange={(e) => setPetForm({ ...petForm, observations: e.target.value })}
      />
    </Box>
  );

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Cadastro de Pet
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && renderTutorStep()}
          {activeStep === 1 && renderAddressStep()}
          {activeStep === 2 && renderPetStep()}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<BackIcon />}
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
                disabled={saving || !canAdvanceStep2}
              >
                {saving ? 'Salvando...' : 'Cadastrar Pet'}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PetRegisterPage;
