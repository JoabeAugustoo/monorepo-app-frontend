import { ReactNode, useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem as MuiMenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { UserMenuConfig, SidebarTema } from '../types';
import { TEMA_OPTIONS } from './ConfigDrawer';

interface AppBarComponentProps {
  onAlternarMenu: () => void;
  onAbrirConfiguracoes?: () => void;
  userMenu: UserMenuConfig;
  appName: string;
  sidebarAberto?: boolean;
  larguraSidebar?: number;
  showHamburger?: boolean;
  appBarActions?: ReactNode;
  notificationSlot?: ReactNode;
  tema?: SidebarTema;
}

export function AppBarComponent({
  onAlternarMenu,
  onAbrirConfiguracoes,
  userMenu,
  appName,
  sidebarAberto = false,
  larguraSidebar = 260,
  showHamburger = true,
  appBarActions,
  notificationSlot,
  tema,
}: AppBarComponentProps) {
  const temaIcon = tema ? TEMA_OPTIONS.find((o) => o.value === tema)?.icon : null;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleAbrirMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFecharMenu = () => {
    setAnchorEl(null);
  };

  const handleItemClick = (onClick: () => void) => {
    handleFecharMenu();
    onClick();
  };

  const getIniciais = (nome: string) => {
    return nome
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        transition: (theme) =>
          theme.transitions.create(['width', 'margin-left'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        ...(sidebarAberto && {
          width: `calc(100% - ${larguraSidebar}px)`,
          ml: `${larguraSidebar}px`,
          transition: (theme) =>
            theme.transitions.create(['width', 'margin-left'], {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }),
      }}
      elevation={0}
    >
      <Toolbar>
        {showHamburger && (
          <IconButton edge="start" onClick={onAlternarMenu} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 600 }}>
          {appName}
        </Typography>
        {appBarActions && (
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            {appBarActions}
          </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {notificationSlot}
          {onAbrirConfiguracoes && (
            <Tooltip title="Configurações">
              <IconButton onClick={onAbrirConfiguracoes} size="small">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                  {temaIcon}
                  <SettingsOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </Box>
              </IconButton>
            </Tooltip>
          )}
          <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, ml: 0.5 }}>
            {userMenu.nomeUsuario}
          </Typography>
          <IconButton onClick={handleAbrirMenu} size="small">
            <Avatar
              src={userMenu.avatar}
              sx={{
                width: 36,
                height: 36,
                bgcolor: 'primary.main',
                fontSize: 14,
              }}
            >
              {!userMenu.avatar && getIniciais(userMenu.nomeUsuario)}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleFecharMenu}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{
              paper: {
                sx: { mt: 1, minWidth: 180 },
              },
            }}
          >
            {userMenu.items.map((item, index) => (
              <MuiMenuItem key={index} onClick={() => handleItemClick(item.onClick)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText>{item.label}</ListItemText>
              </MuiMenuItem>
            ))}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
