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
  Box,
} from '@mui/material';
import DrawIcon from '@mui/icons-material/Draw';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import { signingService } from '../../services';
import type { SigningInfo } from '../../types';

interface SigningSignProps {
  token: string;
  info: SigningInfo;
  previewUrl: string;
  onPreviewError: () => void;
  onNext: () => void;
}

export function SigningSign({ token, info, previewUrl, onPreviewError, onNext }: SigningSignProps) {
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(true);

  const handleSign = async () => {
    try {
      setSigning(true);
      setError(null);
      await signingService.sign(token);
      onNext();
    } catch {
      setError('Erro ao assinar documento. Tente novamente.');
    } finally {
      setSigning(false);
    }
  };

  const handleRetryPreview = () => {
    setPdfError(false);
    setPdfLoading(true);
    onPreviewError();
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = info.documentName;
    a.target = '_blank';
    a.click();
  };

  return (
    <Stack spacing={3}>
      {/* PDF Viewer */}
      <Card variant="outlined">
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {pdfError ? (
            <Box
              sx={{
                height: 700,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                bgcolor: '#fafafa',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Nao foi possivel carregar o documento. O preview pode ter expirado.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleRetryPreview}
              >
                Recarregar
              </Button>
            </Box>
          ) : (
            <Box sx={{ position: 'relative', bgcolor: 'white', borderRadius: 1, overflow: 'hidden' }}>
              {pdfLoading && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#fafafa',
                    zIndex: 1,
                  }}
                >
                  <CircularProgress size={32} />
                </Box>
              )}
              <embed
                src={`${previewUrl}#toolbar=0&view=FitH`}
                type="application/pdf"
                width="100%"
                height="700"
                style={{ display: 'block' }}
                onLoad={() => setPdfLoading(false)}
                onError={() => { setPdfLoading(false); setPdfError(true); }}
              />
            </Box>
          )}

          {!pdfError && (
            <Button
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={handleDownload}
              sx={{ mt: 1.5 }}
            >
              Baixar documento
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Review + Sign */}
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
            Declaro que li o documento acima e concordo com os termos de assinatura digital
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
