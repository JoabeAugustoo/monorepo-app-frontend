import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
} from '@mui/material';
import { useCreateClient, useUpdateClient } from '../../hooks/useClients';
import type { Client, ClientWithSecret } from '../../types';

const clientSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no maximo 100 caracteres'),
  description: z
    .string()
    .max(255, 'Descricao deve ter no maximo 255 caracteres')
    .optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormDialogProps {
  open: boolean;
  client: Client | null;
  applicationId: string;
  applicationName?: string;
  onClose: () => void;
  onClientCreated?: (client: ClientWithSecret) => void;
}

export function ClientFormDialog({
  open,
  client,
  applicationId,
  applicationName,
  onClose,
  onClientCreated,
}: ClientFormDialogProps) {
  const isEditing = !!client;

  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (client) {
        reset({
          name: client.name,
          description: client.description ?? '',
        });
      } else {
        reset({
          name: '',
          description: '',
        });
      }
    }
  }, [open, client, reset]);

  const onSubmit = async (data: ClientFormData) => {
    if (isEditing && client) {
      await updateClient.mutateAsync({
        clientPublicId: client.publicId,
        data: {
          name: data.name,
          description: data.description || undefined,
        },
      });
      onClose();
    } else {
      const newClient = await createClient.mutateAsync({
        appPublicId: applicationId,
        data: {
          name: data.name,
          description: data.description || undefined,
        },
      });
      onClose();
      if (onClientCreated) {
        onClientCreated(newClient);
      }
    }
  };

  const isSubmitting = createClient.isPending || updateClient.isPending;

  const getTitle = () => {
    if (isEditing) return 'Editar Client';
    if (applicationName) return `Novo Client - ${applicationName}`;
    return 'Novo Client';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{getTitle()}</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <TextField
            {...register('name')}
            label="Nome"
            fullWidth
            margin="normal"
            error={!!errors.name}
            helperText={errors.name?.message}
            placeholder="Nome do client"
          />
          <TextField
            {...register('description')}
            label="Descricao"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            error={!!errors.description}
            helperText={errors.description?.message}
            placeholder="Descricao opcional do client"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : isEditing ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
