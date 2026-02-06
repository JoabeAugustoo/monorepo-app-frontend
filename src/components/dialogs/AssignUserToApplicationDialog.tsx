import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Stack,
  Alert,
  Chip,
} from '@mui/material';
import { useUsers } from '../../hooks/useUsers';
import {
  useAddUserToApplication,
  useApplicationRolesSearch,
} from '../../hooks/useApplications';
import type { User, ApplicationRoleSearchResponse } from '../../types';

interface AssignUserToApplicationDialogProps {
  open: boolean;
  applicationId: string;
  applicationName?: string;
  existingUserIds: string[];
  onClose: () => void;
}

export function AssignUserToApplicationDialog({
  open,
  applicationId,
  applicationName,
  existingUserIds,
  onClose,
}: AssignUserToApplicationDialogProps) {
  const { data: allUsers, isLoading: usersLoading, isError: usersError } = useUsers();
  const { data: applicationRoles, isLoading: rolesLoading, isError: rolesError } = useApplicationRolesSearch(applicationId);
  const addUserToApplication = useAddUserToApplication();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<ApplicationRoleSearchResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const availableUsers = allUsers?.filter(
    (user) => user.active && !existingUserIds.includes(user.publicId)
  ) ?? [];

  const availableRoles = applicationRoles?.filter((role) => role.active) ?? [];

  const handleAssign = async () => {
    if (!selectedUser) return;

    setError(null);

    try {
      await addUserToApplication.mutateAsync({
        appPublicId: applicationId,
        userPublicId: selectedUser.publicId,
        rolePublicIds: selectedRoles.map((r) => r.publicId),
      });

      handleClose();
    } catch (err) {
      setError('Erro ao adicionar usuario. Verifique se o endpoint esta disponivel.');
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    setSelectedRoles([]);
    setError(null);
    onClose();
  };

  const isLoading = usersLoading || rolesLoading;
  const hasError = usersError || rolesError;
  const isSubmitting = addUserToApplication.isPending;
  const canSubmit = selectedUser && !isSubmitting;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {applicationName
          ? `Adicionar Usuario - ${applicationName}`
          : 'Adicionar Usuario a Aplicacao'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {hasError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Erro ao carregar dados. Tente novamente.
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Selecione o usuario *
              </Typography>
              <Autocomplete
                value={selectedUser}
                onChange={(_, newValue) => setSelectedUser(newValue)}
                options={availableUsers}
                getOptionLabel={(option) => `${option.userName} (${option.email})`}
                isOptionEqualToValue={(option, value) => option.publicId === value.publicId}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li key={key} {...otherProps}>
                      <Box>
                        <Typography variant="body2">{option.userName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.email}
                          {option.firstName && ` - ${option.firstName} ${option.lastName || ''}`}
                        </Typography>
                      </Box>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Usuario"
                    placeholder="Buscar usuario..."
                    required
                  />
                )}
                noOptionsText="Nenhum usuario disponivel"
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Selecione as roles (opcional)
              </Typography>
              <Autocomplete
                multiple
                value={selectedRoles}
                onChange={(_, newValue) => setSelectedRoles(newValue)}
                options={availableRoles}
                getOptionLabel={(option) => option.name.replace('ROLE_', '')}
                isOptionEqualToValue={(option, value) => option.publicId === value.publicId}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li key={key} {...otherProps}>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2">
                            {option.name.replace('ROLE_', '')}
                          </Typography>
                          {option.isGlobal && (
                            <Chip
                              label="Global"
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          )}
                        </Stack>
                        {option.description && (
                          <Typography variant="caption" color="text.secondary">
                            {option.description}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  );
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.publicId}
                      label={option.name.replace('ROLE_', '')}
                      size="small"
                      color={option.isGlobal ? 'secondary' : 'primary'}
                      variant="outlined"
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Roles" placeholder="Selecione roles..." />
                )}
                noOptionsText="Nenhuma role disponivel"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Voce pode gerenciar as roles do usuario posteriormente na aba de usuarios.
              </Typography>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleAssign}
          disabled={!canSubmit}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Adicionar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
