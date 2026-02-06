import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  TextField,
  Autocomplete,
  Box,
  CircularProgress,
  Chip,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useRoles } from '../../hooks/useRoles';
import { useAssignClientRole, useRemoveClientRole } from '../../hooks/useClients';
import type { Client, Role } from '../../types';

interface ManageClientRolesDialogProps {
  open: boolean;
  client: Client | null;
  applicationId: string;
  onClose: () => void;
}

export function ManageClientRolesDialog({
  open,
  client,
  applicationId,
  onClose,
}: ManageClientRolesDialogProps) {
  const { data: allRoles, isLoading: rolesLoading, isError: rolesError } = useRoles();
  const assignRole = useAssignClientRole();
  const removeRole = useRemoveClientRole();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  if (!client) return null;

  const clientRoleNames = client.roles ?? [];

  const applicationRoles = allRoles?.filter(
    (role) => role.active && (!role.applicationId || role.applicationId === applicationId)
  ) ?? [];

  const availableRoles = applicationRoles.filter(
    (role) => !clientRoleNames.includes(role.name)
  );

  const handleAddRole = async () => {
    if (!selectedRole || !client.publicId) return;

    try {
      await assignRole.mutateAsync({
        clientPublicId: client.publicId,
        data: { rolePublicId: selectedRole.publicId },
      });
      setSelectedRole(null);
    } catch {
      // Error handled by mutation
    }
  };

  const handleRemoveRole = async (roleName: string) => {
    if (!client.publicId) return;

    const roleToRemove = allRoles?.find((r) => r.name === roleName);
    if (!roleToRemove) return;

    try {
      await removeRole.mutateAsync({
        clientPublicId: client.publicId,
        rolePublicId: roleToRemove.publicId,
      });
    } catch {
      // Error handled by mutation
    }
  };

  const getRoleDescription = (roleName: string): string => {
    const role = allRoles?.find((r) => r.name === roleName);
    return role?.description || '';
  };

  const handleClose = () => {
    setSelectedRole(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Gerenciar Roles - {client.name || 'Client'}
        <Typography variant="caption" display="block" color="text.secondary">
          Client ID: {client.clientId || 'N/A'}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {rolesError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Erro ao carregar roles
          </Alert>
        )}

        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Roles atuais
        </Typography>

        {clientRoleNames.length > 0 ? (
          <List dense>
            {clientRoleNames.map((roleName) => (
              <ListItem key={roleName}>
                <ListItemText
                  primary={
                    <Chip
                      label={roleName.replace('ROLE_', '')}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  }
                  secondary={getRoleDescription(roleName)}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleRemoveRole(roleName)}
                    disabled={removeRole.isPending}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.disabled" sx={{ py: 2 }}>
            Nenhuma role atribuida
          </Typography>
        )}

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Adicionar nova role
          </Typography>

          {rolesLoading ? (
            <CircularProgress size={24} />
          ) : (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <Autocomplete
                value={selectedRole}
                onChange={(_, newValue) => setSelectedRole(newValue)}
                options={availableRoles}
                getOptionLabel={(option) => option.name.replace('ROLE_', '')}
                isOptionEqualToValue={(option, value) => option.publicId === value.publicId}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li key={key} {...otherProps}>
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
                  );
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Selecione uma role" size="small" />
                )}
                sx={{ flex: 1 }}
                noOptionsText="Nenhuma role disponivel"
              />
              <Button
                variant="contained"
                onClick={handleAddRole}
                disabled={!selectedRole || assignRole.isPending}
                startIcon={<AddIcon />}
              >
                Adicionar
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
