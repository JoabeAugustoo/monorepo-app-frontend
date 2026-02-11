import { Box, Card, CardContent, Grid, Typography, Stack, Chip, alpha, LinearProgress } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import AppsIcon from '@mui/icons-material/Apps';
import PersonIcon from '@mui/icons-material/Person';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import KeyIcon from '@mui/icons-material/Key';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../auth/AuthContext';
import { useUsersCount } from '../hooks/useUsers';
import { useRolesCount } from '../hooks/useRoles';
import { useApplicationsCount } from '../hooks/useApplications';
import { useClientsCount } from '../hooks/useClients';
import { LoadingState } from '../components/cards/LoadingState';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: number;
}

function StatCard({ title, value, icon, color, subtitle, trend }: StatCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          background: `linear-gradient(90deg, ${color} 0%, ${alpha(color, 0.5)} 100%)`,
        },
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                letterSpacing: '0.05em',
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                mt: 0.5,
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              </Stack>
            )}
            {trend !== undefined && (
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="body2" color="success.main" fontWeight={500}>
                  +{trend}% este mês
                </Typography>
              </Stack>
            )}
          </Box>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.7)} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 16px -4px ${alpha(color, 0.4)}`,
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function WelcomeCard({ user }: { user: { userName?: string; email?: string; roles?: string[] } | null }) {
  const displayName = user?.userName || 'Usuário';

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          right: -20,
          top: -20,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          right: 60,
          bottom: -40,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }}
      />

      <CardContent sx={{ position: 'relative', zIndex: 1, py: 3 }}>
        <Stack direction="row" spacing={3} alignItems="center">
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255,255,255,0.3)',
            }}
          >
            <PersonIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
              Bem-vindo, {displayName}!
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1.5 }}>
              {user?.email}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {(user?.roles ?? []).map((role) => (
                <Chip
                  key={role}
                  label={role.replace('ROLE_', '')}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function QuickStatsCard({ activeCount, totalCount, label, color = '#6366f1' }: { activeCount: number; totalCount: number; label: string; color?: string }) {
  const percentage = totalCount > 0 ? (activeCount / totalCount) * 100 : 0;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {activeCount}/{totalCount}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: alpha(color, 0.1),
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            background: `linear-gradient(90deg, ${color} 0%, ${alpha(color, 0.7)} 100%)`,
          },
        }}
      />
    </Box>
  );
}

export function Dashboard() {
  const { user, hasRole } = useAuth();
  const { data: usersCount, isLoading: usersLoading } = useUsersCount();
  const { data: rolesCount, isLoading: rolesLoading } = useRolesCount();
  const { data: applicationsCount, isLoading: applicationsLoading } = useApplicationsCount();
  const { data: clientsCount, isLoading: clientsLoading } = useClientsCount();

  const isAdmin = hasRole('ADMIN');
  const isLoading = usersLoading || rolesLoading || applicationsLoading || clientsLoading;

  if (isLoading) {
    return <LoadingState />;
  }

  const totalUsers = usersCount?.total || 0;
  const activeUsers = usersCount?.active || 0;
  const totalRoles = rolesCount?.total || 0;
  const activeRoles = rolesCount?.active || 0;
  const totalApplications = applicationsCount?.total || 0;
  const activeApplications = applicationsCount?.active || 0;
  const totalClients = clientsCount?.total || 0;
  const activeClients = clientsCount?.active || 0;

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Visão geral do sistema de segurança
        </Typography>
      </Box>

      {/* Welcome Card */}
      <Box sx={{ mb: 4 }}>
        <WelcomeCard user={user} />
      </Box>

      {isAdmin && (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Aplicações"
                value={totalApplications}
                icon={<AppsIcon sx={{ fontSize: 28, color: 'white' }} />}
                color="#10b981"
                subtitle={`${activeApplications} ativas`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Usuários"
                value={totalUsers}
                icon={<PeopleIcon sx={{ fontSize: 28, color: 'white' }} />}
                color="#6366f1"
                subtitle={`${activeUsers} ativos`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Roles"
                value={totalRoles}
                icon={<SecurityIcon sx={{ fontSize: 28, color: 'white' }} />}
                color="#ec4899"
                subtitle={`${activeRoles} ativas`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Client Credentials"
                value={totalClients}
                icon={<KeyIcon sx={{ fontSize: 28, color: 'white' }} />}
                color="#f59e0b"
                subtitle={`${activeClients} ativos`}
              />
            </Grid>
          </Grid>

          {/* Quick Stats */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Status Geral
              </Typography>
              <Stack spacing={3}>
                <QuickStatsCard
                  activeCount={activeApplications}
                  totalCount={totalApplications}
                  label="Aplicações Ativas"
                  color="#10b981"
                />
                <QuickStatsCard
                  activeCount={activeUsers}
                  totalCount={totalUsers}
                  label="Usuários Ativos"
                  color="#6366f1"
                />
                <QuickStatsCard
                  activeCount={activeRoles}
                  totalCount={totalRoles}
                  label="Roles Ativas"
                  color="#ec4899"
                />
                <QuickStatsCard
                  activeCount={activeClients}
                  totalCount={totalClients}
                  label="Clients Ativos"
                  color="#f59e0b"
                />
              </Stack>
            </CardContent>
          </Card>
        </>
      )}

      {!isAdmin && (
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: alpha('#6366f1', 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SecurityIcon sx={{ color: 'primary.main' }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Acesso Limitado
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Você está logado com permissões limitadas. Entre em contato com um
                  administrador para obter mais acesso.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
