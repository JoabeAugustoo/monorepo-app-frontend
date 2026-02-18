import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Stack,
  Button,
  Alert,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import { signingService } from '../../services';
import type { SigningInfo } from '../../types';

interface SigningIdentificationProps {
  token: string;
  onNext: (info: SigningInfo) => void;
}

export function SigningIdentification({ token, onNext }: SigningIdentificationProps) {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<SigningInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validate = async () => {
      try {
        const data = await signingService.validateToken(token);
        setInfo(data);
      } catch {
        setError('Link invalido ou expirado. Verifique se o link esta correto.');
      } finally {
        setLoading(false);
      }
    };
    validate();
  }, [token]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
        <CircularProgress size={48} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Validando...
        </Typography>
      </Box>
    );
  }

  if (error || !info) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error || 'Erro desconhecido'}
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: '#0d948820',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DescriptionIcon sx={{ color: '#0d9488', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {info.documentName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {info.companyName}
              </Typography>
            </Box>
          </Stack>

          <Stack spacing={1}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                Signatario:
              </Typography>
              <Typography variant="body2" fontWeight={500}>{info.signerName}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                Email:
              </Typography>
              <Typography variant="body2">{info.signerEmail}</Typography>
            </Box>
            {info.signerPhone && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                  Telefone:
                </Typography>
                <Typography variant="body2">{info.signerPhone}</Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={() => onNext(info)}
        sx={{ py: 1.5 }}
      >
        Continuar
      </Button>
    </Stack>
  );
}
