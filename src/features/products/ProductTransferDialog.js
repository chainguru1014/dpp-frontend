import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { METHOD_LABELS } from '../trace/TracePage';
import { lookupRecipient, ownerTransfer, getTransferAvailable } from '../../helper';

// Business methods offered for an owner-initiated transfer.
const METHOD_OPTIONS = [
  'sell',
  'distribute',
  'distribute_to_shop',
  'export_to_country',
  'export_to_store',
  'export_to_shop',
  'gift',
  'lease',
  'return',
  'sale',
];

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim());

export default function ProductTransferDialog({ open, onClose, product, actor, onTransferred }) {
  const minted = product?.total_minted_amount || 0;
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState('');
  const [method, setMethod] = useState('sell');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmNew, setConfirmNew] = useState(false); // confirm-unregistered-email step
  const [available, setAvailable] = useState(null); // units the owner currently holds
  const [availLoading, setAvailLoading] = useState(false);

  // The hard cap for the quantity input: current holding (preferred), else minted.
  const maxQty = available != null ? available : minted;

  useEffect(() => {
    if (!open || !product?._id) return;
    setQuantity(1);
    setEmail('');
    setMethod('sell');
    setError('');
    setConfirmNew(false);
    setLoading(false);
    setAvailable(null);
    let active = true;
    (async () => {
      setAvailLoading(true);
      const res = await getTransferAvailable(product._id, actor);
      if (active) {
        setAvailable(typeof res?.available === 'number' ? res.available : 0);
        setAvailLoading(false);
      }
    })();
    return () => { active = false; };
  }, [open, product?._id]);

  const doTransfer = async () => {
    setLoading(true);
    setError('');
    const res = await ownerTransfer({
      product_id: product._id,
      actor,
      quantity: Number(quantity),
      method,
      receiver_email: email.trim(),
    });
    setLoading(false);
    if (res?.status === 'success') {
      onTransferred &&
        onTransferred(
          res.recipientRegistered
            ? 'Ownership transferred to the registered user.'
            : 'An invite email was sent to the new recipient and ownership was assigned to their email.'
        );
      onClose();
    } else {
      setError(res?.message || 'Transfer failed');
      setConfirmNew(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    const q = Number(quantity);
    if (!q || q < 1) {
      setError('Enter a quantity of at least 1.');
      return;
    }
    if (available != null && available <= 0) {
      setError('You have no units of this product available to transfer.');
      return;
    }
    if (q > maxQty) {
      setError(
        available != null
          ? `You only own ${available} unit(s) available to transfer.`
          : `Quantity cannot exceed minted amount (${minted}).`
      );
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid receiver email address.');
      return;
    }
    setLoading(true);
    const recipient = await lookupRecipient(email.trim());
    setLoading(false);
    if (recipient?.exists) {
      await doTransfer();
    } else {
      // Unregistered recipient — confirm the email is correct before inviting.
      setConfirmNew(true);
    }
  };

  return (
    <>
      <Dialog open={open && !confirmNew} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Transfer ownership — {product?.name || ''}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Minted units: <strong>{minted}</strong>
            {' · '}Available to transfer:{' '}
            <strong>{availLoading ? '…' : (available != null ? available : minted)}</strong>.
            Choose how many units to transfer, the business method, and the receiver's email.
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {available === 0 && !availLoading && (
            <Alert severity="warning" sx={{ mb: 2 }}>No units available to transfer for this product.</Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Quantity"
              type="number"
              size="small"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              inputProps={{ min: 1, max: maxQty || undefined }}
              error={Number(quantity) > maxQty}
              helperText={maxQty ? `1 – ${maxQty}` : 'Number of items to transfer'}
            />
            <TextField select label="Transfer method" size="small" value={method} onChange={(e) => setMethod(e.target.value)}>
              {METHOD_OPTIONS.map((m) => (
                <MenuItem key={m} value={m}>{METHOD_LABELS[m] || m}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Receiver email"
              type="email"
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="recipient@example.com"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || availLoading || available === 0}
          >
            {loading ? <CircularProgress size={20} /> : 'Transfer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm an unregistered recipient before sending the invite. */}
      <Dialog open={open && confirmNew} onClose={loading ? undefined : () => setConfirmNew(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm recipient email</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            <strong>{email}</strong> is not registered yet. Please confirm this email is correct.
            We'll assign ownership to this email and send them an invitation to register and claim it.
          </Typography>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmNew(false)} disabled={loading}>Edit email</Button>
          <Button onClick={doTransfer} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Confirm & send invite'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
