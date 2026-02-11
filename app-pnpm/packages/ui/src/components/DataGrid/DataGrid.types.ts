import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material';

export interface DataGridColumn<T> {
  key: string & keyof T | (string & {});
  header: ReactNode;
  sortable?: boolean;
  headerStyle?: React.CSSProperties;
  cellStyle?: React.CSSProperties;
  render?: (row: T, index: number) => ReactNode;
}

export interface DataGridAction<T> {
  icon: ReactNode;
  tooltip: string;
  onClick: (row: T) => void;
  hidden?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  color?: string;
}

export type SortDirection = 'asc' | 'desc';

interface DataGridBaseProps<T> {
  data: T[];
  columns: DataGridColumn<T>[];
  getRowId: (row: T) => string | number;
  pageSize?: number;
  loading?: boolean;
  selectable?: boolean;
  emptyMessage?: string;
  headerActions?: ReactNode;
  actions?: DataGridAction<T>[];
  onSelectionChange?: (ids: (string | number)[]) => void;
  onPageSizeChange?: (size: number) => void;
  sortField?: string | null;
  sortDirection?: SortDirection | null;
  onSortChange?: (field: string, direction: SortDirection) => void;
  sx?: SxProps<Theme>;
}

export interface DataGridLocalPaginationProps<T> extends DataGridBaseProps<T> {
  serverSidePagination?: false;
  page?: never;
  totalRows?: never;
  onPageChange?: never;
}

export interface DataGridServerPaginationProps<T> extends DataGridBaseProps<T> {
  serverSidePagination: true;
  page: number;
  totalRows: number;
  onPageChange: (page: number) => void;
}

export type DataGridProps<T> =
  | DataGridLocalPaginationProps<T>
  | DataGridServerPaginationProps<T>;
