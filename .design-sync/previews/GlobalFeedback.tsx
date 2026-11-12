import React, { useEffect } from 'react';
import { GlobalFeedback, notify, confirmAction, Box, Typography } from '@yometel/dpp-admin';

// GlobalFeedback is mounted once (YometelAdminProvider does it). Anything
// shows a toast with notify(message, severity) or asks with confirmAction()
// (resolves true/false).
export const Toast = () => {
  useEffect(() => {
    const t = setTimeout(() => notify('Product saved.', 'success'), 50);
    return () => clearTimeout(t);
  }, []);
  return (
    <Box sx={{ width: 560, height: 260, p: 3, position: 'relative' }}>
      <Typography color="text.secondary">notify('Product saved.', 'success')</Typography>
    </Box>
  );
};

export const Confirm = () => {
  useEffect(() => {
    const t = setTimeout(() => {
      confirmAction({ title: 'Delete this product?', message: 'Its passport and codes stop working. This cannot be undone.', confirmText: 'Delete', danger: true });
    }, 50);
    return () => clearTimeout(t);
  }, []);
  return <Box sx={{ width: 560, height: 360 }} />;
};
