import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Stack, Tab, Tabs,
  TextField, Tooltip, Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import PageHeader from '../../components/PageHeader';
import Loader from '../../components/Loader';
import { getFileUrl, getServiceRequests, updateServiceRequest } from '../../helper';
import { notifyError, notifySuccess } from '../../utils/feedbackBus';
import { NEXT_STATUS, REQUEST_STATUS, SERVICE_KINDS, SERVICE_META } from '../../utils/circularity';
import { SERVICE_ICONS } from '../products/CircularityEditor';

const TABS = [
  { value: 'open', label: 'To do' },
  { value: 'completed', label: 'Completed' },
  { value: 'declined', label: 'Declined' },
  { value: 'cancelled', label: 'Cancelled' },
];
const OPEN = ['new', 'accepted', 'in_progress'];

const formatWhen = (d) => {
  if (!d) return '';
  try { return new Date(d).toLocaleString(); } catch (e) { return ''; }
};

// What the "move to" buttons say, from the brand's side.
const ACTION_LABEL = { accepted: 'Accept', in_progress: 'Start work', completed: 'Mark as completed', declined: 'Decline' };

// One request: what the shopper asked, who they are, and the brand's answer.
function RequestDialog({ request, canWrite, onClose, onSaved, token }) {
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setReply(request?.reply || ''); }, [request]);
  if (!request) return null;
  const meta = SERVICE_META[request.kind];
  const status = REQUEST_STATUS[request.status] || REQUEST_STATUS.new;
  const moves = NEXT_STATUS[request.status] || [];

  const save = async (nextStatus) => {
    if (nextStatus === 'declined' && !reply.trim()) {
      notifyError('Please write a short reason, so the shopper knows why.');
      return;
    }
    setBusy(true);
    const res = await updateServiceRequest(token, request._id, { status: nextStatus, reply: reply.trim() });
    setBusy(false);
    if (!res.ok) {
      notifyError(res.message);
      return;
    }
    notifySuccess(nextStatus ? 'Request updated. The shopper has been notified.' : 'Message sent to the shopper.');
    onSaved(res.data);
  };

  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {meta.title} request {request.ref}
        <IconButton onClick={onClose} color="inherit" aria-label="Close" disabled={busy}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip color={status.color} label={status.label} />
            <Typography color="text.secondary">Sent {formatWhen(request.createdAt)}</Typography>
          </Stack>
          <Box>
            <Typography variant="body2" color="text.secondary">Product</Typography>
            <Typography sx={{ fontWeight: 600 }}>
              {request.product_id?.name || request.productName || 'Product'}
              {request.qrcode_id ? ` · item #${request.qrcode_id}` : ''}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">What the shopper wrote</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{request.message}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Shopper</Typography>
            <Typography>{request.contact?.name || 'No name given'}</Typography>
            {request.contact?.email && <Typography><a href={`mailto:${request.contact.email}`}>{request.contact.email}</a></Typography>}
            {request.contact?.phone && <Typography><a href={`tel:${request.contact.phone}`}>{request.contact.phone}</a></Typography>}
          </Box>
          <TextField
            label="Your message to the shopper"
            placeholder="e.g. We can repair this for €15. Please send the jacket to…"
            helperText="Shown to the shopper in the app together with the status."
            multiline minRows={3} fullWidth
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            disabled={!canWrite || busy}
            inputProps={{ maxLength: 1500 }}
          />
          {!canWrite && <Alert severity="info">Only a Supervisor or the company account can answer requests.</Alert>}
          {(request.history || []).length > 1 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>History</Typography>
              {request.history.map((h, i) => (
                <Typography key={i} variant="body2">
                  {formatWhen(h.at)} · {(REQUEST_STATUS[h.status] || {}).label || h.status}{h.by ? ` · ${h.by}` : ''}
                </Typography>
              ))}
            </Box>
          )}
        </Stack>
      </DialogContent>
      {canWrite && (
        <DialogActions sx={{ px: 3, py: 2, flexWrap: 'wrap', gap: 1 }}>
          {moves.includes('declined') && (
            <Button color="error" disabled={busy} onClick={() => save('declined')} sx={{ mr: 'auto' }}>Decline</Button>
          )}
          <Button disabled={busy || reply.trim() === (request.reply || '')} onClick={() => save('')}>Send message only</Button>
          {moves.filter((m) => m !== 'declined').map((m, i, list) => (
            <Button key={m} variant={i === list.length - 1 || list.length === 1 ? 'contained' : 'outlined'} disabled={busy} onClick={() => save(m)}>
              {ACTION_LABEL[m]}
            </Button>
          ))}
        </DialogActions>
      )}
    </Dialog>
  );
}

// Service Requests: what shoppers asked for from the app (repair, resale,
// rental, recycling), for the brand to answer. Each answer and change of
// status is sent to the shopper as a notification.
export default function ServiceRequestsPage({ token, showCompany = false, onOpenProducts }) {
  const [tab, setTab] = useState('open');
  const [kind, setKind] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [canWrite, setCanWrite] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    const res = await getServiceRequests(token, { status: tab, kind });
    setLoading(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setRows(res.data);
    setCounts(res.counts);
    setCanWrite(res.canWrite);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, kind, token]);

  const openCount = OPEN.reduce((sum, s) => sum + (counts[s] || 0), 0);
  const tabCount = (value) => (value === 'open' ? openCount : counts[value] || 0);
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <Box>
      <PageHeader
        title="Service Requests"
        description="Repair, resale, rental and recycling requests your shoppers sent from the app."
        actions={(
          <>
            <TextField select size="small" value={kind} onChange={(e) => setKind(e.target.value)} inputProps={{ 'aria-label': 'Service' }} sx={{ minWidth: 190, bgcolor: 'background.paper' }} SelectProps={{ displayEmpty: true }}>
              <MenuItem value="">All services</MenuItem>
              {SERVICE_KINDS.map((k) => <MenuItem key={k} value={k}>{SERVICE_META[k].title}</MenuItem>)}
            </TextField>
            <Tooltip title="Reload">
              <IconButton color="primary" onClick={load} aria-label="Reload requests"><RefreshIcon /></IconButton>
            </Tooltip>
          </>
        )}
      />

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }} variant="scrollable" allowScrollButtonsMobile>
        {TABS.map((t) => <Tab key={t.value} value={t.value} label={`${t.label} (${tabCount(t.value)})`} />)}
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Loader label="Loading requests…" />}

      {!loading && !error && rows.length === 0 && (
        <Box sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, p: 3, textAlign: 'center' }}>
          {total === 0 && !kind ? (
            <>
              <Typography variant="h6" component="p" sx={{ mb: 0.5 }}>No requests yet</Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 560, mx: 'auto', mb: 2 }}>
                Shoppers can send a request once a product offers a service with “Let shoppers send a request in the app” switched on. Open a product, go to step 4 “Repair & disposal”, and switch it on for repair, resale, rental or recycling.
              </Typography>
              {onOpenProducts && <Button variant="contained" onClick={onOpenProducts}>Go to Products</Button>}
            </>
          ) : (
            <Typography color="text.secondary">Nothing here{kind ? ` for ${SERVICE_META[kind].title.toLowerCase()}` : ''}.</Typography>
          )}
        </Box>
      )}

      {!loading && rows.length > 0 && (
        <Stack spacing={1.5}>
          {rows.map((row) => {
            const Icon = SERVICE_ICONS[row.kind];
            const status = REQUEST_STATUS[row.status] || REQUEST_STATUS.new;
            const thumb = Array.isArray(row.product_id?.images) ? row.product_id.images[0] : null;
            return (
              <Box
                key={row._id}
                sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap', bgcolor: '#fff', border: '1px solid', borderColor: row.status === 'new' ? 'warning.main' : 'divider', borderRadius: 2, p: 1.5 }}
              >
                <Box
                  component="img" alt=""
                  src={thumb ? getFileUrl(thumb) : undefined}
                  sx={{ width: 56, height: 56, borderRadius: 1.5, objectFit: 'cover', bgcolor: '#eef1f6', flexShrink: 0, visibility: thumb ? 'visible' : 'hidden' }}
                />
                <Box sx={{ flex: '1 1 320px', minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Chip size="small" icon={<Icon />} label={SERVICE_META[row.kind].title} variant="outlined" />
                    <Typography variant="subtitle1">{row.product_id?.name || row.productName || 'Product'}</Typography>
                    <Chip size="small" color={status.color} label={status.label} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {[row.ref, row.contact?.name, formatWhen(row.createdAt), showCompany && row.company_id?.name].filter(Boolean).join(' · ')}
                  </Typography>
                  <Typography sx={{ mt: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'anywhere' }}>
                    {row.message}
                  </Typography>
                </Box>
                <Button variant={OPEN.includes(row.status) && canWrite ? 'contained' : 'outlined'} onClick={() => setSelected(row)} sx={{ flexShrink: 0 }}>
                  {OPEN.includes(row.status) && canWrite ? 'Answer' : 'Open'}
                </Button>
              </Box>
            );
          })}
        </Stack>
      )}

      <RequestDialog
        request={selected}
        canWrite={canWrite}
        token={token}
        onClose={() => setSelected(null)}
        onSaved={() => { setSelected(null); load(); }}
      />
    </Box>
  );
}
