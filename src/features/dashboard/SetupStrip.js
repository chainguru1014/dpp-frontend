import React, { useEffect, useState } from 'react';
import { Box, Button, ButtonBase, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, LinearProgress, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CloseIcon from '@mui/icons-material/Close';
import qrcode from 'qrcode';
import { getProductQRcodes, listEmployees } from '../../helper';
import { passportCompleteness } from '../../utils/passportCompleteness';

const HIDDEN_KEY = 'dpp_setupStripHidden';
const TRIED_KEY = 'dpp_setupTriedScan';
// A passport this complete is ready to put in front of shoppers.
const PASSPORT_READY = 80;
const stored = (key) => {
  try { return localStorage.getItem(key) === '1'; } catch (e) { return false; }
};
const store = (key) => {
  try { localStorage.setItem(key, '1'); } catch (e) { /* storage blocked */ }
};

// Codes of any kind that were downloaded to print: QR, Security QR, or the
// barcode / NFC / RFID sheets.
const printedCount = (p) => (p.printed_amount || 0)
  + (p.security_printed_amount || 0)
  + Object.values(p.identifier_printed_amounts || {}).reduce((sum, n) => sum + (Number(n) || 0), 0);

// "Try it": one of the brand's own codes on screen, to scan with a phone and
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
          Point your phone’s camera at this code. It is the first code of “{product?.name}” and opens the page your shoppers will see.
        </Typography>
        {image && <Box component="img" src={image} alt="A code of your product" sx={{ width: 240, height: 240, border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1 }} />}
        {!image && !failed && <LinearProgress sx={{ my: 4 }} />}
        {failed && <Typography color="text.secondary">The code could not be shown. Open Generate Code to see your codes.</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Not now</Button>
        <Button variant="contained" onClick={onDone}>I have tried it</Button>
      </DialogActions>
    </Dialog>
  );
}

// A new brand's way from an empty account to products out in the world, in
// the order the work is really done: brand, product, passport, codes, print,
// test scan, team. Every step is ticked from real data, says why it matters,
// and can be clicked to go and do it. The strip disappears once everything
// is done, or when hidden.
export default function SetupStrip({
  products = [], brands = [], scans = 0, token, companyId, canManageStaff,
  onSetUpBrand, onAddProduct, onCompletePassport, onGenerateCodes, onManageStaff,
}) {
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

  const brandReady = brands.some((b) => ['name', 'detail', 'websiteUrl', 'logoUrl'].every((key) => String(b[key] || '').trim()));
  const scored = products.map((p) => ({ product: p, percent: passportCompleteness(p).percent }));
  const best = scored.reduce((top, row) => (!top || row.percent > top.percent ? row : top), null);
  const withCodes = products.find((p) => (p.total_minted_amount || 0) > 0);
  const codesProduct = withCodes || best?.product;

  const steps = [
    onSetUpBrand && {
      label: 'Set up your brand',
      why: 'Your name, logo, website and a short description. Every product you add starts with them, and shoppers see them on each product page.',
      done: brandReady,
      action: onSetUpBrand,
      button: 'Set up your brand',
    },
    {
      label: 'Add your first product',
      why: 'A name, a category and one photo are enough to start.',
      done: products.length > 0,
      action: onAddProduct,
      button: 'Add a product',
    },
    {
      label: 'Fill in its passport',
      why: best
        ? `“${best.product.name || 'Your product'}” is ${best.percent}% complete. Materials, care, origin and repair are what shoppers (and the EU rules) expect; aim for ${PASSPORT_READY}% or more.`
        : `Materials, care, origin and repair are what shoppers (and the EU rules) expect; aim for ${PASSPORT_READY}% or more.`,
      done: !!best && best.percent >= PASSPORT_READY,
      action: () => (best && onCompletePassport ? onCompletePassport(best.product) : onAddProduct()),
      button: 'Fill in the passport',
    },
    {
      label: 'Create codes for your items',
      why: 'One code per physical item. Scanning it opens that product’s page.',
      done: !!withCodes,
      action: () => onGenerateCodes(codesProduct),
      button: 'Create codes',
    },
    {
      label: 'Download and print the codes',
      why: 'Download the codes as a PDF and print it on labels or hang tags. This step is ticked when you download the PDF.',
      done: products.some((p) => printedCount(p) > 0),
      action: () => onGenerateCodes(codesProduct),
      button: 'Download codes to print',
    },
    {
      label: 'Test a code with your phone',
      why: 'See the page exactly as a shopper does before the items leave your hands.',
      done: scans > 0 || tried,
      action: () => (withCodes ? setTryOpen(true) : onGenerateCodes(codesProduct)),
      button: 'Try it',
    },
    canManageStaff && {
      label: 'Invite your team',
      why: 'Add the employees who will record receiving, packing and other work steps in the mobile app.',
      done: hasTeam,
      action: onManageStaff,
      button: 'Invite your team',
    },
  ].filter(Boolean);
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  // Steps build on each other, so the next one is the first not yet done.
  const next = steps.find((s) => !s.done);

  return (
    <Box sx={{ mb: 3, p: 2.5, bgcolor: '#fff', border: '1px solid', borderColor: 'primary.light', borderRadius: 3, boxShadow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Box sx={{ flex: '1 1 260px', minWidth: 0 }}>
          <Typography variant="h6" component="h2">Getting set up: {done} of {steps.length} done</Typography>
          <LinearProgress variant="determinate" value={(done * 100) / steps.length} sx={{ mt: 1, height: 8, borderRadius: 4, bgcolor: '#e6eaf1', maxWidth: 420 }} />
        </Box>
        <Button onClick={() => { store(HIDDEN_KEY); setHidden(true); }}>Hide</Button>
      </Box>

      {/* The one thing to do now, with the reason for it. */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', p: 2, mb: 2, bgcolor: 'rgba(47,128,200,0.08)', borderRadius: 2 }}>
        <Box sx={{ flex: '1 1 320px', minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">Next step</Typography>
          <Typography variant="subtitle1" component="p" sx={{ fontWeight: 600 }}>{steps.indexOf(next) + 1}. {next.label}</Typography>
          <Typography color="text.secondary">{next.why}</Typography>
        </Box>
        <Button variant="contained" onClick={next.action} sx={{ flexShrink: 0 }}>{next.button}</Button>
      </Box>

      <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 0.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        {steps.map((s, i) => (
          <Box component="li" key={s.label}>
            <ButtonBase
              onClick={s.action}
              title={s.why}
              sx={{ width: '100%', justifyContent: 'flex-start', gap: 1, px: 1, py: 0.75, borderRadius: 1.5, textAlign: 'left', '&:hover': { bgcolor: 'rgba(47,128,200,0.08)' } }}
            >
              {s.done
                ? <CheckCircleIcon sx={{ color: 'success.main' }} aria-label="Done" />
                : <RadioButtonUncheckedIcon sx={{ color: s === next ? 'primary.main' : 'text.disabled' }} aria-label="Not done yet" />}
              <Typography sx={{ fontWeight: s === next ? 600 : 400 }} color={s.done ? 'text.secondary' : 'text.primary'}>
                {i + 1}. {s.label}
              </Typography>
            </ButtonBase>
          </Box>
        ))}
      </Box>
      <TryScanDialog
        open={tryOpen}
        onClose={() => setTryOpen(false)}
        product={withCodes}
        onDone={() => { store(TRIED_KEY); setTried(true); setTryOpen(false); }}
      />
    </Box>
  );
}
