import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useRoles } from '../../hooks/useRoles';
import { useEnableGlobalRole } from '../../hooks/useApplicationGlobalRoles';
import type { Role } from '../../types';

interface EnableGlobalRoleDialogProps {
  open: boolean;
  applicationId: string;
  applicationName: string;
  enabledGlobalRoleIds: string[];
  onClose: () => void;
}

export function EnableGlobalRoleDialog({
  open,
  applicationId,
  applicationName,
  enabledGlobalRoleIds,
  onClose,
}: EnableGlobalRoleDialogProps) {
  const { data: allRoles, isLoading: rolesLoading } = useRoles();
  const enableGlobalRole = useEnableGlobalRole();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const availableGlobalRoles = allRoles?.filter(
    (role) => role.active && !role.applicationId && !enabledGlobalRoleIds.includes(role.publicId)
  );

  const handleEnable = async () => {
    if (!selectedRole) return;

    await enableGlobalRole.mutateAsync({
      appPublicId: applicationId,
      rolePublicId: selectedRole.publicId,
    });
    setSelectedRole(null);
    onClose();
  };

  const handleClose = () => {
    setSelectedRole(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Habilitar Role Global - {applicationName}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Selecione uma role global para habilitar nesta aplicacao. Roles globais habilitadas
          podem ser atribuidas a usuarios e clients desta aplicacao.
        </Typography>

        {rolesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Autocomplete
            value={selectedRole}
            onChange={(_, newValue) => setSelectedRole(newValue)}
            options={availableGlobalRoles || []}
            getOptionLabel={(option) => option.name.replace('ROLE_', '')}
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography variant="body2">
                    {option.name.replace('ROLE_', '')}
                  </Typography>
                  {option.description && (
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  )}
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Selecione uma role global"
                placeholder="Buscar role..."
              />
            )}
            noOptionsText="Nenhuma role global disponivel"
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={enableGlobalRole.isPending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleEnable}
          disabled={!selectedRole || enableGlobalRole.isPending}
          startIcon={enableGlobalRole.isPending ? <CircularProgress size={20} /> : <AddIcon />}
        >
          Habilitar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
