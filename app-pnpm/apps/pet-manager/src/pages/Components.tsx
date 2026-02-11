import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { ptBR } from 'date-fns/locale';
import {
  DataGrid,
  CurrencyField,
  DateRangeField,
  MuiDatePicker,
} from '@app/ui';
import type {
  DataGridColumn,
  DataGridAction,
  SortDirection,
  DateRange,
} from '@app/ui';

// ── Mock data for DataGrid ──────────────────────────────────────────

interface Produto {
  id: number;
  nome: string;
  categoria: string;
  preco: number;
  estoque: number;
  status: 'ativo' | 'inativo';
}

const mockProdutos: Produto[] = [
  { id: 1, nome: 'Racao Premium Adulto', categoria: 'Alimentacao', preco: 189.9, estoque: 45, status: 'ativo' },
  { id: 2, nome: 'Coleira Antipulgas', categoria: 'Saude', preco: 62.5, estoque: 120, status: 'ativo' },
  { id: 3, nome: 'Brinquedo Ossinho', categoria: 'Acessorios', preco: 24.9, estoque: 0, status: 'inativo' },
  { id: 4, nome: 'Shampoo Neutro 500ml', categoria: 'Higiene', preco: 34.9, estoque: 78, status: 'ativo' },
  { id: 5, nome: 'Cama Pet Grande', categoria: 'Acessorios', preco: 259.0, estoque: 12, status: 'ativo' },
  { id: 6, nome: 'Vacina V10', categoria: 'Saude', preco: 95.0, estoque: 30, status: 'ativo' },
  { id: 7, nome: 'Areia Sanitaria 4kg', categoria: 'Higiene', preco: 18.9, estoque: 200, status: 'ativo' },
  { id: 8, nome: 'Comedouro Inox', categoria: 'Acessorios', preco: 42.0, estoque: 0, status: 'inativo' },
];

// ── Props table helper ──────────────────────────────────────────────

interface PropRow {
  prop: string;
  tipo: string;
  descricao: string;
}

function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 700 }}>Prop</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Descricao</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.prop}>
            <TableCell>
              <code>{r.prop}</code>
            </TableCell>
            <TableCell>
              <code>{r.tipo}</code>
            </TableCell>
            <TableCell>{r.descricao}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── Page ─────────────────────────────────────────────────────────────

export default function Components() {
  // DataGrid state
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(null);
  const [pageSize, setPageSize] = useState(5);

  // CurrencyField state
  const [valor, setValor] = useState(1499.9);

  // DateRangeField state
  const [range, setRange] = useState<DateRange>({ start: null, end: null });

  // MuiDatePicker state
  const [mes, setMes] = useState('');
  const [dia, setDia] = useState('');

  // DataGrid columns
  const columns: DataGridColumn<Produto>[] = [
    { key: 'id', header: 'ID', sortable: true, cellStyle: { width: 60 } },
    { key: 'nome', header: 'Nome', sortable: true },
    { key: 'categoria', header: 'Categoria', sortable: true },
    {
      key: 'preco',
      header: 'Preco',
      sortable: true,
      render: (row) =>
        row.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    },
    { key: 'estoque', header: 'Estoque', sortable: true },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Chip
          label={row.status}
          size="small"
          color={row.status === 'ativo' ? 'success' : 'default'}
        />
      ),
    },
  ];

  const actions: DataGridAction<Produto>[] = [
    {
      icon: <Edit fontSize="small" />,
      tooltip: 'Editar',
      onClick: () => {},
    },
    {
      icon: <Delete fontSize="small" />,
      tooltip: 'Excluir',
      onClick: () => {},
    },
  ];

  // Sorted data
  const sortedData = [...mockProdutos].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;
    const aVal = a[sortField as keyof Produto];
    const bVal = b[sortField as keyof Produto];
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h5" fontWeight={700}>
        Componentes @app/ui
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Catalogo interativo dos componentes reutilizaveis do pacote @app/ui.
      </Typography>

      {/* ── DataGrid ─────────────────────────────────────────── */}
      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            DataGrid
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tabela de dados com paginacao, ordenacao, selecao e acoes por linha.
          </Typography>

          <PropsTable
            rows={[
              { prop: 'data', tipo: 'T[]', descricao: 'Array de dados' },
              { prop: 'columns', tipo: 'DataGridColumn<T>[]', descricao: 'Definicao de colunas' },
              { prop: 'getRowId', tipo: '(row: T) => string | number', descricao: 'Extrator de id unico' },
              { prop: 'selectable', tipo: 'boolean', descricao: 'Habilita selecao de linhas' },
              { prop: 'actions', tipo: 'DataGridAction<T>[]', descricao: 'Botoes de acao por linha' },
              { prop: 'sortField / sortDirection', tipo: 'string | SortDirection', descricao: 'Controle de ordenacao' },
              { prop: 'onSortChange', tipo: '(field, dir) => void', descricao: 'Callback ao ordenar' },
              { prop: 'pageSize', tipo: 'number', descricao: 'Itens por pagina (default 10)' },
              { prop: 'loading', tipo: 'boolean', descricao: 'Exibe skeleton de carregamento' },
              { prop: 'serverSidePagination', tipo: 'boolean', descricao: 'Ativa paginacao server-side' },
            ]}
          />

          <Divider />

          <DataGrid<Produto>
            data={sortedData}
            columns={columns}
            getRowId={(r) => r.id}
            selectable
            actions={actions}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={(field, dir) => {
              setSortField(field);
              setSortDirection(dir);
            }}
          />

          <Typography variant="caption" color="text.secondary">
            Estado: sortField={sortField ?? '—'} | sortDirection={sortDirection ?? '—'} | pageSize={pageSize}
          </Typography>
        </CardContent>
      </Card>

      {/* ── CurrencyField ────────────────────────────────────── */}
      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            CurrencyField
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Campo de texto formatado como moeda brasileira (R$). Recebe e emite valor numerico.
          </Typography>

          <PropsTable
            rows={[
              { prop: 'value', tipo: 'number', descricao: 'Valor numerico' },
              { prop: 'onChange', tipo: '(value: number) => void', descricao: 'Callback ao alterar valor' },
              { prop: '...TextFieldProps', tipo: 'Omit<TextFieldProps, "value"|"onChange">', descricao: 'Props padroes do TextField' },
            ]}
          />

          <Divider />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CurrencyField
              label="Valor do produto"
              value={valor}
              onChange={setValor}
              sx={{ maxWidth: 280 }}
            />
            <Typography variant="body2" color="text.secondary">
              Valor numerico: <strong>{valor}</strong>
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* ── DateRangeField ───────────────────────────────────── */}
      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            DateRangeField
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Seletor de intervalo de datas com calendario popover e destaque visual do range.
          </Typography>

          <PropsTable
            rows={[
              { prop: 'value', tipo: 'DateRange', descricao: '{ start: Date | null, end: Date | null }' },
              { prop: 'onChange', tipo: '(value: DateRange) => void', descricao: 'Callback ao selecionar range' },
              { prop: '...TextFieldProps', tipo: 'Omit<TextFieldProps, "value"|"onChange">', descricao: 'Props padroes do TextField' },
            ]}
          />

          <Divider />

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <DateRangeField
                label="Periodo"
                value={range}
                onChange={setRange}
                sx={{ maxWidth: 300 }}
              />
              <Typography variant="body2" color="text.secondary">
                Inicio: <strong>{range.start?.toLocaleDateString('pt-BR') ?? '—'}</strong>
                {' | '}
                Fim: <strong>{range.end?.toLocaleDateString('pt-BR') ?? '—'}</strong>
              </Typography>
            </Box>
          </LocalizationProvider>
        </CardContent>
      </Card>

      {/* ── MuiDatePicker ────────────────────────────────────── */}
      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            MuiDatePicker
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Date picker com suporte a modo mes (MM/yyyy) e dia (dd/MM/yyyy). Valor controlado como string.
          </Typography>

          <PropsTable
            rows={[
              { prop: 'value', tipo: 'string', descricao: '"YYYY-MM" (month) ou "YYYY-MM-DD" (day)' },
              { prop: 'onChange', tipo: '(value: string) => void', descricao: 'Callback com valor string' },
              { prop: 'mode', tipo: "'month' | 'day'", descricao: 'Modo de selecao (default: month)' },
              { prop: 'placeholder', tipo: 'string', descricao: 'Placeholder do campo' },
              { prop: 'disabled', tipo: 'boolean', descricao: 'Desabilita o campo' },
            ]}
          />

          <Divider />

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MuiDatePicker
                  value={mes}
                  onChange={setMes}
                  mode="month"
                  placeholder="Selecione o mes"
                  sx={{ maxWidth: 240 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Valor (mes): <strong>{mes || '—'}</strong>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MuiDatePicker
                  value={dia}
                  onChange={setDia}
                  mode="day"
                  placeholder="Selecione o dia"
                  sx={{ maxWidth: 240 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Valor (dia): <strong>{dia || '—'}</strong>
                </Typography>
              </Box>
            </Box>
          </LocalizationProvider>
        </CardContent>
      </Card>
    </Box>
  );
}
