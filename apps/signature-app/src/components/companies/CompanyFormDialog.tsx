import { useEffect, useState } from 'react';
import { TextField, Box, Card, InputAdornment, Typography, MenuItem } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import NumbersIcon from '@mui/icons-material/Numbers';
import AppsIcon from '@mui/icons-material/Apps';
import { toast } from 'sonner';
import { FormDialog } from '@app/ui';
import { companyService, applicationService } from '../../services';
import { maskCnpj } from '../../utils/format';
import type { Company, Application } from '../../types';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const companySchema = z.object({
  name: z.string().min(1, 'Nome obrigatorio'),
  cnpj: z.string().min(14, 'CNPJ invalido').transform((v) => v.replace(/\D/g, '')),
  applicationPublicId: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyFormDialogProps {
  open: boolean;
  company: Company | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CompanyFormDialog({ open, company, onClose, onSuccess }: CompanyFormDialogProps) {
  const [applications, setApplications] = useState<Application[]>([]);

  const { control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: { name: '', cnpj: '', applicationPublicId: '' },
  });

  useEffect(() => {
    if (open) {
      if (company) {
        reset({ name: company.name, cnpj: maskCnpj(company.cnpj), applicationPublicId: company.applicationPublicId || '' });
      } else {
        reset({ name: '', cnpj: '', applicationPublicId: '' });
      }
      applicationService.findActive()
        .then((data) => setApplications(data || []))
        .catch(() => {});
    }
  }, [open, company, reset]);

  const onSubmit = async (data: CompanyFormData) => {
    try {
      const dto = {
        name: data.name,
        cnpj: data.cnpj,
        applicationPublicId: data.applicationPublicId || undefined,
      };
      if (company?.publicId) {
        await companyService.update(company.publicId, dto);
        toast.success('Empresa atualizada com sucesso!');
      } else {
        await companyService.create(dto);
        toast.success('Empresa criada com sucesso!');
      }
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      toast.error('Erro ao salvar empresa');
    }
  };

  const isEditing = !!company;

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      title=" "
      submitLabel={isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
      loading={isSubmitting}
      maxWidth="sm"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Gradient Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
            borderRadius: 3,
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            }}
          >
            <BusinessIcon sx={{ fontSize: 32, color: '#0d9488' }} />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
              {isEditing ? 'Editar Empresa' : 'Nova Empresa'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
              {isEditing ? 'Atualize os dados da empresa' : 'Preencha os dados para cadastrar'}
            </Typography>
          </Box>
        </Box>

        {/* Form Fields Card */}
        <Card
          variant="outlined"
          sx={{
            bgcolor: '#f8fafc',
            borderRadius: 2,
            borderColor: 'divider',
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Nome"
                required
                error={!!errors.name}
                helperText={errors.name?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon sx={{ color: '#0d9488', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <Controller
            name="cnpj"
            control={control}
            render={({ field }) => (
              <Box>
                <TextField
                  {...field}
                  fullWidth
                  label="CNPJ"
                  required
                  error={!!errors.cnpj}
                  helperText={errors.cnpj?.message}
                  onChange={(e) => {
                    const masked = maskCnpj(e.target.value);
                    field.onChange(masked);
                    setValue('cnpj', masked);
                  }}
                  inputProps={{ maxLength: 18 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <NumbersIcon sx={{ color: '#0d9488', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
                {!errors.cnpj && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, ml: 1.5, display: 'block' }}>
                    Formato: 00.000.000/0000-00
                  </Typography>
                )}
              </Box>
            )}
          />
          <Controller
            name="applicationPublicId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                label="Aplicacao"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AppsIcon sx={{ color: '#0d9488', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="">Nenhuma</MenuItem>
                {applications.map((a) => (
                  <MenuItem key={a.publicId} value={a.publicId}>
                    {a.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Card>
      </Box>
    </FormDialog>
  );
}
