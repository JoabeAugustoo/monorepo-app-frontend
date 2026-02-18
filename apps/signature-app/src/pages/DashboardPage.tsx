import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Button,
  useTheme,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import BadgeIcon from '@mui/icons-material/Badge';
import DescriptionIcon from '@mui/icons-material/Description';
import AppsIcon from '@mui/icons-material/Apps';
import PieChartIcon from '@mui/icons-material/PieChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import FilterListIcon from '@mui/icons-material/FilterList';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { KPICard, DataGrid, DateRangeField } from '@app/ui';
import type { DataGridColumn, DateRange } from '@app/ui';
import { formatDateTime } from '@app/core';
import { companyService, certificateService, documentService, applicationService, dashboardService } from '../services';
import { DocumentStatusChip } from '../components/shared/DocumentStatusChip';
import type { CountResponse, Document, DocumentsByStatusItem, DocumentsByApplicationItem } from '../types';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: '#f59e0b' },
  SIGNING: { label: 'Assinando', color: '#3b82f6' },
  COMPLETED: { label: 'Concluido', color: '#22c55e' },
  CANCELLED: { label: 'Cancelado', color: '#ef4444' },
  EXPIRED: { label: 'Expirado', color: '#6b7280' },
};

const LINE_COLORS = ['#2563EB', '#7C3AED', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#14B8A6'];

function useChartStyles() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return useMemo(() => ({
    tooltip: {
      borderRadius: '8px',
      border: isDark ? '1px solid rgba(37,99,235,0.2)' : '1px solid #e5e7eb',
      backgroundColor: isDark ? '#1E293B' : 'white',
      color: isDark ? '#CBD5E1' : undefined,
      fontSize: '14px',
    },
    gridStroke: isDark ? 'rgba(37,99,235,0.12)' : '#e5e7eb',
    axisStroke: isDark ? '#94A3B8' : '#6b7280',
  }), [isDark]);
}

function toISODate(date: Date | null): string | undefined {
  return date ? date.toISOString().split('T')[0] : undefined;
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const chartStyles = useChartStyles();

  // KPI
  const [companyStats, setCompanyStats] = useState<CountResponse | null>(null);
  const [certStats, setCertStats] = useState<CountResponse | null>(null);
  const [appStats, setAppStats] = useState<CountResponse | null>(null);
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  // Charts filter
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 5, 1),
      end: now,
    };
  });

  // Chart data
  const [statusData, setStatusData] = useState<DocumentsByStatusItem[]>([]);
  const [statusTotal, setStatusTotal] = useState(0);
  const [applicationData, setApplicationData] = useState<DocumentsByApplicationItem[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingApplication, setLoadingApplication] = useState(true);

  // Fetch KPIs + recent docs
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companies, certs, apps, docs] = await Promise.all([
          companyService.count(),
          certificateService.count(),
          applicationService.count(),
          documentService.search({
            skip: 0,
            take: 10,
            sort: [{ field: 'createdAt', direction: 'DESC' }],
          }),
        ]);
        setCompanyStats(companies);
        setCertStats(certs);
        setAppStats(apps);
        setRecentDocs(docs.data || []);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch charts
  const fetchCharts = useCallback(() => {
    const filters = {
      startDate: toISODate(dateRange.start),
      endDate: toISODate(dateRange.end),
    };

    setLoadingStatus(true);
    setLoadingApplication(true);

    dashboardService.getDocumentsByStatus(filters)
      .then((res) => {
        setStatusData(res.data || []);
        setStatusTotal(res.total || 0);
      })
      .catch(() => { setStatusData([]); setStatusTotal(0); })
      .finally(() => setLoadingStatus(false));

    dashboardService.getDocumentsByApplication(filters)
      .then((res) => setApplicationData(res.data || []))
      .catch(() => setApplicationData([]))
      .finally(() => setLoadingApplication(false));
  }, [dateRange]);

  useEffect(() => {
    fetchCharts();
  }, []);

  // Pie chart data
  const pieData = useMemo(() =>
    statusData.map((item) => {
      const config = STATUS_CONFIG[item.status] || { label: item.status, color: '#9ca3af' };
      return { name: config.label, value: item.count, color: config.color };
    }).filter((d) => d.value > 0),
    [statusData],
  );

  // Line chart data
  const lineData = useMemo(() => {
    if (applicationData.length === 0) return [];
    const periodsSet = new Set<string>();
    applicationData.forEach((app) => app.series.forEach((s) => periodsSet.add(s.period)));
    const periods = Array.from(periodsSet).sort();
    return periods.map((period) => {
      const point: Record<string, string | number> = { period };
      applicationData.forEach((app) => {
        const match = app.series.find((s) => s.period === period);
        point[app.applicationName] = match?.count || 0;
      });
      return point;
    });
  }, [applicationData]);

  const columns: DataGridColumn<Document>[] = [
    {
      key: 'fileName',
      header: 'Arquivo',
      render: (doc: Document) => (
        <Typography
          variant="body2"
          fontWeight={500}
          noWrap
          sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
          onClick={() => navigate(`/documentos/${doc.publicId}`)}
        >
          {doc.fileName}
        </Typography>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (doc: Document) => <DocumentStatusChip status={doc.status} />,
    },
    {
      key: 'createdAt',
      header: 'Criado em',
      render: (doc: Document) => (
        <Typography variant="body2">{formatDateTime(doc.createdAt)}</Typography>
      ),
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* KPI Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 220px' }}>
          <KPICard label="Empresas" value={companyStats?.total ?? 0} icon={<BusinessIcon sx={{ fontSize: 40 }} />} gradient="linear-gradient(135deg, #0d9488, #14b8a6)" />
        </Box>
        <Box sx={{ flex: '1 1 220px' }}>
          <KPICard label="Empresas Ativas" value={companyStats?.active ?? 0} icon={<BusinessIcon sx={{ fontSize: 40 }} />} gradient="linear-gradient(135deg, #10b981, #059669)" />
        </Box>
        <Box sx={{ flex: '1 1 220px' }}>
          <KPICard label="Certificados" value={certStats?.total ?? 0} icon={<BadgeIcon sx={{ fontSize: 40 }} />} gradient="linear-gradient(135deg, #3b82f6, #2563eb)" />
        </Box>
        <Box sx={{ flex: '1 1 220px' }}>
          <KPICard label="Aplicacoes" value={appStats?.total ?? 0} icon={<AppsIcon sx={{ fontSize: 40 }} />} gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)" />
        </Box>
        <Box sx={{ flex: '1 1 220px' }}>
          <KPICard label="Documentos Recentes" value={recentDocs.length} icon={<DescriptionIcon sx={{ fontSize: 40 }} />} gradient="linear-gradient(135deg, #f59e0b, #d97706)" />
        </Box>
      </Box>

      {/* Charts Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <DateRangeField
              value={dateRange}
              onChange={setDateRange}
              label="Periodo"
            />
            <Button variant="contained" startIcon={<FilterListIcon />} onClick={fetchCharts}>
              Filtrar
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Charts */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3,
          mb: 4,
        }}
      >
        {/* Pie: Documents by Status */}
        <Card sx={{ minHeight: 460 }}>
          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PieChartIcon sx={{ color: '#3b82f6' }} />
              <Typography variant="h6" fontWeight={600}>Documentos por Status</Typography>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loadingStatus ? (
                <CircularProgress />
              ) : pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={360}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={120} paddingAngle={3} dataKey="value" nameKey="name">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartStyles.tooltip} formatter={(value) => [`${value} documento(s)`, 'Total']} />
                    <Legend formatter={(value: string) => { const item = pieData.find((d) => d.name === value); return `${value} (${item?.value || 0})`; }} />
                    <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '28px', fontWeight: 700, fill: chartStyles.axisStroke }}>{statusTotal}</text>
                    <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '12px', fill: '#9ca3af' }}>total</text>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary">Sem dados para o periodo selecionado.</Typography>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Lines: Documents by Application over Time */}
        <Card sx={{ minHeight: 460 }}>
          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TimelineIcon sx={{ color: '#7c3aed' }} />
              <Typography variant="h6" fontWeight={600}>Documentos por Aplicacao</Typography>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loadingApplication ? (
                <CircularProgress />
              ) : lineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={360}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridStroke} />
                    <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke={chartStyles.axisStroke} />
                    <YAxis tick={{ fontSize: 12 }} stroke={chartStyles.axisStroke} allowDecimals={false} />
                    <Tooltip contentStyle={chartStyles.tooltip} />
                    <Legend />
                    {applicationData.map((app, index) => (
                      <Line key={app.applicationPublicId} type="monotone" dataKey={app.applicationName} stroke={LINE_COLORS[index % LINE_COLORS.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary">Sem dados para o periodo selecionado.</Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Recent Documents */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Documentos Recentes
      </Typography>
      <DataGrid<Document>
        data={recentDocs}
        columns={columns}
        getRowId={(row) => row.publicId}
        emptyMessage="Nenhum documento recente"
        loading={false}
      />
    </Box>
  );
};

export default DashboardPage;
