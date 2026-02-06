import { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  InputAdornment,
  Typography,
} from '@mui/material';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateApplication,
  useUpdateApplication,
} from '../../hooks/useApplications';
import type { Application } from '../../types';

const applicationSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

function generateCode(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s]/g, '') // remove caracteres especiais
    .trim()
    .replace(/\s+/g, '.'); // substitui espaços por pontos
}

interface ApplicationFormDialogProps {
  open: boolean;
  application: Application | null;
  onClose: () => void;
}

export function ApplicationFormDialog({
  open,
  application,
  onClose,
}: ApplicationFormDialogProps) {
  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();

  const isEditing = !!application;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const watchedName = useWatch({ control, name: 'name' });
  const generatedCode = generateCode(watchedName || '');

  useEffect(() => {
    if (open) {
      if (application) {
        reset({
          name: application.name,
          description: application.description || '',
        });
      } else {
        reset({
          name: '',
          description: '',
        });
      }
    }
  }, [open, application, reset]);

  const onSubmit = async (data: ApplicationFormData) => {
    try {
      if (isEditing) {
        await updateApplication.mutateAsync({
          id: application.publicId,
          data,
        });
      } else {
        await createApplication.mutateAsync({
          ...data,
          code: generateCode(data.name),
        });
      }
      onClose();
    } catch {
      // Erro já tratado pelo hook
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>
          {isEditing ? 'Editar Aplicação' : 'Nova Aplicação'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              {...register('name')}
              label="Nome"
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
              autoFocus
            />
            <TextField
              label="Codigo"
              fullWidth
              value={isEditing ? application.code : generatedCode}
              disabled
              InputProps={{
                readOnly: true,
                startAdornment: generatedCode || isEditing ? (
                  <InputAdornment position="start">
                    <Typography variant="body2" color="text.secondary">
                      app:
                    </Typography>
                  </InputAdornment>
                ) : undefined,
              }}
              helperText={isEditing ? 'O codigo nao pode ser alterado' : 'Gerado automaticamente a partir do nome'}
            />
            <TextField
              {...register('description')}
              label="Descricao"
              fullWidth
              multiline
              rows={3}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              },
            }}
          >
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
