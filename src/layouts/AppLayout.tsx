import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  alpha,
  Tooltip,
  Badge,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import AppsIcon from '@mui/icons-material/Apps';
import KeyIcon from '@mui/icons-material/Key';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { useAuth } from '../auth/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { DRAWER_WIDTH, SIDEBAR_CONFIG } from '../theme';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Aplicações', path: '/applications', icon: <AppsIcon />, roles: ['ADMIN'] },
  { label: 'Usuários', path: '/users', icon: <PeopleIcon />, roles: ['ADMIN'] },
  { label: 'Roles', path: '/roles', icon: <SecurityIcon />, roles: ['ADMIN'] },
  { label: 'Client Credentials', path: '/clients', icon: <KeyIcon />, roles: ['ADMIN'] },
];

export function AppLayout() {
  const { isMobile } = useResponsive();
  const { user, logout, hasAnyRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || hasAnyRole(item.roles)
  );

  const drawer = (
    <Box
      sx={{
        height: '100%',
        background: SIDEBAR_CONFIG.background,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo Section */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 3,
          py: 3,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
          }}
        >
          <SecurityIcon sx={{ color: '#fff', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              color: SIDEBAR_CONFIG.logoColor,
              fontWeight: 700,
              fontSize: '1.1rem',
              lineHeight: 1.2,
            }}
          >
            Security
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: SIDEBAR_CONFIG.itemColor,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Admin Panel
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: SIDEBAR_CONFIG.dividerColor, mx: 2 }} />

      {/* Navigation */}
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  py: 1.25,
                  px: 2,
                  backgroundColor: isActive ? SIDEBAR_CONFIG.activeItemBg : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive
                      ? SIDEBAR_CONFIG.activeItemBg
                      : SIDEBAR_CONFIG.itemHoverBg,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? SIDEBAR_CONFIG.activeItemColor : SIDEBAR_CONFIG.itemColor,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? SIDEBAR_CONFIG.activeItemColor : SIDEBAR_CONFIG.itemColor,
                  }}
                />
                {isActive && (
                  <Box
                    sx={{
                      width: 4,
                      height: 20,
                      borderRadius: 2,
                      backgroundColor: SIDEBAR_CONFIG.activeItemColor,
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User Section */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ borderColor: SIDEBAR_CONFIG.dividerColor, mb: 2 }} />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
          }}
        >
          <Avatar
            sx={{
              width: 38,
              height: 38,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              fontSize: '0.95rem',
              fontWeight: 600,
            }}
          >
            {user?.userName?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                color: SIDEBAR_CONFIG.logoColor,
                fontWeight: 600,
                fontSize: '0.875rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.userName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: SIDEBAR_CONFIG.itemColor,
                fontSize: '0.75rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {user?.email}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          backgroundColor: 'background.paper',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          <IconButton
            color="inherit"
            aria-label="abrir menu"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />

          {/* Notifications */}
          <Tooltip title="Notificações">
            <IconButton
              sx={{
                mr: 1,
                color: 'text.secondary',
                '&:hover': { backgroundColor: alpha('#6366f1', 0.08) },
              }}
            >
              <Badge badgeContent={0} color="error">
                <NotificationsNoneIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Settings */}
          <Tooltip title="Configurações">
            <IconButton
              sx={{
                mr: 2,
                color: 'text.secondary',
                '&:hover': { backgroundColor: alpha('#6366f1', 0.08) },
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          <Box
            onClick={handleMenuOpen}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              py: 0.5,
              px: 1,
              borderRadius: 2,
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: alpha('#6366f1', 0.08),
              },
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              {user?.userName?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
                {user?.userName}
              </Typography>
              <Typography variant="caption" color="text.secondary" lineHeight={1.2}>
                {user?.roles?.[0]?.replace('ROLE_', '') || 'Usuário'}
              </Typography>
            </Box>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 200,
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {user?.userName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={handleMenuClose}
              sx={{ py: 1.5, gap: 1.5 }}
            >
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="body2">Meu Perfil</Typography>
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              sx={{ py: 1.5, gap: 1.5 }}
            >
              <SettingsIcon fontSize="small" color="action" />
              <Typography variant="body2">Configurações</Typography>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={handleLogout}
              sx={{
                py: 1.5,
                gap: 1.5,
                color: 'error.main',
              }}
            >
              <LogoutIcon fontSize="small" />
              <Typography variant="body2">Sair</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              border: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              border: 'none',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
