import { useRef } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Button,
  Tooltip,
} from '@mui/material';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useNotificationsOptional } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `${diffMin}min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

export function NotificationBell() {
  const ctx = useNotificationsOptional();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  if (!ctx) return null;

  const { notifications, unreadCount, panelOpen, setPanelOpen, markAsRead, markAllAsRead, config } = ctx;

  const handleToggle = () => {
    setPanelOpen(!panelOpen);
  };

  const handleClose = () => {
    setPanelOpen(false);
  };

  const handleNotificationClick = (notification: (typeof notifications)[0]) => {
    if (!notification.read) {
      markAsRead(notification.publicId);
    }
    if (config.onNotificationClick) {
      config.onNotificationClick(notification, navigate);
    }
    handleClose();
  };

  return (
    <>
      <Tooltip title="Notificações">
        <IconButton ref={anchorRef} onClick={handleToggle} size="small">
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: 10,
                height: 18,
                minWidth: 18,
              },
            }}
          >
            <NotificationsOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={panelOpen}
        anchorEl={anchorRef.current}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 360, maxHeight: 480, mt: 1 },
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            Notificações
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAllIcon />}
              onClick={markAllAsRead}
              sx={{ textTransform: 'none', fontSize: 12 }}
            >
              Marcar todas como lidas
            </Button>
          )}
        </Box>
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Nenhuma notificação
            </Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ overflowY: 'auto', maxHeight: 400 }}>
            {notifications.map((notification) => (
              <ListItemButton
                key={notification.publicId}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: !notification.read ? 'action.hover' : 'transparent',
                }}
              >
                {!notification.read && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      mr: 1.5,
                      flexShrink: 0,
                    }}
                  />
                )}
                <ListItemText
                  primary={notification.title}
                  secondary={notification.message}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: !notification.read ? 600 : 400,
                    noWrap: true,
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    noWrap: true,
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 1, flexShrink: 0, whiteSpace: 'nowrap' }}
                >
                  {formatRelativeTime(notification.createdAt)}
                </Typography>
              </ListItemButton>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
}
