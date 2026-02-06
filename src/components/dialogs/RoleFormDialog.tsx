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
import { useCreateRole, useUpdateRole } from '../../hooks/useRoles';
import type { Role, ApplicationRoleSearchResponse } from '../../types';

const roleSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no maximo 50 caracteres')
    .regex(/^[A-Z_]+$/, 'Nome deve conter apenas letras maiusculas e underscore'),
  description: z
    .string()
    .min(3, 'Descricao deve ter pelo menos 3 caracteres')
    .max(255, 'Descricao deve ter no maximo 255 caracteres'),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormDialogProps {
  open: boolean;
  role: Role | ApplicationRoleSearchResponse | null;
  onClose: () => void;
  applicationId?: string;
  applicationName?: string;
}

export function RoleFormDialog({
  open,
  role,
  onClose,
  applicationId,
  applicationName,
}: RoleFormDialogProps) {
  const isEditing = !!role;

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (role) {
        reset({
          name: role.name.replace('ROLE_', ''),
          description: role.description ?? '',
        });
      } else {
        reset({
          name: '',
          description: '',
        });
      }
    }
  }, [open, role, reset]);

  const onSubmit = async (data: RoleFormData) => {
    const roleName = data.name.startsWith('ROLE_') ? data.name : `ROLE_${data.name}`;

    if (isEditing && role) {
      await updateRole.mutateAsync({
        id: role.publicId,
        data: { description: data.description },
      });
    } else {
      await createRole.mutateAsync({
        name: roleName,
        description: data.description,
        applicationId,
      });
    }

    onClose();
  };

  const isSubmitting = createRole.isPending || updateRole.isPending;

  const getTitle = () => {
    if (isEditing) return 'Editar Role';
    if (applicationName) return `Nova Role - ${applicationName}`;
    return 'Nova Role';
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
            helperText={errors.name?.message || 'Use letras maiusculas e underscore (ex: MANAGER)'}
            disabled={isEditing}
            inputProps={{ style: { textTransform: 'uppercase' } }}
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
