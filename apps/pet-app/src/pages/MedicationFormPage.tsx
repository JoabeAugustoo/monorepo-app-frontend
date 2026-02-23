import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Medication as MedicationIcon,
  Inventory as InventoryIcon,
  Info as InfoIcon,
  Science as ScienceIcon,
  Factory as FactoryIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { medicationService } from '../services';
import type { MedicationDto, MedicationType } from '../types';

const TYPE_LABELS: Record<MedicationType, string> = {
  INTERNAL: 'Interno',
  EXTERNAL: 'Externo',
  CONTROLLED: 'Controlado',
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

interface MedicationFormData {
  name: string;
  type: MedicationType | '';
  defaultDosage: string;
  manufacturer: string;
  description: string;
  minimumStock: string;
}

const initialFormData: MedicationFormData = {
  name: '', type: '', defaultDosage: '', manufacturer: '', description: '', minimumStock: '0',
};

const MedicationFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [formData, setFormData] = useState<MedicationFormData>(initialFormData);

  useEffect(() => {
    if (!id) return;
    const loadMedication = async () => {
      setLoadingData(true);
      try {
        const med = await medicationService.getById(id);
        setFormData({
          name: med.name || '',
          type: med.type || '',
          defaultDosage: med.defaultDosage || '',
          manufacturer: med.manufacturer || '',
          description: med.description || '',
          minimumStock: med.minimumStock?.toString() || '0',
        });
      } catch {
        toast.error('Erro ao carregar dados do medicamento.');
        navigate('/medicamentos');
      } finally {
        setLoadingData(false);
      }
    };
    loadMedication();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data: MedicationDto = {
        name: formData.name,
        type: formData.type as MedicationType,
        defaultDosage: formData.defaultDosage || undefined,
        manufacturer: formData.manufacturer || undefined,
        description: formData.description || undefined,
        minimumStock: formData.minimumStock ? parseInt(formData.minimumStock) : undefined,
      };

      if (id) {
        await medicationService.update(id, data);
        toast.success('Medicamento atualizado com sucesso!');
      } else {
        await medicationService.create(data);
        toast.success('Medicamento criado com sucesso!');
      }

      navigate('/medicamentos');
    } catch (error) {
      console.error('Erro ao salvar medicamento:', error);
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
        <Button startIcon={<BackIcon />} onClick={() => navigate('/medicamentos')} color="inherit">
          Voltar
        </Button>
        <Box sx={{ width: 48, height: 48, borderRadius: 2.5, background: 'linear-gradient(135deg, #9C72D9 0%, #7B5BBF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 14px rgba(156, 114, 217, 0.35)', flexShrink: 0 }}>
          <MedicationIcon />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
            {isEditing ? 'Editar Medicamento' : 'Novo Medicamento'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {isEditing ? 'Atualize os dados do medicamento' : 'Cadastre um novo medicamento'}
          </Typography>
        </Box>
      </Box>

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* --- Identificação --- */}
          <Box sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: '16px', border: '1px solid', borderColor: (theme) => alpha(theme.palette.divider, 0.08), boxShadow: `0 1px 3px ${alpha('#000', 0.04)}` }}>
            <SectionHeader icon={<MedicationIcon fontSize="small" />} title="Identificação" subtitle="Nome e tipo do medicamento" />
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Nome *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MedicationIcon sx={{ color: '#9C72D9', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Tipo *"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as MedicationType | '' })}
                >
                  <MuiMenuItem value="">Selecione...</MuiMenuItem>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <MuiMenuItem key={value} value={value}>{label}</MuiMenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>

          {/* --- Detalhes --- */}
          <Box sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: '16px', border: '1px solid', borderColor: (theme) => alpha(theme.palette.divider, 0.08), boxShadow: `0 1px 3px ${alpha('#000', 0.04)}` }}>
            <SectionHeader icon={<InfoIcon fontSize="small" />} title="Detalhes" subtitle="Dosagem, fabricante e estoque" gradient="linear-gradient(135deg, #F48FB1, #E57399)" />
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Dosagem Padrão"
                  value={formData.defaultDosage}
                  onChange={(e) => setFormData({ ...formData, defaultDosage: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ScienceIcon sx={{ color: '#F48FB1', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Fabricante"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FactoryIcon sx={{ color: '#F48FB1', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Descrição"
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                        <DescriptionIcon sx={{ color: '#F48FB1', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Estoque Mínimo"
                  type="number"
                  value={formData.minimumStock}
                  onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                  slotProps={{ input: { inputProps: { min: '0' } } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <InventoryIcon sx={{ color: '#F48FB1', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
            <Button variant="outlined" onClick={() => navigate('/medicamentos')}>
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

export default MedicationFormPage;
