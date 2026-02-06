import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Stack,
  IconButton,
  Tooltip,
  alpha,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AppsIcon from '@mui/icons-material/Apps';
import InfoIcon from '@mui/icons-material/Info';
import SecurityIcon from '@mui/icons-material/Security';
import PeopleIcon from '@mui/icons-material/People';
import KeyIcon from '@mui/icons-material/Key';
import { LoadingState } from '../../components/cards/LoadingState';
import { ErrorState } from '../../components/cards/ErrorState';
import { StatusChip } from '../../components/cards/StatusChip';
import { useApplication } from '../../hooks/useApplications';
import { ApplicationInfoTab } from './tabs/ApplicationInfoTab';
import { ApplicationRolesTab } from './tabs/ApplicationRolesTab';
import { ApplicationUsersTab } from './tabs/ApplicationUsersTab';
import { ApplicationClientsTab } from './tabs/ApplicationClientsTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`application-tabpanel-${index}`}
      aria-labelledby={`application-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </Box>
  );
}

function a11yProps(index: number) {
  return {
    id: `application-tab-${index}`,
    'aria-controls': `application-tabpanel-${index}`,
  };
}

export function ApplicationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: application, isLoading, isError, refetch } = useApplication(id || '');
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError || !application) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Tooltip title="Voltar">
          <IconButton onClick={() => navigate('/applications')}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            background: application.active
              ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
              : (theme) => alpha(theme.palette.grey[500], 0.2),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: application.active
              ? '0 4px 12px rgba(16, 185, 129, 0.3)'
              : 'none',
          }}
        >
          <AppsIcon sx={{ color: application.active ? 'white' : 'grey.500', fontSize: 28 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h5" fontWeight={700}>
              {application.name}
            </Typography>
            <StatusChip active={application.active} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {application.description || 'Sem descricao'}
          </Typography>
        </Box>
      </Stack>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="application tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<InfoIcon />}
            iconPosition="start"
            label="Informacoes"
            {...a11yProps(0)}
          />
          <Tab
            icon={<SecurityIcon />}
            iconPosition="start"
            label="Roles"
            {...a11yProps(1)}
          />
          <Tab
            icon={<PeopleIcon />}
            iconPosition="start"
            label="Usuarios"
            {...a11yProps(2)}
          />
          <Tab
            icon={<KeyIcon />}
            iconPosition="start"
            label="Client Credentials"
            {...a11yProps(3)}
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <ApplicationInfoTab application={application} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ApplicationRolesTab
          applicationId={application.publicId}
          applicationName={application.name}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <ApplicationUsersTab
          applicationId={application.publicId}
          applicationName={application.name}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <ApplicationClientsTab
          applicationId={application.publicId}
          applicationName={application.name}
        />
      </TabPanel>
    </Box>
  );
}
