import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  Button,
  Divider,
  CircularProgress,
  MobileStepper,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import { getFileUrl, getTransferByCode, confirmTransfer, rejectTransfer } from '../../helper';

const Detail = ({ label, value }) =>
  value ? (
    <Box sx={{ display: 'flex', py: 0.75, borderTop: '1px solid', borderColor: 'divider' }}>
      <Typography variant="body2" sx={{ width: 110, color: 'text.secondary', fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ flex: 1 }}>
        {value}
      </Typography>
    </Box>
  ) : null;

/**
 * Detail dialog for a single notification.
 * - transfer_request: product brief + amount + requester, with Approve/Decline.
 * - system/other:      title, image slider and multi-line description.
 */
const NotificationDetailDialog = ({ open, notification, recipientKind, recipientId, onClose, onActionDone }) => {
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [step, setStep] = useState(0);

  const isTransfer = notification?.type === 'transfer_request';
  const code = notification?.data?.transferCode;

  useEffect(() => {
    if (!open) return;
    setResultMsg('');
    setStep(0);
    setTransfer(null);
    if (isTransfer && code) {
      setLoading(true);
      getTransferByCode(code)
        .then((tr) => setTransfer(tr))
        .finally(() => setLoading(false));
    }
  }, [open, isTransfer, code]);

  const act = async (action) => {
    if (!code) return;
    setSubmitting(true);
    const actor = { kind: recipientKind, id: recipientId };
    const res = action === 'confirm' ? await confirmTransfer(code, actor) : await rejectTransfer(code, actor);
    setSubmitting(false);
    if (res && res.status !== 'fail') {
      setResultMsg(action === 'confirm' ? 'Transfer approved.' : 'Transfer declined.');
      onActionDone?.();
      setTimeout(() => onClose(), 800);
    } else {
      setResultMsg(res?.message || 'Something went wrong');
    }
  };

  if (!notification) return null;

  const d = notification.data || {};
  const snap = transfer?.productSnapshot || {};
  const buyer = transfer?.to_owner || {};
  const status = transfer?.status;
  const isPending = !transfer || status === 'pending';
  const productImage = getFileUrl(snap.image || d.productImage);
  const images = Array.isArray(notification.images) ? notification.images : [];
  const maxSteps = images.length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8, zIndex: 2 }}>
        <CloseIcon />
      </IconButton>

      {isTransfer ? (
        <DialogContent sx={{ pt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, pr: 3 }}>
            Ownership transfer request
          </Typography>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={26} />
            </Box>
          ) : (
            <>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                {productImage ? (
                  <Box
                    component="img"
                    src={productImage}
                    alt={snap.name || d.productName}
                    sx={{ width: 150, height: 180, objectFit: 'contain', borderRadius: 2, bgcolor: '#fff', border: '1px solid', borderColor: 'divider' }}
                  />
                ) : null}
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 1 }}>
                  {snap.name || d.productName || 'Product'}
                </Typography>
                {!!(snap.brandName || d.brandName) && (
                  <Typography variant="body2" color="text.secondary">
                    {snap.brandName || d.brandName}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: 'background.default',
                  borderRadius: 2,
                  px: 2,
                  py: 1.25,
                  mb: 2,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Transfer amount
                </Typography>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 800 }}>
                  {transfer?.quantity ?? d.quantity ?? 1}
                </Typography>
              </Box>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Requested by
              </Typography>
              <Box sx={{ bgcolor: 'background.default', borderRadius: 2, px: 2, py: 1, mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 800, py: 0.75 }}>
                  {buyer.name || d.buyerName || '—'}
                </Typography>
                <Detail label="Email" value={buyer.email || d.buyerEmail} />
                <Detail label="Phone" value={buyer.phone || d.buyerPhone} />
                <Detail label="Country" value={buyer.country || d.buyerCountry} />
                <Detail label="Address" value={d.buyerAddress} />
              </Box>

              {resultMsg ? (
                <Typography align="center" color="primary" sx={{ fontWeight: 700, py: 1 }}>
                  {resultMsg}
                </Typography>
              ) : !isPending ? (
                <Chip label={`This request is ${status}`} color="default" sx={{ width: '100%' }} />
              ) : null}
            </>
          )}
        </DialogContent>
      ) : (
        <DialogContent sx={{ pt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, pr: 3 }}>
            {notification.title}
          </Typography>
          {maxSteps > 0 && (
            <Box sx={{ mb: 2 }}>
              <Box
                component="img"
                src={getFileUrl(images[step])}
                alt={`image-${step}`}
                sx={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 2, bgcolor: 'background.default' }}
              />
              {maxSteps > 1 && (
                <MobileStepper
                  steps={maxSteps}
                  position="static"
                  activeStep={step}
                  sx={{ bgcolor: 'transparent', justifyContent: 'space-between' }}
                  nextButton={
                    <Button size="small" onClick={() => setStep((s) => Math.min(s + 1, maxSteps - 1))} disabled={step === maxSteps - 1}>
                      Next <KeyboardArrowRight />
                    </Button>
                  }
                  backButton={
                    <Button size="small" onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0}>
                      <KeyboardArrowLeft /> Back
                    </Button>
                  }
                />
              )}
            </Box>
          )}
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.primary', lineHeight: 1.7 }}>
            {notification.message}
          </Typography>
        </DialogContent>
      )}

      {isTransfer && isPending && !resultMsg && !loading && (
        <>
          <Divider />
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button color="error" variant="outlined" onClick={() => act('reject')} disabled={submitting}>
              Decline
            </Button>
            <Button variant="contained" onClick={() => act('confirm')} disabled={submitting}>
              {submitting ? 'Working…' : 'Approve'}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default NotificationDetailDialog;
