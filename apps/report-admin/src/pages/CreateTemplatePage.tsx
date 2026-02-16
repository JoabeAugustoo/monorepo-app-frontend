import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  MenuItem as MuiMenuItem,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { templateService, applicationService } from '../services';
import type { TemplateEngine, TemplateStatus, DocumentType, Application } from '../types';

const ENGINE_OPTIONS: { value: TemplateEngine; label: string }[] = [
  { value: 'HANDLEBARS', label: 'Handlebars' },
  { value: 'HTML', label: 'HTML' },
];

const STATUS_OPTIONS: { value: TemplateStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'PUBLISHED', label: 'Publicado' },
  { value: 'ARCHIVED', label: 'Arquivado' },
];

const DOC_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'SEND_ONLY', label: 'Envio Simples' },
  { value: 'SIGNATURE_REQUIRED', label: 'Requer Assinatura' },
];

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const CreateTemplatePage = () => {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [apps, setApps] = useState<Application[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    engine: 'HANDLEBARS' as TemplateEngine,
    status: 'DRAFT' as TemplateStatus,
    documentType: 'SEND_ONLY' as DocumentType,
    category: '',
    applicationId: '',
  });

  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);

  useEffect(() => {
    applicationService.getActive()
      .then(setApps)
      .catch(() => {});
  }, []);

  const handleNameChange = (value: string) => {
    const newState = { ...formData, name: value };
    if (!keyManuallyEdited) {
      newState.key = slugify(value);
    }
    setFormData(newState);
  };

  const handleKeyChange = (value: string) => {
    setKeyManuallyEdited(true);
    setFormData({ ...formData, key: value });
  };

  const selectedApp = apps.find((a) => a.publicId === formData.applicationId);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.key.trim()) {
      toast.error('Preencha os campos obrigatórios (Nome e Chave).');
      return;
    }
    if (!selectedApp) {
      toast.error('Selecione uma aplicação.');
      return;
    }

    setSaving(true);
    try {
      const created = await templateService.create({
        name: formData.name.trim(),
        key: formData.key.trim(),
        description: formData.description.trim() || undefined,
        engine: formData.engine,
        status: formData.status,
        documentType: formData.documentType,
        category: formData.category.trim() || undefined,
        applicationId: selectedApp.publicId,
        applicationName: selectedApp.name,
        applicationCode: selectedApp.code,
      });
      toast.success('Template criado com sucesso!');
      navigate(`/templates/${created.publicId}`);
    } catch {
      // error handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/templates')}>Voltar</Button>
        <Typography variant="h5" fontWeight={700}>Novo Template</Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              select
              label="Aplicação *"
              value={formData.applicationId}
              onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
            >
              <MuiMenuItem value="" disabled>Selecione uma aplicação</MuiMenuItem>
              {apps.map((app) => (
                <MuiMenuItem key={app.publicId} value={app.publicId}>{app.name} ({app.code})</MuiMenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Nome *"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
              <TextField
                fullWidth
                label="Chave *"
                value={formData.key}
                onChange={(e) => handleKeyChange(e.target.value)}
                helperText="Identificador único (slug)"
                slotProps={{ input: { sx: { fontFamily: 'monospace' } } }}
              />
            </Box>

            <TextField
              fullWidth
              label="Descrição"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                select
                label="Engine *"
                value={formData.engine}
                onChange={(e) => setFormData({ ...formData, engine: e.target.value as TemplateEngine })}
              >
                {ENGINE_OPTIONS.map((opt) => (
                  <MuiMenuItem key={opt.value} value={opt.value}>{opt.label}</MuiMenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                select
                label="Tipo de Documento"
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value as DocumentType })}
              >
                {DOC_TYPE_OPTIONS.map((opt) => (
                  <MuiMenuItem key={opt.value} value={opt.value}>{opt.label}</MuiMenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TemplateStatus })}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <MuiMenuItem key={opt.value} value={opt.value}>{opt.label}</MuiMenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Categoria"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                helperText="Ex: Cirurgia, Vacinação, Consulta"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
        >
          {saving ? 'Salvando...' : 'Criar Template'}
        </Button>
      </Box>
    </Box>
  );
};

export default CreateTemplatePage;
