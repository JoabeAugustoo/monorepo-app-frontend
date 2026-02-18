import { useEffect, useState, useRef, useCallback } from 'react';
import {
  TextField, Box, MenuItem, Card, InputAdornment, Typography, IconButton,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import BusinessIcon from '@mui/icons-material/Business';
import AppsIcon from '@mui/icons-material/Apps';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'sonner';
import { FormDialog } from '@app/ui';
import { documentService, companyService, applicationService } from '../../services';
import type { Company, Application } from '../../types';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const uploadSchema = z.object({
  companyPublicId: z.string().min(1, 'Empresa obrigatoria'),
  applicationPublicId: z.string().optional(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

interface DocumentUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DocumentUploadDialog({ open, onClose, onSuccess }: DocumentUploadDialogProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { companyPublicId: '', applicationPublicId: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ companyPublicId: '', applicationPublicId: '' });
      setFile(null);
      companyService.findActive()
        .then((data) => setCompanies(data || []))
        .catch(() => {});
      applicationService.findActive()
        .then((data) => setApplications(data || []))
        .catch(() => {});
    }
  }, [open, reset]);

  const handleFile = useCallback((f: File | null) => {
    if (f && !f.name.match(/\.pdf$/i)) {
      toast.error('Selecione um arquivo PDF');
      return;
    }
    setFile(f);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0] || null;
    handleFile(droppedFile);
  }, [handleFile]);

  const onSubmit = async (data: UploadFormData) => {
    if (!file) {
      toast.error('Selecione um arquivo PDF');
      return;
    }
    try {
      await documentService.upload(data.companyPublicId, file, data.applicationPublicId || undefined);
      toast.success('Documento enviado com sucesso!');
      onSuccess();
    } catch (error) {
      console.error('Erro ao enviar documento:', error);
      toast.error('Erro ao enviar documento');
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      title=" "
      submitLabel={isSubmitting ? 'Enviando...' : 'Enviar'}
      loading={isSubmitting}
      disabled={!file}
      maxWidth="sm"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Gradient Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
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
            <DescriptionIcon sx={{ fontSize: 32, color: '#f59e0b' }} />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
              Upload de Documento
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
              Envie o documento PDF para assinatura
            </Typography>
          </Box>
        </Box>

        {/* Drag & Drop Zone / File Preview */}
        {!file ? (
          <Box
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
              border: isDragging ? '2px solid #f59e0b' : '2px dashed #f59e0b',
              borderRadius: 3,
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              bgcolor: isDragging ? 'rgba(245,158,11,0.08)' : 'transparent',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(245,158,11,0.04)',
                borderStyle: 'solid',
              },
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 48, color: '#f59e0b', opacity: 0.8 }} />
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mt: 1 }}>
              Arraste o arquivo PDF aqui
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              ou clique para selecionar
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".pdf"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />
          </Box>
        ) : (
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              borderColor: 'divider',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <PictureAsPdfIcon sx={{ color: 'white', fontSize: 22 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {formatFileSize(file.size)}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setFile(null)} sx={{ color: 'text.secondary' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Card>
        )}

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
            name="companyPublicId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                label="Empresa"
                required
                error={!!errors.companyPublicId}
                helperText={errors.companyPublicId?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              >
                {companies.map((c) => (
                  <MenuItem key={c.publicId} value={c.publicId}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Controller
            name="applicationPublicId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                label="Aplicacao"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AppsIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="">Nenhuma</MenuItem>
                {applications.map((a) => (
                  <MenuItem key={a.publicId} value={a.publicId}>
                    {a.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Card>
      </Box>
    </FormDialog>
  );
}
