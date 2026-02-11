import { type ReactNode } from 'react';
import { Card, CardContent, Typography, Box, type SxProps, type Theme } from '@mui/material';

export interface KPICardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  gradient?: string;
  minHeight?: number;
  sx?: SxProps<Theme>;
}

export const KPICard = ({
  label,
  value,
  icon,
  gradient = 'linear-gradient(135deg, #3b82f6, #2563eb)',
  minHeight = 140,
  sx,
}: KPICardProps) => {
  return (
    <Card
      sx={{
        background: gradient,
        color: 'white',
        minHeight,
        ...sx,
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 3,
          height: '100%',
          '&:last-child': { pb: 3 },
        }}
      >
        <Box>
          <Typography variant="body1" sx={{ opacity: 0.9, mb: 1 }}>
            {label}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {value}
          </Typography>
        </Box>
        {icon && (
          <Box sx={{ fontSize: 50, opacity: 0.8, display: 'flex' }}>
            {icon}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
