import { Box, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface VerificationSealProps {
  chainValid: boolean;
}

export function VerificationSeal({ chainValid }: VerificationSealProps) {
  const isValid = chainValid;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          border: `4px solid ${isValid ? '#16a34a' : '#dc2626'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: isValid ? '#f0fdf4' : '#fef2f2',
          boxShadow: `0 0 0 8px ${isValid ? '#dcfce720' : '#fee2e220'}, 0 4px 24px ${isValid ? '#16a34a30' : '#dc262630'}`,
        }}
      >
        {isValid ? (
          <CheckCircleIcon sx={{ fontSize: 64, color: '#16a34a' }} />
        ) : (
          <CancelIcon sx={{ fontSize: 64, color: '#dc2626' }} />
        )}
      </Box>

      <Typography variant="h5" fontWeight={700} sx={{ mt: 3, color: isValid ? '#16a34a' : '#dc2626' }}>
        {isValid ? 'Documento Valido' : 'Documento Invalido'}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {chainValid ? 'Cadeia de evidencias integra' : 'Cadeia de evidencias comprometida'}
      </Typography>
    </Box>
  );
}
