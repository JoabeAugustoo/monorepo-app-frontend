import { Box, Typography, Stack } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface SigningSuccessProps {
  signerName?: string;
}

export function SigningSuccess({ signerName }: SigningSuccessProps) {
  return (
    <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
      <Box
        sx={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          bgcolor: '#dcfce7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 56, color: '#16a34a' }} />
      </Box>

      <Typography variant="h5" fontWeight={700} textAlign="center">
        Documento assinado com sucesso!
      </Typography>

      <Typography variant="body1" color="text.secondary" textAlign="center">
        {signerName
          ? `${signerName}, sua assinatura foi registrada e a cadeia de evidencias foi atualizada.`
          : 'Sua assinatura foi registrada e a cadeia de evidencias foi atualizada.'
        }
      </Typography>

      <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 360 }}>
        Voce pode fechar esta pagina. Quando todas as assinaturas forem concluidas, o documento estara disponivel para download.
      </Typography>
    </Stack>
  );
}
