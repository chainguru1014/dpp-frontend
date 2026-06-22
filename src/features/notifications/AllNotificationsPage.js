import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  CircularProgress,
  Button,
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CampaignIcon from '@mui/icons-material/Campaign';
import { useAuth } from '../auth/AuthContext';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../helper';
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
      return <SwapHorizIcon sx={{ color }} />;
    case 'transfer_confirmed':
    case 'transfer_received':
      return <CheckCircleIcon sx={{ color }} />;
    case 'transfer_rejected':
      return <CancelIcon sx={{ color }} />;
    default:
      return <CampaignIcon sx={{ color }} />;
  }
};

const AllNotificationsPage = () => {
  const { company, isAppUser } = useAuth();
  const recipientId = company?._id ? String(company._id) : '';
  const recipientKind = isAppUser ? 'User' : 'Company';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    if (!recipientId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await getNotifications(recipientKind, recipientId, 100);
    setItems(Array.isArray(res?.data) ? res.data : []);
    setLoading(false);
  }, [recipientId, recipientKind]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkAll = async () => {
    if (!recipientId) return;
    await markAllNotificationsRead(recipientKind, recipientId);
    load();
  };

  const handleOpenDetail = (n) => {
    if (!n.read && recipientId) {
      setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      markNotificationRead(n._id, recipientId);
    }
    setDetail(n);
  };

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 400 }}>
          Notifications
        </Typography>
        {items.some((n) => !n.read) && (
          <Button onClick={handleMarkAll}>Mark all as read</Button>
        )}
      </Box>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <NotificationsNoneIcon sx={{ fontSize: 44, color: 'text.disabled' }} />
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {items.map((n, idx) => {
              const color = LEVEL_COLOR[n.level] || LEVEL_COLOR.info;
              return (
                <React.Fragment key={n._id || idx}>
                  <ListItem
                    button
                    onClick={() => handleOpenDetail(n)}
                    alignItems="flex-start"
                    sx={{ bgcolor: n.read ? 'transparent' : 'rgba(47,123,201,0.06)', py: 1.5, cursor: 'pointer' }}
                  >
                    <ListItemAvatar>
                      <Avatar variant="rounded" sx={{ bgcolor: `${color}22` }}>
                        {typeIcon(n.type, color)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body1" sx={{ fontWeight: 400 }}>
                          {n.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                            {n.message}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
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
      </Paper>

      <NotificationDetailDialog
        open={Boolean(detail)}
        notification={detail}
        recipientKind={recipientKind}
        recipientId={recipientId}
        onClose={() => setDetail(null)}
        onActionDone={load}
      />
    </Box>
  );
};

export default AllNotificationsPage;
