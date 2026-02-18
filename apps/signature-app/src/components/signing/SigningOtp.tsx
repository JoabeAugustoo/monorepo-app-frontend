import { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  CircularProgress,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import { signingService } from '../../services';
import { OtpChannel, type SigningInfo } from '../../types';

interface SigningOtpProps {
  token: string;
  info: SigningInfo;
  onNext: () => void;
}

export function SigningOtp({ token, info, onNext }: SigningOtpProps) {
  const [channel, setChannel] = useState<OtpChannel>(OtpChannel.EMAIL);
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = async () => {
    try {
      setSending(true);
      setError(null);
      await signingService.requestOtp(token, { channel });
      setOtpSent(true);
    } catch {
      setError('Erro ao enviar codigo. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return;

    if (digits.length > 1) {
      const newCode = [...code];
      for (let i = 0; i < digits.length && index + i < 6; i++) {
        newCode[index + i] = digits[i];
      }
      setCode(newCode);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = digits;
    setCode(newCode);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!digits) return;

    const newCode = [...code];
    for (let i = 0; i < digits.length; i++) {
      newCode[i] = digits[i];
    }
    setCode(newCode);
    inputRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = code.join('');
    if (otpCode.length !== 6) return;

    try {
      setVerifying(true);
      setError(null);
      await signingService.verifyOtp(token, { code: otpCode });
      onNext();
    } catch {
      setError('Codigo invalido. Tente novamente.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  if (!otpSent) {
    return (
      <Stack spacing={3}>
        <Typography variant="body1" textAlign="center">
          Escolha como deseja receber o codigo de verificacao:
        </Typography>

        <ToggleButtonGroup
          value={channel}
          exclusive
          onChange={(_, v) => v && setChannel(v)}
          fullWidth
          sx={{ '& .MuiToggleButton-root': { py: 2 } }}
        >
          <ToggleButton value={OtpChannel.EMAIL}>
            <Stack alignItems="center" spacing={0.5}>
              <EmailIcon />
              <Typography variant="body2">Email</Typography>
              <Typography variant="caption" color="text.secondary">
                {info.signerEmail}
              </Typography>
            </Stack>
          </ToggleButton>
          {info.signerPhone && (
            <ToggleButton value={OtpChannel.SMS}>
              <Stack alignItems="center" spacing={0.5}>
                <SmsIcon />
                <Typography variant="body2">SMS</Typography>
                <Typography variant="caption" color="text.secondary">
                  {info.signerPhone}
                </Typography>
              </Stack>
            </ToggleButton>
          )}
        </ToggleButtonGroup>

        {error && <Alert severity="error">{error}</Alert>}

        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleSendOtp}
          disabled={sending}
          sx={{ py: 1.5 }}
        >
          {sending ? <CircularProgress size={24} /> : 'Enviar Codigo'}
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Typography variant="body1" textAlign="center">
        Digite o codigo de 6 digitos enviado para{' '}
        <strong>{channel === OtpChannel.EMAIL ? info.signerEmail : info.signerPhone}</strong>
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
        {code.map((digit, index) => (
          <TextField
            key={index}
            value={digit}
            onChange={(e) => handleCodeChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            inputRef={(el) => { inputRefs.current[index] = el; }}
            inputProps={{
              maxLength: 6,
              style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, padding: '12px 0' },
              inputMode: 'numeric',
            }}
            sx={{ width: 48 }}
            variant="outlined"
          />
        ))}
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={handleVerifyOtp}
        disabled={verifying || code.join('').length !== 6}
        sx={{ py: 1.5 }}
      >
        {verifying ? <CircularProgress size={24} /> : 'Verificar Codigo'}
      </Button>

      <Button variant="text" size="small" onClick={() => { setOtpSent(false); setCode(['', '', '', '', '', '']); setError(null); }}>
        Reenviar codigo
      </Button>
    </Stack>
  );
}
