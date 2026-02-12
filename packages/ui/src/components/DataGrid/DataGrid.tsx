import { useState, useMemo } from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableSortLabel,
  Checkbox,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  Pagination,
  Paper,
  Skeleton,
  Box,
  Typography,
} from '@mui/material';
import type { DataGridProps, SortDirection } from './DataGrid.types';

export function DataGrid<T>(props: DataGridProps<T>) {
  const {
    data = [],
    columns = [],
    getRowId,
    pageSize = 10,
    loading = false,
    selectable = false,
    emptyMessage = 'Nenhum item encontrado',
    headerActions,
    actions,
    onSelectionChange,
    onPageSizeChange,
    sortField = null,
    sortDirection = null,
    onSortChange,
    sx,
  } = props;

  const serverSidePagination = props.serverSidePagination === true;

  const [localPage, setLocalPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  const page = serverSidePagination ? props.page : localPage;
  const totalRows = serverSidePagination ? props.totalRows : data.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  const currentData = useMemo(() => {
    if (serverSidePagination) return data;
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize, serverSidePagination]);

  const colSpan = columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0);

  // --- Selection ---
  const allCurrentIds = useMemo(
    () => currentData.map((row) => getRowId(row)),
    [currentData, getRowId],
  );
  const isAllSelected = allCurrentIds.length > 0 && allCurrentIds.every((id) => selectedIds.has(id));
  const isIndeterminate = !isAllSelected && allCurrentIds.some((id) => selectedIds.has(id));

  const updateSelection = (next: Set<string | number>) => {
    setSelectedIds(next);
    onSelectionChange?.(Array.from(next));
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      updateSelection(new Set());
    } else {
      updateSelection(new Set(allCurrentIds));
    }
  };

  const handleSelectRow = (id: string | number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    updateSelection(next);
  };

  // --- Pagination ---
  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    if (serverSidePagination) {
      props.onPageChange(newPage);
    } else {
      setLocalPage(newPage);
    }
  };

  const handlePageSizeChange = (value: number) => {
    onPageSizeChange?.(value);
    if (!serverSidePagination) {
      setLocalPage(1);
    }
  };

  // --- Sort ---
  const handleSort = (field: string) => {
    if (!onSortChange) return;
    let direction: SortDirection = 'asc';
    if (sortField === field && sortDirection === 'asc') {
      direction = 'desc';
    }
    onSortChange(field, direction);
  };

  // --- Pagination info ---
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalRows);

  return (
    <Paper
      sx={{
        overflow: 'hidden',
        borderRadius: 1,
        boxShadow: 'none',
        border: '1px solid',
        borderColor: 'divider',
        ...sx,
      }}
    >
      {/* Header */}
      {(headerActions || selectable) && (
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? theme.palette.background.paper
                : '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            {totalRows} {totalRows === 1 ? 'item' : 'itens'}
            {selectedIds.size > 0 &&
              ` (${selectedIds.size} selecionado${selectedIds.size > 1 ? 's' : ''})`}
          </Typography>
          {headerActions && <Box>{headerActions}</Box>}
        </Box>
      )}

      {/* Table */}
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead
            sx={{
              bgcolor: (theme) =>
                theme.palette.mode === 'dark'
                  ? theme.palette.background.paper
                  : '#f9fafb',
              '& .MuiTableCell-head': {
                fontWeight: 600,
                color: (theme) =>
                  theme.palette.mode === 'dark'
                    ? theme.palette.text.primary
                    : '#374151',
                fontSize: '0.875rem',
                borderBottom: '2px solid',
                borderColor: 'divider',
              },
            }}
          >
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              {columns.map((col, idx) => {
                const isSortable = col.sortable !== false && !!onSortChange;
                const isActive = sortField === col.key;
                return (
                  <TableCell
                    key={idx}
                    style={col.headerStyle}
                    sortDirection={isActive ? (sortDirection as 'asc' | 'desc') || false : false}
                  >
                    {isSortable ? (
                      <TableSortLabel
                        active={isActive}
                        direction={isActive ? (sortDirection ?? 'asc') : 'asc'}
                        onClick={() => handleSort(col.key as string)}
                      >
                        {col.header}
                      </TableSortLabel>
                    ) : (
                      col.header
                    )}
                  </TableCell>
                );
              })}
              {actions && (
                <TableCell align="center" sx={{ width: 120 }}>
                  Ações
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                <TableRow key={i}>
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Skeleton variant="rectangular" width={20} height={20} />
                    </TableCell>
                  )}
                  {columns.map((_, ci) => (
                    <TableCell key={ci}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell>
                      <Skeleton variant="text" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : currentData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((row) => {
                const rowId = getRowId(row);
                return (
                  <TableRow
                    key={rowId}
                    hover
                    sx={{
                      transition: 'background-color 0.15s',
                    }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.has(rowId)}
                          onChange={() => handleSelectRow(rowId)}
                        />
                      </TableCell>
                    )}
                    {columns.map((col, ci) => (
                      <TableCell
                        key={ci}
                        style={col.cellStyle}
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.875rem',
                          borderBottom: '1px solid',
                          borderColor: (theme) =>
                            theme.palette.mode === 'dark'
                              ? theme.palette.divider
                              : '#f3f4f6',
                        }}
                      >
                        {col.render
                          ? col.render(row, currentData.indexOf(row))
                          : (row[col.key as keyof T] as React.ReactNode)}
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell
                        align="center"
                        sx={{
                          borderBottom: '1px solid',
                          borderColor: (theme) =>
                            theme.palette.mode === 'dark'
                              ? theme.palette.divider
                              : '#f3f4f6',
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          {actions.map((action, ai) => {
                            if (action.hidden?.(row)) return null;
                            return (
                              <Tooltip key={ai} title={action.tooltip}>
                                <span>
                                  <IconButton
                                    size="small"
                                    disabled={action.disabled?.(row)}
                                    onClick={() => action.onClick(row)}
                                    color={(action.color as any) ?? 'default'}
                                  >
                                    {action.icon}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            );
                          })}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Box>

      {/* Pagination Footer */}
      {totalRows > 0 && (
        <Box
          sx={{
            px: 3,
            py: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
            {start}–{end} de {totalRows}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Select
              size="small"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              variant="standard"
              disableUnderline
              sx={{
                fontSize: '0.8rem',
                color: 'text.secondary',
                '& .MuiSelect-select': {
                  py: 0.25,
                  px: 0.5,
                  pr: '20px !important',
                },
                '& .MuiSvgIcon-root': { fontSize: '1rem', color: 'text.secondary' },
              }}
            >
              <MenuItem value={10}>10 / pág</MenuItem>
              <MenuItem value={25}>25 / pág</MenuItem>
              <MenuItem value={50}>50 / pág</MenuItem>
              <MenuItem value={100}>100 / pág</MenuItem>
            </Select>

            {totalPages > 1 && (
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                size="small"
                shape="rounded"
                sx={{
                  '& .MuiPaginationItem-root': {
                    fontSize: '0.8rem',
                    minWidth: 28,
                    height: 28,
                    color: 'text.secondary',
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: '#fff',
                      fontWeight: 600,
                      '&:hover': { bgcolor: 'primary.dark' },
                    },
                  },
                }}
              />
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
