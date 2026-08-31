import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Stack, TextField, MenuItem, Button, Table,
  TableHead, TableRow, TableCell, TableBody, Paper, IconButton, Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import SellIcon from '@mui/icons-material/Sell';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PublicIcon from '@mui/icons-material/Public';
import VerifiedIcon from '@mui/icons-material/Verified';
import { getAnalytics } from '../../helper';
import Loader from '../../components/Loader';

// Blue / gray / white family only.
const COLORS = ['#1b4f72', '#4a96dd', '#5b9bd8', '#8aa0c4', '#6b7a93', '#aab6c8'];

// Matches the backend's DEFAULT_DESTINATION_COUNTRIES in qrcodeController.ts.
const DEFAULT_DESTINATION_COUNTRIES = ['Germany', 'France', 'Netherlands', 'Spain', 'United Kingdom'];

const CATEGORY_LABELS = {
  denim: 'Denim',
  tops: 'Tops (T-Shirts / Knit)',
  bottoms: 'Bottoms',
  outerwear: 'Outerwear',
  others: 'Others',
};
const CATEGORY_ICONS = {
  denim: CheckroomIcon,
  tops: CheckroomIcon,
  bottoms: CheckroomIcon,
  outerwear: CheckroomIcon,
  others: SellIcon,
};

// Icon on the left, number+label+delta stacked on the right — delta is the
// percent change vs the same metric's value 30 days ago (null = no 30-day-old
// baseline to compare against yet).
const Kpi = ({ icon: Icon, label, value, delta, sub }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ width: 52, height: 52, borderRadius: 2, bgcolor: '#eef2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon sx={{ fontSize: 28, color: 'primary.main' }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 400, fontSize: { xs: '1.4rem', md: '1.3rem' } }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
          {label}
        </Typography>
        {delta != null && (
          <Typography variant="caption" sx={{ color: delta >= 0 ? '#2e7d32' : '#c0392b', fontWeight: 600, display: 'block' }}>
            {delta >= 0 ? '+' : ''}{delta}% vs last 30 days
          </Typography>
        )}
        {sub && (
          <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 600, display: 'block' }}>
            {sub}
          </Typography>
        )}
      </Box>
    </CardContent>
  </Card>
);

const Section = ({ title, children, sx }) => (
  <Card sx={{ height: '100%', ...sx }}>
    <CardContent sx={{ py: 1.25 }}>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 400, fontSize: '0.92rem' }}>
        {title}
      </Typography>
      {children}
    </CardContent>
  </Card>
);

// SVG donut chart for [{category,count}] segments.
const Donut = ({ segments }) => {
  const total = segments.reduce((s, x) => s + (x.count || 0), 0);
  const r = 48;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Box sx={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#eef1f6" strokeWidth="18" />
          {total > 0 &&
            segments.map((s, i) => {
              if (!s.count) return null;
              const frac = s.count / total;
              const dash = frac * circumference;
              const el = (
                <circle
                  key={s.category}
                  cx="70" cy="70" r={r} fill="none"
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth="18"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 70 70)"
                />
              );
              offset += dash;
              return el;
            })}
        </svg>
      </Box>
      <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
        {segments.map((s, i) => (
          <Box key={s.category} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[i % COLORS.length], flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1 }}>
              {CATEGORY_LABELS[s.category] || s.category}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {total ? `${Math.round((s.count / total) * 1000) / 10}%` : '0%'} ({s.count})
            </Typography>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
};

// SVG line chart for [{date,count}] series.
// Rounds a chart max up to a "nice" number (1/2/5 x 10^n) so 5 evenly-spaced
// gridlines land on round values like 20K/40K/60K instead of odd fractions.
const niceStep = (max) => {
  if (max <= 0) return 1;
  const rough = max / 5;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  if (residual > 5) return 10 * magnitude;
  if (residual > 2) return 5 * magnitude;
  if (residual > 1) return 2 * magnitude;
  return magnitude;
};
const formatShort = (n) => (n >= 1000 ? `${Math.round(n / 1000)}K` : `${Math.round(n)}`);

// Area chart with Y-axis gridlines/labels and periodic X-axis date labels.
const LineChart = ({ data }) => {
  const plotWidth = 280;
  const plotHeight = 120;
  const leftPad = 34;
  const bottomPad = 18;
  const width = leftPad + plotWidth;
  const height = plotHeight + bottomPad;

  const rawMax = Math.max(1, ...data.map((d) => d.count));
  const step = niceStep(rawMax);
  const niceMax = step * 5;
  const ticks = [0, 1, 2, 3, 4, 5].map((i) => i * step);

  const xAt = (i) => leftPad + (i / Math.max(1, data.length - 1)) * plotWidth;
  const yAt = (v) => plotHeight - (v / niceMax) * plotHeight;

  const linePoints = data.map((d, i) => `${xAt(i)},${yAt(d.count)}`).join(' ');
  const areaPoints = data.length
    ? `${xAt(0)},${plotHeight} ${linePoints} ${xAt(data.length - 1)},${plotHeight}`
    : '';

  // One label per week across a 30-day series (matches the target's weekly cadence).
  const labelIndices = data.length
    ? Array.from({ length: Math.ceil((data.length - 1) / 7) + 1 }, (_, i) => Math.min(i * 7, data.length - 1))
    : [];

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={leftPad} x2={width} y1={yAt(tick)} y2={yAt(tick)} stroke="#eef1f6" strokeWidth="1" />
            <text x={leftPad - 6} y={yAt(tick) + 3} fontSize="8" fill="#6b7a93" textAnchor="end">
              {formatShort(tick)}
            </text>
          </g>
        ))}
        {data.length > 0 && (
          <polygon points={areaPoints} fill={COLORS[0]} opacity="0.12" />
        )}
        <polyline points={linePoints} fill="none" stroke={COLORS[0]} strokeWidth="2" />
        {labelIndices.map((i) => (
          <text key={i} x={xAt(i)} y={height - 2} fontSize="8" fill="#6b7a93" textAnchor="middle">
            {data[i].date.slice(5)}
          </text>
        ))}
      </svg>
    </Box>
  );
};

// Horizontal bars for [{country,count}].
const CountryBars = ({ items }) => {
  if (!items || !items.length) {
    return <Typography variant="body2" color="text.secondary">No data yet.</Typography>;
  }
  const total = items.reduce((s, x) => s + x.count, 0) || 1;
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <Stack spacing={0.9}>
      {items.map((it, i) => (
        <Box key={it.country}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography variant="body2" noWrap sx={{ maxWidth: '65%' }}>{it.country}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 400 }}>
              {it.count} <Typography component="span" variant="caption" color="text.secondary">({Math.round((it.count / total) * 1000) / 10}%)</Typography>
            </Typography>
          </Box>
          <Box sx={{ height: 6, borderRadius: 3, bgcolor: '#eef1f6', overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${(it.count / max) * 100}%`, bgcolor: COLORS[i % COLORS.length], borderRadius: 3 }} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
};

const EMPTY_FILTERS = { date_from: '', date_to: '', item_category: '', origin_country: '', destination_country: '', city: '' };

export default function DashboardAnalytics({ ownerKind = null, ownerId = null }) {
  const [a, setA] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  useEffect(() => {
    setA(null);
    const cleaned = Object.fromEntries(Object.entries(appliedFilters).filter(([, v]) => v));
    getAnalytics(ownerKind, ownerId, cleaned).then(setA);
  }, [ownerKind, ownerId, appliedFilters]);

  // Matches the backend's DEFAULT_DESTINATION_COUNTRIES — always these 5
  // columns (+ Others), not derived from actual scan volume.
  const traceabilityColumns = DEFAULT_DESTINATION_COUNTRIES;

  if (!a) {
    return <Loader label="Loading analytics…" />;
  }

  const t = a.totals || {};

  return (
    <Box sx={{ mt: { xs: 3, md: 1.5 } }}>
      <Grid container spacing={1} sx={{ mb: 1.5 }}>
        <Grid item xs={6} sm={4} md={2}><Kpi icon={QrCodeScannerIcon} label="Total Scans" value={t.scans ?? 0} delta={t.deltas?.scans} /></Grid>
        <Grid item xs={6} sm={4} md={2}><Kpi icon={CheckroomIcon} label="Unique Items" value={t.uniqueItems ?? 0} delta={t.deltas?.uniqueItems} /></Grid>
        <Grid item xs={6} sm={4} md={2}><Kpi icon={SellIcon} label="Unique SKUs" value={t.uniqueSkus ?? 0} delta={t.deltas?.uniqueSkus} /></Grid>
        <Grid item xs={6} sm={4} md={2}><Kpi icon={StorefrontIcon} label="Retail Stores" value={t.retailStores ?? 0} delta={t.deltas?.retailStores} /></Grid>
        <Grid item xs={6} sm={4} md={2}><Kpi icon={PublicIcon} label="Countries" value={t.countries ?? 0} delta={t.deltas?.countries} /></Grid>
        <Grid item xs={6} sm={4} md={2}><Kpi icon={VerifiedIcon} label="Data Integrity" value={`${t.dataIntegrity ?? 100}%`} sub="Verified" /></Grid>
      </Grid>

      <Grid container spacing={1.25} sx={{ mb: 1.25 }}>
        <Grid item xs={12} md={4}>
          <Section title="Scans by Item Category">
            <Donut segments={a.categoryBreakdown || []} />
          </Section>
        </Grid>
        <Grid item xs={12} md={4}>
          <Section title="Scans Trend (Last 30 Days)">
            <LineChart data={a.scansByDay || []} />
          </Section>
        </Grid>
        <Grid item xs={12} md={4}>
          <Section title="Scans by Country (Destination)">
            <CountryBars items={a.countryBreakdown || []} />
          </Section>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 1.5, mb: 1.25 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} flexWrap="wrap" useFlexGap>
          <TextField
            label="From" type="date" size="small" InputLabelProps={{ shrink: true }}
            value={filters.date_from} onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
            sx={{ minWidth: 150 }}
          />
          <TextField
            label="To" type="date" size="small" InputLabelProps={{ shrink: true }}
            value={filters.date_to} onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
            sx={{ minWidth: 150 }}
          />
          <TextField
            select label="Item Category" size="small" value={filters.item_category}
            onChange={(e) => setFilters((f) => ({ ...f, item_category: e.target.value }))}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All</MenuItem>
            {(a.filterOptions?.itemCategories || []).map((k) => (
              <MenuItem key={k} value={k}>{CATEGORY_LABELS[k] || k}</MenuItem>
            ))}
          </TextField>
          <TextField
            select label="Origin Country" size="small" value={filters.origin_country}
            onChange={(e) => setFilters((f) => ({ ...f, origin_country: e.target.value }))}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All</MenuItem>
            {(a.filterOptions?.originCountries || []).map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <TextField
            select label="Destination Country" size="small" value={filters.destination_country}
            onChange={(e) => setFilters((f) => ({ ...f, destination_country: e.target.value }))}
            sx={{ minWidth: 170 }}
          >
            <MenuItem value="">All</MenuItem>
            {(a.filterOptions?.destinationCountries || []).map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <TextField
            select label="City" size="small" value={filters.city}
            onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All</MenuItem>
            {(a.filterOptions?.cities || []).map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <Tooltip title="Refresh">
            <IconButton onClick={() => setAppliedFilters(filters)} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="text"
            onClick={() => { setFilters(EMPTY_FILTERS); setAppliedFilters(EMPTY_FILTERS); }}
          >
            Reset
          </Button>
        </Stack>
      </Paper>

      {/* Traceability Overview */}
      <Paper sx={{ p: 1.5 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 400, fontSize: '0.92rem' }}>
          Traceability Overview
        </Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell rowSpan={2}>Item Category</TableCell>
                <TableCell rowSpan={2}>Origin Country</TableCell>
                <TableCell rowSpan={2} align="right">Total Scanned (PCS)</TableCell>
                <TableCell align="center" colSpan={traceabilityColumns.length + 1} sx={{ borderBottom: 'none' }}>
                  Destination (Country)
                </TableCell>
                <TableCell rowSpan={2}>City (Top)</TableCell>
                <TableCell rowSpan={2} align="right">Stores</TableCell>
              </TableRow>
              <TableRow>
                {traceabilityColumns.map((c) => <TableCell key={c} align="right">{c}</TableCell>)}
                <TableCell align="right">Others</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(a.traceabilityOverview || []).map((row) => {
                const CategoryIcon = CATEGORY_ICONS[row.itemCategory] || SellIcon;
                return (
                  <TableRow key={`${row.skuStyleNumber || row.originCountry}-${row.itemCategory}`} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <CategoryIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                        {CATEGORY_LABELS[row.itemCategory] || row.itemCategory}
                      </Box>
                    </TableCell>
                    <TableCell>{row.originCountry || '—'}</TableCell>
                    <TableCell align="right">{row.totalScanned}</TableCell>
                    {traceabilityColumns.map((c) => (
                      <TableCell key={c} align="right">{row.destinationBreakdown?.[c] || 0}</TableCell>
                    ))}
                    <TableCell align="right">{row.destinationBreakdown?.Others || 0}</TableCell>
                    <TableCell>{(row.topCities || []).join(', ') || '—'}</TableCell>
                    <TableCell align="right">{row.stores}</TableCell>
                  </TableRow>
                );
              })}
              {!(a.traceabilityOverview || []).length && (
                <TableRow>
                  <TableCell colSpan={6 + traceabilityColumns.length}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No scan activity yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Box>
  );
}
