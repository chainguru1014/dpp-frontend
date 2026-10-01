import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, LinearProgress, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CloseIcon from '@mui/icons-material/Close';
import qrcode from 'qrcode';
import { getProductQRcodes, listEmployees } from '../../helper';

const HIDDEN_KEY = 'dpp_setupStripHidden';
const TRIED_KEY = 'dpp_setupTriedScan';
const stored = (key) => {
  try { return localStorage.getItem(key) === '1'; } catch (e) { return false; }
};
const store = (key) => {
  try { localStorage.setItem(key, '1'); } catch (e) { /* storage blocked */ }
};

// "Try it": one of the brand's own labels on screen, to scan with a phone and
// see the product page a shopper gets.
function TryScanDialog({ open, onClose, product, onDone }) {
  const [image, setImage] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!open || !product) return;
    let cancelled = false;
    setImage('');
    setFailed(false);
    (async () => {
      const codes = await getProductQRcodes(product._id, 1);
      const url = Array.isArray(codes) && codes[0]?.url;
      if (!url) {
        if (!cancelled) setFailed(true);
        return;
      }
      const dataUrl = await qrcode.toDataURL(url, { width: 280, margin: 1 }).catch(() => '');
      if (!cancelled) {
        setImage(dataUrl);
        setFailed(!dataUrl);
      }
    })();
    return () => { cancelled = true; };
  }, [open, product]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        Try it with your phone
        <IconButton onClick={onClose} color="inherit" aria-label="Close"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <Typography sx={{ mb: 2 }}>
          Point your phone’s camera at this code. It is the first label of “{product?.name}” and opens the page your shoppers will see.
        </Typography>
        {image && <Box component="img" src={image} alt="A label of your product" sx={{ width: 240, height: 240, border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1 }} />}
        {!image && !failed && <LinearProgress sx={{ my: 4 }} />}
        {failed && <Typography color="text.secondary">The label could not be shown. Open Generate Code to see your labels.</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Not now</Button>
        <Button variant="contained" onClick={onDone}>I have tried it</Button>
      </DialogActions>
    </Dialog>
  );
}

// A new brand's first steps, as one slim strip: how far along they are and
// the one thing to do next. Steps are ticked from real data (products,
// labels, prints, scans, staff). It disappears once everything is done, or
// when hidden.
export default function SetupStrip({ products = [], scans = 0, token, companyId, canManageStaff, onAddProduct, onGenerateCodes, onManageStaff }) {
  const [hidden, setHidden] = useState(() => stored(HIDDEN_KEY));
  const [tried, setTried] = useState(() => stored(TRIED_KEY));
  const [tryOpen, setTryOpen] = useState(false);
  // null until loaded, so the strip doesn't flash an unticked step.
  const [hasTeam, setHasTeam] = useState(canManageStaff ? null : true);

  useEffect(() => {
    if (!canManageStaff || !token || hidden) return;
    let cancelled = false;
    listEmployees(token, companyId).then((list) => {
      if (!cancelled) setHasTeam((list || []).some((e) => e.employeeType === 'working_employee'));
    });
    return () => { cancelled = true; };
  }, [canManageStaff, token, companyId, hidden]);

  if (hidden || hasTeam === null) return null;

  const withLabels = products.find((p) => (p.total_minted_amount || 0) > 0);
  const steps = [
    { label: 'Add a product', done: products.length > 0, action: onAddProduct, button: 'Add a product' },
    { label: 'Create its labels', done: !!withLabels, action: onGenerateCodes, button: 'Create labels' },
    { label: 'Print the labels', done: products.some((p) => (p.printed_amount || 0) > 0), action: onGenerateCodes, button: 'Print labels' },
    { label: 'Scan one with your phone', done: scans > 0 || tried, action: () => setTryOpen(true), button: 'Try it' },
    canManageStaff && { label: 'Add your team', done: hasTeam, action: onManageStaff, button: 'Add your team' },
  ].filter(Boolean);
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  // Steps build on each other, so the next one is the first not yet done.
  const next = steps.find((s) => !s.done);

  return (
    <Box sx={{ mb: 3, p: 2.5, bgcolor: '#fff', border: '1px solid', borderColor: 'primary.light', borderRadius: 3, boxShadow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
        <Box sx={{ flex: '1 1 260px', minWidth: 0 }}>
          <Typography variant="h6" component="h2">Getting set up: {done} of {steps.length} done</Typography>
          <LinearProgress variant="determinate" value={(done * 100) / steps.length} sx={{ mt: 1, height: 8, borderRadius: 4, bgcolor: '#e6eaf1', maxWidth: 420 }} />
        </Box>
        <Button variant="contained" onClick={next.action}>Next: {next.button}</Button>
        <Button onClick={() => { store(HIDDEN_KEY); setHidden(true); }}>Hide</Button>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 3, rowGap: 0.75 }}>
        {steps.map((s, i) => (
          <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {s.done
              ? <CheckCircleIcon sx={{ color: 'success.main' }} aria-label="Done" />
              : <RadioButtonUncheckedIcon sx={{ color: s === next ? 'primary.main' : 'text.disabled' }} aria-label="Not done yet" />}
            <Typography sx={{ fontWeight: s === next ? 600 : 400 }} color={s.done ? 'text.secondary' : 'text.primary'}>
              {i + 1}. {s.label}
            </Typography>
          </Box>
        ))}
      </Box>
      <TryScanDialog
        open={tryOpen}
        onClose={() => setTryOpen(false)}
        product={withLabels}
        onDone={() => { store(TRIED_KEY); setTried(true); setTryOpen(false); }}
      />
    </Box>
  );
}
