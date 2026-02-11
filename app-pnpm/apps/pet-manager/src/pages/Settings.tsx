import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid2 as Grid,
  Snackbar,
  Alert,
  Avatar,
} from '@mui/material';

export default function Settings() {
  const [nome, setNome] = useState('Joabe');
  const [email, setEmail] = useState('joabe@email.com');
  const [telefone, setTelefone] = useState('(11) 99999-0000');
  const [snackbarAberto, setSnackbarAberto] = useState(false);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setSnackbarAberto(true);
  };

  const getIniciais = (n: string) =>
    n
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Configuracoes
      </Typography>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24 }}>
              {getIniciais(nome)}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {nome}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Administrador
              </Typography>
            </Box>
          </Box>

          <Box component="form" onSubmit={handleSalvar}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" type="submit">
                Salvar Alteracoes
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbarAberto}
        autoHideDuration={3000}
        onClose={() => setSnackbarAberto(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarAberto(false)}
          severity="success"
          variant="filled"
        >
          Configuracoes salvas com sucesso!
        </Alert>
      </Snackbar>
    </Box>
  );
}
