export interface StatusChipProps {
  active: boolean | null | undefined;
  activeLabel?: string;
  inactiveLabel?: string;
  unknownLabel?: string;
}

export const StatusChip = ({
  active,
  activeLabel = 'Ativo',
  inactiveLabel = 'Inativo',
  unknownLabel = 'N/A',
}: StatusChipProps) => {
  const isActive = active === true;
  const isInactive = active === false;

  return (
    <span
      style={{
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: isActive ? '#dcfce7' : isInactive ? '#fee2e2' : '#f3f4f6',
        color: isActive ? '#166534' : isInactive ? '#dc2626' : '#6b7280',
      }}
    >
      {isActive ? activeLabel : isInactive ? inactiveLabel : unknownLabel}
    </span>
  );
};
