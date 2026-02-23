import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid2 as Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  useTheme,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import InventoryIcon from '@mui/icons-material/Inventory';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DrawIcon from '@mui/icons-material/Draw';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import HotelIcon from '@mui/icons-material/Hotel';
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

import { KPICard, DateRangeField, type DateRange } from '@app/ui';
import { dashboardService, medicalProcedureService, medicationService, stockBatchService } from '../services';
import type { DashboardKpis, VisitsPerDayItem, ProceduresByTypeItem, ProceduresByStatusItem, MedicationStockItem, MedicalProcedure, Medication, StockBatch } from '../types';

const TYPE_LABELS: Record<string, string> = {
  CONSULTATION: 'Consulta',
  SURGERY: 'Cirurgia',
  EXAM: 'Exame',
  VACCINATION: 'Vacinação',
  GROOMING: 'Banho/Tosa',
  OTHER: 'Outro',
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendados',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluídos',
  CANCELLED: 'Cancelados',
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: '#7EB3E0',
  IN_PROGRESS: '#F48FB1',
  COMPLETED: '#81C9C5',
  CANCELLED: '#BDBDBD',
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
  }), [isDark]);
}

function getDefaultRange(): DateRange {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: now,
  };
}

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function Dashboard() {
  const chartStyles = useChartStyles();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultRange);

  // Dashboard API data
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [visitsPerDay, setVisitsPerDay] = useState<VisitsPerDayItem[]>([]);
  const [proceduresByType, setProceduresByType] = useState<ProceduresByTypeItem[]>([]);
  const [proceduresByStatus, setProceduresByStatus] = useState<ProceduresByStatusItem[]>([]);
  const [medicationStock, setMedicationStock] = useState<MedicationStockItem[]>([]);

  // Secondary data (kept from existing services)
  const [scheduledToday, setScheduledToday] = useState<MedicalProcedure[]>([]);
  const [lowStockMeds, setLowStockMeds] = useState<Medication[]>([]);
  const [expiringBatches, setExpiringBatches] = useState<StockBatch[]>([]);

  // Load dashboard data from backend
  const loadDashboard = useCallback(() => {
    if (!dateRange.start || !dateRange.end) return;
    setLoading(true);
    const startDate = toISODate(dateRange.start);
    const endDate = toISODate(dateRange.end);

    Promise.all([
      dashboardService.getKpis(startDate, endDate).catch(() => null),
      dashboardService.getVisitsPerDay(startDate, endDate).catch(() => []),
      dashboardService.getProceduresByType(startDate, endDate).catch(() => []),
      dashboardService.getProceduresByStatus(startDate, endDate).catch(() => []),
      dashboardService.getMedicationStock().catch(() => []),
    ]).then(([kpisData, visits, byType, byStatus, stock]) => {
      setKpis(kpisData);
      setVisitsPerDay(visits);
      setProceduresByType(byType);
      setProceduresByStatus(byStatus);
      setMedicationStock(stock);
    }).finally(() => setLoading(false));
  }, [dateRange]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // Load secondary data (scheduled today + alerts)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    medicalProcedureService.search({
      where: { status: 'SCHEDULED', date: { gte: today + 'T00:00:00', lte: today + 'T23:59:59' } },
      skip: 0,
      take: 10,
      sort: [{ field: 'date', direction: 'ASC' }],
    }).then((res) => setScheduledToday(res?.data || [])).catch(() => {});

    medicationService.getLowStock().then(setLowStockMeds).catch(() => {});
    stockBatchService.getExpiring(30).then(setExpiringBatches).catch(() => {});
  }, []);

  // Transform chart data
  const dailyChartData = useMemo(() =>
    visitsPerDay.map((item) => ({
      day: new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      atendimentos: item.count,
    })),
  [visitsPerDay]);

  const typeChartData = useMemo(() =>
    proceduresByType
      .map((item) => ({ name: TYPE_LABELS[item.type] || item.type, value: item.count }))
      .sort((a, b) => b.value - a.value),
  [proceduresByType]);

  const statusChartData = useMemo(() =>
    proceduresByStatus
      .filter((item) => item.count > 0)
      .map((item) => ({
        name: STATUS_LABELS[item.status] || item.status,
        value: item.count,
        color: STATUS_COLORS[item.status] || '#BDBDBD',
      })),
  [proceduresByStatus]);

  const medStockChartData = useMemo(() =>
    medicationStock.slice(0, 10).map((m) => ({
      name: m.name.length > 15 ? m.name.slice(0, 15) + '...' : m.name,
      atual: m.currentStock,
      minimo: m.minimumStock,
    })),
  [medicationStock]);

  const kpiCards = [
    { titulo: 'Atendimentos Ativos', valor: kpis?.activeVisits, icone: <MedicalServicesIcon sx={{ fontSize: 50 }} />, gradient: 'linear-gradient(135deg, #9C72D9, #7B5BBF)' },
    { titulo: 'Internações', valor: kpis?.hospitalizations, icone: <HotelIcon sx={{ fontSize: 50 }} />, gradient: 'linear-gradient(135deg, #F48FB1, #E57399)' },
    { titulo: 'Aguardando Assinatura', valor: kpis?.documentsAwaitingSignature, icone: <DrawIcon sx={{ fontSize: 50 }} />, gradient: 'linear-gradient(135deg, #7EB3E0, #5A9BD5)' },
    { titulo: 'Visitas Concluídas', valor: kpis?.completedVisits, icone: <CheckCircleIcon sx={{ fontSize: 50 }} />, gradient: 'linear-gradient(135deg, #81C9C5, #5FB8B3)' },
  ];

  const formatTime = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Painel
        </Typography>
        <DateRangeField
          value={dateRange}
          onChange={setDateRange}
          size="small"
        />
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpiCards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.titulo}>
            <KPICard
              label={card.titulo}
              value={loading && card.valor == null ? '...' : (card.valor ?? 0)}
              icon={card.icone}
              gradient={card.gradient}
              minHeight={120}
            />
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
        {/* Chart 1: Atendimentos por dia */}
        <Card sx={{ minHeight: 420 }}>
          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <TrendingUpIcon sx={{ color: '#9C72D9' }} />
              <Typography variant="h6" fontWeight={600}>
                Atendimentos por Dia
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              {dailyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={dailyChartData}>
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
                      interval={Math.floor(dailyChartData.length / 8)}
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

        {/* Chart 2: Procedimentos por tipo */}
        <Card sx={{ minHeight: 420 }}>
          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <LocalHospitalIcon sx={{ color: '#F48FB1' }} />
              <Typography variant="h6" fontWeight={600}>
                Procedimentos por Tipo
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              {typeChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={typeChartData}
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
                      {typeChartData.map((_entry, index) => (
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
        {/* Chart 3: Status dos Procedimentos */}
        <Card sx={{ minHeight: 420 }}>
          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <CalendarMonthIcon sx={{ color: '#9C72D9' }} />
              <Typography variant="h6" fontWeight={600}>
                Status dos Procedimentos
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={statusChartData} layout="vertical" margin={{ left: 20 }}>
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
                      {statusChartData.map((entry, index) => (
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

        {/* Chart 4: Estoque de Medicamentos */}
        <Card sx={{ minHeight: 420 }}>
          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <InventoryIcon sx={{ color: '#F48FB1' }} />
              <Typography variant="h6" fontWeight={600}>
                Estoque de Medicamentos
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              {medStockChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={medStockChartData}>
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
