import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Typography,
} from '@mui/material';
import { subscribe } from '../../utils/feedbackBus';

// Renders utils/feedbackBus.js events: toast messages (bottom of the screen,
// long enough to read) and one confirmation dialog at a time.
const GlobalFeedback = () => {
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(
    () =>
      subscribe((event) => {
        if (event.type === 'toast') setToast({ ...event, key: Date.now() });
        if (event.type === 'confirm') setConfirm(event);
      }),
    []
  );

  const answer = (value) => {
    confirm?.resolve(value);
    setConfirm(null);
  };

  const opts = confirm?.options || {};

  return (
    <>
      <Snackbar
        key={toast?.key}
        open={!!toast}
        autoHideDuration={toast?.severity === 'error' ? 9000 : 6000}
        onClose={(_, reason) => reason !== 'clickaway' && setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert
            severity={toast.severity}
            variant="filled"
            onClose={() => setToast(null)}
            sx={{ fontSize: '1rem', alignItems: 'center', maxWidth: 560 }}
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>

      <Dialog open={!!confirm} onClose={() => answer(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{opts.title || 'Please confirm'}</DialogTitle>
        <DialogContent>
          <Typography sx={{ whiteSpace: 'pre-line' }}>{opts.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => answer(false)}>{opts.cancelText || 'Cancel'}</Button>
          <Button
            variant="contained"
            color={opts.danger ? 'error' : 'primary'}
            onClick={() => answer(true)}
            autoFocus
          >
            {opts.confirmText || 'OK'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GlobalFeedback;
