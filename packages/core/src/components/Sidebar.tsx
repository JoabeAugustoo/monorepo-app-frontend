import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';
import { MenuItem, SidebarTema } from '../types';
import { darkTokens } from '../theme/darkThemeTokens';

interface SidebarProps {
  menuItems: MenuItem[];
  aberto: boolean;
  onFechar: () => void;
  largura: number;
  appName: string;
  appLogo?: React.ReactNode;
  tema?: SidebarTema;
}

interface TemaConfig {
  dark: boolean;
  bgcolor: string;
  border: boolean;
}

function getTemaConfig(tema: SidebarTema): TemaConfig {
  switch (tema) {
    case 'claro':
      return { dark: false, bgcolor: '#FFFFFF', border: true };
    case 'escuro':
      return { dark: true, bgcolor: darkTokens.sidebar.bg, border: false };
  }
}

const dk = darkTokens.sidebar;

export function Sidebar({ menuItems, aberto, onFechar, largura, appName, appLogo, tema = 'claro' }: SidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();

  const primaryColor = theme.palette.primary.main;
  const config = getTemaConfig(tema);

  const handleNavegar = (path: string) => {
    navigate(path);
    if (isMobile) {
      onFechar();
    }
  };

  const isAtivo = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const brandArea = (cfg: TemaConfig) => (
    <Toolbar sx={{ px: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {appLogo ? (
          <Box sx={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {appLogo}
          </Box>
        ) : (
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 1.5,
              bgcolor: cfg.dark ? dk.brandBg : alpha(primaryColor, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem',
              color: cfg.dark ? dk.activeText : primaryColor,
            }}
          >
            {appName[0]}
          </Box>
        )}
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ color: cfg.dark ? dk.activeText : primaryColor }}
        >
          {appName}
        </Typography>
      </Box>
    </Toolbar>
  );

  const navList = (cfg: TemaConfig) => (
    <List sx={{ px: 1.5, pt: 1 }}>
      {menuItems.map((item) => {
        const ativo = isAtivo(item.path);
        return (
          <ListItemButton
            key={item.path}
            onClick={() => handleNavegar(item.path)}
            selected={ativo}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              py: 1,
              position: 'relative',
              overflow: 'hidden',
              ...(cfg.dark
                ? {
                    color: ativo ? dk.activeText : dk.inactiveText,
                    '&.Mui-selected': {
                      bgcolor: dk.selectedBg,
                      '&:hover': { bgcolor: dk.selectedHoverBg },
                    },
                    '&:hover': { bgcolor: dk.hoverBg },
                  }
                : {
                    color: ativo ? primaryColor : 'text.secondary',
                    '&.Mui-selected': {
                      bgcolor: alpha(primaryColor, 0.08),
                      '&:hover': { bgcolor: alpha(primaryColor, 0.14) },
                    },
                    '&:hover': { bgcolor: alpha(primaryColor, 0.04) },
                  }),
              // Active indicator bar (vertical bar on the left)
              '&::after': ativo
                ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    bottom: '20%',
                    width: 3,
                    borderRadius: '0 3px 3px 0',
                    bgcolor: cfg.dark ? dk.indicator : primaryColor,
                  }
                : {},
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: cfg.dark
                  ? ativo ? dk.activeIcon : dk.inactiveIcon
                  : ativo ? primaryColor : alpha(primaryColor, 0.5),
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontWeight: ativo ? 600 : 400,
                fontSize: '0.9rem',
              }}
            />
          </ListItemButton>
        );
      })}
    </List>
  );

  const drawerContent = (cfg: TemaConfig) => (
    <>
      {brandArea(cfg)}
      <Divider sx={{ borderColor: cfg.dark ? dk.divider : 'divider', mx: 2 }} />
      {navList(cfg)}
    </>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={aberto}
        onClose={onFechar}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: largura,
            boxSizing: 'border-box',
            bgcolor: config.bgcolor,
            ...(!config.border && { borderRight: 'none' }),
          },
        }}
      >
        {drawerContent(config)}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="persistent"
      open={aberto}
      sx={{
        width: largura,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: largura,
          boxSizing: 'border-box',
          bgcolor: config.bgcolor,
          ...(config.border
            ? { borderRight: '1px solid', borderColor: 'divider' }
            : { borderRight: 'none' }),
        },
      }}
    >
      {drawerContent(config)}
    </Drawer>
  );
}
