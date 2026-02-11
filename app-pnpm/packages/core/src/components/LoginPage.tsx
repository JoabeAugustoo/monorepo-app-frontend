import { FormEvent, useState } from 'react';
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { LoginPageConfig } from '../types';
import { useAuth } from '../hooks/useAuth';

interface LoginPageProps extends LoginPageConfig {
  appName: string;
}

/**
 * Derives a dark background base and accent colors from corFundo or theme primary.
 * Returns hex-like values suitable for rgba usage.
 */
function useLoginColors(corFundo?: string) {
  const theme = useTheme();
  const accent = corFundo || theme.palette.primary.main;
  // Dark base tones derived from the accent
  const darkBase = '#0f172a';
  const darkMid = corFundo
    ? alpha(corFundo, 0.35)
    : alpha(theme.palette.primary.dark, 0.4);

  return { accent, darkBase, darkMid };
}

export function LoginPage({
  mode,
  logo,
  titulo,
  subtitulo,
  mostrarEsqueciSenha,
  onEsqueciSenha,
  onSubmit,
  textoBotao = 'Entrar',
  appName,
  corFundo,
}: LoginPageProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { accent, darkBase, darkMid } = useLoginColors(corFundo);

  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [tipoIdentificador, setTipoIdentificador] = useState<'email' | 'username'>(
    mode === 'username' ? 'username' : 'email',
  );

  const labelIdentificador = tipoIdentificador === 'email' ? 'E-mail' : 'Usuário';
  const tipoInput = tipoIdentificador === 'email' ? 'email' : 'text';
  const iconeIdentificador =
    tipoIdentificador === 'email' ? <EmailIcon /> : <PersonIcon />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const resposta = await onSubmit({ identificador, senha, tipoIdentificador });
      login(resposta);
      navigate('/', { replace: true });
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao fazer login');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${darkBase} 0%, ${darkMid} 50%, ${darkBase} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        p: { xs: 2, sm: 3 },
      }}
    >
      {/* Animated glow - top left */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(accent, 0.15)} 0%, transparent 70%)`,
          filter: 'blur(40px)',
          animation: 'loginPulse1 8s ease-in-out infinite',
          '@keyframes loginPulse1': {
            '0%, 100%': { transform: 'scale(1)', opacity: 0.5 },
            '50%': { transform: 'scale(1.2)', opacity: 0.8 },
          },
        }}
      />

      {/* Animated glow - bottom right */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(accent, 0.12)} 0%, transparent 70%)`,
          filter: 'blur(60px)',
          animation: 'loginPulse2 10s ease-in-out infinite',
          '@keyframes loginPulse2': {
            '0%, 100%': { transform: 'scale(1.1)', opacity: 0.6 },
            '50%': { transform: 'scale(0.9)', opacity: 0.4 },
          },
        }}
      />

      {/* Static glow - center */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(accent, 0.08)} 0%, transparent 60%)`,
          filter: 'blur(80px)',
        }}
      />

      {/* Grid pattern overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          opacity: 0.7,
        }}
      />

      {/* Login card */}
      <Card
        sx={{
          maxWidth: 420,
          width: '100%',
          position: 'relative',
          zIndex: 1,
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        }}
      >
        <CardContent
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 4 }}
        >
          {/* Logo / Icon */}
          {logo ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>{logo}</Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${accent} 0%, ${alpha(accent, 0.7)} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 24px -4px ${alpha(accent, 0.4)}`,
                }}
              >
                <LockOutlinedIcon sx={{ fontSize: 32, color: 'white' }} />
              </Box>
            </Box>
          )}

          {/* Title */}
          <Typography variant="h5" textAlign="center" fontWeight={700}>
            {titulo ?? appName}
          </Typography>

          {subtitulo && (
            <Typography variant="body2" textAlign="center" color="text.secondary">
              {subtitulo}
            </Typography>
          )}

          {mode === 'both' && (
            <ToggleButtonGroup
              value={tipoIdentificador}
              exclusive
              onChange={(_, valor) => {
                if (valor) setTipoIdentificador(valor);
              }}
              fullWidth
              size="small"
            >
              <ToggleButton value="email">E-mail</ToggleButton>
              <ToggleButton value="username">Usuário</ToggleButton>
            </ToggleButtonGroup>
          )}

          <TextField
            label={labelIdentificador}
            type={tipoInput}
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            fullWidth
            autoFocus
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    {iconeIdentificador}
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label="Senha"
            type={mostrarSenha ? 'text' : 'password'}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      edge="end"
                      size="small"
                    >
                      {mostrarSenha ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {mostrarEsqueciSenha && (
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={onEsqueciSenha}
              sx={{ alignSelf: 'flex-end', mt: -1 }}
            >
              Esqueci minha senha
            </Link>
          )}

          {erro && <Alert severity="error">{erro}</Alert>}

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={carregando || !identificador || !senha}
            sx={{
              mt: 1,
              py: 1.5,
              background: `linear-gradient(135deg, ${accent} 0%, ${alpha(accent, 0.75)} 100%)`,
              '&:hover': {
                background: `linear-gradient(135deg, ${alpha(accent, 0.9)} 0%, ${alpha(accent, 0.65)} 100%)`,
              },
            }}
          >
            {carregando ? <CircularProgress size={24} sx={{ color: 'white' }} /> : textoBotao}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
