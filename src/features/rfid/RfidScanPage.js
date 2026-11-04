import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, IconButton, MenuItem, Paper, Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import SensorsIcon from '@mui/icons-material/Sensors';
import SettingsIcon from '@mui/icons-material/Settings';
import BluetoothIcon from '@mui/icons-material/Bluetooth';
import BluetoothDisabledIcon from '@mui/icons-material/BluetoothDisabled';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PageHeader from '../../components/PageHeader';
import { getFileUrl, normalizeProductImages } from '../../helper';
import ProductDetailDialog from './ProductDetailDialog';
import {
  IMPINJ_DEFAULT_READER_SETTINGS, IMPINJ_READER_DISPLAY_NAME, RFID_POLL_MS, RFID_READER_TYPES, STATUS_CHECK_EVERY_N_TICKS,
  connectAndStartImpinj, fetchProduct, formatPrice, getImpinjReaderSettings, getImpinjReaderStatus, getImpinjTagsInView,
  getRecentTags, lookupTagProduct, stopAndDisconnectImpinj, updateImpinjReaderSettings,
  RFID_TEST_MODE, connectVirtualReader, disconnectVirtualReader,
} from './rfidReader';

// The one text size used across the page (the large count aside).
const TEXT = { fontSize: '0.95rem' };

const STATUS_TEXT = {
  idle: 'Not connected',
  connecting: 'Connecting…',
  reading: 'Reading tags',
  failed: 'Connection failed',
};
const STATUS_COLOR = { idle: '#8a94a6', connecting: '#d9822b', reading: '#2e7d32', failed: '#c62828' };

// RFID Scan: connect a reader and list every product whose tag passes it.
// The reader is driven exactly as in the staff app's RFID capture (see
// rfidReader.js); the list only lives on this page, and Clear empties it.
export default function RfidScanPage() {
  const [readerType, setReaderType] = useState('impinj');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Newest first: { epc, firstSeen, lastSeen, product } (product: undefined
  // while it is being looked up, null for a tag that isn't registered).
  const [items, setItems] = useState([]);
  const knownRef = useRef(new Set());
  const [detail, setDetail] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isImpinj = readerType === 'impinj';
  const connected = status === 'reading';

  // Adds tags not seen before, then looks up their products.
  const addTags = (tags) => {
    const now = new Date().toISOString();
    const fresh = [];
    tags.forEach((tag) => {
      if (!tag?.epc) return;
      const seenAt = tag.lastSeenTimeUtc || tag.seenAt || now;
      if (knownRef.current.has(tag.epc)) {
        setItems((prev) => prev.map((it) => (it.epc === tag.epc ? { ...it, lastSeen: seenAt } : it)));
        return;
      }
      knownRef.current.add(tag.epc);
      fresh.push({ epc: tag.epc, firstSeen: seenAt, lastSeen: seenAt, product: undefined });
    });
    if (!fresh.length) return;
    setItems((prev) => [...fresh.reverse(), ...prev]);
    fresh.forEach(async (it) => {
      const product = await lookupTagProduct(it.epc);
      setItems((prev) => prev.map((x) => (x.epc === it.epc ? { ...x, product } : x)));
    });
  };

  // Polling while connected, as in the app: Impinj tags in view every
  // 1.5 s (no overlapping requests), its status every 10th poll; virtual
  // readers ask /rfid/recent.
  useEffect(() => {
    if (!connected) return undefined;
    let cancelled = false;
    let inFlight = false;
    let tick = 0;
    const poll = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        if (isImpinj) {
          tick += 1;
          if (tick % STATUS_CHECK_EVERY_N_TICKS === 0) {
            const s = await getImpinjReaderStatus();
            if (cancelled) return;
            if (!s.isStarted) {
              setStatus('failed');
              setError(s.lastError || 'The connection to the reader was lost.');
              return;
            }
          }
          const tags = await getImpinjTagsInView();
          if (!cancelled) addTags(tags || []);
        } else {
          const tags = await getRecentTags();
          if (!cancelled) addTags(tags);
        }
      } catch (err) {
        // A missed poll is retried on the next tick.
      } finally {
        inFlight = false;
      }
    };
    poll();
    const timer = setInterval(poll, RFID_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, isImpinj]);

  const connect = async () => {
    setError('');
    if (!isImpinj) {
      await connectVirtualReader();
      setStatus('reading');
      return;
    }
    setBusy(true);
    setStatus('connecting');
    try {
      await connectAndStartImpinj();
      setStatus('reading');
    } catch (err) {
      setError(err?.message || 'Could not connect to the reader.');
      setStatus('failed');
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setStatus('idle');
    if (!isImpinj) {
      await disconnectVirtualReader();
      return;
    }
    setBusy(true);
    try {
      await stopAndDisconnectImpinj();
    } catch (err) {
      // The reader may already be gone; the page is disconnected either way.
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    knownRef.current = new Set();
    setItems([]);
  };

  const changeReaderType = async (next) => {
    if (connected) await disconnect();
    setError('');
    setStatus('idle');
    setReaderType(next);
  };

  const registered = items.filter((it) => it.product).length;
  const unregistered = items.filter((it) => it.product === null).length;

  return (
    <Box>
      <PageHeader
        icon={SensorsIcon}
        title="RFID Scan"
      />

      {/* Count and reader controls (2/5) beside the scanned products (3/5). */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 3fr' }, gap: 2, alignItems: 'start' }}>
        <Paper sx={{ p: { xs: 2, md: 3 }, textAlign: 'center' }}>
          <Typography sx={{ fontSize: { xs: '3.5rem', md: '4.5rem' }, fontWeight: 300, lineHeight: 1, color: 'text.primary' }} aria-live="polite">
            {registered}
          </Typography>
          <Typography sx={{ ...TEXT, mt: 1, letterSpacing: '0.18em', fontWeight: 600, color: 'text.secondary' }}>
            {registered === 1 ? 'PRODUCT SCANNED' : 'PRODUCTS SCANNED'}
          </Typography>
          {unregistered > 0 && (
            <Typography color="text.secondary" sx={{ ...TEXT, mt: 0.5 }}>
              and {unregistered} unregistered {unregistered === 1 ? 'tag' : 'tags'}
            </Typography>
          )}

          <TextField
            select
            size="small"
            fullWidth
            label="Reader"
            value={readerType}
            onChange={(e) => changeReaderType(e.target.value)}
            disabled={busy}
            sx={{ mt: 3, textAlign: 'left' }}
          >
            {RFID_READER_TYPES.map((r) => <MenuItem key={r.key} value={r.key}>{r.label}</MenuItem>)}
          </TextField>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mt: 1.5 }}>
            <Button
              variant="contained"
              color={connected ? 'error' : 'primary'}
              startIcon={busy ? <CircularProgress size={18} color="inherit" /> : connected ? <BluetoothDisabledIcon /> : <BluetoothIcon />}
              onClick={connected ? disconnect : connect}
              disabled={busy}
              sx={{ flex: 1 }}
            >
              {connected ? 'Disconnect' : 'Connect'}
            </Button>
            <Button variant="outlined" startIcon={<ClearAllIcon />} onClick={clear} disabled={!items.length}>
              Clear
            </Button>
            <Tooltip title="Reader settings">
              <IconButton onClick={() => setSettingsOpen(true)} aria-label="Reader settings" sx={{ border: 1, borderColor: 'divider' }}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Stack>

          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mt: 2 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: STATUS_COLOR[status], flexShrink: 0 }} />
            <Typography color="text.secondary" sx={TEXT}>
              {isImpinj ? IMPINJ_READER_DISPLAY_NAME : `${RFID_READER_TYPES.find((r) => r.key === readerType)?.label} reader`} · {STATUS_TEXT[status]}
            </Typography>
          </Stack>
          {!isImpinj && (
            <Typography color="text.secondary" sx={{ ...TEXT, display: 'block', mt: 0.5 }}>
              A browser can't reach this reader directly; it connects virtually and lists the tags the reader reports to the server.
            </Typography>
          )}
          {!!error && <Alert severity="error" sx={{ ...TEXT, mt: 2, textAlign: 'left' }}>{error}</Alert>}
          {RFID_TEST_MODE && (
            <Alert severity="info" sx={{ ...TEXT, mt: 2, textAlign: 'left' }}>
              Test mode: Connect uses dummy tags, and no reader is contacted.
            </Alert>
          )}
        </Paper>

        <Paper sx={{ p: { xs: 2, md: 2.5 }, minHeight: { md: 'calc(100vh - 230px)' } }}>
          <Typography sx={{ ...TEXT, fontWeight: 700, mb: 1.5 }}>Scanned products</Typography>
          {items.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <SensorsIcon sx={{ fontSize: 44, color: 'text.disabled' }} />
              <Typography color="text.secondary" sx={{ ...TEXT, mt: 1 }}>
                {connected ? 'Waiting for tags… Hold a tagged product near the reader.' : 'Connect a reader to start scanning.'}
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1}>
              {items.map((it) => <ScannedRow key={it.epc} item={it} onOpen={() => setDetail(it)} />)}
            </Stack>
          )}
        </Paper>
      </Box>

      <ProductDetailDialog
        open={!!detail}
        product={detail?.product}
        loadProduct={detail?.product?._id ? () => fetchProduct(detail.product._id) : null}
        onClose={() => setDetail(null)}
      />
      <ReaderSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Box>
  );
}

function ScannedRow({ item, onOpen }) {
  const p = item.product;
  const image = p ? normalizeProductImages(p.images)[0] : '';
  const facts = p ? [p.color && `Color: ${p.color}`, p.size && `Size: ${p.size}`].filter(Boolean) : [];
  const price = p ? formatPrice(p.price, p.currency) : '';
  return (
    <Paper variant="outlined" sx={{ px: 1.5, py: 1, display: 'flex', alignItems: 'center', gap: 1.5, borderRadius: 2 }}>
      <Box sx={{ width: 48, height: 48, borderRadius: 1, bgcolor: 'grey.100', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {image ? (
          <img src={getFileUrl(image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : p === undefined ? (
          <CircularProgress size={18} />
        ) : (
          <InventoryIcon sx={{ color: 'text.disabled', fontSize: 24 }} />
        )}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ ...TEXT, fontWeight: 700 }} noWrap>
          {p ? p.name || 'Unnamed product' : p === null ? 'Unregistered tag' : 'Looking up…'}
          {!!p?.brandInfo?.name && <Box component="span" sx={{ fontWeight: 400, color: 'text.secondary' }}>{` (Brand: ${p.brandInfo.name})`}</Box>}
        </Typography>
        <Typography sx={{ ...TEXT, color: 'text.secondary' }} noWrap>
          {[...facts, item.epc].join(' · ')}
        </Typography>
      </Box>
      {p === null && <Chip size="small" label="Not registered" variant="outlined" sx={TEXT} />}
      {!!price && <Typography sx={{ ...TEXT, fontWeight: 700, color: 'primary.main', whiteSpace: 'nowrap' }}>{price}</Typography>}
      {p && (
        <Button size="small" variant="outlined" endIcon={<ChevronRightIcon />} onClick={onOpen} sx={{ ...TEXT, whiteSpace: 'nowrap' }}>
          Product details
        </Button>
      )}
    </Paper>
  );
}

// The app's reader settings form (Impinj R700 connection), saved to the
// reader service.
function ReaderSettingsDialog({ open, onClose }) {
  const [form, setForm] = useState(IMPINJ_DEFAULT_READER_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setLoading(true);
    getImpinjReaderSettings()
      .then((current) => setForm({ ...IMPINJ_DEFAULT_READER_SETTINGS, ...current }))
      .catch((err) => setError(err?.message || 'Could not load the reader settings.'))
      .finally(() => setLoading(false));
  }, [open]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setNumber = (key) => (e) => setForm((f) => ({ ...f, [key]: Number(String(e.target.value).replace(/[^0-9]/g, '')) || 0 }));
  const setFlag = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.checked }));

  const save = async () => {
    setError('');
    if (!String(form.ipAddress || '').trim()) {
      setError('IP address is required.');
      return;
    }
    if (!Number.isInteger(form.port) || form.port < 1 || form.port > 65535) {
      setError('Port must be a number between 1 and 65535.');
      return;
    }
    setSaving(true);
    try {
      const applied = await updateImpinjReaderSettings(form);
      setForm({ ...IMPINJ_DEFAULT_READER_SETTINGS, ...applied });
      onClose();
    } catch (err) {
      setError(err?.message || 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  const antennas = form.availableAntennaPorts || [];
  const enabled = form.enabledAntennaPorts || antennas;
  const toggleAntenna = (port) => setForm((f) => {
    const current = f.enabledAntennaPorts ?? f.availableAntennaPorts ?? [];
    const next = current.includes(port) ? current.filter((x) => x !== port) : [...current, port].sort((a, b) => a - b);
    return { ...f, enabledAntennaPorts: next };
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Reader settings</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {IMPINJ_READER_DISPLAY_NAME}. These are the connection settings the reader service uses.
        </Typography>
        {loading ? (
          <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress /></Box>
        ) : (
          <Stack spacing={2}>
            <TextField label="Reader name" value={form.readerName} onChange={set('readerName')} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="IP address" value={form.ipAddress} onChange={set('ipAddress')} fullWidth />
              <TextField label="Port" value={String(form.port)} onChange={setNumber('port')} sx={{ width: 140 }} inputProps={{ inputMode: 'numeric' }} />
            </Stack>
            <TextField label="Connection timeout (ms)" value={String(form.connectionTimeoutMs)} onChange={setNumber('connectionTimeoutMs')} inputProps={{ inputMode: 'numeric' }} />
            <FormControlLabel control={<Switch checked={!!form.autoReconnect} onChange={setFlag('autoReconnect')} />} label="Reconnect automatically" />
            {form.autoReconnect && (
              <Stack spacing={2} sx={{ pl: 2 }}>
                <TextField label="Reconnect interval (ms)" value={String(form.reconnectIntervalMs)} onChange={setNumber('reconnectIntervalMs')} inputProps={{ inputMode: 'numeric' }} />
                <FormControlLabel control={<Switch checked={!!form.unlimitedReconnectAttempts} onChange={setFlag('unlimitedReconnectAttempts')} />} label="Unlimited reconnect attempts" />
                {!form.unlimitedReconnectAttempts && (
                  <TextField label="Maximum reconnect attempts" value={String(form.maxReconnectAttempts)} onChange={setNumber('maxReconnectAttempts')} inputProps={{ inputMode: 'numeric' }} />
                )}
              </Stack>
            )}
            <FormControlLabel control={<Switch checked={!!form.autoConnectOnStartup} onChange={setFlag('autoConnectOnStartup')} />} label="Connect when the service starts" />
            {antennas.length > 0 && (
              <Box>
                <Typography variant="body2" sx={{ mb: 0.5 }}>Enabled antennas</Typography>
                {antennas.map((port) => (
                  <FormControlLabel key={port} control={<Checkbox checked={enabled.includes(port)} onChange={() => toggleAntenna(port)} />} label={`Antenna ${port}`} />
                ))}
              </Box>
            )}
            {!!error && <Alert severity="error">{error}</Alert>}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={saving || loading}>{saving ? 'Saving…' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  );
}
