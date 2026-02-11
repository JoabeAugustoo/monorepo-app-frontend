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
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { SidebarTema, UserMenuConfig } from '../types';

interface AppBarComponentProps {
  onAlternarMenu: () => void;
  onAlternarTema?: () => void;
  sidebarTema?: SidebarTema;
  userMenu: UserMenuConfig;
  appName: string;
  sidebarAberto?: boolean;
  larguraSidebar?: number;
  showHamburger?: boolean;
  appBarActions?: ReactNode;
}

export function AppBarComponent({
  onAlternarMenu,
  onAlternarTema,
  sidebarTema = 'claro',
  userMenu,
  appName,
  sidebarAberto = false,
  larguraSidebar = 260,
  showHamburger = true,
  appBarActions,
}: AppBarComponentProps) {
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
          {onAlternarTema && (
            <IconButton onClick={onAlternarTema} size="small">
              {sidebarTema === 'escuro' ? (
                <DarkModeOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              ) : (
                <LightModeOutlinedIcon fontSize="small" sx={{ color: 'warning.main' }} />
              )}
            </IconButton>
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
