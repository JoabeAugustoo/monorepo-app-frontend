import { Box, Typography, Button, Stack } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useNavigate } from 'react-router-dom';

interface SigningSuccessProps {
  documentId: string;
}

export function SigningSuccess({ documentId }: SigningSuccessProps) {
  const navigate = useNavigate();

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
        Sua assinatura foi registrada e a cadeia de evidencias foi atualizada.
      </Typography>

      <Button
        variant="contained"
        startIcon={<VerifiedIcon />}
        onClick={() => navigate(`/verify/${documentId}`)}
        sx={{ mt: 2, py: 1.5, px: 4 }}
      >
        Verificar Documento
      </Button>
    </Stack>
  );
}
