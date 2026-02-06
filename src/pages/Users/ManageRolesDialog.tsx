import { useState, useMemo } from 'react';
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
  Divider,
  Chip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AppsIcon from '@mui/icons-material/Apps';
import { useRoles } from '../../hooks/useRoles';
import { useApplications } from '../../hooks/useApplications';
import { useAssignRole, useRevokeRole, useUserRoles } from '../../hooks/useUserAppRoles';
import { useApplicationGlobalRoles } from '../../hooks/useApplicationGlobalRoles';
import type { User, Role, Application, UserRoleResponse } from '../../types';

interface ManageRolesDialogProps {
  open: boolean;
  user: User | null;
  applicationGuid?: string;
  onClose: () => void;
}

interface ApplicationRolesSectionProps {
  application: Application;
  user: User;
  userRoles: UserRoleResponse[];
  allRoles: Role[];
  enabledGlobalRoles: Role[];
}

function ApplicationRolesSection({
  application,
  user,
  userRoles,
  allRoles,
  enabledGlobalRoles,
}: ApplicationRolesSectionProps) {
  const assignRole = useAssignRole();
  const revokeRole = useRevokeRole();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const userRolesInApp = userRoles.filter(
    (ur) => ur.applicationId === application.publicId
  );
  const userRoleNames = userRolesInApp.map((ur) => ur.roleName);

  const domainRoles = allRoles.filter(
    (role) => role.active && role.applicationId === application.publicId
  );

  const availableRoles = [...domainRoles, ...enabledGlobalRoles].filter(
    (role) => role.active && !userRoleNames.includes(role.name)
  );

  const handleAddRole = async () => {
    if (!selectedRole || !user.publicId) return;

    await assignRole.mutateAsync({
      userId: user.publicId,
      applicationId: application.publicId,
      roleId: selectedRole.publicId,
    });
    setSelectedRole(null);
  };

  const handleRemoveRole = async (roleName: string) => {
    if (!user.publicId) return;

    const roleToRemove = allRoles.find((r) => r.name === roleName);
    if (!roleToRemove) {
      const globalRole = enabledGlobalRoles.find((r) => r.name === roleName);
      if (globalRole) {
        await revokeRole.mutateAsync({
          userId: user.publicId,
          applicationId: application.publicId,
          roleId: globalRole.publicId,
        });
      }
      return;
    }

    await revokeRole.mutateAsync({
      userId: user.publicId,
      applicationId: application.publicId,
      roleId: roleToRemove.publicId,
    });
  };

  const getRoleDescription = (roleName: string): string => {
    const role = allRoles.find((r) => r.name === roleName);
    if (role) return role.description || '';
    const globalRole = enabledGlobalRoles.find((r) => r.name === roleName);
    return globalRole?.description || '';
  };

  const isGlobalRole = (roleName: string): boolean => {
    return enabledGlobalRoles.some((r) => r.name === roleName);
  };

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Roles atuais
      </Typography>

      {userRoleNames.length > 0 ? (
        <List dense>
          {userRoleNames.map((roleName) => (
            <ListItem key={roleName}>
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">
                      {roleName.replace('ROLE_', '')}
                    </Typography>
                    {isGlobalRole(roleName) && (
                      <Chip label="Global" size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                    )}
                  </Stack>
                }
                secondary={getRoleDescription(roleName)}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleRemoveRole(roleName)}
                  disabled={revokeRole.isPending}
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
          Nenhuma role atribuida nesta aplicacao
        </Typography>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Adicionar role
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <Autocomplete
            value={selectedRole}
            onChange={(_, newValue) => setSelectedRole(newValue)}
            options={availableRoles}
            getOptionLabel={(option) => option?.name?.replace('ROLE_', '') || ''}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props;
              const isGlobal = !option.applicationId;
              return (
                <li key={key} {...otherProps}>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2">
                        {option?.name?.replace('ROLE_', '') || ''}
                      </Typography>
                      {isGlobal && (
                        <Chip label="Global" size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
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
      </Box>
    </Box>
  );
}

export function ManageRolesDialog({ open, user, applicationGuid, onClose }: ManageRolesDialogProps) {
  const { data: allRoles, isLoading: rolesLoading } = useRoles();
  const { data: applications, isLoading: applicationsLoading } = useApplications();
  const { data: userRolesData } = useUserRoles(user?.publicId ?? '');

  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const effectiveApplicationId = applicationGuid || selectedApplication?.publicId;
  const { data: enabledGlobalRoles } = useApplicationGlobalRoles(effectiveApplicationId || '');

  const showApplicationSelector = !applicationGuid;

  const userApplications = useMemo(() => {
    if (!userRolesData || !applications) return [];
    const appIds = [...new Set(userRolesData.map((ur) => ur.applicationId))];
    return applications.filter((app) => appIds.includes(app.publicId));
  }, [userRolesData, applications]);

  const handleClose = () => {
    setSelectedApplication(null);
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Gerenciar Roles - {user.userName}</DialogTitle>
      <DialogContent>
        {rolesLoading || applicationsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : showApplicationSelector ? (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Selecione uma aplicacao para gerenciar as roles do usuario ou visualize as aplicacoes onde ele ja possui acesso.
            </Typography>

            <Autocomplete
              value={selectedApplication}
              onChange={(_, newValue) => setSelectedApplication(newValue)}
              options={applications || []}
              getOptionLabel={(option) => option.name}
              renderInput={(params) => (
                <TextField {...params} label="Selecionar aplicacao" />
              )}
              sx={{ mb: 3 }}
              noOptionsText="Nenhuma aplicacao disponivel"
            />

            {selectedApplication && allRoles && (
              <Box sx={{ mb: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <ApplicationRolesSection
                  application={selectedApplication}
                  user={user}
                  userRoles={userRolesData || []}
                  allRoles={allRoles}
                  enabledGlobalRoles={enabledGlobalRoles || []}
                />
              </Box>
            )}

            {userApplications.length > 0 && (
              <Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Aplicacoes com acesso ({userApplications.length})
                </Typography>

                {userApplications.map((app) => {
                  const appRoles = userRolesData?.filter((ur) => ur.applicationId === app.publicId) || [];
                  return (
                    <Accordion key={app.publicId} sx={{ mb: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1,
                              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <AppsIcon sx={{ color: 'white', fontSize: 18 }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {app.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {appRoles.length} role(s)
                            </Typography>
                          </Box>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                          {appRoles.map((role) => (
                            <Chip
                              key={role.roleId}
                              label={role.roleName.replace('ROLE_', '')}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            )}
          </Box>
        ) : (
          allRoles && (
            <ApplicationRolesSection
              application={applications?.find((a) => a.publicId === applicationGuid) || { publicId: applicationGuid, name: '' } as Application}
              user={user}
              userRoles={userRolesData || []}
              allRoles={allRoles}
              enabledGlobalRoles={enabledGlobalRoles || []}
            />
          )
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
