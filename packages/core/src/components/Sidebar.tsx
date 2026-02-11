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
      return { dark: true, bgcolor: '#1E293B', border: false };
  }
}

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
              bgcolor: cfg.dark ? alpha('#fff', 0.18) : alpha(primaryColor, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem',
              color: cfg.dark ? '#fff' : primaryColor,
            }}
          >
            {appName[0]}
          </Box>
        )}
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ color: cfg.dark ? '#fff' : primaryColor }}
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
              ...(cfg.dark
                ? {
                    color: ativo ? '#fff' : alpha('#fff', 0.7),
                    '&.Mui-selected': {
                      bgcolor: alpha('#fff', 0.15),
                      '&:hover': { bgcolor: alpha('#fff', 0.22) },
                    },
                    '&:hover': { bgcolor: alpha('#fff', 0.08) },
                  }
                : {
                    '&.Mui-selected': {
                      bgcolor: alpha(primaryColor, 0.08),
                      '&:hover': { bgcolor: alpha(primaryColor, 0.14) },
                    },
                  }),
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: cfg.dark
                  ? ativo ? '#fff' : alpha('#fff', 0.7)
                  : ativo ? primaryColor : 'inherit',
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
      <Divider sx={{ borderColor: cfg.dark ? alpha('#fff', 0.12) : 'divider', mx: 2 }} />
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
