import { useEffect, useState } from 'react';
import { TextField, Box, Card, InputAdornment, Typography } from '@mui/material';
import AppsIcon from '@mui/icons-material/Apps';
import CodeIcon from '@mui/icons-material/Code';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import { toast } from 'sonner';
import { FormDialog } from '@app/ui';
import { applicationService } from '../../services';
import type { Application } from '../../types';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const applicationSchema = z.object({
  name: z.string().min(1, 'Nome obrigatorio'),
  code: z.string().min(1, 'Codigo obrigatorio'),
  externalId: z.string().optional(),
  description: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface ApplicationFormDialogProps {
  open: boolean;
  application: Application | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApplicationFormDialog({ open, application, onClose, onSuccess }: ApplicationFormDialogProps) {
  const [manuallyEdited, setManuallyEdited] = useState(false);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { name: '', code: '', externalId: '', description: '' },
  });

  const nameValue = watch('name');

  useEffect(() => {
    if (open) {
      if (application) {
        reset({ name: application.name, code: application.code, externalId: application.externalId || '', description: application.description || '' });
        setManuallyEdited(true);
      } else {
        reset({ name: '', code: '', externalId: '', description: '' });
        setManuallyEdited(false);
      }
    }
  }, [open, application, reset]);

  useEffect(() => {
    if (!manuallyEdited && nameValue) {
      setValue('code', slugify(nameValue));
    }
  }, [nameValue, manuallyEdited, setValue]);

  const onSubmit = async (data: ApplicationFormData) => {
    try {
      const dto = {
        name: data.name,
        code: data.code,
        externalId: data.externalId || undefined,
        description: data.description || undefined,
      };
      if (application?.publicId) {
        await applicationService.update(application.publicId, dto);
        toast.success('Aplicacao atualizada com sucesso!');
      } else {
        await applicationService.create(dto);
        toast.success('Aplicacao criada com sucesso!');
      }
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar aplicacao:', error);
      toast.error('Erro ao salvar aplicacao');
    }
  };

  const isEditing = !!application;

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
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
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
            <AppsIcon sx={{ fontSize: 32, color: '#8b5cf6' }} />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
              {isEditing ? 'Editar Aplicacao' : 'Nova Aplicacao'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
              {isEditing ? 'Atualize os dados da aplicacao' : 'Preencha os dados para cadastrar'}
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
                      <AppsIcon sx={{ color: '#8b5cf6', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Codigo"
                required
                error={!!errors.code}
                helperText={errors.code?.message || 'Identificador unico (slug)'}
                onChange={(e) => {
                  field.onChange(e);
                  setManuallyEdited(true);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CodeIcon sx={{ color: '#8b5cf6', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  sx: { fontFamily: 'monospace' },
                }}
              />
            )}
          />
          <Controller
            name="externalId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="External ID"
                error={!!errors.externalId}
                helperText={errors.externalId?.message || 'Identificador externo (opcional)'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FingerprintIcon sx={{ color: '#8b5cf6', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  sx: { fontFamily: 'monospace' },
                }}
              />
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Descricao"
                multiline
                rows={3}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            )}
          />
        </Card>
      </Box>
    </FormDialog>
  );
}
