import { DocumentStatus } from '../../types';

const STATUS_CONFIG: Record<DocumentStatus, { label: string; bg: string; color: string }> = {
  [DocumentStatus.PENDING]: { label: 'Pendente', bg: '#fef3c7', color: '#92400e' },
  [DocumentStatus.SIGNING]: { label: 'Em Assinatura', bg: '#dbeafe', color: '#1e40af' },
  [DocumentStatus.COMPLETED]: { label: 'Concluido', bg: '#dcfce7', color: '#166534' },
  [DocumentStatus.CANCELLED]: { label: 'Cancelado', bg: '#fee2e2', color: '#991b1b' },
  [DocumentStatus.EXPIRED]: { label: 'Expirado', bg: '#f3f4f6', color: '#6b7280' },
};

interface DocumentStatusChipProps {
  status: DocumentStatus;
}

export const DocumentStatusChip = ({ status }: DocumentStatusChipProps) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG[DocumentStatus.PENDING];
  return (
    <span
      style={{
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  );
};
