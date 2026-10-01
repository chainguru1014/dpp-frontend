import React, { useMemo, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { pairTagsWithItems } from '../../helper';
import { useAuth } from '../auth/AuthContext';
import { parseCsv } from '../../utils/csv';

const TAG_TYPES = [
  { value: 'rfid', label: 'RFID tag (EPC)' },
  { value: 'nfc', label: 'NFC tag (ID)' },
  { value: 'barcode', label: 'Barcode' },
];

// Pair physical tags with individual items, so a tag and that item's QR code
// lead to the same passport and history. Two ways to give the list:
//   - one tag per line: tags are given to items in order, starting at an
//     item number (how tags come off a reader on a production line);
//   - two columns "item number, tag ID" for explicit pairs.
export default function PairTagsDialog({ open, onClose, product, totalItems }) {
  const { token } = useAuth();
  const [sourceType, setSourceType] = useState('rfid');
  const [startAt, setStartAt] = useState(1);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Rows with two filled cells are explicit pairs; otherwise it's a plain
  // list numbered from `startAt`. A header row ("item,tag") is skipped.
  const pairs = useMemo(() => {
    const rows = parseCsv(input).map((cells) => cells.map((c) => String(c).trim()).filter(Boolean));
    // Drop a header row such as "item,tag" or a lone "epc".
    const isHeader = (cells) => cells.every((c) => /^(item|item[ _]?(number|no|id)|number|no|tag|tag[ _]?id|epc|raw_value|value|id)$/i.test(c));
    const data = rows.filter((cells) => cells.length && !isHeader(cells));
    const explicit = data.length > 0 && data.every((cells) => cells.length >= 2 && /^\d+$/.test(cells[0]));
    if (explicit) return data.map((cells) => ({ qrcode_id: Number(cells[0]), raw_value: cells[1] }));
    const first = Math.max(1, Number(startAt) || 1);
    return data.map((cells, i) => ({ qrcode_id: first + i, raw_value: cells[cells.length - 1] }));
  }, [input, startAt]);

  const beyond = pairs.filter((p) => p.qrcode_id > totalItems).length;

  const close = () => {
    setResult(null);
    setError('');
    setInput('');
    onClose();
  };

  const loadFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setInput(await file.text());
    setResult(null);
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    const res = await pairTagsWithItems(token, product._id, sourceType, pairs);
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setResult(res.data);
  };

  return (
    <Dialog open={open} onClose={(e, reason) => { if (reason !== 'backdropClick') close(); }} fullWidth maxWidth="sm">
      <DialogTitle>Pair tags with items</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Ties each tag to one item of "{product?.name}". After pairing, reading the tag and scanning the item's QR code open the same
          passport and the same history. This product has {totalItems} item{totalItems === 1 ? '' : 's'} (QR codes).
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField select label="Tag type" value={sourceType} onChange={(e) => setSourceType(e.target.value)} sx={{ flex: 1 }}>
            {TAG_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
          </TextField>
          <TextField
            type="number"
            label="Start at item number"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            inputProps={{ min: 1 }}
            helperText="Used when the list has one tag per line."
            sx={{ flex: 1 }}
          />
        </Stack>
        <TextField
          label="Tag IDs"
          placeholder={'One tag per line:\nE28011700000020F1A2B3C01\nE28011700000020F1A2B3C02\n\nor item number, tag:\n12, E28011700000020F1A2B3C0C'}
          multiline
          minRows={7}
          maxRows={14}
          fullWidth
          value={input}
          onChange={(e) => { setInput(e.target.value); setResult(null); }}
        />
        <Button component="label" startIcon={<UploadFileIcon />} sx={{ mt: 1 }}>
          Load from a CSV file
          <input type="file" accept=".csv,text/csv,text/plain" hidden onChange={loadFile} />
        </Button>

        {pairs.length > 0 && !result && (
          <Alert severity={beyond ? 'warning' : 'info'} sx={{ mt: 2 }}>
            {pairs.length} tag{pairs.length === 1 ? '' : 's'} for items #{Math.min(...pairs.map((p) => p.qrcode_id))} to #{Math.max(...pairs.map((p) => p.qrcode_id))}.
            {beyond > 0 && ` ${beyond} of them point past item #${totalItems}: create more QR codes first, or those will be reported as errors.`}
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {result && (
          <Box sx={{ mt: 2 }}>
            <Alert severity={result.errors.length ? 'warning' : 'success'}>
              {result.paired} paired{result.unchanged ? `, ${result.unchanged} were already paired` : ''}{result.errors.length ? `, ${result.errors.length} could not be paired` : ''}.
            </Alert>
            {result.errors.slice(0, 50).map((e, i) => (
              <Typography key={i} variant="body2" sx={{ mt: 0.5 }}>
                Item #{e.qrcode_id} · {e.raw_value || '(no tag)'}: {e.message}
              </Typography>
            ))}
            {result.errors.length > 50 && <Typography variant="body2" sx={{ mt: 0.5 }}>…and {result.errors.length - 50} more.</Typography>}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>{result ? 'Close' : 'Cancel'}</Button>
        {!result && (
          <Button variant="contained" onClick={submit} disabled={busy || pairs.length === 0}>
            {busy ? 'Pairing…' : `Pair ${pairs.length || ''} tag${pairs.length === 1 ? '' : 's'}`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
