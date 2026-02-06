import { Box, CircularProgress, Typography, alpha } from '@mui/material';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Carregando...' }: LoadingStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        py: 12,
        gap: 3,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: (theme) =>
              `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
          }}
        />
        <CircularProgress
          size={48}
          thickness={3}
          sx={{
            color: 'primary.main',
          }}
        />
      </Box>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 500 }}
      >
        {message}
      </Typography>
    </Box>
  );
}
