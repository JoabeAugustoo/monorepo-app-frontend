import { ReactNode } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Select,
  MenuItem,
  ListItemIcon,
  ListItemText,
  SelectChangeEvent,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import WavesOutlinedIcon from '@mui/icons-material/WavesOutlined';
import WbTwilightOutlinedIcon from '@mui/icons-material/WbTwilightOutlined';
import AcUnitOutlinedIcon from '@mui/icons-material/AcUnitOutlined';
import PetsOutlinedIcon from '@mui/icons-material/PetsOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import { SidebarTema } from '../types';

const DRAWER_WIDTH = 320;

export interface TemaOption {
  value: SidebarTema;
  label: string;
  icon: ReactNode;
}

export const TEMA_OPTIONS: TemaOption[] = [
  { value: 'claro',  label: 'Claro',  icon: <LightModeOutlinedIcon fontSize="small" sx={{ color: '#F9A825' }} /> },
  { value: 'escuro', label: 'Escuro', icon: <DarkModeOutlinedIcon  fontSize="small" sx={{ color: '#B494E8' }} /> },
  { value: 'oceano', label: 'Oceano', icon: <WavesOutlinedIcon     fontSize="small" sx={{ color: '#4DD0E1' }} /> },
  { value: 'sunset', label: 'Sunset', icon: <WbTwilightOutlinedIcon fontSize="small" sx={{ color: '#FFB74D' }} /> },
  { value: 'nord',   label: 'Nord',   icon: <AcUnitOutlinedIcon    fontSize="small" sx={{ color: '#88C0D0' }} /> },
  { value: 'pet',    label: 'Pet',    icon: <PetsOutlinedIcon      fontSize="small" sx={{ color: '#9C72D9' }} /> },
  { value: 'azul',   label: 'Azul',   icon: <BoltOutlinedIcon      fontSize="small" sx={{ color: '#2979FF' }} /> },
];

interface ConfigDrawerProps {
  aberto: boolean;
  onFechar: () => void;
  tema: SidebarTema;
  onTemaChange: (novoTema: SidebarTema) => void;
}

export function ConfigDrawer({ aberto, onFechar, tema, onTemaChange }: ConfigDrawerProps) {
  const handleTemaChange = (event: SelectChangeEvent) => {
    onTemaChange(event.target.value as SidebarTema);
  };

  const currentOption = TEMA_OPTIONS.find((o) => o.value === tema) ?? TEMA_OPTIONS[0];

  return (
    <Drawer
      anchor="right"
      open={aberto}
      onClose={onFechar}
      slotProps={{
        paper: {
          sx: {
            width: DRAWER_WIDTH,
            bgcolor: 'background.paper',
          },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Configurações
        </Typography>
        <IconButton onClick={onFechar} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
          Aparência
        </Typography>

        <Typography variant="body2" sx={{ mb: 1 }}>
          Tema
        </Typography>
        <Select
          value={tema}
          onChange={handleTemaChange}
          fullWidth
          size="small"
          renderValue={() => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {currentOption.icon}
              {currentOption.label}
            </Box>
          )}
        >
          {TEMA_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              <ListItemIcon>{opt.icon}</ListItemIcon>
              <ListItemText>{opt.label}</ListItemText>
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Drawer>
  );
}
