import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  TextField,
  Typography,
  Grid2 as Grid,
  Alert,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Save as SaveIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Badge as CnpjIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  Storefront as StorefrontIcon,
  VpnKey as CertificateIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Shield as ShieldIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon,
  Lock as LockIcon,
  CameraAlt as CameraIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { formatCnpj, formatPhone, formatDate, formatDateTime } from '@app/core';
import { toast } from 'sonner';
import { clinicService } from '../services';
import type { Clinic, ClinicDto, ClinicCertificate } from '../types';

const UF_OPTIONS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

const EMPTY_FORM: ClinicDto = {
  tradeName: '',
  legalName: '',
  cnpj: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
};

const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const SectionHeader = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: '10px',
        background: 'linear-gradient(135deg, #9C72D9, #7B5BBF)',
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

// --- Certificate Section ---
type CertStatus = 'active' | 'expiring' | 'expired' | 'none';

function getCertStatus(cert: ClinicCertificate | null): CertStatus {
  if (!cert) return 'none';
  const now = new Date();
  const expires = new Date(cert.validTo);
  if (expires <= now) return 'expired';
  const daysLeft = (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysLeft <= 30) return 'expiring';
  return 'active';
}

const CERT_THEME: Record<CertStatus, {
  gradient: string;
  iconBg: string;
  border: string;
  chipBg: string;
  chipColor: string;
  chipLabel: string;
}> = {
  active: {
    gradient: 'linear-gradient(135deg, #059669, #047857)',
    iconBg: 'rgba(5, 150, 105, 0.1)',
    border: '#d1fae5',
    chipBg: '#dcfce7',
    chipColor: '#166534',
    chipLabel: 'Ativo',
  },
  expiring: {
    gradient: 'linear-gradient(135deg, #d97706, #b45309)',
    iconBg: 'rgba(217, 119, 6, 0.1)',
    border: '#fef3c7',
    chipBg: '#fef3c7',
    chipColor: '#92400e',
    chipLabel: 'Expirando',
  },
  expired: {
    gradient: 'linear-gradient(135deg, #dc2626, #b91c1c)',
    iconBg: 'rgba(220, 38, 38, 0.1)',
    border: '#fecaca',
    chipBg: '#fee2e2',
    chipColor: '#991b1b',
    chipLabel: 'Expirado',
  },
  none: {
    gradient: 'linear-gradient(135deg, #9C72D9, #7B5BBF)',
    iconBg: 'rgba(156, 114, 217, 0.1)',
    border: 'transparent',
    chipBg: '#f3f4f6',
    chipColor: '#6b7280',
    chipLabel: 'Sem certificado',
  },
};

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function CertificateSection({ certificate, certFile, setCertFile, certName, setCertName, certPassword, setCertPassword, uploadingCert, onUpload, cardSx }: {
  certificate: ClinicCertificate | null;
  certFile: File | null;
  setCertFile: (f: File | null) => void;
  certName: string;
  setCertName: (v: string) => void;
  certPassword: string;
  setCertPassword: (v: string) => void;
  uploadingCert: boolean;
  onUpload: () => void;
  cardSx: Record<string, unknown>;
}) {
  const status = useMemo(() => getCertStatus(certificate), [certificate]);
  const certTheme = CERT_THEME[status];
  const hasCert = certificate !== null && status !== 'none';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const daysLeft = useMemo(() => {
    if (!certificate?.validTo) return 0;
    const diff = new Date(certificate.validTo).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [certificate]);

  const handleFile = useCallback((f: File | null) => {
    if (f && !f.name.match(/\.(p12|pfx)$/i)) {
      toast.error('Selecione um arquivo .p12 ou .pfx');
      return;
    }
    setCertFile(f);
  }, [setCertFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0] || null);
  }, [handleFile]);

  return (
    <Card sx={{
      ...cardSx,
      ...(status === 'expiring' && { border: `1.5px solid ${certTheme.border}` }),
      ...(status === 'expired' && { border: `1.5px solid ${certTheme.border}` }),
    }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        {/* Header with status badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: certTheme.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
            }}>
              <CertificateIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                Certificado Digital
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Certificado A1 (.pfx/.p12) para assinatura de documentos
              </Typography>
            </Box>
          </Box>
          <Chip
            size="small"
            label={certTheme.chipLabel}
            icon={
              status === 'active' ? <CheckIcon sx={{ fontSize: 14 }} /> :
              status === 'expiring' ? <WarningIcon sx={{ fontSize: 14 }} /> :
              status === 'expired' ? <ErrorIcon sx={{ fontSize: 14 }} /> :
              <ShieldIcon sx={{ fontSize: 14 }} />
            }
            sx={{
              backgroundColor: certTheme.chipBg,
              color: certTheme.chipColor,
              fontWeight: 700,
              fontSize: '0.7rem',
              '& .MuiChip-icon': { color: certTheme.chipColor },
            }}
          />
        </Box>

        {/* Certificate info */}
        {hasCert && (
          <Box sx={{
            p: 2.5,
            mb: 3,
            borderRadius: '12px',
            bgcolor: certTheme.iconBg,
            border: `1px solid ${certTheme.border}`,
          }}>
            {status === 'expiring' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1.5, borderRadius: '8px', bgcolor: '#fffbeb' }}>
                <WarningIcon sx={{ fontSize: 18, color: '#d97706' }} />
                <Typography variant="body2" fontWeight={600} sx={{ color: '#92400e' }}>
                  Certificado expira em {daysLeft} dia{daysLeft !== 1 ? 's' : ''}. Faça o upload de um novo certificado.
                </Typography>
              </Box>
            )}
            {status === 'expired' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1.5, borderRadius: '8px', bgcolor: '#fef2f2' }}>
                <ErrorIcon sx={{ fontSize: 18, color: '#dc2626' }} />
                <Typography variant="body2" fontWeight={600} sx={{ color: '#991b1b' }}>
                  Certificado expirado. Faça o upload de um novo certificado para continuar assinando documentos.
                </Typography>
              </Box>
            )}

            <Grid container spacing={2}>
              {certificate?.name && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>Nome</Typography>
                  <Typography variant="body2" fontWeight={600}>{certificate.name}</Typography>
                </Grid>
              )}
              {certificate?.subjectCn && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>Titular</Typography>
                  <Typography variant="body2" fontWeight={600}>{certificate.subjectCn}</Typography>
                </Grid>
              )}
              {certificate?.issuerCn && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>Emitido por</Typography>
                  <Typography variant="body2" fontWeight={600}>{certificate.issuerCn}</Typography>
                </Grid>
              )}
              {certificate?.validFrom && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>Válido desde</Typography>
                  <Typography variant="body2" fontWeight={600}>{formatDate(certificate.validFrom)}</Typography>
                </Grid>
              )}
              {certificate?.validTo && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>Expira em</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{
                    color: status === 'expired' ? '#dc2626' : status === 'expiring' ? '#d97706' : undefined,
                  }}>
                    {formatDate(certificate.validTo)}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Upload section */}
        <Divider sx={{ my: 0, mb: 3, opacity: 0.5 }} />

        <Typography variant="body2" fontWeight={600} sx={{ mb: 2 }}>
          {hasCert ? 'Substituir certificado' : 'Enviar certificado'}
        </Typography>

        {/* Drag & Drop / File preview */}
        {!certFile ? (
          <Box
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
            onDrop={handleDrop}
            sx={{
              border: isDragging ? '2px solid #9C72D9' : '2px dashed',
              borderColor: isDragging ? '#9C72D9' : 'divider',
              borderRadius: 3,
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              bgcolor: isDragging ? 'rgba(156, 114, 217, 0.06)' : 'transparent',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(156, 114, 217, 0.04)',
                borderColor: '#9C72D9',
                borderStyle: 'solid',
              },
            }}
          >
            <UploadIcon sx={{ fontSize: 48, color: '#9C72D9', opacity: 0.8 }} />
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mt: 1 }}>
              Arraste o arquivo .pfx ou .p12 aqui
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              ou clique para selecionar
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".pfx,.p12"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />
          </Box>
        ) : (
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              borderColor: 'divider',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              background: 'linear-gradient(135deg, #9C72D9, #7B5BBF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <FileIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {certFile.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {formatFileSize(certFile.size)}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setCertFile(null)} sx={{ color: 'text.secondary' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Card>
        )}

        {/* Password + Send */}
        {certFile && (
          <Card
            variant="outlined"
            sx={{
              mt: 2,
              borderRadius: 2,
              borderColor: 'divider',
              bgcolor: (t) => t.palette.mode === 'dark' ? t.palette.background.default : '#f8fafc',
              p: 2.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <TextField
              label="Nome do certificado"
              value={certName}
              onChange={(e) => setCertName(e.target.value)}
              fullWidth
              placeholder="Ex: Certificado A1 - Clínica PetFlow"
              InputProps={{
                startAdornment: <CertificateIcon sx={{ color: '#9C72D9', fontSize: 20, mr: 1 }} />,
              }}
            />
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                label="Senha do certificado"
                type="password"
                value={certPassword}
                onChange={(e) => setCertPassword(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: <LockIcon sx={{ color: '#9C72D9', fontSize: 20, mr: 1 }} />,
                }}
              />
              <Button
                variant="contained"
                onClick={onUpload}
                disabled={!certName.trim() || !certPassword.trim() || uploadingCert}
                startIcon={uploadingCert ? <CircularProgress size={18} color="inherit" /> : <UploadIcon />}
                sx={{
                  borderRadius: '10px',
                  py: 1.5,
                  px: 3,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  minWidth: 130,
                }}
              >
                {uploadingCert ? 'Enviando...' : 'Enviar'}
              </Button>
            </Box>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

const ClinicPage = () => {
  const theme = useTheme();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [form, setForm] = useState<ClinicDto>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ClinicDto, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- Logo ---
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // --- Certificado Digital ---
  const [certificate, setCertificate] = useState<ClinicCertificate | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certName, setCertName] = useState('');
  const [certPassword, setCertPassword] = useState('');
  const [uploadingCert, setUploadingCert] = useState(false);

  const isEditing = !!clinic;

  const loadLogo = useCallback(async () => {
    try {
      const url = await clinicService.getLogo();
      setLogoUrl(url);
    } catch {
      setLogoUrl(null);
    }
  }, []);

  const loadCertificate = useCallback(async () => {
    try {
      const cert = await clinicService.getCertificate();
      setCertificate(cert);
    } catch {
      setCertificate(null);
    }
  }, []);

  const loadClinic = useCallback(async () => {
    setLoading(true);
    try {
      const data = await clinicService.getActive();
      setClinic(data);
      setForm({
        tradeName: data.tradeName,
        legalName: data.legalName,
        cnpj: formatCnpj(data.cnpj),
        phone: formatPhone(data.phone),
        email: data.email,
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
      });
      await Promise.all([loadCertificate(), loadLogo()]);
    } catch {
      setClinic(null);
      setForm(EMPTY_FORM);
    } finally {
      setLoading(false);
    }
  }, [loadCertificate, loadLogo]);

  useEffect(() => {
    loadClinic();
  }, [loadClinic]);

  const handleChange = (field: keyof ClinicDto, value: string) => {
    let formatted = value;
    if (field === 'cnpj') formatted = formatCnpj(value);
    if (field === 'phone') formatted = formatPhone(value);

    setForm((prev) => ({ ...prev, [field]: formatted }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ClinicDto, string>> = {};

    if (!form.tradeName.trim()) newErrors.tradeName = 'Nome fantasia é obrigatório';
    if (!form.legalName.trim()) newErrors.legalName = 'Razão social é obrigatória';

    const cnpjDigits = form.cnpj.replace(/\D/g, '');
    if (cnpjDigits.length !== 14) newErrors.cnpj = 'CNPJ deve ter 14 dígitos';

    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) newErrors.phone = 'Telefone inválido';

    if (!form.email.trim()) newErrors.email = 'Email é obrigatório';
    else if (!validateEmail(form.email)) newErrors.email = 'Email inválido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const dto: ClinicDto = {
        tradeName: form.tradeName.trim(),
        legalName: form.legalName.trim(),
        cnpj: form.cnpj.replace(/\D/g, ''),
        phone: form.phone.replace(/\D/g, ''),
        email: form.email.trim(),
        address: form.address?.trim() || undefined,
        city: form.city?.trim() || undefined,
        state: form.state || undefined,
      };

      if (isEditing) {
        await clinicService.update(clinic.publicId, dto);
        toast.success('Clínica atualizada com sucesso!');
      } else {
        await clinicService.create(dto);
        toast.success('Clínica cadastrada com sucesso!');
      }
      await loadClinic();
    } catch {
      toast.error('Erro ao salvar clínica.');
    } finally {
      setSaving(false);
    }
  };

  const handleCertUpload = async () => {
    if (!certFile || !certName.trim() || !certPassword.trim()) return;

    setUploadingCert(true);
    try {
      await clinicService.uploadCertificate(certFile, certName.trim(), certPassword);
      toast.success('Certificado digital enviado com sucesso!');
      setCertFile(null);
      setCertName('');
      setCertPassword('');
      await loadCertificate();
    } catch {
      toast.error('Erro ao enviar certificado digital.');
    } finally {
      setUploadingCert(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem (PNG, JPG, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }
    setUploadingLogo(true);
    try {
      await clinicService.uploadLogo(file);
      toast.success('Logo atualizada com sucesso!');
      await loadLogo();
    } catch {
      toast.error('Erro ao enviar logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const cardSx = {
    mb: 3,
    borderRadius: '16px',
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    boxShadow: `0 1px 3px ${alpha('#000', 0.04)}`,
    transition: 'box-shadow 0.2s',
    '&:hover': {
      boxShadow: `0 4px 12px ${alpha('#000', 0.08)}`,
    },
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      {/* Hero Header */}
      <Card
        sx={{
          mb: 4,
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #9C72D9 0%, #7B5BBF 50%, #6247AA 100%)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -60,
            right: 60,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
          }}
        />
        <CardContent sx={{ p: { xs: 3, sm: 4 }, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                onClick={() => isEditing && logoInputRef.current?.click()}
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isEditing ? 'pointer' : 'default',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'all 0.2s',
                  '&:hover': isEditing ? {
                    background: 'rgba(255,255,255,0.25)',
                    '& .logo-overlay': { opacity: 1 },
                  } : {},
                }}
              >
                {logoUrl ? (
                  <Box
                    component="img"
                    src={logoUrl}
                    alt="Logo"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <StorefrontIcon sx={{ fontSize: 30 }} />
                )}
                {isEditing && (
                  <Box
                    className="logo-overlay"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      bgcolor: 'rgba(0,0,0,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <CameraIcon sx={{ fontSize: 20 }} />
                  </Box>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                    e.target.value = '';
                  }}
                />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                  {isEditing ? clinic.tradeName : 'Minha Clínica'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.25 }}>
                  {isEditing ? clinic.legalName : 'Configure os dados da sua clínica'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {isEditing && (
                <Chip
                  label={clinic.active ? 'Ativa' : 'Inativa'}
                  size="small"
                  sx={{
                    backgroundColor: clinic.active ? 'rgba(255,255,255,0.2)' : 'rgba(255,100,100,0.3)',
                    color: '#fff',
                    fontWeight: 700,
                    backdropFilter: 'blur(10px)',
                  }}
                />
              )}
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={18} sx={{ color: '#9C72D9' }} /> : <SaveIcon />}
                sx={{
                  bgcolor: '#fff',
                  color: '#7B5BBF',
                  fontWeight: 700,
                  borderRadius: '12px',
                  px: 3,
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                  '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.5)', color: '#7B5BBF' },
                }}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </Box>
          </Box>

          {isEditing && (
            <Box sx={{ display: 'flex', gap: 3, mt: 2.5, flexWrap: 'wrap' }}>
              {[
                { icon: <CnpjIcon sx={{ fontSize: 14 }} />, text: formatCnpj(clinic.cnpj) },
                { icon: <PhoneIcon sx={{ fontSize: 14 }} />, text: formatPhone(clinic.phone) },
                { icon: <EmailIcon sx={{ fontSize: 14 }} />, text: clinic.email },
              ].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.75 }}>
                  {item.icon}
                  <Typography variant="caption" fontWeight={500}>{item.text}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Empty state */}
      {!isEditing && (
        <Alert
          severity="info"
          sx={{ mb: 3, borderRadius: '12px' }}
        >
          Nenhuma clínica cadastrada ainda. Preencha os dados abaixo para começar.
        </Alert>
      )}

      {/* Logo da Empresa */}
      {isEditing && (
        <Card sx={cardSx}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <SectionHeader
              icon={<ImageIcon sx={{ fontSize: 20 }} />}
              title="Logo da Empresa"
              subtitle="Imagem exibida nos documentos e relatórios"
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              {/* Preview */}
              <Box
                onClick={() => logoInputRef.current?.click()}
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '16px',
                  border: '2px dashed',
                  borderColor: logoUrl ? 'transparent' : 'divider',
                  bgcolor: logoUrl ? 'transparent' : alpha('#9C72D9', 0.04),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#9C72D9',
                    borderStyle: 'solid',
                    '& .upload-overlay': { opacity: 1 },
                  },
                }}
              >
                {logoUrl ? (
                  <Box
                    component="img"
                    src={logoUrl}
                    alt="Logo"
                    sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 0.5 }}
                  />
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                    <UploadIcon sx={{ fontSize: 32, color: '#9C72D9', opacity: 0.5 }} />
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                      Enviar
                    </Typography>
                  </Box>
                )}
                {logoUrl && (
                  <Box
                    className="upload-overlay"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      borderRadius: '14px',
                    }}
                  >
                    <CameraIcon sx={{ color: '#fff', fontSize: 28 }} />
                  </Box>
                )}
              </Box>

              {/* Info */}
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {logoUrl
                    ? 'Clique na imagem ou no botão para substituir a logo.'
                    : 'Envie a logo da sua clínica. Formatos aceitos: PNG, JPG, SVG. Tamanho máximo: 5MB.'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={uploadingLogo ? <CircularProgress size={16} /> : <UploadIcon />}
                    disabled={uploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: alpha('#9C72D9', 0.4),
                      color: '#9C72D9',
                      '&:hover': { borderColor: '#9C72D9', bgcolor: alpha('#9C72D9', 0.04) },
                    }}
                  >
                    {uploadingLogo ? 'Enviando...' : logoUrl ? 'Substituir' : 'Enviar Logo'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Identificação */}
      <Card sx={cardSx}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <SectionHeader
            icon={<BusinessIcon sx={{ fontSize: 20 }} />}
            title="Identificação"
            subtitle="Dados jurídicos da clínica"
          />

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Nome Fantasia"
                value={form.tradeName}
                onChange={(e) => handleChange('tradeName', e.target.value)}
                fullWidth
                required
                error={!!errors.tradeName}
                helperText={errors.tradeName}
                inputProps={{ maxLength: 150 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Razão Social"
                value={form.legalName}
                onChange={(e) => handleChange('legalName', e.target.value)}
                fullWidth
                required
                error={!!errors.legalName}
                helperText={errors.legalName}
                inputProps={{ maxLength: 200 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                label="CNPJ"
                value={form.cnpj}
                onChange={(e) => handleChange('cnpj', e.target.value)}
                placeholder="00.000.000/0000-00"
                fullWidth
                required
                error={!!errors.cnpj}
                helperText={errors.cnpj}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card sx={cardSx}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <SectionHeader
            icon={<PhoneIcon sx={{ fontSize: 20 }} />}
            title="Contato"
            subtitle="Telefone e email de contato"
          />

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Telefone"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(00) 00000-0000"
                fullWidth
                required
                error={!!errors.phone}
                helperText={errors.phone}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contato@clinica.com.br"
                fullWidth
                required
                error={!!errors.email}
                helperText={errors.email}
                inputProps={{ maxLength: 150 }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card sx={cardSx}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <SectionHeader
            icon={<LocationIcon sx={{ fontSize: 20 }} />}
            title="Endereço"
            subtitle="Usado nos documentos e relatórios gerados"
          />

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Endereço Completo"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Rua Exemplo, 123 - Bairro"
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Cidade"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                label="UF"
                value={form.state}
                onChange={(e) => handleChange('state', e.target.value)}
                fullWidth
                slotProps={{ select: { native: true } }}
              >
                <option value="" />
                {UF_OPTIONS.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Certificado Digital */}
      {isEditing && <CertificateSection
        certificate={certificate}
        certFile={certFile}
        setCertFile={setCertFile}
        certName={certName}
        setCertName={setCertName}
        certPassword={certPassword}
        setCertPassword={setCertPassword}
        uploadingCert={uploadingCert}
        onUpload={handleCertUpload}
        cardSx={cardSx}
      />}

      {/* Metadata footer */}
      {isEditing && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, py: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <CalendarIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.disabled">
              Cadastrado em {formatDateTime(clinic.createdAt)}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ opacity: 0.5 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <CalendarIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.disabled">
              Atualizado em {formatDateTime(clinic.updatedAt)}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ClinicPage;
