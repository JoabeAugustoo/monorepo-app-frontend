import { SignerStatus } from '../../types';

const STATUS_CONFIG: Record<SignerStatus, { label: string; bg: string; color: string }> = {
  [SignerStatus.PENDING]: { label: 'Pendente', bg: '#fef3c7', color: '#92400e' },
  [SignerStatus.OTP_SENT]: { label: 'OTP Enviado', bg: '#e0e7ff', color: '#3730a3' },
  [SignerStatus.OTP_VERIFIED]: { label: 'OTP Verificado', bg: '#dbeafe', color: '#1e40af' },
  [SignerStatus.SIGNED]: { label: 'Assinado', bg: '#dcfce7', color: '#166534' },
  [SignerStatus.REJECTED]: { label: 'Rejeitado', bg: '#fee2e2', color: '#991b1b' },
  [SignerStatus.EXPIRED]: { label: 'Expirado', bg: '#f3f4f6', color: '#6b7280' },
};

interface SignerStatusChipProps {
  status: SignerStatus;
}

export const SignerStatusChip = ({ status }: SignerStatusChipProps) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG[SignerStatus.PENDING];
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
