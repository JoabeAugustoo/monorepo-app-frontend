import { Box, Typography, Button, Card, alpha } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import AddIcon from '@mui/icons-material/Add';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = 'Nenhum item encontrado',
  message = 'Não há dados para exibir.',
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
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
        backgroundColor: (theme) => alpha(theme.palette.grey[500], 0.02),
        border: '2px dashed',
        borderColor: (theme) => alpha(theme.palette.grey[500], 0.15),
        boxShadow: 'none',
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: 4,
          backgroundColor: (theme) => alpha(theme.palette.grey[500], 0.08),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon || <InboxIcon sx={{ fontSize: 40, color: 'text.disabled' }} />}
      </Box>
      <Typography
        variant="h6"
        sx={{
          color: 'text.secondary',
          fontWeight: 600,
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        color="text.disabled"
        textAlign="center"
        sx={{ maxWidth: 300 }}
      >
        {message}
      </Typography>
      {actionLabel && onAction && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAction}
          sx={{
            mt: 2,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            },
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}
