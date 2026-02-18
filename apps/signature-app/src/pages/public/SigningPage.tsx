import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
} from '@mui/material';
import { SigningIdentification } from '../../components/signing/SigningIdentification';
import { SigningOtp } from '../../components/signing/SigningOtp';
import { SigningSign } from '../../components/signing/SigningSign';
import { SigningSuccess } from '../../components/signing/SigningSuccess';
import type { SigningInfo } from '../../types';

const steps = ['Identificacao', 'Verificacao', 'Assinatura', 'Concluido'];

const SigningPage = () => {
  const { token } = useParams<{ token: string }>();
  const [activeStep, setActiveStep] = useState(0);
  const [signingInfo, setSigningInfo] = useState<SigningInfo | null>(null);
  const [documentId, setDocumentId] = useState<string>('');

  if (!token) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
        <Typography color="error">Link invalido</Typography>
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
      <Box sx={{ width: '100%', maxWidth: 480 }}>
        {/* Logo/Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <img src="/logo.svg" alt="Signature" style={{ width: 48, height: 48 }} />
          <Typography variant="h6" fontWeight={700} sx={{ mt: 1, color: '#0d9488' }}>
            Assinatura Digital
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Content */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            {activeStep === 0 && (
              <SigningIdentification
                token={token}
                onNext={(info) => {
                  setSigningInfo(info);
                  setActiveStep(1);
                }}
              />
            )}
            {activeStep === 1 && signingInfo && (
              <SigningOtp
                token={token}
                info={signingInfo}
                onNext={() => setActiveStep(2)}
              />
            )}
            {activeStep === 2 && signingInfo && (
              <SigningSign
                token={token}
                info={signingInfo}
                onNext={(docId) => {
                  setDocumentId(docId);
                  setActiveStep(3);
                }}
              />
            )}
            {activeStep === 3 && (
              <SigningSuccess documentId={documentId} />
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default SigningPage;
