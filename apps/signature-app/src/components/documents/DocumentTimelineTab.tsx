import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Chip } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import ErrorIcon from '@mui/icons-material/Error';
import { documentService } from '../../services';
import { EvidenceTimeline } from '../verify/EvidenceTimeline';
import type { EvidenceEvent } from '../../types';

interface DocumentTimelineTabProps {
  documentPublicId: string;
}

export function DocumentTimelineTab({ documentPublicId }: DocumentTimelineTabProps) {
  const [events, setEvents] = useState<EvidenceEvent[]>([]);
  const [chainValid, setChainValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      const data = await documentService.getTimeline(documentPublicId);
      setEvents(data.events || []);
      setChainValid(data.chainValid);
    } catch (error) {
      console.error('Erro ao carregar timeline:', error);
      setEvents([]);
      setChainValid(null);
    } finally {
      setLoading(false);
    }
  }, [documentPublicId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box>
      {chainValid !== null && (
        <Box sx={{ mb: 3 }}>
          <Chip
            icon={chainValid ? <VerifiedIcon /> : <ErrorIcon />}
            label={chainValid ? 'Cadeia de evidencias valida' : 'Cadeia de evidencias invalida'}
            color={chainValid ? 'success' : 'error'}
            variant="outlined"
          />
        </Box>
      )}
      <EvidenceTimeline evidences={events} />
    </Box>
  );
}
