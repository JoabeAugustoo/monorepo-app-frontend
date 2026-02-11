import { useEffect, useState } from 'react';
import { TextField, Box, MenuItem } from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import { toast } from 'sonner';
import { FormDialog } from '@app/ui';
import { clientService, applicationService } from '../../services';
import type { Client, ClientWithSecret, Application } from '../../types';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const clientSchema = z.object({
  name: z.string().min(1, 'Nome obrigatorio'),
  description: z.string().optional(),
  applicationId: z.string().min(1, 'Aplicacao obrigatoria'),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormDialogProps {
  open: boolean;
  client: Client | null;
  applicationId?: string;
  onClose: () => void;
  onSuccess: (clientWithSecret?: ClientWithSecret) => void;
}

export function ClientFormDialog({ open, client, applicationId, onClose, onSuccess }: ClientFormDialogProps) {
  const [applications, setApplications] = useState<Application[]>([]);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: '', description: '', applicationId: applicationId || '' },
  });

  useEffect(() => {
    if (open) {
      if (client) {
        reset({
          name: client.name,
          description: client.description || '',
          applicationId: client.applicationId || applicationId || '',
        });
      } else {
        reset({ name: '', description: '', applicationId: applicationId || '' });
      }

      if (!applicationId) {
        applicationService.search({ skip: 0, take: 100, sort: [{ field: 'name', direction: 'ASC' }] })
          .then((res) => setApplications(res.data || []))
          .catch(() => {});
      }
    }
  }, [open, client, applicationId, reset]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      if (client?.publicId) {
        await clientService.update(client.publicId, {
          name: data.name,
          description: data.description,
        });
        toast.success('Client atualizado com sucesso!');
        onSuccess();
      } else {
        const result = await clientService.create(data.applicationId, {
          name: data.name,
          description: data.description,
        });
        toast.success('Client criado com sucesso!');
        onSuccess(result);
      }
    } catch (error) {
      console.error('Erro ao salvar client:', error);
      toast.error('Erro ao salvar client');
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      title={client ? 'Editar Client' : 'Novo Client'}
      titleIcon={<KeyIcon sx={{ color: '#3F51B5' }} />}
      submitLabel={isSubmitting ? 'Salvando...' : client ? 'Atualizar' : 'Criar'}
      loading={isSubmitting}
      maxWidth="sm"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="Nome" required error={!!errors.name} helperText={errors.name?.message} />
          )}
        />
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth label="Descricao" multiline rows={2} />
          )}
        />
        {!applicationId && (
          <Controller
            name="applicationId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                label="Aplicacao"
                required
                disabled={!!client}
                error={!!errors.applicationId}
                helperText={errors.applicationId?.message}
              >
                {applications.map((app) => (
                  <MenuItem key={app.publicId} value={app.publicId}>
                    {app.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        )}
      </Box>
    </FormDialog>
  );
}
