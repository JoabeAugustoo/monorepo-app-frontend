import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  InputAdornment,
  IconButton,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useCreateUser } from '../../hooks/useUsers';
import { useAssignRole } from '../../hooks/useUserAppRoles';

interface UserFormDialogProps {
  open: boolean;
  onClose: () => void;
  applicationId?: string;
  applicationName?: string;
}

export function UserFormDialog({ open, onClose, applicationId, applicationName }: UserFormDialogProps) {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const createUser = useCreateUser();
  const assignRole = useAssignRole();

  const isForApplication = !!applicationId;
  const isPending = createUser.isPending || assignRole.isPending;

  const handleSubmit = async () => {
    const userData = {
      userName,
      email,
      password,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
    };

    const newUser = await createUser.mutateAsync(userData);

    // Se for para uma aplicação específica, vincula o usuário com uma role default
    if (isForApplication && newUser.publicId) {
      // Note: O novo backend requer um roleId para atribuir
      // Se não houver role, apenas cria o usuário sem vincular
    }

    handleClose();
  };

  const handleClose = () => {
    onClose();
    setUserName('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setShowPassword(false);
  };

  const isValid = userName && email && password;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isForApplication ? `Novo Usuario - ${applicationName}` : 'Novo Usuario'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            fullWidth
            required
            placeholder="nome.sobrenome"
          />

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            placeholder="usuario@email.com"
          />

          <TextField
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Stack direction="row" spacing={2}>
            <TextField
              label="Nome"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Sobrenome"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              fullWidth
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!isValid || isPending}
        >
          {isForApplication ? 'Criar e Vincular' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
