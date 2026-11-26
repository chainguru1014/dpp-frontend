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
// List columns: photo, product and request, consumer, received, status, action.
const GRID = '56px minmax(0, 2.4fr) minmax(0, 1.3fr) 150px 120px 120px';

// "25 Nov 2026, 11:51": day first, no seconds (easier to read than 11/25/2026, 11:51:10 AM).
const formatWhen = (d) => {
  if (!d) return '';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  return x.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const productThumb = (r) => (Array.isArray(r?.product_id?.images) ? r.product_id.images[0] : null);
const Label = ({ children }) => (
  <Typography sx={{ fontSize: 13, letterSpacing: 0.4, textTransform: 'uppercase', color: 'text.secondary', mb: 0.5 }}>{children}</Typography>
);

// What the "move to" buttons say, from the brand's side.
const ACTION_LABEL = { accepted: 'Accept', in_progress: 'Start work', completed: 'Mark as completed', declined: 'Decline' };

// One request: what the consumer asked, who they are, and the brand's answer.
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
      notifyError('Please write a short reason, so the consumer knows why.');
      return;
    }
    setBusy(true);
    const res = await updateServiceRequest(token, request._id, { status: nextStatus, reply: reply.trim() });
    setBusy(false);
    if (!res.ok) {
      notifyError(res.message);
      return;
    }
    notifySuccess(nextStatus ? 'Request updated. The consumer has been notified.' : 'Message sent to the consumer.');
    onSaved(res.data);
  };

  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {meta.title} request {request.ref}
        <IconButton onClick={onClose} color="inherit" aria-label="Close" disabled={busy}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {/* What and which product */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box component="img" alt="" src={productThumb(request) ? getFileUrl(productThumb(request)) : undefined}
              sx={{ width: 64, height: 64, borderRadius: 2, objectFit: 'cover', bgcolor: '#eef1f6', flexShrink: 0, visibility: productThumb(request) ? 'visible' : 'hidden' }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 18, fontWeight: 600 }}>
                {request.product_id?.name || request.productName || 'Product'}
                {request.qrcode_id ? <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>{` · item #${request.qrcode_id}`}</Box> : null}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                <Chip size="small" variant="outlined" label={meta.title} />
                <Chip size="small" color={status.color} label={status.label} />
                <Typography variant="body2" color="text.secondary">Received {formatWhen(request.createdAt)}</Typography>
              </Stack>
            </Box>
          </Stack>

          {/* The consumer's words */}
          <Box>
            <Label>Request</Label>
            <Box sx={{ bgcolor: '#f5f7fa', borderRadius: 2, px: 2, py: 1.5 }}>
              <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{request.message}</Typography>
            </Box>
          </Box>

          {/* Who sent it */}
          <Box>
            <Label>Consumer</Label>
            <Typography>{request.contact?.name || 'No name given'}</Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              {request.contact?.email && <Typography variant="body2"><a href={`mailto:${request.contact.email}`}>{request.contact.email}</a></Typography>}
              {request.contact?.phone && <Typography variant="body2"><a href={`tel:${request.contact.phone}`}>{request.contact.phone}</a></Typography>}
            </Stack>
          </Box>

          {/* The brand's answer */}
          <Box>
            <Label>Your answer</Label>
            <TextField
              placeholder="e.g. We can repair this for €15. Please send the jacket to…"
              helperText="The consumer sees it in the app together with the status."
              multiline minRows={3} fullWidth
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              disabled={!canWrite || busy}
              inputProps={{ maxLength: 1500, 'aria-label': 'Your answer to the consumer' }}
            />
          </Box>
          {!canWrite && <Alert severity="info">Only a Supervisor or the company account can respond to requests.</Alert>}

          {(request.history || []).length > 1 && (
            <Box>
              <Label>History</Label>
              <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
                {request.history.map((h, i) => (
                  <Box component="li" key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', pb: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: i === request.history.length - 1 ? 'primary.main' : '#c7cfda', mt: '6px', flexShrink: 0 }} />
                    <Typography variant="body2">
                      <b>{(REQUEST_STATUS[h.status] || {}).label || h.status}</b>
                      <Box component="span" sx={{ color: 'text.secondary' }}>{` · ${formatWhen(h.at)}${h.by ? ` · ${h.by}` : ''}`}</Box>
                    </Typography>
                  </Box>
                ))}
              </Box>
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

// Service Requests: what consumers asked for from the app (repair, resale,
// rental, recycling), for the brand to answer. Each answer and change of
// status is sent to the consumer as a notification.
// Layout (2026-11-26): one list panel; each row = photo, product + service +
// the request's first line, consumer + reference, date, status, one action;
// new requests carry an amber marker on the left.
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
        description="Repair, resale, rental and recycling requests consumers sent from the app."
        actions={(
          <>
            <TextField select size="small" value={kind} onChange={(e) => setKind(e.target.value)} inputProps={{ 'aria-label': 'Service' }} sx={{ minWidth: 190, bgcolor: 'background.paper' }} SelectProps={{ displayEmpty: true }}>
              <MenuItem value="">All services</MenuItem>
              {SERVICE_KINDS.map((k) => <MenuItem key={k} value={k}>{SERVICE_META[k].title}</MenuItem>)}
            </TextField>
          </>
        )}
        moreActions={[{ label: 'Reload', icon: RefreshIcon, onClick: load }]}
      />

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable" allowScrollButtonsMobile>
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
                Consumers can send a request once a product offers a service with “Let shoppers send a request in the app” switched on. Open a product, go to step 4 “Repair & disposal”, and switch it on for repair, resale, rental or recycling.
              </Typography>
              {onOpenProducts && <Button variant="contained" onClick={onOpenProducts}>Go to Products</Button>}
            </>
          ) : (
            <Typography color="text.secondary">Nothing here{kind ? ` for ${SERVICE_META[kind].title.toLowerCase()}` : ''}.</Typography>
          )}
        </Box>
      )}

      {!loading && rows.length > 0 && (
        <Box sx={{ bgcolor: '#fff', borderRadius: 3, boxShadow: '0 1px 3px rgba(16,42,67,0.06)', overflow: 'hidden' }}>
          {/* Column names (wide screens) */}
          <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: GRID, gap: 2, px: 2.5, py: 1.25, bgcolor: '#f7f9fb', borderBottom: '1px solid', borderColor: 'divider' }}>
            {['', 'Product and request', 'Consumer', 'Received', 'Status', ''].map((h, i) => (
              <Typography key={i} sx={{ fontSize: 13, color: 'text.secondary' }}>{h}</Typography>
            ))}
          </Box>
          {rows.map((row, i) => {
            const Icon = SERVICE_ICONS[row.kind];
            const status = REQUEST_STATUS[row.status] || REQUEST_STATUS.new;
            const thumb = productThumb(row);
            const actionable = OPEN.includes(row.status) && canWrite;
            return (
              <Box
                key={row._id}
                sx={{
                  position: 'relative', display: 'grid', gridTemplateColumns: { xs: '56px 1fr', md: GRID }, gap: { xs: 1.5, md: 2 }, alignItems: 'center',
                  px: 2.5, py: 1.75, borderTop: i ? '1px solid' : 0, borderColor: 'divider', '&:hover': { bgcolor: '#fafbfd' },
                }}
              >
                {row.status === 'new' && <Box aria-hidden sx={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 4, borderRadius: '0 4px 4px 0', bgcolor: 'warning.main' }} />}
                <Box component="img" alt="" src={thumb ? getFileUrl(thumb) : undefined}
                  sx={{ width: 56, height: 56, borderRadius: 2, objectFit: 'cover', bgcolor: '#eef1f6', visibility: thumb ? 'visible' : 'hidden', gridRow: { xs: 'span 2', md: 'auto' } }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 16 }} noWrap>{row.product_id?.name || row.productName || 'Product'}</Typography>
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.secondary', mt: 0.25 }}>
                    {Icon && <Icon sx={{ fontSize: 17 }} />}
                    <Typography variant="body2" sx={{ flexShrink: 0 }}>{SERVICE_META[row.kind].title}</Typography>
                    {!!row.message && <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>{`· “${String(row.message).split('\n')[0]}”`}</Typography>}
                  </Stack>
                </Box>
                <Box sx={{ minWidth: 0, gridColumn: { xs: '2', md: 'auto' } }}>
                  <Typography noWrap>{row.contact?.name || 'No name given'}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {[row.ref, showCompany && row.company_id?.name].filter(Boolean).join(' · ')}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>{formatWhen(row.createdAt)}</Typography>
                <Box sx={{ display: { xs: 'none', md: 'block' } }}><Chip size="small" color={status.color} label={status.label} /></Box>
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' }, display: 'flex', justifyContent: 'flex-end', gap: 1, alignItems: 'center' }}>
                  <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1, alignItems: 'center', mr: 'auto' }}>
                    <Chip size="small" color={status.color} label={status.label} />
                    <Typography variant="body2" color="text.secondary">{formatWhen(row.createdAt)}</Typography>
                  </Box>
                  <Button variant={actionable ? 'contained' : 'outlined'} onClick={() => setSelected(row)} sx={{ minWidth: 104 }}>
                    {actionable ? 'Answer' : 'View'}
                  </Button>
                </Box>
              </Box>
            );
          })}
        </Box>
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
