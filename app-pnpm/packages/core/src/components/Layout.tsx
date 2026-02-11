import { ReactNode, useCallback, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  MenuItem as MuiMenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  Toolbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { NavigateFunction, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AppBarComponent } from './AppBarComponent';
import { useSidebar } from '../hooks/useSidebar';
import { useAuthOpcional } from '../hooks/useAuth';
import { MenuItem, SidebarTema, UserMenuConfig } from '../types';

const LARGURA_SIDEBAR = 260;
const STORAGE_KEY = 'pet-sidebar-tema';
const TEMAS: SidebarTema[] = ['claro', 'escuro'];

function lerTema(): SidebarTema {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo && TEMAS.includes(salvo as SidebarTema)) return salvo as SidebarTema;
  } catch { /* ignore */ }
  return 'claro';
}

interface LayoutProps {
  menuItems: MenuItem[];
  userMenu: UserMenuConfig | ((navigate: NavigateFunction, logout?: () => void) => UserMenuConfig);
  appName: string;
  appLogo?: ReactNode;
  menuLayout?: 'vertical' | 'horizontal';
  appBarActions?: ReactNode;
}

export type LayoutContext = {
  menuItems: MenuItem[];
  userMenu: UserMenuConfig;
  appName: string;
};

export function Layout({ menuItems, userMenu, appName, appLogo, menuLayout = 'vertical', appBarActions }: LayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isHorizontal = menuLayout === 'horizontal';
  const { aberto, alternar, fechar } = useSidebar(!isMobile && !isHorizontal);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuthOpcional();
  const [sidebarTema, setSidebarTema] = useState<SidebarTema>(lerTema);

  const resolvedUserMenu = useMemo(
    () => (typeof userMenu === 'function' ? userMenu(navigate, auth?.logout) : userMenu),
    [userMenu, navigate, auth?.logout],
  );

  const alternarTema = useCallback(() => {
    setSidebarTema((atual) => {
      const proximo = TEMAS[(TEMAS.indexOf(atual) + 1) % TEMAS.length];
      try { localStorage.setItem(STORAGE_KEY, proximo); } catch { /* ignore */ }
      return proximo;
    });
  }, []);

  const showSidebar = isHorizontal ? isMobile : true;
  const sidebarAberto = isHorizontal ? (isMobile && aberto) : (!isMobile && aberto);
  const showHamburger = !isHorizontal || isMobile;

  // Tab index based on current route
  const activeTabIndex = useMemo(() => {
    const idx = menuItems.findIndex((item) => {
      if (item.path === '/') return location.pathname === '/';
      return location.pathname.startsWith(item.path);
    });
    return idx >= 0 ? idx : 0;
  }, [menuItems, location.pathname]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    navigate(menuItems[newValue].path);
  };

  const handleSelectChange = (event: { target: { value: unknown } }) => {
    navigate(menuItems[event.target.value as number].path);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBarComponent
        onAlternarMenu={alternar}
        onAlternarTema={alternarTema}
        sidebarTema={sidebarTema}
        userMenu={resolvedUserMenu}
        appName={appName}
        sidebarAberto={!isHorizontal && !isMobile && aberto}
        larguraSidebar={LARGURA_SIDEBAR}
        showHamburger={showHamburger}
        appBarActions={appBarActions}
      />
      {showSidebar && (
        <Sidebar
          menuItems={menuItems}
          aberto={sidebarAberto}
          onFechar={fechar}
          largura={LARGURA_SIDEBAR}
          appName={appName}
          appLogo={appLogo}
          tema={sidebarTema}
        />
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          transition: theme.transitions.create('margin', {
            easing: aberto
              ? theme.transitions.easing.easeOut
              : theme.transitions.easing.sharp,
            duration: aberto
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
          ml: isHorizontal || isMobile ? 0 : aberto ? 0 : `-${LARGURA_SIDEBAR}px`,
        }}
      >
        <Toolbar />
        {isHorizontal && (() => {
          const isDark = sidebarTema === 'escuro';
          const tabBg = isDark ? '#1E293B' : '#FFFFFF';
          const tabColor = isDark ? alpha('#fff', 0.7) : 'text.secondary';
          const tabActiveColor = isDark ? '#fff' : 'primary.main';
          const indicatorColor = isDark ? '#fff' : undefined;

          return (
            <Box sx={{ mb: 3 }}>
              {isMobile ? (
                <FormControl fullWidth>
                  <Select
                    value={activeTabIndex}
                    onChange={handleSelectChange}
                    sx={{
                      backgroundColor: tabBg,
                      color: isDark ? '#fff' : undefined,
                      '& .MuiSelect-icon': { color: isDark ? alpha('#fff', 0.7) : undefined },
                    }}
                    renderValue={(value) => {
                      const item = menuItems[value as number];
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {item.icon}
                          {item.label}
                        </Box>
                      );
                    }}
                  >
                    {menuItems.map((item, index) => (
                      <MuiMenuItem key={item.path} value={index}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {item.icon}
                          {item.label}
                        </Box>
                      </MuiMenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Paper
                  sx={{
                    p: 0.5,
                    bgcolor: tabBg,
                    ...(isDark && { border: 'none' }),
                  }}
                >
                  <Tabs
                    value={activeTabIndex}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    TabIndicatorProps={{
                      sx: indicatorColor ? { backgroundColor: indicatorColor } : {},
                    }}
                  >
                    {menuItems.map((item) => (
                      <Tab
                        key={item.path}
                        icon={<Box sx={{ display: 'flex', alignItems: 'center' }}>{item.icon}</Box>}
                        label={item.label}
                        iconPosition="start"
                        sx={{
                          minHeight: 48,
                          textTransform: 'none',
                          fontWeight: 500,
                          color: tabColor,
                          '&.Mui-selected': {
                            color: tabActiveColor,
                          },
                          '&:hover': {
                            bgcolor: isDark ? alpha('#fff', 0.08) : undefined,
                          },
                        }}
                      />
                    ))}
                  </Tabs>
                </Paper>
              )}
            </Box>
          );
        })()}
        <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, p: 3, '&:last-child': { pb: 3 } }}>
            <Outlet context={{ menuItems, userMenu: resolvedUserMenu, appName } satisfies LayoutContext} />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export function useLayoutContext() {
  return useOutletContext<LayoutContext>();
}
