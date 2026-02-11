import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
  alpha,
  Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AppsIcon from '@mui/icons-material/Apps';
import InfoIcon from '@mui/icons-material/Info';
import SecurityIcon from '@mui/icons-material/Security';
import PeopleIcon from '@mui/icons-material/People';
import KeyIcon from '@mui/icons-material/Key';
import { StatusChip } from '@app/ui';
import { applicationService } from '../services';
import { ApplicationInfoTab } from '../components/applications/ApplicationInfoTab';
import { ApplicationRolesTab } from '../components/applications/ApplicationRolesTab';
import { ApplicationUsersTab } from '../components/applications/ApplicationUsersTab';
import { ApplicationClientsTab } from '../components/applications/ApplicationClientsTab';
import type { Application } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </Box>
  );
}

const ApplicationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (!id) return;
    const fetchApp = async () => {
      try {
        const data = await applicationService.getById(id);
        setApp(data);
      } catch (error) {
        console.error('Erro ao carregar aplicacao:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!app) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="error">Aplicacao nao encontrada</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/aplicacoes')} sx={{ mt: 2 }}>
          Voltar
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Tooltip title="Voltar">
          <IconButton onClick={() => navigate('/aplicacoes')}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            background: app.active
              ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
              : alpha('#9e9e9e', 0.2),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: app.active ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
          }}
        >
          <AppsIcon sx={{ color: app.active ? 'white' : '#9e9e9e', fontSize: 28 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h5" fontWeight={700}>
              {app.name}
            </Typography>
            <StatusChip active={app.active} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {app.description || 'Sem descricao'}
          </Typography>
        </Box>
      </Stack>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<InfoIcon />} iconPosition="start" label="Informacoes" />
          <Tab icon={<SecurityIcon />} iconPosition="start" label="Roles" />
          <Tab icon={<PeopleIcon />} iconPosition="start" label="Usuarios" />
          <Tab icon={<KeyIcon />} iconPosition="start" label="Client Credentials" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <ApplicationInfoTab application={app} />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <ApplicationRolesTab applicationId={app.publicId} applicationName={app.name} />
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <ApplicationUsersTab applicationId={app.publicId} applicationName={app.name} />
      </TabPanel>
      <TabPanel value={tabValue} index={3}>
        <ApplicationClientsTab applicationId={app.publicId} applicationName={app.name} />
      </TabPanel>
    </Box>
  );
};

export default ApplicationDetailPage;
