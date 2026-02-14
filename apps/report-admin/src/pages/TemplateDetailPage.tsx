import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid2 as Grid,
  Typography,
  CircularProgress,
  LinearProgress,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem as MuiMenuItem,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  CloudUpload as UploadIcon,
  CheckCircle as ActivateIcon,
  Close as CloseIcon,
  PowerSettingsNew as ToggleIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDate, formatDateTime } from '@app/core';
import { ConfirmDialog } from '@app/ui';
import { templateService } from '../services';
import type { Template, TemplateVersion, TemplateStatus, TemplateEngine, TemplateDto } from '../types';

const STATUS_CONFIG: Record<TemplateStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Rascunho', color: '#F59E0B' },
  PUBLISHED: { label: 'Publicado', color: '#22C55E' },
  ARCHIVED: { label: 'Arquivado', color: '#BDBDBD' },
};

const ENGINE_OPTIONS: { value: TemplateEngine; label: string }[] = [
  { value: 'HANDLEBARS', label: 'Handlebars' },
  { value: 'HTML', label: 'HTML' },
];

const STATUS_OPTIONS: { value: TemplateStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'PUBLISHED', label: 'Publicado' },
  { value: 'ARCHIVED', label: 'Arquivado' },
];

const TemplateDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [template, setTemplate] = useState<Template | null>(null);
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<TemplateDto>>({});

  // Upload version
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Confirm actions
  const [activateVersionTarget, setActivateVersionTarget] = useState<TemplateVersion | null>(null);
  const [toggleActiveConfirm, setToggleActiveConfirm] = useState(false);

  const fetchData = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      templateService.getById(id),
      templateService.getVersions(id),
    ])
      .then(([tmpl, vers]) => {
        setTemplate(tmpl);
        setVersions(vers);
      })
      .catch(() => toast.error('Erro ao carregar template'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleEdit = () => {
    if (!template) return;
    setEditData({
      key: template.key,
      name: template.name,
      description: template.description || '',
      engine: template.engine,
      status: template.status,
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!id || !editData.key || !editData.name) return;
    setActionLoading(true);
    try {
      const updated = await templateService.update(id, editData as TemplateDto);
      setTemplate(updated);
      setEditOpen(false);
      toast.success('Template atualizado!');
    } catch {
      // error handled by interceptor
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!id || !template) return;
    setActionLoading(true);
    try {
      const updated = template.active
        ? await templateService.deactivate(id)
        : await templateService.activate(id);
      setTemplate(updated);
      setToggleActiveConfirm(false);
      toast.success(template.active ? 'Template desativado!' : 'Template ativado!');
    } catch {
      // error handled by interceptor
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadVersion = async () => {
    if (!id || !uploadFile) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      await templateService.uploadVersion(id, uploadFile, setUploadProgress);
      toast.success('Nova versão enviada!');
      setUploadOpen(false);
      setUploadFile(null);
      setUploadProgress(0);
      fetchData();
    } catch {
      // error handled by interceptor
    } finally {
      setUploading(false);
    }
  };

  const handleActivateVersion = async () => {
    if (!id || !activateVersionTarget?.publicId) return;
    setActionLoading(true);
    try {
      await templateService.activateVersion(id, activateVersionTarget.publicId);
      toast.success(`Versão ${activateVersionTarget.version} ativada!`);
      setActivateVersionTarget(null);
      fetchData();
    } catch {
      // error handled by interceptor
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (!template) {
    return <Typography>Template não encontrado.</Typography>;
  }

  const statusConfig = STATUS_CONFIG[template.status];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/templates')}>Voltar</Button>
          <Typography variant="h5" fontWeight={700}>{template.name}</Typography>
          {statusConfig && (
            <Chip
              label={statusConfig.label}
              sx={{ backgroundColor: statusConfig.color + '14', color: statusConfig.color, fontWeight: 600 }}
            />
          )}
          <Chip
            label={template.active ? 'Ativo' : 'Inativo'}
            size="small"
            sx={{
              backgroundColor: template.active ? '#22C55E14' : '#EF444414',
              color: template.active ? '#22C55E' : '#EF4444',
              fontWeight: 600,
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color={template.active ? 'error' : 'success'}
            startIcon={<ToggleIcon />}
            onClick={() => setToggleActiveConfirm(true)}
          >
            {template.active ? 'Desativar' : 'Ativar'}
          </Button>
          <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit}>
            Editar
          </Button>
          <Button variant="contained" startIcon={<UploadIcon />} onClick={() => setUploadOpen(true)}>
            Nova Versão
          </Button>
        </Box>
      </Box>

      {/* Template info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">Nome</Typography>
              <Typography fontWeight={500}>{template.name}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">Chave</Typography>
              <Typography sx={{ fontFamily: 'monospace' }}>{template.key}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">Engine</Typography>
              <Typography>{ENGINE_OPTIONS.find(e => e.value === template.engine)?.label || template.engine}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary">Versão Ativa</Typography>
              <Typography>{template.activeVersion != null ? `v${template.activeVersion}` : '-'}</Typography>
            </Grid>
            {template.description && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary">Descrição</Typography>
                <Typography>{template.description}</Typography>
              </Grid>
            )}
            {template.tenantId && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">Tenant</Typography>
                <Typography sx={{ fontFamily: 'monospace' }}>{template.tenantId}</Typography>
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">Criado em</Typography>
              <Typography>{formatDateTime(template.createdAt)}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">Atualizado em</Typography>
              <Typography>{formatDateTime(template.updatedAt)}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Versions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Versões ({versions.length})
          </Typography>
          {versions.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Versão</TableCell>
                  <TableCell>Arquivo</TableCell>
                  <TableCell>Checksum</TableCell>
                  <TableCell>Criado em</TableCell>
                  <TableCell>Criado por</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {versions.map((ver) => (
                  <TableRow key={ver.publicId} sx={ver.isActive ? { backgroundColor: '#22C55E08' } : undefined}>
                    <TableCell>
                      <Typography fontWeight={ver.isActive ? 700 : 400}>v{ver.version}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {ver.filePath || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }} title={ver.checksum}>
                        {ver.checksum ? ver.checksum.substring(0, 12) + '...' : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(ver.createdAt)}</TableCell>
                    <TableCell>{ver.createdBy || '-'}</TableCell>
                    <TableCell>
                      {ver.isActive ? (
                        <Chip label="Ativa" size="small" sx={{ backgroundColor: '#22C55E14', color: '#22C55E', fontWeight: 600 }} />
                      ) : (
                        <Chip label="Inativa" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {!ver.isActive && (
                        <IconButton
                          size="small"
                          color="success"
                          title="Ativar esta versão"
                          onClick={() => setActivateVersionTarget(ver)}
                        >
                          <ActivateIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography color="text.secondary" variant="body2">Nenhuma versão encontrada.</Typography>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Template</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Nome"
              value={editData.name || ''}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Chave"
              value={editData.key || ''}
              onChange={(e) => setEditData({ ...editData, key: e.target.value })}
              slotProps={{ input: { sx: { fontFamily: 'monospace' } } }}
            />
            <TextField
              fullWidth
              label="Descrição"
              multiline
              rows={3}
              value={editData.description || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                select
                label="Engine"
                value={editData.engine || ''}
                onChange={(e) => setEditData({ ...editData, engine: e.target.value as TemplateEngine })}
              >
                {ENGINE_OPTIONS.map((opt) => (
                  <MuiMenuItem key={opt.value} value={opt.value}>{opt.label}</MuiMenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                select
                label="Status"
                value={editData.status || ''}
                onChange={(e) => setEditData({ ...editData, status: e.target.value as TemplateStatus })}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <MuiMenuItem key={opt.value} value={opt.value}>{opt.label}</MuiMenuItem>
                ))}
              </TextField>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : undefined}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Version Dialog */}
      <Dialog open={uploadOpen} onClose={() => { if (!uploading) { setUploadOpen(false); setUploadFile(null); } }} maxWidth="sm" fullWidth>
        <DialogTitle>
          Upload Nova Versão
          {!uploading && (
            <IconButton onClick={() => { setUploadOpen(false); setUploadFile(null); }} sx={{ position: 'absolute', right: 8, top: 8 }}>
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent>
          {!uploadFile ? (
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '2px dashed',
                borderColor: 'grey.300',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
              <Typography color="text.secondary">Clique para selecionar um arquivo</Typography>
              <Typography variant="caption" color="text.secondary">.hbs ou .html</Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept=".hbs,.html"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setUploadFile(f); }}
                style={{ display: 'none' }}
              />
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <UploadIcon color="primary" />
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={500}>{uploadFile.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(uploadFile.size / 1024).toFixed(1)} KB
                  </Typography>
                </Box>
                {!uploading && (
                  <IconButton size="small" onClick={() => setUploadFile(null)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              {uploading && (
                <Box sx={{ width: '100%' }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}>
                    {uploadProgress}%
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setUploadOpen(false); setUploadFile(null); }} disabled={uploading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleUploadVersion}
            disabled={!uploadFile || uploading}
            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
          >
            {uploading ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={!!activateVersionTarget}
        title="Ativar Versão"
        message={`Deseja ativar a versão ${activateVersionTarget?.version}? A versão atual será desativada.`}
        onConfirm={handleActivateVersion}
        onClose={() => setActivateVersionTarget(null)}
      />
      <ConfirmDialog
        open={toggleActiveConfirm}
        title={template.active ? 'Desativar Template' : 'Ativar Template'}
        message={template.active
          ? `Deseja desativar o template "${template.name}"?`
          : `Deseja ativar o template "${template.name}"?`
        }
        onConfirm={handleToggleActive}
        onClose={() => setToggleActiveConfirm(false)}
      />
    </Box>
  );
};

export default TemplateDetailPage;
