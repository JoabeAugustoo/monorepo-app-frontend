import { Box, Typography, Stack } from '@mui/material';
import {
  Description as DocCreatedIcon,
  Draw as CompanySignedIcon,
  PersonAdd as SignerAddedIcon,
  Sms as OtpIcon,
  Verified as OtpVerifiedIcon,
  CheckCircle as SignerSignedIcon,
  TaskAlt as CompletedIcon,
  Cancel as CancelledIcon,
  Event as DefaultIcon,
} from '@mui/icons-material';
import { formatDateTime } from '@app/core';
import { EvidenceType, type EvidenceEvent } from '../../types';

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  [EvidenceType.DOCUMENT_CREATED]: { icon: <DocCreatedIcon sx={{ fontSize: 20, color: 'white' }} />, color: '#6366f1', label: 'Documento Criado' },
  [EvidenceType.DOCUMENT_UPLOADED]: { icon: <DocCreatedIcon sx={{ fontSize: 20, color: 'white' }} />, color: '#6366f1', label: 'Documento Enviado' },
  [EvidenceType.COMPANY_SIGNED]: { icon: <CompanySignedIcon sx={{ fontSize: 20, color: 'white' }} />, color: '#0d9488', label: 'Assinado pela Empresa' },
  [EvidenceType.SIGNED_BY_COMPANY]: { icon: <CompanySignedIcon sx={{ fontSize: 20, color: 'white' }} />, color: '#0d9488', label: 'Assinado pela Empresa' },
  [EvidenceType.SIGNER_ADDED]: { icon: <SignerAddedIcon sx={{ fontSize: 20, color: 'white' }} />, color: '#8b5cf6', label: 'Signatario Adicionado' },
  [EvidenceType.OTP_REQUESTED]: { icon: <OtpIcon sx={{ fontSize: 20, color: 'white' }} />, color: '#f59e0b', label: 'OTP Solicitado' },
  [EvidenceType.OTP_VERIFIED]: { icon: <OtpVerifiedIcon sx={{ fontSize: 20, color: 'white' }} />, color: '#3b82f6', label: 'OTP Verificado' },
  [EvidenceType.SIGNER_SIGNED]: { icon: <SignerSignedIcon sx={{ fontSize: 20, color: 'white' }} />, color: '#10b981', label: 'Signatario Assinou' },
  [EvidenceType.SIGNED_BY_SIGNER]: { icon: <SignerSignedIcon sx={{ fontSize: 20, color: 'white' }} />, color: '#10b981', label: 'Signatario Assinou' },
  [EvidenceType.DOCUMENT_COMPLETED]: { icon: <CompletedIcon sx={{ fontSize: 20, color: 'white' }} />, color: '#059669', label: 'Documento Concluido' },
  [EvidenceType.DOCUMENT_CANCELLED]: { icon: <CancelledIcon sx={{ fontSize: 20, color: 'white' }} />, color: '#ef4444', label: 'Documento Cancelado' },
};

const DEFAULT_CONFIG = { icon: <DefaultIcon sx={{ fontSize: 20, color: 'white' }} />, color: '#6b7280', label: 'Evento' };

interface EvidenceTimelineProps {
  evidences: EvidenceEvent[];
}

export function EvidenceTimeline({ evidences }: EvidenceTimelineProps) {
  if (!evidences?.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Nenhuma evidencia registrada.
      </Typography>
    );
  }

  return (
    <Box sx={{ position: 'relative', pl: 4 }}>
      {/* Vertical line */}
      <Box
        sx={{
          position: 'absolute',
          left: 15,
          top: 0,
          bottom: 0,
          width: 2,
          bgcolor: '#e5e7eb',
        }}
      />

      <Stack spacing={3}>
        {evidences.map((evidence, index) => {
          const config = TYPE_CONFIG[evidence.type] || DEFAULT_CONFIG;
          return (
            <Box key={evidence.id || index} sx={{ position: 'relative' }}>
              {/* Dot */}
              <Box
                sx={{
                  position: 'absolute',
                  left: -25,
                  top: 2,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: config.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 2px 8px ${config.color}40`,
                }}
              >
                {config.icon}
              </Box>

              {/* Content */}
              <Box sx={{ ml: 2 }}>
                <Typography variant="body2" fontWeight={600}>
                  {config.label}
                </Typography>
                {evidence.payload && Object.keys(evidence.payload).length > 0 && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {Object.entries(evidence.payload)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' | ')}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  {formatDateTime(evidence.createdAt)}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
