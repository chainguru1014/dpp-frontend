import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Button,
  Tooltip,
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CampaignIcon from '@mui/icons-material/Campaign';
import { useAuth } from '../auth/AuthContext';
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../helper';
import NotificationDetailDialog from './NotificationDetailDialog';

const LEVEL_COLOR = {
  info: '#3e87d6',
  success: '#2e7d32',
  warning: '#ed6c02',
  critical: '#d32f2f',
};

const typeIcon = (type, color) => {
  switch (type) {
    case 'transfer_request':
      return <SwapHorizIcon sx={{ color }} fontSize="small" />;
    case 'transfer_confirmed':
    case 'transfer_received':
      return <CheckCircleIcon sx={{ color }} fontSize="small" />;
    case 'transfer_rejected':
      return <CancelIcon sx={{ color }} fontSize="small" />;
    default:
      return <CampaignIcon sx={{ color }} fontSize="small" />;
  }
};

const formatWhen = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString();
  } catch (e) {
    return '';
  }
};

const NotificationBell = ({ onShowAll }) => {
  const { company, isAppUser } = useAuth();
  const recipientId = company?._id ? String(company._id) : '';
  const recipientKind = isAppUser ? 'User' : 'Company';
  const [anchorEl, setAnchorEl] = useState(null);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [detail, setDetail] = useState(null);
  const activeRef = useRef(true);

  const open = Boolean(anchorEl);

  const refreshCount = useCallback(async () => {
    if (!recipientId) {
      setUnread(0);
      return;
    }
    const count = await getUnreadNotificationCount(recipientKind, recipientId);
    if (activeRef.current) setUnread(count);
  }, [recipientId]);

  // Poll the unread count every 3 seconds for near real-time updates.
  useEffect(() => {
    activeRef.current = true;
    refreshCount();
    const id = setInterval(refreshCount, 3000);
    return () => {
      activeRef.current = false;
      clearInterval(id);
    };
  }, [refreshCount]);

  const handleOpen = async (e) => {
    setAnchorEl(e.currentTarget);
    if (!recipientId) return;
    const res = await getNotifications(recipientKind, recipientId, 50);
    if (activeRef.current) setItems(Array.isArray(res?.data) ? res.data : []);
  };

  const handleClose = () => setAnchorEl(null);

  // Clicking a single notification marks just that one read (persisted on the
  // backend) and reflects it immediately in the UI.
  const handleItemClick = (n) => {
    if (!n.read && recipientId) {
      setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      markNotificationRead(n._id, recipientId).then(refreshCount);
    }
    setDetail(n);
    handleClose();
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton color="inherit" onClick={handleOpen} sx={{ mr: 1 }}>
          <Badge badgeContent={unread} color="error" max={99}>
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 380, maxWidth: '92vw', maxHeight: 480, borderRadius: 2, overflow: 'hidden' } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 400 }}>
            Notifications
          </Typography>
          {items.length > 0 && (
            <Button
              size="small"
              onClick={async () => {
                if (recipientId) {
                  await markAllNotificationsRead(recipientKind, recipientId);
                  refreshCount();
                }
              }}
            >
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />
        {items.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <NotificationsNoneIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ overflowY: 'auto', maxHeight: 400 }}>
            {items.map((n, idx) => {
              const color = LEVEL_COLOR[n.level] || LEVEL_COLOR.info;
              return (
                <React.Fragment key={n._id || idx}>
                  <ListItem
                    alignItems="flex-start"
                    button
                    onClick={() => handleItemClick(n)}
                    sx={{ bgcolor: n.read ? 'transparent' : 'rgba(47,123,201,0.06)', py: 1.25, cursor: 'pointer' }}
                  >
                    <ListItemAvatar sx={{ minWidth: 44 }}>
                      <Avatar sx={{ bgcolor: `${color}22`, width: 34, height: 34 }} variant="rounded">
                        {typeIcon(n.type, color)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 400 }}>
                          {n.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                            {n.message}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {formatWhen(n.createdAt)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {idx < items.length - 1 && <Divider component="li" />}
                </React.Fragment>
              );
            })}
          </List>
        )}
        <Divider />
        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Button
            size="small"
            onClick={() => {
              handleClose();
              onShowAll?.();
            }}
          >
            Show all
          </Button>
        </Box>
      </Popover>

      <NotificationDetailDialog
        open={Boolean(detail)}
        notification={detail}
        recipientKind={recipientKind}
        recipientId={recipientId}
        onClose={() => setDetail(null)}
        onActionDone={refreshCount}
      />
    </>
  );
};

export default NotificationBell;
