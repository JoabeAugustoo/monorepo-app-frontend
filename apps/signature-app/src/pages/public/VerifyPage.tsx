import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Alert,
} from '@mui/material';
import { formatDateTime } from '@app/core';
import { verifyService } from '../../services';
import { VerificationSeal } from '../../components/verify/VerificationSeal';
import { EvidenceTimeline } from '../../components/verify/EvidenceTimeline';
import { DocumentStatusChip } from '../../components/shared/DocumentStatusChip';
import type { VerificationResponse, DocumentStatus } from '../../types';

const VerifyPage = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;
    const verify = async () => {
      try {
        const data = await verifyService.verify(documentId);
        setResult(data);
      } catch {
        setError('Documento nao encontrado ou erro na verificacao.');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [documentId]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f7fa',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        py: 4,
        px: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 600 }}>
        {/* Logo/Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <img src="/logo.svg" alt="Signature" style={{ width: 48, height: 48 }} />
          <Typography variant="h6" fontWeight={700} sx={{ mt: 1, color: '#0d9488' }}>
            Verificacao de Documento
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Stack spacing={3}>
            {/* Seal */}
            <Card>
              <CardContent>
                <VerificationSeal
                  chainValid={result.chainValid}
                />
              </CardContent>
            </Card>

            {/* Document Info */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Informacoes do Documento
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>Arquivo:</Typography>
                    <Typography variant="body2" fontWeight={500}>{result.fileName}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>Empresa:</Typography>
                    <Typography variant="body2">{result.companyName}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>CNPJ:</Typography>
                    <Typography variant="body2">{result.companyCnpj}</Typography>
                  </Box>
                  {result.applicationName && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>Aplicacao:</Typography>
                      <Typography variant="body2">{result.applicationName}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>Status:</Typography>
                    <DocumentStatusChip status={result.status as DocumentStatus} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>Criado em:</Typography>
                    <Typography variant="body2">{formatDateTime(result.createdAt)}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Hashes */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Hashes de Integridade
                </Typography>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Hash Original</Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        wordBreak: 'break-all',
                        bgcolor: '#f3f4f6',
                        p: 1,
                        borderRadius: 1,
                      }}
                    >
                      {result.originalHash}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Hash Atual</Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        wordBreak: 'break-all',
                        bgcolor: result.originalHash === result.currentHash ? '#f0fdf4' : '#fef2f2',
                        p: 1,
                        borderRadius: 1,
                      }}
                    >
                      {result.currentHash}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Signatures */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Assinaturas
                </Typography>
                {result.signatures.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma assinatura registrada.
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {result.signatures.map((sig) => (
                      <Box
                        key={sig.publicId}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 1.5,
                          bgcolor: '#f9fafb',
                          borderRadius: 1,
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {sig.type === 'COMPANY' ? 'Assinatura da Empresa (PAdES)' : 'Assinatura Eletronica'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {formatDateTime(sig.signedAt)}
                          </Typography>
                          {sig.ipAddress && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                              IP: {sig.ipAddress}
                            </Typography>
                          )}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '9999px',
                            bgcolor: '#dcfce7',
                            color: '#166534',
                            fontWeight: 600,
                          }}
                        >
                          Assinado
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>

            {/* Evidence Chain */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Cadeia de Evidencias
                </Typography>
                <EvidenceTimeline evidences={result.evidenceChain} />
              </CardContent>
            </Card>
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default VerifyPage;
