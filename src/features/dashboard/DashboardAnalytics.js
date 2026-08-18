import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Stack, TextField, MenuItem, Button, Table,
  TableHead, TableRow, TableCell, TableBody, Paper,
} from '@mui/material';
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

const Kpi = ({ icon: Icon, label, value, sub }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ py: 1.25 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#eef2f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon sx={{ fontSize: 18, color: 'primary.main' }} />
        </Box>
      </Box>
      <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 400, fontSize: { xs: '1.4rem', md: '1.3rem' } }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
        {label}
      </Typography>
      {sub && (
        <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 600 }}>
          {sub}
        </Typography>
      )}
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
  const r = 34;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Box sx={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#eef1f6" strokeWidth="14" />
          {total > 0 &&
            segments.map((s, i) => {
              if (!s.count) return null;
              const frac = s.count / total;
              const dash = frac * circumference;
              const el = (
                <circle
                  key={s.category}
                  cx="50" cy="50" r={r} fill="none"
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth="14"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 50 50)"
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
const LineChart = ({ data }) => {
  const width = 320;
  const height = 110;
  const max = Math.max(1, ...data.map((d) => d.count));
  const points = data.map((d, i) => {
    const x = (i / Math.max(1, data.length - 1)) * width;
    const y = height - (d.count / max) * height;
    return `${x},${y}`;
  });
  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <svg width="100%" height={height + 20} viewBox={`0 0 ${width} ${height + 20}`} preserveAspectRatio="none">
        <polyline points={points.join(' ')} fill="none" stroke={COLORS[0]} strokeWidth="2" />
        {data.length > 0 && (
          <>
            <text x="0" y={height + 15} fontSize="8" fill="#6b7a93">{data[0].date.slice(5)}</text>
            <text x={width - 30} y={height + 15} fontSize="8" fill="#6b7a93">{data[data.length - 1].date.slice(5)}</text>
          </>
        )}
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

  const traceabilityColumns = useMemo(() => {
    if (!a?.countryBreakdown) return [];
    return a.countryBreakdown.slice(0, 5).map((c) => c.country);
  }, [a]);

  if (!a) {
    return <Loader label="Loading analytics…" />;
  }

  const t = a.totals || {};

  return (
    <Box sx={{ mt: { xs: 3, md: 1.5 } }}>
      <Grid container spacing={1} sx={{ mb: 1.5 }}>
        <Grid item xs={6} sm={4} md={2}><Kpi icon={QrCodeScannerIcon} label="Total Scans" value={t.scans ?? 0} /></Grid>
        <Grid item xs={6} sm={4} md={2}><Kpi icon={CheckroomIcon} label="Unique Items" value={t.uniqueItems ?? 0} /></Grid>
        <Grid item xs={6} sm={4} md={2}><Kpi icon={SellIcon} label="Unique SKUs" value={t.uniqueSkus ?? 0} /></Grid>
        <Grid item xs={6} sm={4} md={2}><Kpi icon={StorefrontIcon} label="Retail Stores" value={t.retailStores ?? 0} /></Grid>
        <Grid item xs={6} sm={4} md={2}><Kpi icon={PublicIcon} label="Countries" value={t.countries ?? 0} /></Grid>
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
          <Button variant="contained" onClick={() => setAppliedFilters(filters)}>Apply</Button>
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
                <TableCell>Item Category</TableCell>
                <TableCell>SKU / Style No.</TableCell>
                <TableCell>Origin Country</TableCell>
                <TableCell align="right">Total Scanned (PCS)</TableCell>
                {traceabilityColumns.map((c) => <TableCell key={c} align="right">{c}</TableCell>)}
                <TableCell align="right">Others</TableCell>
                <TableCell>City (Top)</TableCell>
                <TableCell align="right">Stores</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(a.traceabilityOverview || []).map((row) => {
                const CategoryIcon = CATEGORY_ICONS[row.itemCategory] || SellIcon;
                return (
                  <TableRow key={`${row.skuStyleNumber}-${row.itemCategory}`} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <CategoryIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                        {CATEGORY_LABELS[row.itemCategory] || row.itemCategory}
                      </Box>
                    </TableCell>
                    <TableCell>{row.skuStyleNumber || '—'}</TableCell>
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
                  <TableCell colSpan={8 + traceabilityColumns.length}>
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
