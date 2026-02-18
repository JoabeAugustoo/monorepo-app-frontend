import { useEffect } from 'react';
import { TextField, Box, Card, InputAdornment, Typography, MenuItem } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import CategoryIcon from '@mui/icons-material/Category';
import { toast } from 'sonner';
import { FormDialog } from '@app/ui';
import { signerService } from '../../services';
import { DocumentType } from '../../types';
import { maskCpf } from '../../utils/format';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const signerSchema = z.object({
  name: z.string().min(1, 'Nome obrigatorio'),
  documentType: z.nativeEnum(DocumentType),
  document: z.string().min(1, 'Documento obrigatorio'),
  email: z.string().email('Email invalido'),
  phone: z.string().optional(),
  signOrder: z.coerce.number().min(0).optional(),
});

type SignerFormData = z.infer<typeof signerSchema>;

interface AddSignerDialogProps {
  open: boolean;
  documentPublicId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ACCENT = '#0d9488';

export function AddSignerDialog({ open, documentPublicId, onClose, onSuccess }: AddSignerDialogProps) {
  const { control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<SignerFormData>({
    resolver: zodResolver(signerSchema),
    defaultValues: {
      name: '',
      documentType: DocumentType.CPF,
      document: '',
      email: '',
      phone: '',
      signOrder: 0,
    },
  });

  const documentType = watch('documentType');

  useEffect(() => {
    if (open) {
      reset({
        name: '',
        documentType: DocumentType.CPF,
        document: '',
        email: '',
        phone: '',
        signOrder: 0,
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: SignerFormData) => {
    try {
      await signerService.create({
        documentPublicId,
        name: data.name,
        documentType: data.documentType,
        document: data.document.replace(/\D/g, ''),
        email: data.email,
        phone: data.phone || undefined,
        signOrder: data.signOrder,
      });
      toast.success('Signatario adicionado com sucesso!');
      onSuccess();
    } catch (error) {
      console.error('Erro ao adicionar signatario:', error);
      toast.error('Erro ao adicionar signatario');
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      title=" "
      submitLabel={isSubmitting ? 'Adicionando...' : 'Adicionar'}
      loading={isSubmitting}
      maxWidth="sm"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Gradient Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
            borderRadius: 3,
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            }}
          >
            <PersonAddIcon sx={{ fontSize: 32, color: ACCENT }} />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
              Adicionar Signatario
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
              Preencha os dados do signatario do documento
            </Typography>
          </Box>
        </Box>

        {/* Form Fields Card */}
        <Card
          variant="outlined"
          sx={{
            bgcolor: '#f8fafc',
            borderRadius: 2,
            borderColor: 'divider',
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Nome"
                required
                error={!!errors.name}
                helperText={errors.name?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: ACCENT, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <Controller
            name="documentType"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                label="Tipo de Documento"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CategoryIcon sx={{ color: ACCENT, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value={DocumentType.CPF}>CPF</MenuItem>
                <MenuItem value={DocumentType.CNPJ}>CNPJ</MenuItem>
                <MenuItem value={DocumentType.PASSPORT}>Passaporte</MenuItem>
              </TextField>
            )}
          />
          <Controller
            name="document"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Numero do Documento"
                required
                error={!!errors.document}
                helperText={errors.document?.message}
                onChange={(e) => {
                  const val = documentType === DocumentType.CPF ? maskCpf(e.target.value) : e.target.value;
                  field.onChange(val);
                  setValue('document', val);
                }}
                inputProps={{ maxLength: documentType === DocumentType.CPF ? 14 : 30 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon sx={{ color: ACCENT, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Email"
                type="email"
                required
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: ACCENT, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Telefone"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: ACCENT, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <Controller
            name="signOrder"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Ordem de Assinatura"
                type="number"
                inputProps={{ min: 0 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FormatListNumberedIcon sx={{ color: ACCENT, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </Card>
      </Box>
    </FormDialog>
  );
}
