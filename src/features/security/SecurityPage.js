import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import BlockIcon from '@mui/icons-material/Block';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import ReplayIcon from '@mui/icons-material/Replay';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PageHeader from '../../components/PageHeader';
import Loader from '../../components/Loader';
import { getFileUrl, getSecurityInsights, setItemBlocked } from '../../helper';
import { confirmAction, notifyError, notifySuccess } from '../../utils/feedbackBus';

const PERIODS = [
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 365, label: 'Last 12 months' },
];

const LEVELS = {
  high: { label: 'Likely copy', color: 'error' },
  medium: { label: 'Worth a look', color: 'warning' },
  none: { label: 'No warning signs', color: 'default' },
};

const formatWhen = (d) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleString();
  } catch (e) {
    return '';
  }
};

function Kpi({ icon: Icon, label, value, sub, color = 'primary.main' }) {
  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, p: 2, display: 'flex', gap: 1.5, alignItems: 'center', minWidth: 0 }}>
      <Icon sx={{ fontSize: 34, color }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" component="p" sx={{ lineHeight: 1.1 }}>{value}</Typography>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </Box>
    </Box>
  );
}

// Horizontal bars: [{ label, value }]. The longest bar fills the row.
function Bars({ rows, unit, color = '#2f80c8', emptyText }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.some((r) => r.value > 0)) return <Typography color="text.secondary">{emptyText}</Typography>;
  return (
    <Stack spacing={1}>
      {rows.map((r) => (
        <Box key={r.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body2" sx={{ width: 120, flexShrink: 0 }} noWrap title={r.label}>{r.label}</Typography>
          <Box sx={{ flex: 1, height: 18, bgcolor: '#eef1f6', borderRadius: 1, overflow: 'hidden' }}>
            <Box sx={{ width: `${(r.value / max) * 100}%`, height: '100%', bgcolor: color, borderRadius: 1, minWidth: r.value ? 4 : 0 }} />
          </Box>
          <Typography variant="body2" sx={{ width: 90, flexShrink: 0, textAlign: 'right', fontWeight: 600 }}>
            {r.value.toLocaleString()} {unit}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}

const Section = ({ title, description, children }) => (
  <Box sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, p: 2 }}>
    <Typography variant="h6" component="h2" sx={{ mb: description ? 0.25 : 1.5 }}>{title}</Typography>
    {description && <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{description}</Typography>}
    {children}
  </Box>
);

// Security: how often each label is scanned, where, and which labels behave
// like copies. A genuine label is on one item; a copied one turns up in
// places the item could not have reached in time. The brand decides what to
// do with a flagged label — blocking it warns every shopper who scans it.
export default function SecurityPage({ token, canBlock, onOpenItem }) {
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [busyKey, setBusyKey] = useState('');

  const load = async (period = days) => {
    setLoading(true);
    setError('');
    const res = await getSecurityInsights(token, period);
    setLoading(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setData(res.data);
  };

  useEffect(() => {
    load(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, token]);

  const toggleBlocked = async (row) => {
    const blocking = !row.blocked;
    const sure = await confirmAction(blocking
      ? {
          title: 'Mark this code as a suspected copy?',
          message: `Everyone who scans code #${row.qrcodeId} of "${row.productName}" will see a warning that it may be a copy. The genuine item carries the same label, so its owner sees the warning too. You can undo this at any time.`,
          confirmText: 'Mark as suspected copy',
          danger: true,
        }
      : {
          title: 'Remove the warning?',
          message: `Code #${row.qrcodeId} of "${row.productName}" will show as authenticated again.`,
          confirmText: 'Remove warning',
        });
    if (!sure) return;
    const key = `${row.productId}:${row.qrcodeId}`;
    setBusyKey(key);
    const res = await setItemBlocked(token, row.productId, row.qrcodeId, blocking, blocking ? row.reasons.join(' ') : '');
    setBusyKey('');
    if (!res.ok) {
      notifyError(res.message);
      return;
    }
    notifySuccess(blocking ? 'Label marked. Shoppers who scan it now see a warning.' : 'Warning removed.');
    load(days);
  };

  const totals = data?.totals;

  return (
    <Box>
      <PageHeader
        title="Security"
        description="Codes that behave like copies, and how often your codes are scanned."
        actions={(
          <>
            <TextField select size="small" value={days} onChange={(e) => setDays(Number(e.target.value))} inputProps={{ 'aria-label': 'Period' }} sx={{ minWidth: 170, bgcolor: 'background.paper' }}>
              {PERIODS.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
            </TextField>
            <Tooltip title="Reload">
              <IconButton color="primary" onClick={() => load(days)} aria-label="Reload security overview"><RefreshIcon /></IconButton>
            </Tooltip>
          </>
        )}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Loader label="Checking your codes…" />}

      {!loading && data && (
        <Stack spacing={2}>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' } }}>
            <Kpi icon={QrCodeScannerIcon} value={totals.itemsScanned.toLocaleString()} label="Codes scanned" sub={`${totals.scans.toLocaleString()} scans in total`} />
            <Kpi icon={ReplayIcon} value={totals.repeatItems.toLocaleString()} label="Scanned more than once" />
            <Kpi
              icon={GppMaybeIcon}
              value={(totals.highRisk + totals.mediumRisk).toLocaleString()}
              label="Codes with warning signs"
              sub={`${totals.highRisk} likely copies, ${totals.mediumRisk} worth a look`}
              color={totals.highRisk ? 'error.main' : totals.mediumRisk ? 'warning.main' : 'success.main'}
            />
            <Kpi
              icon={VerifiedUserIcon}
              value={totals.securityVerified.toLocaleString()}
              label="Security QR checks passed"
              sub={`${totals.securityFailed} failed · ${totals.blocked} codes marked as copies`}
              color={totals.securityFailed ? 'error.main' : 'success.main'}
            />
          </Box>

          <Section
            title="Codes to check"
            description="Location comes from the scanner's GPS or internet address, which can be wrong (for example with a VPN). Treat these as reasons to look, then decide."
          >
            {data.suspects.length === 0 ? (
              <Alert severity="success">No label shows warning signs in this period.</Alert>
            ) : (
              <Stack spacing={1.5}>
                {data.suspects.map((row) => {
                  const key = `${row.productId}:${row.qrcodeId}`;
                  const level = LEVELS[row.level] || LEVELS.none;
                  return (
                    <Box key={key} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap', border: '1px solid', borderColor: row.blocked ? 'error.main' : 'divider', borderRadius: 2, p: 1.5 }}>
                      <Box
                        component="img"
                        alt=""
                        src={row.productImage ? getFileUrl(row.productImage) : undefined}
                        sx={{ width: 56, height: 56, borderRadius: 1.5, objectFit: 'cover', bgcolor: '#eef1f6', flexShrink: 0, visibility: row.productImage ? 'visible' : 'hidden' }}
                      />
                      <Box sx={{ flex: '1 1 320px', minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Typography variant="subtitle1">{row.productName} · code #{row.qrcodeId}</Typography>
                          <Chip size="small" color={level.color} label={level.label} />
                          {row.blocked && <Chip size="small" color="error" variant="outlined" icon={<BlockIcon />} label="Marked as suspected copy" />}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {[row.pmcCode && `Passport ID ${row.pmcCode}`, `${row.scans} scans`, row.countries.length && row.countries.join(', '), row.lastScan && `last scanned ${formatWhen(row.lastScan)}`].filter(Boolean).join(' · ')}
                        </Typography>
                        {row.reasons.map((reason, i) => (
                          <Typography key={i} variant="body2" sx={{ mt: 0.5 }}>• {reason}</Typography>
                        ))}
                      </Box>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ flexShrink: 0 }}>
                        {onOpenItem && (
                          <Button variant="outlined" onClick={() => onOpenItem(row)}>See its history</Button>
                        )}
                        {canBlock && (
                          <Button
                            variant={row.blocked ? 'outlined' : 'contained'}
                            color={row.blocked ? 'primary' : 'error'}
                            disabled={busyKey === key}
                            onClick={() => toggleBlocked(row)}
                          >
                            {row.blocked ? 'Remove warning' : 'Mark as suspected copy'}
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Section>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
            <Section title="How many times each code was scanned" description="Most codes are scanned once or a few times. A long tail on the right is worth a look.">
              <Bars
                rows={data.repeatHistogram.map((b) => ({ label: `${b.label} ${b.label === '1' ? 'scan' : 'scans'}`, value: b.items }))}
                unit="codes"
                emptyText="No scans in this period."
              />
            </Section>
            <Section title="Scans by country">
              <Bars
                rows={data.countries.map((c) => ({ label: c.country, value: c.count }))}
                unit="scans"
                color="#3a9d6a"
                emptyText="No located scans in this period."
              />
            </Section>
          </Box>
        </Stack>
      )}
    </Box>
  );
}
