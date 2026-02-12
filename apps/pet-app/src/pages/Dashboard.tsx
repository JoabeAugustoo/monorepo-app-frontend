import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid2 as Grid,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  useTheme,
} from '@mui/material';
import PetsIcon from '@mui/icons-material/Pets';
import PeopleIcon from '@mui/icons-material/People';
import BadgeIcon from '@mui/icons-material/Badge';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import InventoryIcon from '@mui/icons-material/Inventory';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { petService, customerService, employeeService, medicalProcedureService, medicationService, stockBatchService } from '../services';
import type { MedicalProcedure, Medication, StockBatch, ProcedureType } from '../types';

const TYPE_LABELS: Record<string, string> = {
  CONSULTATION: 'Consulta',
  SURGERY: 'Cirurgia',
  EXAM: 'Exame',
  VACCINATION: 'Vacinação',
  GROOMING: 'Banho/Tosa',
  OTHER: 'Outro',
};

const CHART_COLORS = ['#9C72D9', '#F48FB1', '#81C9C5', '#FFD6A5', '#7EB3E0', '#C9A6E8'];

function useChartStyles() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return useMemo(() => ({
    tooltip: {
      borderRadius: '8px',
      border: isDark ? '1px solid rgba(156,114,217,0.2)' : '1px solid #e5e7eb',
      backgroundColor: isDark ? '#2A2540' : 'white',
      color: isDark ? '#E8E0F0' : undefined,
      fontSize: '14px',
    },
    gridStroke: isDark ? 'rgba(156,114,217,0.12)' : '#e5e7eb',
    axisStroke: isDark ? '#A99BBF' : '#6b7280',
    labelFill: isDark ? '#A99BBF' : undefined,
  }), [isDark]);
}

interface DailyChartData {
  day: string;
  atendimentos: number;
}

interface TypeChartData {
  name: string;
  value: number;
}

interface StatusChartData {
  name: string;
  value: number;
  color: string;
}

interface MedStockChartData {
  name: string;
  atual: number;
  minimo: number;
}

export default function Dashboard() {
  const chartStyles = useChartStyles();
  const [petCount, setPetCount] = useState<number | null>(null);
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [employeeCount, setEmployeeCount] = useState<number | null>(null);
  const [inProgressCount, setInProgressCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [scheduledToday, setScheduledToday] = useState<MedicalProcedure[]>([]);
  const [lowStockMeds, setLowStockMeds] = useState<Medication[]>([]);
  const [expiringBatches, setExpiringBatches] = useState<StockBatch[]>([]);

  // Chart data
  const [dailyData, setDailyData] = useState<DailyChartData[]>([]);
  const [typeData, setTypeData] = useState<TypeChartData[]>([]);
  const [statusData, setStatusData] = useState<StatusChartData[]>([]);
  const [medStockData, setMedStockData] = useState<MedStockChartData[]>([]);

  // KPIs
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [pets, customers, employees] = await Promise.all([
          petService.getCount().catch(() => 0),
          customerService.getCount().catch(() => 0),
          employeeService.getCount().catch(() => 0),
        ]);
        setPetCount(typeof pets === 'number' ? pets : pets?.count ?? 0);
        setCustomerCount(typeof customers === 'number' ? customers : customers?.count ?? 0);
        setEmployeeCount(typeof employees === 'number' ? employees : employees?.count ?? 0);
      } catch (error) {
        console.error('Erro ao carregar dados do painel:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  // Lists & alerts
  useEffect(() => {
    medicalProcedureService.search({
      where: { status: 'IN_PROGRESS' },
      skip: 0,
      take: 1,
    }).then((res) => {
      setInProgressCount(res?.total ?? 0);
    }).catch(() => setInProgressCount(0));

    const today = new Date().toISOString().split('T')[0];
    medicalProcedureService.search({
      where: { status: 'SCHEDULED', date: { gte: today + 'T00:00:00', lte: today + 'T23:59:59' } },
      skip: 0,
      take: 10,
      sort: [{ field: 'date', direction: 'ASC' }],
    }).then((res) => {
      setScheduledToday(res?.data || []);
    }).catch(() => {});

    medicationService.getLowStock().then(setLowStockMeds).catch(() => {});
    stockBatchService.getExpiring(30).then(setExpiringBatches).catch(() => {});
  }, []);

  // Chart: Atendimentos por dia (last 30 days)
  useEffect(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const from = thirtyDaysAgo.toISOString().split('T')[0];

    medicalProcedureService.search({
      where: { date: { gte: from + 'T00:00:00' } },
      skip: 0,
      take: 1000,
      sort: [{ field: 'date', direction: 'ASC' }],
    }).then((res) => {
      const procedures = res?.data || [];
      const dayMap: Record<string, number> = {};

      // Initialize all 30 days
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dayMap[key] = 0;
      }

      procedures.forEach((p) => {
        if (p.date) {
          const key = p.date.split('T')[0];
          if (key in dayMap) dayMap[key]++;
        }
      });

      setDailyData(
        Object.entries(dayMap).map(([day, count]) => ({
          day: new Date(day + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          atendimentos: count,
        }))
      );
    }).catch(() => {});
  }, []);

  // Chart: Procedimentos por tipo (last 30 days)
  useEffect(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const from = thirtyDaysAgo.toISOString().split('T')[0];

    medicalProcedureService.search({
      where: { date: { gte: from + 'T00:00:00' } },
      skip: 0,
      take: 1000,
    }).then((res) => {
      const procedures = res?.data || [];
      const typeMap: Record<string, number> = {};
      procedures.forEach((p) => {
        const label = TYPE_LABELS[p.type] || p.type;
        typeMap[label] = (typeMap[label] || 0) + 1;
      });
      setTypeData(
        Object.entries(typeMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
      );
    }).catch(() => {});
  }, []);

  // Chart: Procedimentos por status
  useEffect(() => {
    const statusConfig: { status: string; label: string; color: string }[] = [
      { status: 'SCHEDULED', label: 'Agendados', color: '#7EB3E0' },
      { status: 'IN_PROGRESS', label: 'Em andamento', color: '#F48FB1' },
      { status: 'COMPLETED', label: 'Concluídos', color: '#81C9C5' },
      { status: 'CANCELLED', label: 'Cancelados', color: '#BDBDBD' },
    ];

    Promise.all(
      statusConfig.map(async ({ status, label, color }) => {
        try {
          const res = await medicalProcedureService.search({
            where: { status },
            skip: 0,
            take: 1,
          });
          return { name: label, value: res?.total ?? 0, color };
        } catch {
          return { name: label, value: 0, color };
        }
      })
    ).then((data) => setStatusData(data.filter(d => d.value > 0)));
  }, []);

  // Chart: Estoque de medicamentos (top 10)
  useEffect(() => {
    medicationService.search({
      where: {},
      skip: 0,
      take: 10,
      sort: [{ field: 'currentStock', direction: 'ASC' }],
    }).then((res) => {
      const meds = res?.data || [];
      setMedStockData(
        meds.map((m) => ({
          name: m.name.length > 15 ? m.name.slice(0, 15) + '...' : m.name,
          atual: m.currentStock ?? 0,
          minimo: m.minimumStock,
        }))
      );
    }).catch(() => {});
  }, []);

  const cards = [
    { titulo: 'Total de Pets', valor: petCount, icone: <PetsIcon />, cor: '#9C72D9' },
    { titulo: 'Total de Clientes', valor: customerCount, icone: <PeopleIcon />, cor: '#F48FB1' },
    { titulo: 'Total de Funcionários', valor: employeeCount, icone: <BadgeIcon />, cor: '#81C9C5' },
    { titulo: 'Em Atendimento', valor: inProgressCount, icone: <MedicalServicesIcon />, cor: '#7EB3E0' },
  ];

  const formatTime = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Painel
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.titulo}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {card.titulo}
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {loading && card.valor === null ? <CircularProgress size={28} /> : (card.valor ?? 0)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      backgroundColor: card.cor + '14',
                      color: card.cor,
                    }}
                  >
                    {card.icone}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Z-Pattern Charts: Row 1 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3,
          mb: 3,
        }}
      >
        {/* Chart 1 (Top-Left): Atendimentos por dia - Line/Area */}
        <Card sx={{ minHeight: 420 }}>
          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <TrendingUpIcon sx={{ color: '#9C72D9' }} />
              <Typography variant="h6" fontWeight={600}>
                Atendimentos por Dia (30 dias)
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="colorAtendimentos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9C72D9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#9C72D9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridStroke} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11 }}
                      stroke={chartStyles.axisStroke}
                      interval={Math.floor(dailyData.length / 8)}
                    />
                    <YAxis tick={{ fontSize: 12 }} stroke={chartStyles.axisStroke} allowDecimals={false} />
                    <Tooltip
                      contentStyle={chartStyles.tooltip}
                      formatter={(value: number) => [`${value} atendimento(s)`, 'Total']}
                    />
                    <Area
                      type="monotone"
                      dataKey="atendimentos"
                      stroke="#9C72D9"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAtendimentos)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
                  <Typography color="text.secondary">Sem dados de atendimentos.</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Chart 2 (Top-Right): Procedimentos por tipo - Donut */}
        <Card sx={{ minHeight: 420 }}>
          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <LocalHospitalIcon sx={{ color: '#F48FB1' }} />
              <Typography variant="h6" fontWeight={600}>
                Procedimentos por Tipo (30 dias)
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              {typeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value }: { name: string; value: number }) =>
                        value > 0 ? `${name}: ${value}` : ''
                      }
                      labelLine={false}
                    >
                      {typeData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={chartStyles.tooltip}
                      formatter={(value: number) => [`${value} procedimento(s)`, 'Total']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
                  <Typography color="text.secondary">Sem dados de procedimentos.</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Z-Pattern Charts: Row 2 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3,
          mb: 3,
        }}
      >
        {/* Chart 3 (Bottom-Left): Status dos Procedimentos - Bar horizontal */}
        <Card sx={{ minHeight: 420 }}>
          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <CalendarMonthIcon sx={{ color: '#9C72D9' }} />
              <Typography variant="h6" fontWeight={600}>
                Status dos Procedimentos
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={statusData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridStroke} />
                    <XAxis type="number" tick={{ fontSize: 12 }} stroke={chartStyles.axisStroke} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 13 }}
                      stroke={chartStyles.axisStroke}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={chartStyles.tooltip}
                      formatter={(value: number) => [`${value} procedimento(s)`, 'Total']}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-status-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
                  <Typography color="text.secondary">Sem dados de status.</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Chart 4 (Bottom-Right): Estoque de Medicamentos - Bar */}
        <Card sx={{ minHeight: 420 }}>
          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <InventoryIcon sx={{ color: '#F48FB1' }} />
              <Typography variant="h6" fontWeight={600}>
                Estoque de Medicamentos
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              {medStockData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={medStockData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridStroke} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      stroke={chartStyles.axisStroke}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis tick={{ fontSize: 12 }} stroke={chartStyles.axisStroke} allowDecimals={false} />
                    <Tooltip contentStyle={chartStyles.tooltip} />
                    <Legend />
                    <Bar dataKey="atual" name="Estoque Atual" fill="#9C72D9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="minimo" name="Estoque Mínimo" fill="#F48FB1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
                  <Typography color="text.secondary">Sem dados de medicamentos.</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Scheduled today + Alerts */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Agendados Hoje
              </Typography>
              {scheduledToday.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Nenhum agendamento para hoje.</Typography>
              ) : (
                <List dense disablePadding>
                  {scheduledToday.map((proc) => (
                    <ListItem key={proc.publicId} disableGutters>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {formatTime(proc.date)}
                            </Typography>
                            <Chip label={TYPE_LABELS[proc.type] || proc.type} size="small" variant="outlined" />
                            <Typography variant="body2">{proc.petName}</Typography>
                          </Box>
                        }
                        secondary={`${proc.veterinarianName || 'Vet. não definido'} — ${proc.description?.slice(0, 60) || ''}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Alertas
              </Typography>

              {lowStockMeds.length > 0 && (
                <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {lowStockMeds.length} medicamento(s) com estoque baixo
                  </Typography>
                  <Typography variant="caption">
                    {lowStockMeds.slice(0, 3).map(m => m.name).join(', ')}
                    {lowStockMeds.length > 3 && ` e mais ${lowStockMeds.length - 3}...`}
                  </Typography>
                </Alert>
              )}

              {expiringBatches.length > 0 && (
                <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {expiringBatches.length} lote(s) vencendo em 30 dias
                  </Typography>
                  <Typography variant="caption">
                    {expiringBatches.slice(0, 3).map(b => `${b.medicationName} (${b.batchNumber})`).join(', ')}
                    {expiringBatches.length > 3 && ` e mais ${expiringBatches.length - 3}...`}
                  </Typography>
                </Alert>
              )}

              {lowStockMeds.length === 0 && expiringBatches.length === 0 && (
                <Typography variant="body2" color="text.secondary">Nenhum alerta no momento.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
