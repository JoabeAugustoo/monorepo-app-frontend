import { useState, useEffect, useMemo } from 'react';
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
  useTheme,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PieChartIcon from '@mui/icons-material/PieChart';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { KPICard } from '@app/ui';
import { templateService } from '../services';
import type { CountResponse, Template } from '../types';

const CHART_COLORS = ['#2563EB', '#7C3AED', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4'];

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

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Rascunho', color: '#F59E0B' },
  PUBLISHED: { label: 'Publicado', color: '#22C55E' },
  ARCHIVED: { label: 'Arquivado', color: '#BDBDBD' },
};

const ENGINE_LABELS: Record<string, { label: string; color: string }> = {
  HANDLEBARS: { label: 'Handlebars', color: '#2563EB' },
  HTML: { label: 'HTML', color: '#7C3AED' },
};

export default function DashboardPage() {
  const chartStyles = useChartStyles();

  const [counts, setCounts] = useState<CountResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [statusData, setStatusData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [engineData, setEngineData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [recentTemplates, setRecentTemplates] = useState<Template[]>([]);

  useEffect(() => {
    templateService.getCount()
      .then(setCounts)
      .catch(() => setCounts({ total: 0, active: 0, inactive: 0 }))
      .finally(() => setLoading(false));
  }, []);

  // Templates by status
  useEffect(() => {
    const statuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
    Promise.all(
      statuses.map(async (status) => {
        try {
          const res = await templateService.search({
            where: { status },
            skip: 0,
            take: 1,
          });
          const config = STATUS_LABELS[status];
          return { name: config.label, value: res?.total ?? 0, color: config.color };
        } catch {
          const config = STATUS_LABELS[status];
          return { name: config.label, value: 0, color: config.color };
        }
      })
    ).then((data) => setStatusData(data.filter(d => d.value > 0)));
  }, []);

  // Templates by engine
  useEffect(() => {
    const engines = ['HANDLEBARS', 'HTML'] as const;
    Promise.all(
      engines.map(async (engine) => {
        try {
          const res = await templateService.search({
            where: { engine },
            skip: 0,
            take: 1,
          });
          const config = ENGINE_LABELS[engine];
          return { name: config.label, value: res?.total ?? 0, color: config.color };
        } catch {
          const config = ENGINE_LABELS[engine];
          return { name: config.label, value: 0, color: config.color };
        }
      })
    ).then((data) => setEngineData(data.filter(d => d.value > 0)));
  }, []);

  // Recent templates (most recently updated)
  useEffect(() => {
    templateService.search({
      where: {},
      skip: 0,
      take: 8,
      sort: [{ field: 'updatedAt', direction: 'DESC' }],
    })
      .then((res) => setRecentTemplates(res?.data || []))
      .catch(() => {});
  }, []);

  const cards = [
    {
      titulo: 'Total de Templates',
      valor: counts?.total,
      icone: <DescriptionIcon sx={{ fontSize: 50 }} />,
      gradient: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
    },
    {
      titulo: 'Templates Ativos',
      valor: counts?.active,
      icone: <CheckCircleIcon sx={{ fontSize: 50 }} />,
      gradient: 'linear-gradient(135deg, #22C55E, #16A34A)',
    },
    {
      titulo: 'Templates Inativos',
      valor: counts?.inactive,
      icone: <UnpublishedIcon sx={{ fontSize: 50 }} />,
      gradient: 'linear-gradient(135deg, #BDBDBD, #9E9E9E)',
    },
    {
      titulo: 'Com Versão Ativa',
      valor: recentTemplates.filter(t => t.activeVersion != null).length || null,
      icone: <AssessmentIcon sx={{ fontSize: 50 }} />,
      gradient: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
    },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cards.map((card) => (
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

      {/* Charts Row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3,
          mb: 3,
        }}
      >
        {/* Chart: Templates por Status (Donut) */}
        <Card sx={{ minHeight: 420 }}>
          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <PieChartIcon sx={{ color: '#2563EB' }} />
              <Typography variant="h6" fontWeight={600}>
                Templates por Status
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      label={(props) => {
                        const name = props.name ?? '';
                        const value = props.value ?? 0;
                        return value > 0 ? `${name}: ${value}` : '';
                      }}
                      labelLine={false}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={chartStyles.tooltip}
                      formatter={(value) => [`${value} template(s)`, 'Total']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
                  <Typography color="text.secondary">Sem dados de templates.</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Chart: Templates por Engine (Bar) */}
        <Card sx={{ minHeight: 420 }}>
          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <TrendingUpIcon sx={{ color: '#7C3AED' }} />
              <Typography variant="h6" fontWeight={600}>
                Templates por Engine
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              {engineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={engineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridStroke} />
                    <XAxis dataKey="name" tick={{ fontSize: 13 }} stroke={chartStyles.axisStroke} />
                    <YAxis tick={{ fontSize: 12 }} stroke={chartStyles.axisStroke} allowDecimals={false} />
                    <Tooltip
                      contentStyle={chartStyles.tooltip}
                      formatter={(value) => [`${value} template(s)`, 'Total']}
                    />
                    <Bar dataKey="value" name="Templates" radius={[6, 6, 0, 0]} barSize={60}>
                      {engineData.map((entry, index) => (
                        <Cell key={`cell-engine-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
                  <Typography color="text.secondary">Sem dados de engines.</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Recent Templates */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Templates Recentes
          </Typography>
          {recentTemplates.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Nenhum template encontrado.</Typography>
          ) : (
            <List dense disablePadding>
              {recentTemplates.map((tmpl) => {
                const statusConf = STATUS_LABELS[tmpl.status];
                return (
                  <ListItem key={tmpl.publicId} disableGutters sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={600}>{tmpl.name}</Typography>
                          <Chip
                            label={tmpl.key}
                            size="small"
                            variant="outlined"
                            sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                          />
                          {statusConf && (
                            <Chip
                              label={statusConf.label}
                              size="small"
                              sx={{
                                backgroundColor: statusConf.color + '14',
                                color: statusConf.color,
                                fontWeight: 600,
                                fontSize: '0.7rem',
                              }}
                            />
                          )}
                          {tmpl.activeVersion != null && (
                            <Chip label={`v${tmpl.activeVersion}`} size="small" color="primary" variant="outlined" />
                          )}
                        </Box>
                      }
                      secondary={`Engine: ${ENGINE_LABELS[tmpl.engine]?.label || tmpl.engine} — Atualizado: ${new Date(tmpl.updatedAt).toLocaleDateString('pt-BR')}`}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
