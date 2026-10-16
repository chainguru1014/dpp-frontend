import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
  MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import qrcode from 'qrcode';
import PageHeader from '../../components/PageHeader';
import Loader from '../../components/Loader';
import {
  listShipmentManifests, createShipmentManifest, getShipmentManifestHistory, deleteShipmentManifest,
} from '../../helper';
import { notifyError, notifySuccess, confirmAction } from '../../utils/feedbackBus';

const STATUS_META = {
  pending: { label: 'Pending', color: 'default' },
  complete: { label: 'Complete', color: 'success' },
  mismatch: { label: 'Mismatch', color: 'error' },
};

// Super admin + Supervisor ("company advisor") page: create a shipment's
// expected-item list (a specific qrcode_id range of one product), print its
// QR code for the physical box, and review RFID gate-scan results against
// it. The actual gate scan happens in the staff app (CorporateScannerScreen-
// adjacent flow) — this page is the setup + review side.
export default function ShipmentInspectionPage({ token, products }) {
  const [manifests, setManifests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  const refresh = async () => {
    setLoading(true);
    const res = await listShipmentManifests(token);
    if (res.ok) setManifests(res.data);
    else notifyError(res.message);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (manifest) => {
    const sure = await confirmAction({
      title: 'Delete this shipment manifest?',
      message: `"${manifest.label || manifest.manifest_code}" and its inspection history will be removed. This can't be undone.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!sure) return;
    const res = await deleteShipmentManifest(token, manifest._id);
    if (res.ok) {
      notifySuccess('Shipment manifest deleted.');
      refresh();
    } else {
      notifyError(res.message);
    }
  };

  return (
    <Box>
      <PageHeader
        icon={LocalShippingIcon}
        title="Shipment Inspection"
        description="Create a shipment's expected-item list, print its QR code for the box, and review RFID gate-scan results against it."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Create Manifest
          </Button>
        }
      />

      {loading ? (
        <Loader />
      ) : manifests.length === 0 ? (
        <Alert severity="info">No shipment manifests yet. Create one to get started.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Label</TableCell>
                <TableCell align="right">Items</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {manifests.map((m) => {
                const status = STATUS_META[m.status] || STATUS_META.pending;
                return (
                  <TableRow key={m._id} hover sx={{ cursor: 'pointer' }} onClick={() => setDetail(m)}>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{m.manifest_code}</TableCell>
                    <TableCell>{m.product_id?.name || '—'}</TableCell>
                    <TableCell>{m.label || '—'}</TableCell>
                    <TableCell align="right">{m.expected_qrcode_ids?.length ?? 0}</TableCell>
                    <TableCell><Chip size="small" label={status.label} color={status.color} /></TableCell>
                    <TableCell>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(m); }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CreateManifestDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        products={products}
        token={token}
        onCreated={(manifest) => {
          setCreateOpen(false);
          refresh();
          setDetail(manifest);
        }}
      />

      <ManifestDetailDialog manifest={detail} token={token} onClose={() => setDetail(null)} />
    </Box>
  );
}

function CreateManifestDialog({ open, onClose, products, token, onCreated }) {
  const [productId, setProductId] = useState('');
  const [fromItem, setFromItem] = useState('1');
  const [toItem, setToItem] = useState('');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setProductId('');
      setFromItem('1');
      setToItem('');
      setLabel('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!productId || !fromItem || !toItem) {
      notifyError('Pick a product and an item range.');
      return;
    }
    setBusy(true);
    const res = await createShipmentManifest(token, {
      product_id: productId,
      from_item: Number(fromItem),
      to_item: Number(toItem),
      label: label.trim(),
    });
    setBusy(false);
    if (res.ok) {
      notifySuccess('Shipment manifest created.');
      onCreated(res.data);
    } else {
      notifyError(res.message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Shipment Manifest</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField select label="Product" value={productId} onChange={(e) => setProductId(e.target.value)} fullWidth>
            {(products || []).map((p) => (
              <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={2}>
            <TextField
              label="From item #"
              type="number"
              value={fromItem}
              onChange={(e) => setFromItem(e.target.value)}
              fullWidth
              inputProps={{ min: 1 }}
            />
            <TextField
              label="To item #"
              type="number"
              value={toItem}
              onChange={(e) => setToItem(e.target.value)}
              fullWidth
              inputProps={{ min: 1 }}
            />
          </Stack>
          <TextField
            label="Label (optional)"
            placeholder="e.g. PO-4821"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            fullWidth
          />
          <Alert severity="info" variant="outlined">
            Only items whose QR codes already exist for this product can be included — generate those first if needed.
            Each expected item's RFID tag must also be paired to that specific unit (Generate Code → RFID Tag → pair),
            not just registered to the product generally, for a gate scan to ever match it.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={busy}>
          {busy ? 'Creating…' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ManifestDetailDialog({ manifest, token, onClose }) {
  const [qrImage, setQrImage] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!manifest) {
      setQrImage(null);
      setHistory([]);
      return undefined;
    }
    let cancelled = false;
    qrcode.toDataURL(manifest.manifest_code).then((url) => {
      if (!cancelled) setQrImage(url);
    }).catch(() => {});
    setHistoryLoading(true);
    getShipmentManifestHistory(token, manifest._id).then((res) => {
      if (cancelled) return;
      if (res.ok) setHistory(res.data);
      setHistoryLoading(false);
    });
    return () => { cancelled = true; };
  }, [manifest, token]);

  if (!manifest) return null;
  const status = STATUS_META[manifest.status] || STATUS_META.pending;

  return (
    <Dialog open={!!manifest} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{manifest.label || manifest.manifest_code}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Stack direction="row" spacing={3} alignItems="flex-start">
            {qrImage && (
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1, bgcolor: '#fff', flexShrink: 0 }}>
                <img src={qrImage} alt="Manifest QR" width={120} height={120} />
              </Box>
            )}
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">Code</Typography>
              <Typography sx={{ fontFamily: 'monospace' }}>{manifest.manifest_code}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Product</Typography>
              <Typography>{manifest.product_id?.name || '—'}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Expected items</Typography>
              <Typography>{manifest.expected_qrcode_ids?.length ?? 0}</Typography>
              <Chip size="small" label={status.label} color={status.color} sx={{ mt: 1, alignSelf: 'flex-start' }} />
            </Stack>
          </Stack>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Inspection history</Typography>
            {historyLoading ? (
              <Loader minHeight={80} />
            ) : history.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Not inspected yet — scan this manifest's QR in the staff app, then scan the gate.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {history.map((record) => (
                  <Paper key={record._id} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Chip
                        size="small"
                        label={record.result === 'pass' ? 'Complete' : 'Mismatch'}
                        color={record.result === 'pass' ? 'success' : 'error'}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {record.createdAt ? new Date(record.createdAt).toLocaleString() : ''}
                      </Typography>
                    </Stack>
                    {record.missing_qrcode_ids?.length > 0 && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Missing: {record.missing_qrcode_ids.join(', ')}
                      </Typography>
                    )}
                    {record.unexpected_epcs?.length > 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Unexpected tags: {record.unexpected_epcs.length}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
