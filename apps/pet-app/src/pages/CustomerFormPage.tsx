import { useState, useEffect } from 'react';
import {
  TextField,
  Box,
  Button,
  Typography,
  CircularProgress,
  InputAdornment,
  Grid2 as Grid,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Notes as NotesIcon,
  Badge as BadgeIcon,
  Home as HomeIcon,
  Map as MapIcon,
  LocationCity as CityIcon,
  Signpost as SignpostIcon,
  Tag as TagIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { formatPhone, formatCpf, formatCep } from '@app/core';
import { customerService, addressService } from '../services';
import type { CustomerDto, CustomerAddress } from '../types';

const SectionHeader = ({ icon, title, subtitle, gradient }: { icon: React.ReactNode; title: string; subtitle?: string; gradient?: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: '10px',
        background: gradient || 'linear-gradient(135deg, #9C72D9, #7B5BBF)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
);

interface CustomerFormData {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  secondaryPhone: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  notes: string;
}

const initialFormData: CustomerFormData = {
  name: '',
  cpf: '',
  email: '',
  phone: '',
  secondaryPhone: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
  notes: '',
};

const CustomerFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);

  useEffect(() => {
    if (!id) return;
    const loadCustomer = async () => {
      setLoadingData(true);
      try {
        const [full, addresses] = await Promise.all([
          customerService.getCustomerById(id),
          addressService.listAddresses(id).catch(() => [] as CustomerAddress[]),
        ]);
        const addr = addresses.find((a) => a.isDefault) || addresses[0];
        setFormData({
          name: full.name || '',
          cpf: full.cpf || '',
          email: full.email || '',
          phone: full.phone || '',
          secondaryPhone: full.secondaryPhone || '',
          street: addr?.address?.street || full.street || '',
          number: addr?.number || full.number || '',
          complement: addr?.complement || full.complement || '',
          neighborhood: addr?.address?.neighborhood || full.neighborhood || '',
          city: addr?.address?.city || full.city || '',
          state: addr?.address?.state || full.state || '',
          zipCode: addr?.address?.zipCode || full.zipCode || '',
          notes: full.notes || '',
        });
      } catch {
        toast.error('Erro ao carregar dados do cliente.');
        navigate('/clientes');
      } finally {
        setLoadingData(false);
      }
    };
    loadCustomer();
  }, [id, navigate]);

  const handleCepBlur = async () => {
    const digits = formData.zipCode.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setLoadingCep(true);
    try {
      const data = await addressService.getCep(digits);
      setFormData((prev) => ({
        ...prev,
        street: data.street || prev.street,
        neighborhood: data.neighborhood || prev.neighborhood,
        city: data.city || prev.city,
        state: data.state || prev.state,
      }));
    } catch {
      // silently fail
    } finally {
      setLoadingCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const customerData: CustomerDto = {
        name: formData.name,
        cpf: formData.cpf || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        secondaryPhone: formData.secondaryPhone || undefined,
        street: formData.street || undefined,
        number: formData.number || undefined,
        complement: formData.complement || undefined,
        neighborhood: formData.neighborhood || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        notes: formData.notes || undefined,
      };

      if (id) {
        await customerService.updateCustomer(id, customerData);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await customerService.createCustomer(customerData);
        toast.success('Cliente criado com sucesso!');
      }

      navigate('/clientes');
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
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
        <Button startIcon={<BackIcon />} onClick={() => navigate('/clientes')} color="inherit">
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
          <PeopleIcon />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {isEditing ? 'Atualize os dados do tutor' : 'Cadastre um novo tutor na clínica'}
          </Typography>
        </Box>
      </Box>

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* --- Dados Pessoais --- */}
          <Box
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              borderRadius: '16px',
              border: '1px solid',
              borderColor: (theme) => alpha(theme.palette.divider, 0.08),
              boxShadow: `0 1px 3px ${alpha('#000', 0.04)}`,
            }}
          >
            <SectionHeader
              icon={<PersonIcon sx={{ fontSize: 20 }} />}
              title="Dados Pessoais"
              subtitle="Informacoes de identificacao do tutor"
            />
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  InputProps={{ startAdornment: <PersonIcon sx={{ color: '#9C72D9', fontSize: 20, mr: 1 }} /> }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="CPF"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: formatCpf(e.target.value) })}
                  placeholder="000.000.000-00"
                  InputProps={{ startAdornment: <BadgeIcon sx={{ color: '#9C72D9', fontSize: 20, mr: 1 }} /> }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  InputProps={{ startAdornment: <EmailIcon sx={{ color: '#9C72D9', fontSize: 20, mr: 1 }} /> }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Telefone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                  InputProps={{ startAdornment: <PhoneIcon sx={{ color: '#9C72D9', fontSize: 20, mr: 1 }} /> }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Telefone Secundario"
                  value={formData.secondaryPhone}
                  onChange={(e) => setFormData({ ...formData, secondaryPhone: formatPhone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                  InputProps={{ startAdornment: <PhoneIcon sx={{ color: '#9C72D9', fontSize: 20, mr: 1 }} /> }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* --- Endereco --- */}
          <Box
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              borderRadius: '16px',
              border: '1px solid',
              borderColor: (theme) => alpha(theme.palette.divider, 0.08),
              boxShadow: `0 1px 3px ${alpha('#000', 0.04)}`,
            }}
          >
            <SectionHeader
              icon={<LocationIcon sx={{ fontSize: 20 }} />}
              title="Endereco"
              subtitle="Endereco residencial do tutor"
              gradient="linear-gradient(135deg, #7EB3E0, #5A9BD5)"
            />
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="CEP"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: formatCep(e.target.value) })}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  InputProps={{
                    startAdornment: <LocationIcon sx={{ color: '#7EB3E0', fontSize: 20, mr: 1 }} />,
                    endAdornment: loadingCep ? (
                      <InputAdornment position="end"><CircularProgress size={18} /></InputAdornment>
                    ) : null,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Rua"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  InputProps={{ startAdornment: <SignpostIcon sx={{ color: '#7EB3E0', fontSize: 20, mr: 1 }} /> }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Numero"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  InputProps={{ startAdornment: <TagIcon sx={{ color: '#7EB3E0', fontSize: 20, mr: 1 }} /> }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Complemento"
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                  InputProps={{ startAdornment: <HomeIcon sx={{ color: '#7EB3E0', fontSize: 20, mr: 1 }} /> }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Bairro"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  InputProps={{ startAdornment: <HomeIcon sx={{ color: '#7EB3E0', fontSize: 20, mr: 1 }} /> }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Cidade"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  InputProps={{ startAdornment: <CityIcon sx={{ color: '#7EB3E0', fontSize: 20, mr: 1 }} /> }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="UF"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  InputProps={{ startAdornment: <MapIcon sx={{ color: '#7EB3E0', fontSize: 20, mr: 1 }} /> }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* --- Observacoes --- */}
          <Box
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              borderRadius: '16px',
              border: '1px solid',
              borderColor: (theme) => alpha(theme.palette.divider, 0.08),
              boxShadow: `0 1px 3px ${alpha('#000', 0.04)}`,
            }}
          >
            <SectionHeader
              icon={<NotesIcon sx={{ fontSize: 20 }} />}
              title="Observacoes"
              subtitle="Anotacoes internas sobre o tutor"
              gradient="linear-gradient(135deg, #81C9C5, #5FB8B3)"
            />
            <TextField
              fullWidth
              label="Notas"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              InputProps={{ startAdornment: <NotesIcon sx={{ color: '#81C9C5', fontSize: 20, mr: 1, mt: 1, alignSelf: 'flex-start' }} /> }}
            />
          </Box>

          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
            <Button variant="outlined" onClick={() => navigate('/clientes')}>
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
    </Box>
  );
};

export default CustomerFormPage;
