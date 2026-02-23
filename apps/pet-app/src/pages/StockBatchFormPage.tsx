import { useState, useEffect } from 'react';
import {
  TextField,
  Box,
  Button,
  Typography,
  CircularProgress,
  Grid2 as Grid,
  alpha,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Inventory as InventoryIcon,
  Tag as TagIcon,
  Numbers as NumbersIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import { MuiDatePicker } from '@app/ui';
import { stockBatchService, medicationService } from '../services';
import type { StockBatchDto, Medication } from '../types';

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

const StockBatchFormPage = () => {
  const navigate = useNavigate();
  const { id: medicationId } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(false);
  const [medication, setMedication] = useState<Medication | null>(null);

  const [formData, setFormData] = useState({
    batchNumber: '',
    quantity: '',
    unitCost: '',
    expirationDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (medicationId) {
      medicationService.getById(medicationId).then(setMedication).catch(() => {});
    }
  }, [medicationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicationId) return;
    try {
      setLoading(true);
      const data: StockBatchDto = {
        medicationId,
        batchNumber: formData.batchNumber,
        quantity: parseFloat(formData.quantity),
        unitCost: parseFloat(formData.unitCost),
        expirationDate: formData.expirationDate,
      };
      await stockBatchService.create(data);
      toast.success('Lote criado com sucesso!');
      navigate(`/medicamentos/${medicationId}/estoque`);
    } catch (error) {
      console.error('Erro ao salvar lote:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate(`/medicamentos/${medicationId}/estoque`)} color="inherit">
          Voltar
        </Button>
        <Box sx={{ width: 48, height: 48, borderRadius: 2.5, background: 'linear-gradient(135deg, #9C72D9 0%, #7B5BBF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 14px rgba(156, 114, 217, 0.35)', flexShrink: 0 }}>
          <InventoryIcon />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
            Novo Lote
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {medication ? `Medicamento: ${medication.name}` : 'Adicionar lote ao estoque'}
          </Typography>
        </Box>
      </Box>

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* --- Lote --- */}
          <Box sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: '16px', border: '1px solid', borderColor: (theme) => alpha(theme.palette.divider, 0.08), boxShadow: `0 1px 3px ${alpha('#000', 0.04)}` }}>
            <SectionHeader icon={<InventoryIcon fontSize="small" />} title="Lote" subtitle="Identificacao e validade do lote" />
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Número do Lote *"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TagIcon sx={{ color: '#9C72D9', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <MuiDatePicker
                  mode="day"
                  value={formData.expirationDate}
                  onChange={(val) => setFormData({ ...formData, expirationDate: val })}
                  placeholder="Data de Validade *"
                />
              </Grid>
            </Grid>
          </Box>

          {/* --- Quantidade e Custo --- */}
          <Box sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: '16px', border: '1px solid', borderColor: (theme) => alpha(theme.palette.divider, 0.08), boxShadow: `0 1px 3px ${alpha('#000', 0.04)}` }}>
            <SectionHeader icon={<MoneyIcon fontSize="small" />} title="Quantidade e Custo" subtitle="Quantidade e valor unitario" gradient="linear-gradient(135deg, #F48FB1, #E57399)" />
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Quantidade *"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  slotProps={{ input: { inputProps: { min: '1' } } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <NumbersIcon sx={{ color: '#F48FB1', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Custo Unitário *"
                  type="number"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                  required
                  slotProps={{ input: { inputProps: { min: '0', step: '0.01' } } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon sx={{ color: '#F48FB1', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
            <Button variant="outlined" onClick={() => navigate(`/medicamentos/${medicationId}/estoque`)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default StockBatchFormPage;
