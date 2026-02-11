import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as DollarSignIcon,
  People as UsersIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import { KPICard } from '@app/ui';
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
import { useDate } from '../contexts/DateContext';
import { useRefresh } from '../contexts/RefreshContext';
import { usePermissions } from '../hooks/usePermissions';
import { dashboardService } from '../services';
import { formatCurrency } from '../utils/i18n';
import type {
  DashboardKPIs,
  DailySale,
  EmployeePerformance,
  MonthlyTrend,
  PurchaseDistribution,
} from '../types';

// ------- local chart-data shapes -------

interface ChartDailySale {
  day: string;
  vendas: number;
  valor: number;
}

interface ChartEmployee {
  name: string;
  vendas: number;
  valor: number;
  employeeId?: string;
}

interface ChartMonthlyTrend {
  mes: string;
  vendas: number;
  despesas: number;
  lucro: number;
}

interface DashboardData {
  totalSales: number;
  newClients: number;
  purchasesTotal: number;
  netProfit: number;
  dailySales: ChartDailySale[];
  employeePerformance: ChartEmployee[];
  monthlyTrend: ChartMonthlyTrend[];
  purchaseDistribution: PurchaseDistribution[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const formatPaymentName = (name: string): string => {
  if (name === 'CASH') return 'A Vista';
  if (name === 'CREDIT_CARD') return 'Cartão de Crédito';
  return name;
};

const emptyData: DashboardData = {
  totalSales: 0,
  newClients: 0,
  purchasesTotal: 0,
  netProfit: 0,
  dailySales: [],
  employeePerformance: [],
  monthlyTrend: [],
  purchaseDistribution: [
    { name: 'CASH', amount: 0 },
    { name: 'CREDIT_CARD', amount: 0 },
  ],
};

const DashboardPage = () => {
  const { selectedYear, selectedMonth } = useDate();
  const { refreshTriggers } = useRefresh();
  const { canReadDashboard } = usePermissions();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!canReadDashboard) return;
    setLoading(true);
    try {
      const kpis: DashboardKPIs = await dashboardService.getKPIs(selectedYear, selectedMonth);

      const [dailySalesResult, employeePerformanceResult, monthlyTrendResult, purchaseDistributionResult] =
        await Promise.allSettled([
          dashboardService.getDailySales(selectedYear, selectedMonth),
          dashboardService.getEmployeePerformance(selectedYear, selectedMonth),
          dashboardService.getMonthlyTrend(selectedYear, selectedMonth),
          dashboardService.getPurchaseDistribution(selectedYear, selectedMonth),
        ]);

      const netProfit = (kpis.totalSales || 0) - (kpis.totalPurchases || 0);

      const dailySales: ChartDailySale[] =
        dailySalesResult.status === 'fulfilled'
          ? (dailySalesResult.value || []).map((day: DailySale) => ({
              day: day.day,
              vendas: day.sales ?? 0,
              valor: day.amount ?? 0,
            }))
          : [];

      const employeePerformance: ChartEmployee[] =
        employeePerformanceResult.status === 'fulfilled'
          ? (employeePerformanceResult.value || []).map((emp: EmployeePerformance) => ({
              name: emp.employeeName || 'Sem nome',
              vendas: emp.sales ?? 0,
              valor: emp.amount ?? 0,
              employeeId: emp.employeeId,
            }))
          : [];

      const monthlyTrend: ChartMonthlyTrend[] =
        monthlyTrendResult.status === 'fulfilled'
          ? (monthlyTrendResult.value || []).map((trend: MonthlyTrend) => ({
              mes: MONTH_NAMES[trend.month - 1] ?? String(trend.month),
              vendas: trend.sales ?? 0,
              despesas: trend.expenses ?? 0,
              lucro: trend.profit ?? 0,
            }))
          : [];

      const purchaseDistribution: PurchaseDistribution[] =
        purchaseDistributionResult.status === 'fulfilled'
          ? purchaseDistributionResult.value || []
          : [
              { name: 'CASH', amount: 0 },
              { name: 'CREDIT_CARD', amount: 0 },
            ];

      setDashboardData({
        totalSales: kpis.totalSales || 0,
        newClients: kpis.newClients || 0,
        purchasesTotal: kpis.totalPurchases || 0,
        netProfit,
        dailySales,
        employeePerformance,
        monthlyTrend,
        purchaseDistribution,
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      setDashboardData({ ...emptyData });
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, canReadDashboard]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshTriggers.dashboard]);

  const filteredData = dashboardData ?? emptyData;

  return (
    <Box>
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* KPI Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 4,
        }}
      >
        <KPICard
          label="Vendas do Mes"
          value={formatCurrency(filteredData.totalSales)}
          icon={<DollarSignIcon sx={{ fontSize: 50 }} />}
          gradient="linear-gradient(135deg, #3b82f6, #2563eb)"
        />

        <KPICard
          label="Lucro Liquido"
          value={formatCurrency(filteredData.netProfit)}
          icon={<TrendingUpIcon sx={{ fontSize: 50 }} />}
          gradient="linear-gradient(135deg, #10b981, #059669)"
        />

        <KPICard
          label="Clientes Novos"
          value={filteredData.newClients}
          icon={<UsersIcon sx={{ fontSize: 50 }} />}
          gradient="linear-gradient(135deg, #f59e0b, #d97706)"
        />

        <KPICard
          label="Total de Compras"
          value={formatCurrency(filteredData.purchasesTotal)}
          icon={<ShoppingCartIcon sx={{ fontSize: 50 }} />}
          gradient="linear-gradient(135deg, #f43f5e, #e11d48)"
        />
      </Box>

      {/* Charts Row 1 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3,
          mb: 4,
        }}
      >
        {/* Daily Sales Area Chart */}
        <Card sx={{ minHeight: 450 }}>
          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <TrendingUpIcon sx={{ color: '#3b82f6' }} />
              <Typography variant="h5" component="h3">
                Vendas dos Ultimos 30 Dias
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={filteredData.dailySales}>
                  <defs>
                    <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    tickFormatter={(value: number) => formatCurrency(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      fontSize: '14px',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'vendas' ? `${value} vendas` : formatCurrency(value),
                      name === 'vendas' ? 'Quantidade de Vendas' : 'Valor Total',
                    ]}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="vendas"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorVendas)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="valor"
                    stroke="#10b981"
                    fillOpacity={0.3}
                    fill="url(#colorValor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Employee Pie Chart */}
        <Card sx={{ minHeight: 450 }}>
          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <UsersIcon sx={{ color: '#8b5cf6' }} />
              <Typography variant="h5" component="h3">
                Vendas por Funcionario
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={filteredData.employeePerformance}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="vendas"
                    label={({ name, vendas }: { name: string; vendas: number }) =>
                      `${name}: ${vendas}`
                    }
                    labelLine={false}
                  >
                    {filteredData.employeePerformance.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} vendas`, 'Total']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      fontSize: '14px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Charts Row 2 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3,
          mb: 4,
        }}
      >
        {/* Monthly Trend Bar Chart */}
        <Card sx={{ minHeight: 500 }}>
          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <TrendingUpIcon sx={{ color: '#10b981' }} />
              <Typography variant="h5" component="h3">
                Tendencia Mensal (6 meses)
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={filteredData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    tickFormatter={(value: number) => `R$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      fontSize: '14px',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="vendas" name="Vendas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="#f5420bff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lucro" name="Lucro" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Purchase Distribution Donut Chart */}
        <Card sx={{ minHeight: 500 }}>
          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <ShoppingCartIcon sx={{ color: '#ef4444' }} />
              <Typography variant="h5" component="h3">
                Distribuicao de Compras
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={filteredData.purchaseDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="amount"
                    nameKey="name"
                    label={({
                      name,
                      amount,
                    }: {
                      name: string;
                      amount: number;
                    }) => (amount > 0 ? `${formatPaymentName(name)}: ${formatCurrency(amount)}` : '')}
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      fontSize: '14px',
                    }}
                  />
                  <Legend formatter={(value: string) => formatPaymentName(value)} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Performance Table */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <UsersIcon sx={{ color: '#059669' }} />
            <Typography variant="h5" component="h3">
              Ranking de Desempenho - Funcionarios
            </Typography>
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Posicao</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Funcionario</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Vendas</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Valor Total</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>Performance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.employeePerformance.map((employee, index) => (
                  <TableRow key={employee.employeeId ?? index}>
                    <TableCell>
                      <Chip
                        label={index + 1}
                        size="small"
                        sx={{
                          bgcolor:
                            index === 0
                              ? '#fbbf24'
                              : index === 1
                                ? '#9ca3af'
                                : index === 2
                                  ? '#f59e0b'
                                  : '#e5e7eb',
                          color: index < 3 ? 'white' : '#6b7280',
                          fontWeight: '600',
                          minWidth: '24px',
                          height: '24px',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" sx={{ color: '#111827' }}>
                        {employee.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1">{employee.vendas} vendas</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" sx={{ color: '#059669' }}>
                        {formatCurrency(employee.valor)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((employee.vendas / 50) * 100, 100)}
                          sx={{
                            width: 100,
                            height: 12,
                            borderRadius: 6,
                            bgcolor: '#f3f4f6',
                            '& .MuiLinearProgress-bar': {
                              bgcolor:
                                employee.vendas >= 40
                                  ? '#10b981'
                                  : employee.vendas >= 25
                                    ? '#f59e0b'
                                    : '#ef4444',
                              borderRadius: 6,
                            },
                          }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {Math.min((employee.vendas / 50) * 100, 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardPage;
