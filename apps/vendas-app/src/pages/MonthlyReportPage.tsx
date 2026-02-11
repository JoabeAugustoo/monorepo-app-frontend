import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Download as DownloadIcon,
  TrendingUp,
  Warning,
  TableChart,
  AttachMoney,
  People,
  CreditCard,
  AccountBalance,
  Work,
  ShoppingCart,
  Receipt,
} from '@mui/icons-material';
import { KPICard } from '@app/ui';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { monthlyReportService } from '../services';
import { useDate } from '../contexts/DateContext';
import { useRefresh } from '../contexts/RefreshContext';
import { formatCurrency } from '../utils/i18n';
import type { MonthlyClosing } from '../types';

interface ReportData {
  total_sales: number;
  total_sales_count: number;
  total_new_clients: number;
  total_salaries: number;
  credits_purchased_cash: number;
  credits_purchased_credit: number;
  credits_purchased_total: number;
  total_extra_works: number;
  net_profit: number;
  month: number;
  year: number;
}

const getMonthName = (monthNum: number): string => {
  const months = [
    'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return months[monthNum - 1] || 'Mes';
};

const MonthlyReportPage = () => {
  const { selectedYear, selectedMonth } = useDate();
  const { refreshTriggers } = useRefresh();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const year = selectedYear;
  const month = selectedMonth;

  useEffect(() => {
    if (month && year) {
      fetchReport();
    }
  }, [month, year, refreshTriggers.dashboard]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data: MonthlyClosing = await monthlyReportService.getMonthlyClosing(year, month);

      setReport({
        total_sales: data.totalSales || 0,
        total_sales_count: data.totalAttendances || 0,
        total_new_clients: data.newClients || 0,
        total_salaries: data.totalSalaries || 0,
        credits_purchased_cash: data.totalPurchasesCash || 0,
        credits_purchased_credit: data.totalPurchasesCredit || 0,
        credits_purchased_total: (data.totalPurchasesCash || 0) + (data.totalPurchasesCredit || 0),
        total_extra_works: data.totalExtraWorks || 0,
        net_profit: data.netProfit || 0,
        month,
        year,
      });
    } catch (error) {
      console.error('Erro ao carregar fechamento mensal:', error);
      toast.error('Erro ao carregar fechamento mensal');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!report) return;

    const monthName = getMonthName(month);
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(40);

    doc.text('RELATORIO MENSAL - FECHAMENTO', 20, 30);
    doc.setFontSize(16);
    doc.text(`${monthName} de ${year}`, 20, 45);

    doc.setLineWidth(0.5);
    doc.line(20, 50, 190, 50);

    // Revenue section
    doc.setFontSize(14);
    doc.setTextColor(0, 128, 0);
    doc.text('RECEITAS', 20, 65);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Total de Vendas:', 25, 75);
    doc.text(formatCurrency(report.total_sales), 120, 75);

    doc.text('Total de Atendimentos:', 25, 85);
    doc.text(report.total_sales_count.toString(), 120, 85);

    doc.text('Clientes Novos:', 25, 95);
    doc.text(report.total_new_clients.toString(), 120, 95);

    // Expenses section
    doc.setFontSize(14);
    doc.setTextColor(255, 0, 0);
    doc.text('DESPESAS', 20, 115);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Compras Pagas (A Vista):', 25, 125);
    doc.text(formatCurrency(report.credits_purchased_cash), 120, 125);

    doc.text('Divida com Servidores (A Prazo):', 25, 135);
    doc.text(formatCurrency(report.credits_purchased_credit), 120, 135);

    doc.text('Total Compras:', 25, 145);
    doc.text(formatCurrency(report.credits_purchased_total), 120, 145);

    doc.text('Salarios:', 25, 155);
    doc.text(formatCurrency(report.total_salaries), 120, 155);

    doc.text('Trabalhos Extras:', 25, 165);
    doc.text(formatCurrency(report.total_extra_works), 120, 165);

    // Result section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 255);
    doc.text('RESULTADO', 20, 185);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Lucro Liquido:', 25, 195);
    doc.setFontSize(14);
    doc.setTextColor(0, 128, 0);
    doc.text(formatCurrency(report.net_profit), 120, 195);

    // Notes
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Obs: O lucro liquido considera apenas compras pagas a vista.', 20, 215);
    doc.text('Dividas (a prazo) nao sao descontadas ate serem pagas.', 20, 225);

    // Footer
    const now = new Date();
    const generatedDate = now.toLocaleDateString('pt-BR') + ' as ' + now.toLocaleTimeString('pt-BR');
    doc.setFontSize(8);
    doc.text(`Relatorio gerado em ${generatedDate}`, 20, 280);

    doc.save(`relatorio_fechamento_${month}_${year}.pdf`);
    toast.success('PDF baixado com sucesso!');
  };

  const exportToExcel = () => {
    if (!report) return;

    const monthName = getMonthName(month);

    const summaryData = [
      ['RELATORIO MENSAL - FECHAMENTO'],
      [`${monthName} de ${year}`],
      [''],
      ['RECEITAS'],
      ['Total de Vendas', report.total_sales],
      ['Total de Atendimentos', report.total_sales_count],
      ['Clientes Novos', report.total_new_clients],
      [''],
      ['DESPESAS'],
      ['Compras Pagas (A Vista)', report.credits_purchased_cash],
      ['Divida com Servidores (A Prazo)', report.credits_purchased_credit],
      ['Total Compras', report.credits_purchased_total],
      ['Salarios', report.total_salaries],
      ['Trabalhos Extras', report.total_extra_works],
      [''],
      ['RESULTADO'],
      ['Lucro Liquido', report.net_profit],
      [''],
      ['Obs: O lucro liquido considera apenas compras pagas a vista.'],
      ['Dividas (a prazo) nao sao descontadas ate serem pagas.'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(summaryData);

    ws['B5'] = { t: 'n', v: report.total_sales, z: '"R$"#,##0.00' };
    ws['B10'] = { t: 'n', v: report.credits_purchased_cash, z: '"R$"#,##0.00' };
    ws['B11'] = { t: 'n', v: report.credits_purchased_credit, z: '"R$"#,##0.00' };
    ws['B12'] = { t: 'n', v: report.credits_purchased_total, z: '"R$"#,##0.00' };
    ws['B13'] = { t: 'n', v: report.total_salaries, z: '"R$"#,##0.00' };
    ws['B14'] = { t: 'n', v: report.total_extra_works, z: '"R$"#,##0.00' };
    ws['B17'] = { t: 'n', v: report.net_profit, z: '"R$"#,##0.00' };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatorio');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `relatorio_${month}_${year}.xlsx`);

    toast.success('Excel exportado!');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Fechamento - {getMonthName(month)} {year}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Relatorio financeiro do periodo selecionado
        </Typography>
      </Box>

      {loading ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Carregando...
            </Typography>
          </CardContent>
        </Card>
      ) : (
        report && (
          <>
            {/* Receitas - KPI Cards */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2.5,
                '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 10px)', md: '1 1 0' } },
              }}
            >
              <KPICard
                label="Total Vendas"
                value={formatCurrency(report.total_sales)}
                icon={<AttachMoney sx={{ fontSize: 40 }} />}
                gradient="linear-gradient(135deg, #3b82f6, #2563eb)"
                minHeight={120}
              />

              <KPICard
                label="Atendimentos"
                value={report.total_sales_count}
                icon={<Receipt sx={{ fontSize: 40 }} />}
                gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
                minHeight={120}
              />

              <KPICard
                label="Clientes Novos"
                value={report.total_new_clients}
                icon={<People sx={{ fontSize: 40 }} />}
                gradient="linear-gradient(135deg, #f59e0b, #d97706)"
                minHeight={120}
              />

              <KPICard
                label="Salarios"
                value={formatCurrency(report.total_salaries)}
                icon={<Work sx={{ fontSize: 40 }} />}
                gradient="linear-gradient(135deg, #64748b, #475569)"
                minHeight={120}
              />
            </Box>

            {/* Despesas - Compras */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <ShoppingCart sx={{ color: '#6b7280' }} />
                  <Typography variant="h6" fontWeight="bold">
                    Compras Realizadas
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2.5,
                    '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 10px)', md: '1 1 0' } },
                  }}
                >
                  {/* Pagos A Vista */}
                  <Box
                    sx={{
                      bgcolor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 2,
                      p: 2.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <AccountBalance sx={{ fontSize: 20, color: '#16a34a' }} />
                      <Typography variant="body2" color="#16a34a" fontWeight={600}>
                        Pagos (A Vista)
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="bold" color="#16a34a" sx={{ mb: 0.5 }}>
                      {formatCurrency(report.credits_purchased_cash)}
                    </Typography>
                    <Typography variant="caption" color="#6b7280">
                      Descontado do lucro
                    </Typography>
                  </Box>

                  {/* Divida A Prazo */}
                  <Box
                    sx={{
                      bgcolor: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: 2,
                      p: 2.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Warning sx={{ fontSize: 20, color: '#d97706' }} />
                      <Typography variant="body2" color="#d97706" fontWeight={600}>
                        Divida (A Prazo)
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="bold" color="#d97706" sx={{ mb: 0.5 }}>
                      {formatCurrency(report.credits_purchased_credit)}
                    </Typography>
                    <Typography variant="caption" color="#6b7280">
                      Nao descontado ainda
                    </Typography>
                  </Box>

                  {/* Total Geral */}
                  <Box
                    sx={{
                      bgcolor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 2,
                      p: 2.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <CreditCard sx={{ fontSize: 20, color: '#475569' }} />
                      <Typography variant="body2" color="#475569" fontWeight={600}>
                        Total Compras
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="bold" color="#475569">
                      {formatCurrency(report.credits_purchased_total)}
                    </Typography>
                  </Box>
                </Box>

                {report.total_extra_works > 0 && (
                  <Box sx={{ mt: 2.5 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Trabalhos Extras
                      </Typography>
                      <Typography variant="body1" fontWeight={600} color="#6b7280">
                        {formatCurrency(report.total_extra_works)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Lucro Liquido - Hero Card */}
            <Card
              sx={{
                background: report.net_profit >= 0
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: 'white',
                minHeight: 130,
              }}
            >
              <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <TrendingUp sx={{ fontSize: 28, flexShrink: 0 }} />
                      <Typography variant="h6" fontWeight="bold" noWrap>
                        Lucro Liquido
                      </Typography>
                    </Box>
                    <Typography
                      variant="h3"
                      fontWeight="bold"
                      sx={{ mb: 1, fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}
                    >
                      {formatCurrency(report.net_profit)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85 }}>
                      Vendas - Compras Pagas - Salarios - Extras
                    </Typography>
                  </Box>
                  <TrendingUp sx={{ fontSize: { xs: 40, md: 64 }, opacity: 0.2, flexShrink: 0, display: { xs: 'none', sm: 'block' } }} />
                </Box>
              </CardContent>
            </Card>

            {/* Export Buttons */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                '& > *': { flex: { xs: '1 1 100%', sm: '1 1 0' } },
              }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<DownloadIcon />}
                onClick={exportToPDF}
                sx={{
                  py: 1.5,
                  fontSize: '0.95rem',
                  bgcolor: '#dc2626',
                  color: 'white',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#b91c1c' },
                }}
              >
                Baixar PDF
              </Button>

              <Button
                variant="contained"
                size="large"
                startIcon={<TableChart />}
                onClick={exportToExcel}
                sx={{
                  py: 1.5,
                  fontSize: '0.95rem',
                  bgcolor: '#16a34a',
                  color: 'white',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#15803d' },
                }}
              >
                Exportar Excel
              </Button>
            </Box>
          </>
        )
      )}
    </Box>
  );
};

export default MonthlyReportPage;
