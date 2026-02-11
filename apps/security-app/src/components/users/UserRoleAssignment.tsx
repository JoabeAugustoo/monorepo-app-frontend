import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import { userService } from '../../services';
import type { User, UserApplicationRoles } from '../../types';

interface UserRoleAssignmentProps {
  open: boolean;
  user: User;
  onClose: () => void;
}

export function UserRoleAssignment({ open, user, onClose }: UserRoleAssignmentProps) {
  const [appRoles, setAppRoles] = useState<UserApplicationRoles[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !user.publicId) return;
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const data = await userService.getUserApplications(user.publicId);
        setAppRoles(data);
      } catch (error) {
        console.error('Erro ao carregar roles do usuario:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, [open, user.publicId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PersonIcon sx={{ color: '#3F51B5' }} />
          <Typography variant="h6">Roles de {user.userName}</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : appRoles.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            Nenhuma role atribuida a este usuario.
          </Typography>
        ) : (
          <List>
            {appRoles.map((appRole) => (
              <ListItem key={appRole.application.public_id} sx={{ flexDirection: 'column', alignItems: 'flex-start', borderBottom: '1px solid #e5e7eb' }}>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" fontWeight={600}>
                      {appRole.application.name}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {appRole.application.public_id}
                    </Typography>
                  }
                />
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                  {appRole.roles.map((role) => (
                    <Chip
                      key={role}
                      label={role}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
