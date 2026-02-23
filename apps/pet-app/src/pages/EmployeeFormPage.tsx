import { useState, useEffect } from 'react';
import {
  TextField,
  Box,
  Button,
  Typography,
  CircularProgress,
  MenuItem as MuiMenuItem,
  FormControlLabel,
  Checkbox,
  Grid2 as Grid,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Badge as BadgeIcon,
  MedicalServices as VetIcon,
  SupportAgent as AttendantIcon,
  Work as AdminIcon,
  SupervisorAccount as ManagerIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { MuiDatePicker } from '@app/ui';
import { formatPhone, formatCpf } from '@app/core';
import { employeeService } from '../services';
import { EmployeeCredentialsDialog } from '../components/employees/EmployeeCredentialsDialog';
import type { EmployeeDto, EmployeeCreateResponse, EmployeeRole } from '../types';

const ROLE_LABELS: Record<EmployeeRole, string> = {
  VETERINARIAN: 'Veterinario',
  ATTENDANT: 'Atendente',
  ADMINISTRATIVE: 'Administrativo',
  MANAGER: 'Gerente',
};

const ROLE_ICONS: Record<EmployeeRole, React.ReactNode> = {
  VETERINARIAN: <VetIcon sx={{ fontSize: 16 }} />,
  ATTENDANT: <AttendantIcon sx={{ fontSize: 16 }} />,
  ADMINISTRATIVE: <AdminIcon sx={{ fontSize: 16 }} />,
  MANAGER: <ManagerIcon sx={{ fontSize: 16 }} />,
};

const ROLE_COLORS: Record<EmployeeRole, string> = {
  VETERINARIAN: '#9C72D9',
  ATTENDANT: '#81C9C5',
  ADMINISTRATIVE: '#7EB3E0',
  MANAGER: '#F48FB1',
};

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

interface EmployeeFormData {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  role: EmployeeRole | '';
  crmv: string;
  hireDate: string;
  createAuthUser: boolean;
}

const initialFormData: EmployeeFormData = {
  name: '',
  cpf: '',
  email: '',
  phone: '',
  role: '',
  crmv: '',
  hireDate: new Date().toISOString().split('T')[0],
  createAuthUser: true,
};

const EmployeeFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);

  const [showCredentials, setShowCredentials] = useState(false);
  const [credentialsData, setCredentialsData] = useState<EmployeeCreateResponse | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadEmployee = async () => {
      setLoadingData(true);
      try {
        const employee = await employeeService.getEmployeeById(id);
        setFormData({
          name: employee.name || '',
          cpf: employee.cpf ? formatCpf(employee.cpf) : '',
          email: employee.email || '',
          phone: employee.phone ? formatPhone(employee.phone) : '',
          role: employee.role || '',
          crmv: employee.crmv || '',
          hireDate: employee.hireDate ? employee.hireDate.split('T')[0] : '',
          createAuthUser: false,
        });
      } catch {
        toast.error('Erro ao carregar dados do funcionario.');
        navigate('/funcionarios');
      } finally {
        setLoadingData(false);
      }
    };
    loadEmployee();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const employeeData: EmployeeDto = {
        name: formData.name,
        cpf: formData.cpf || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        role: formData.role as EmployeeRole || undefined,
        crmv: formData.crmv || undefined,
        hireDate: formData.hireDate || undefined,
      };

      if (id) {
        await employeeService.updateEmployee(id, employeeData);
        toast.success('Funcionario atualizado com sucesso!');
        navigate('/funcionarios');
      } else {
        employeeData.createAuthUser = formData.createAuthUser;
        const result = await employeeService.createEmployee(employeeData);

        if (formData.createAuthUser && (result.generatedUserName || result.generatedPassword)) {
          setCredentialsData(result);
          setShowCredentials(true);
        } else {
          toast.success('Funcionario criado com sucesso!');
          navigate('/funcionarios');
        }
      }
    } catch (error) {
      console.error('Erro ao salvar funcionario:', error);
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
        <Button startIcon={<BackIcon />} onClick={() => navigate('/funcionarios')} color="inherit">
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
          <BadgeIcon />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
            {isEditing ? 'Editar Funcionário' : 'Novo Funcionário'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {isEditing ? 'Atualize os dados do funcionário' : 'Cadastre um novo membro da equipe'}
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
              subtitle="Informacoes de identificacao do funcionario"
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
            </Grid>
          </Box>

          {/* --- Cargo --- */}
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
              icon={<AdminIcon sx={{ fontSize: 20 }} />}
              title="Cargo"
              subtitle="Funcao e dados profissionais"
              gradient="linear-gradient(135deg, #F48FB1, #E57399)"
            />
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Cargo"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as EmployeeRole | '' })}
                  InputProps={{ startAdornment: <AdminIcon sx={{ color: '#F48FB1', fontSize: 20, mr: 1 }} /> }}
                >
                  <MuiMenuItem value="">Selecione...</MuiMenuItem>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <MuiMenuItem key={value} value={value}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: ROLE_COLORS[value as EmployeeRole], display: 'flex' }}>{ROLE_ICONS[value as EmployeeRole]}</span>
                        {label}
                      </span>
                    </MuiMenuItem>
                  ))}
                </TextField>
              </Grid>
              {formData.role === 'VETERINARIAN' && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="CRMV"
                    value={formData.crmv}
                    onChange={(e) => setFormData({ ...formData, crmv: e.target.value })}
                    InputProps={{ startAdornment: <VetIcon sx={{ color: '#F48FB1', fontSize: 20, mr: 1 }} /> }}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, md: 6 }}>
                <MuiDatePicker
                  mode="day"
                  label="Data de Contratação"
                  value={formData.hireDate}
                  onChange={(val) => setFormData({ ...formData, hireDate: val })}
                />
              </Grid>
            </Grid>
          </Box>

          {/* --- Acesso ao Sistema --- */}
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
              icon={<LockIcon sx={{ fontSize: 20 }} />}
              title="Acesso ao Sistema"
              subtitle="Configuracoes de autenticacao"
              gradient="linear-gradient(135deg, #7EB3E0, #5A9BD5)"
            />
            <Grid container spacing={2.5}>
              {!isEditing && (
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.createAuthUser}
                        onChange={(e) => setFormData({ ...formData, createAuthUser: e.target.checked })}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Criar acesso ao sistema
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Um usuario e senha serao gerados automaticamente para o funcionario acessar o sistema
                        </Typography>
                      </Box>
                    }
                  />
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
            <Button variant="outlined" onClick={() => navigate('/funcionarios')}>
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

      <EmployeeCredentialsDialog
        open={showCredentials}
        data={credentialsData}
        onClose={() => {
          setShowCredentials(false);
          setCredentialsData(null);
          navigate('/funcionarios');
        }}
      />
    </Box>
  );
};

export default EmployeeFormPage;
