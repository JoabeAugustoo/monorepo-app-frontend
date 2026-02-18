import { useState } from 'react';
import {
  Typography,
  Button,
  Stack,
  Alert,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import DrawIcon from '@mui/icons-material/Draw';
import { signingService } from '../../services';
import type { SigningInfo } from '../../types';

interface SigningSignProps {
  token: string;
  info: SigningInfo;
  onNext: (documentId: string) => void;
}

export function SigningSign({ token, info, onNext }: SigningSignProps) {
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSign = async () => {
    try {
      setSigning(true);
      setError(null);
      const result = await signingService.sign(token);
      onNext(result.documentId);
    } catch {
      setError('Erro ao assinar documento. Tente novamente.');
    } finally {
      setSigning(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            Revise antes de assinar
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>Documento:</strong> {info.documentName}
            </Typography>
            <Typography variant="body2">
              <strong>Empresa:</strong> {info.companyName}
            </Typography>
            <Typography variant="body2">
              <strong>Signatario:</strong> {info.signerName}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <FormControlLabel
        control={<Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />}
        label={
          <Typography variant="body2">
            Declaro que li e concordo com os termos de assinatura digital
          </Typography>
        }
      />

      {error && <Alert severity="error">{error}</Alert>}

      <Button
        variant="contained"
        fullWidth
        size="large"
        startIcon={signing ? <CircularProgress size={20} color="inherit" /> : <DrawIcon />}
        onClick={handleSign}
        disabled={!agreed || signing}
        sx={{ py: 1.5 }}
      >
        {signing ? 'Assinando...' : 'Assinar Documento'}
      </Button>
    </Stack>
  );
}
