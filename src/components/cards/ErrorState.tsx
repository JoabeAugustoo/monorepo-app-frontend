import { Box, Typography, Button, Card, alpha } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Erro ao carregar dados',
  message = 'Ocorreu um erro ao buscar os dados. Tente novamente.',
  onRetry,
}: ErrorStateProps) {
  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        py: 8,
        px: 4,
        gap: 2,
        backgroundColor: (theme) => alpha(theme.palette.error.main, 0.02),
        border: '1px solid',
        borderColor: (theme) => alpha(theme.palette.error.main, 0.15),
        boxShadow: 'none',
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: 4,
          backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 40, color: 'error.main' }} />
      </Box>
      <Typography
        variant="h6"
        sx={{
          color: 'error.main',
          fontWeight: 600,
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        textAlign="center"
        sx={{ maxWidth: 300 }}
      >
        {message}
      </Typography>
      {onRetry && (
        <Button
          variant="outlined"
          color="error"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          sx={{
            mt: 2,
            borderColor: (theme) => alpha(theme.palette.error.main, 0.5),
            '&:hover': {
              borderColor: 'error.main',
              backgroundColor: (theme) => alpha(theme.palette.error.main, 0.08),
            },
          }}
        >
          Tentar novamente
        </Button>
      )}
    </Card>
  );
}
