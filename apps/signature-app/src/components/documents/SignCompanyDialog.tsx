import { useEffect, useState } from 'react';
import { TextField, Box, MenuItem } from '@mui/material';
import DrawIcon from '@mui/icons-material/Draw';
import { toast } from 'sonner';
import { FormDialog } from '@app/ui';
import { certificateService, documentService } from '../../services';
import type { Certificate } from '../../types';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const signSchema = z.object({
  certificatePublicId: z.string().min(1, 'Certificado obrigatorio'),
  password: z.string().min(1, 'Senha obrigatoria'),
});

type SignFormData = z.infer<typeof signSchema>;

interface SignCompanyDialogProps {
  open: boolean;
  documentId: string;
  companyPublicId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function SignCompanyDialog({ open, documentId, companyPublicId, onClose, onSuccess }: SignCompanyDialogProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SignFormData>({
    resolver: zodResolver(signSchema),
    defaultValues: { certificatePublicId: '', password: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ certificatePublicId: '', password: '' });
      certificateService.search({
        skip: 0,
        take: 100,
        where: { companyPublicId },
        sort: [{ field: 'name', direction: 'ASC' }],
      })
        .then((res) => setCertificates(res.data || []))
        .catch(() => {});
    }
  }, [open, companyPublicId, reset]);

  const onSubmit = async (data: SignFormData) => {
    try {
      await documentService.signWithCompany(documentId, {
        certificatePublicId: data.certificatePublicId,
        password: data.password,
      });
      toast.success('Assinatura pela empresa solicitada com sucesso!');
      onSuccess();
    } catch (error) {
      console.error('Erro ao assinar documento:', error);
      toast.error('Erro ao assinar documento. Verifique a senha do certificado.');
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      title="Assinar pela Empresa"
      titleIcon={<DrawIcon sx={{ color: '#0d9488' }} />}
      submitLabel={isSubmitting ? 'Assinando...' : 'Assinar'}
      loading={isSubmitting}
      maxWidth="sm"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <Controller
          name="certificatePublicId"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              fullWidth
              label="Certificado"
              required
              error={!!errors.certificatePublicId}
              helperText={errors.certificatePublicId?.message}
            >
              {certificates.map((cert) => (
                <MenuItem key={cert.publicId} value={cert.publicId}>
                  {cert.name} ({cert.subjectCn})
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Senha do Certificado"
              type="password"
              required
              error={!!errors.password}
              helperText={errors.password?.message}
            />
          )}
        />
      </Box>
    </FormDialog>
  );
}
