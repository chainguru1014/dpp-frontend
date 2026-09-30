import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardActionArea, CardContent, Typography, Grid, Stack, TextField, MenuItem, Button, Table,
  TableHead, TableRow, TableCell, TableBody, Paper, Collapse,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import SellIcon from '@mui/icons-material/Sell';
import PublicIcon from '@mui/icons-material/Public';
import VerifiedIcon from '@mui/icons-material/Verified';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { getAnalytics, getCapturesCount } from '../../helper';
import { useAuth } from '../auth/AuthContext';
import Loader from '../../components/Loader';

// Clearly different hues (was five similar blue-greys, hard to tell apart,
// especially for older eyes or colour-blind users). Navy/blue lead so the
// palette still matches the app.
const COLORS = ['#1b4f72', '#2f80c8', '#d9822b', '#3a9d6a', '#8a5cc2', '#c0392b', '#6b7a93'];

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

// Icon on the left, number + label (+ change vs 30 days ago) on the right.
// `onClick`, when given, makes the whole card a link to that metric's page
// (shown by a "View" hint); omitted when the role can't see that page.
const KpiContent = ({ icon: Icon, label, value, delta, sub, linked }) => (
  <CardContent sx={{ py: 1.75, display: 'flex', alignItems: 'center', gap: 1.5, height: '100%' }}>
    <Box sx={{ width: 52, height: 52, borderRadius: 2, bgcolor: '#eaf2fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon sx={{ fontSize: 28, color: 'primary.main' }} />
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography sx={{ color: 'primary.main', fontWeight: 700, fontSize: '1.6rem', lineHeight: 1.15 }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: '0.95rem', color: 'text.secondary', lineHeight: 1.3 }}>
        {label}
      </Typography>
      {delta != null && (
        <Typography variant="caption" sx={{ color: delta >= 0 ? 'success.main' : 'error.main', fontWeight: 600, display: 'block' }}>
          {delta >= 0 ? '▲ +' : '▼ '}{delta}% in 30 days
        </Typography>
      )}
      {sub && (
        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600, display: 'block' }}>
          {sub}
        </Typography>
      )}
    </Box>
    {linked && (
      <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', alignSelf: 'flex-end', fontSize: '0.85rem', fontWeight: 500 }}>
        View<ChevronRightIcon fontSize="small" />
      </Box>
    )}
  </CardContent>
);

const Kpi = ({ onClick, ...props }) => (
  <Card sx={{ height: '100%' }}>
    {onClick ? (
      <CardActionArea onClick={onClick} sx={{ height: '100%' }} aria-label={`${props.label}: ${props.value}. Open`}>
        <KpiContent {...props} linked />
      </CardActionArea>
    ) : (
      <KpiContent {...props} />
    )}
  </Card>
);

const Section = ({ title, children, sx }) => (
  <Card sx={{ height: '100%', ...sx }}>
    <CardContent sx={{ py: 1.75 }}>
      <Typography variant="subtitle1" component="h2" sx={{ mb: 1.25 }}>
        {title}
      </Typography>
      {children}
    </CardContent>
  </Card>
);

const EmptyChart = ({ text = 'No scans yet.' }) => (
  <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>{text}</Typography>
);

// SVG donut chart for [{category,count}] segments.
const Donut = ({ segments, labels = CATEGORY_LABELS }) => {
  const total = segments.reduce((s, x) => s + (x.count || 0), 0);
  if (!total) return <EmptyChart />;
  const r = 48;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
      <Box sx={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="Scans by product category">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#eef1f6" strokeWidth="20" />
          {segments.map((s, i) => {
            if (!s.count) return null;
            const frac = s.count / total;
            const dash = frac * circumference;
            const el = (
              <circle
                key={s.category}
                cx="70" cy="70" r={r} fill="none"
                stroke={COLORS[i % COLORS.length]}
                strokeWidth="20"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 70 70)"
              />
            );
            offset += dash;
            return el;
          })}
          <text x="70" y="68" textAnchor="middle" fontSize="20" fontWeight="700" fill="#1b4f72">{total}</text>
          <text x="70" y="86" textAnchor="middle" fontSize="11" fill="#51617a">scans</text>
        </svg>
      </Box>
      <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
        {segments.map((s, i) => (
          <Box key={s.category} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: COLORS[i % COLORS.length], flexShrink: 0 }} />
            <Typography variant="body2" sx={{ flex: 1 }}>
              {labels[s.category] || s.category}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
              {s.count} <Typography component="span" variant="body2" color="text.secondary">({Math.round((s.count / total) * 100)}%)</Typography>
            </Typography>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
};

// Rounds a chart max up to a "nice" number (1/2/5 x 10^n) so the gridlines
// land on round values.
const niceStep = (max) => {
  if (max <= 0) return 1;
  const rough = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  if (residual > 5) return 10 * magnitude;
  if (residual > 2) return 5 * magnitude;
  if (residual > 1) return 2 * magnitude;
  return magnitude;
};
const formatShort = (n) => (n >= 1000 ? `${Math.round(n / 100) / 10}K` : `${Math.round(n)}`);
const formatDay = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? String(iso).slice(5) : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Area chart with Y gridlines and weekly X labels. Drawn in a fixed
// coordinate space that scales proportionally (no stretched text), with room
// at the top and sides so the outermost labels are never clipped.
const LineChart = ({ data }) => {
  if (!data.length || !data.some((d) => d.count > 0)) return <EmptyChart text="No scans in the last 30 days." />;
  const leftPad = 34;
  const rightPad = 14;
  const topPad = 12;
  const plotWidth = 320;
  const plotHeight = 130;
  const bottomPad = 24;
  const width = leftPad + plotWidth + rightPad;
  const height = topPad + plotHeight + bottomPad;

  const rawMax = Math.max(1, ...data.map((d) => d.count));
  const step = niceStep(rawMax);
  const niceMax = step * Math.ceil(rawMax / step);
  const ticks = [];
  for (let v = 0; v <= niceMax; v += step) ticks.push(v);

  const xAt = (i) => leftPad + (i / Math.max(1, data.length - 1)) * plotWidth;
  const yAt = (v) => topPad + plotHeight - (v / niceMax) * plotHeight;

  const linePoints = data.map((d, i) => `${xAt(i)},${yAt(d.count)}`).join(' ');
  const areaPoints = `${xAt(0)},${yAt(0)} ${linePoints} ${xAt(data.length - 1)},${yAt(0)}`;

  // A label about once a week, never two crowded together at the end.
  const labelIndices = [];
  for (let i = 0; i < data.length; i += 7) labelIndices.push(i);
  const last = data.length - 1;
  if (labelIndices[labelIndices.length - 1] !== last) {
    if (last - labelIndices[labelIndices.length - 1] < 4) labelIndices.pop();
    labelIndices.push(last);
  }

  return (
    <Box sx={{ width: '100%' }}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Scans per day for the last 30 days" style={{ display: 'block' }}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={leftPad} x2={leftPad + plotWidth} y1={yAt(tick)} y2={yAt(tick)} stroke="#e3e8ef" strokeWidth="1" />
            <text x={leftPad - 6} y={yAt(tick) + 4} fontSize="11" fill="#51617a" textAnchor="end">
              {formatShort(tick)}
            </text>
          </g>
        ))}
        <polygon points={areaPoints} fill={COLORS[1]} opacity="0.15" />
        <polyline points={linePoints} fill="none" stroke={COLORS[0]} strokeWidth="2.5" strokeLinejoin="round" />
        {labelIndices.map((i) => (
          <text
            key={i}
            x={xAt(i)}
            y={height - 6}
            fontSize="11"
            fill="#51617a"
            textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'}
          >
            {formatDay(data[i].date)}
          </text>
        ))}
      </svg>
    </Box>
  );
};

// Horizontal bars for [{country,count}].
const CountryBars = ({ items }) => {
  if (!items || !items.length) return <EmptyChart />;
  const total = items.reduce((s, x) => s + x.count, 0) || 1;
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <Stack spacing={1.25}>
      {items.map((it, i) => (
        <Box key={it.country}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4, gap: 1 }}>
            <Typography variant="body1">{it.country}</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
              {it.count} <Typography component="span" variant="body2" color="text.secondary">({Math.round((it.count / total) * 100)}%)</Typography>
            </Typography>
          </Box>
          <Box sx={{ height: 10, borderRadius: 5, bgcolor: '#eef1f6', overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${(it.count / max) * 100}%`, bgcolor: COLORS[i % COLORS.length], borderRadius: 5 }} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
};

const EMPTY_FILTERS = { date_from: '', date_to: '', item_category: '', origin_country: '', destination_country: '', city: '' };
const activeFilterCount = (f) => Object.values(f).filter(Boolean).length;

export default function DashboardAnalytics({
  ownerKind = null, ownerId = null,
  onNavigateToScanHistory, onNavigateToCaptureHistory, onNavigateToProducts, onNavigateToGenerateCode,
}) {
  const [a, setA] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setA(null);
    const cleaned = Object.fromEntries(Object.entries(appliedFilters).filter(([, v]) => v));
    getAnalytics(ownerKind, ownerId, cleaned).then(setA);
  }, [ownerKind, ownerId, appliedFilters]);

  // Total Captures card: super admin — every capture; company / Supervisor —
  // its company's; working employee — their own. Not shown to app users.
  const { token, company, isAppUser } = useAuth();
  const isWorkingEmployee = company?.actorKind === 'Employee' && company?.employeeType !== 'supervisor';
  const showCaptures = !isAppUser;
  const [capturesTotal, setCapturesTotal] = useState(null);
  useEffect(() => {
    if (!showCaptures || !token) return;
    getCapturesCount(token, { mine: isWorkingEmployee }).then(setCapturesTotal);
  }, [showCaptures, token, isWorkingEmployee]);

  // Countries with at least one scan (from the backend, most-scanned first).
  // Older backends don't send destinationColumns — fall back to the country
  // keys they already put in each row's destinationBreakdown (incl. Others).
  const traceabilityColumns = a?.destinationColumns
    || Object.keys(a?.traceabilityOverview?.[0]?.destinationBreakdown || {});
  // Managed category names (super admin > Manage Categories), with the
  // built-in names as a fallback for older backends.
  const categoryLabels = { ...CATEGORY_LABELS, ...(a?.filterOptions?.itemCategoryLabels || {}) };

  if (!a) {
    return <Loader label="Loading your figures…" />;
  }

  const t = a.totals || {};
  const applied = activeFilterCount(appliedFilters);

  // Field mapping (see backend qrcodeController): `uniqueSkus` is distinct
  // product types scanned; `uniqueItems` is distinct scanned item codes.
  const cards = [
    { key: 'scans', icon: QrCodeScannerIcon, label: isAppUser ? 'My scans' : 'Scans', value: t.scans ?? 0, delta: t.deltas?.scans, onClick: onNavigateToScanHistory },
    showCaptures && { key: 'captures', icon: CameraAltIcon, label: isWorkingEmployee ? 'My captures' : 'Captures', value: capturesTotal ?? 0, onClick: onNavigateToCaptureHistory },
    { key: 'products', icon: Inventory2Icon, label: 'Products scanned', value: t.uniqueSkus ?? 0, delta: t.deltas?.uniqueSkus, onClick: onNavigateToProducts },
    !isAppUser && { key: 'codes', icon: QrCode2Icon, label: 'Codes scanned', value: t.uniqueItems ?? 0, delta: t.deltas?.uniqueItems, onClick: onNavigateToGenerateCode },
    { key: 'countries', icon: PublicIcon, label: 'Countries', value: t.countries ?? 0, delta: t.deltas?.countries },
    !isAppUser && { key: 'integrity', icon: VerifiedIcon, label: 'Records verified', value: `${t.dataIntegrity ?? 100}%` },
  ].filter(Boolean);

  const filterPanel = (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between">
        <Typography color="text.secondary">
          {applied
            ? `Showing figures for ${applied} filter${applied === 1 ? '' : 's'}.`
            : 'Showing all figures. Use filters to narrow them down by date, category or country.'}
        </Typography>
        <Stack direction="row" spacing={1}>
          {applied > 0 && (
            <Button onClick={() => { setFilters(EMPTY_FILTERS); setAppliedFilters(EMPTY_FILTERS); }}>
              Clear filters
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
          >
            {showFilters ? 'Hide filters' : 'Filters'}
          </Button>
        </Stack>
      </Stack>
      <Collapse in={showFilters}>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <TextField
              label="From date" type="date" fullWidth InputLabelProps={{ shrink: true }}
              value={filters.date_from} onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <TextField
              label="To date" type="date" fullWidth InputLabelProps={{ shrink: true }}
              value={filters.date_to} onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <TextField
              select label="Product category" fullWidth value={filters.item_category}
              onChange={(e) => setFilters((f) => ({ ...f, item_category: e.target.value }))}
            >
              <MenuItem value="">All categories</MenuItem>
              {(a.filterOptions?.itemCategories || []).map((k) => (
                <MenuItem key={k} value={k}>{categoryLabels[k] || k}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <TextField
              select label="Made in" fullWidth value={filters.origin_country}
              onChange={(e) => setFilters((f) => ({ ...f, origin_country: e.target.value }))}
            >
              <MenuItem value="">All countries</MenuItem>
              {(a.filterOptions?.originCountries || []).map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <TextField
              select label="Scanned in" fullWidth value={filters.destination_country}
              onChange={(e) => setFilters((f) => ({ ...f, destination_country: e.target.value }))}
            >
              <MenuItem value="">All countries</MenuItem>
              {(a.filterOptions?.destinationCountries || []).map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <TextField
              select label="City" fullWidth value={filters.city}
              onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
            >
              <MenuItem value="">All cities</MenuItem>
              {(a.filterOptions?.cities || []).map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button onClick={() => setFilters(EMPTY_FILTERS)}>Reset</Button>
          <Button variant="contained" onClick={() => setAppliedFilters(filters)}>Apply filters</Button>
        </Stack>
      </Collapse>
    </Paper>
  );

  return (
    <Box>
      {filterPanel}

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {cards.map((c) => (
          <Grid item key={c.key} xs={12} sm={6} md={4} xl={cards.length > 4 ? 2 : 3}>
            <Kpi icon={c.icon} label={c.label} value={c.value} delta={c.delta} onClick={c.onClick} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6} xl={4}>
          <Section title={isAppUser ? 'My scans by product category' : 'Scans by product category'}>
            <Donut segments={a.categoryBreakdown || []} labels={categoryLabels} />
          </Section>
        </Grid>
        <Grid item xs={12} md={6} xl={4}>
          <Section title="Scans per day (last 30 days)">
            <LineChart data={a.scansByDay || []} />
          </Section>
        </Grid>
        <Grid item xs={12} md={6} xl={4}>
          <Section title="Countries where products were scanned">
            <CountryBars items={a.countryBreakdown || []} />
          </Section>
        </Grid>
      </Grid>

      {/* Brand/traceability detail — not meaningful for shoppers. */}
      {!isAppUser && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" component="h2" sx={{ mb: 0.5 }}>
            Where each product category is made and scanned
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 1.5 }}>
            Number of scans per country, for each product category and country of manufacture.
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={2}>Product category</TableCell>
                  <TableCell rowSpan={2}>Made in</TableCell>
                  <TableCell rowSpan={2} align="right">Total scans</TableCell>
                  {traceabilityColumns.length > 0 && (
                    <TableCell align="center" colSpan={traceabilityColumns.length} sx={{ borderBottom: 'none' }}>
                      Scanned in
                    </TableCell>
                  )}
                  <TableCell rowSpan={2}>Top cities</TableCell>
                </TableRow>
                <TableRow>
                  {traceabilityColumns.map((c) => <TableCell key={c} align="right">{c}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {(a.traceabilityOverview || []).map((row) => {
                  const CategoryIcon = CATEGORY_ICONS[row.itemCategory] || SellIcon;
                  return (
                    <TableRow key={`${row.skuStyleNumber || row.originCountry}-${row.itemCategory}`} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <CategoryIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                          {categoryLabels[row.itemCategory] || row.itemCategory}
                        </Box>
                      </TableCell>
                      <TableCell>{row.originCountry || '—'}</TableCell>
                      <TableCell align="right">{row.totalScanned}</TableCell>
                      {traceabilityColumns.map((c) => (
                        <TableCell key={c} align="right">{row.destinationBreakdown?.[c] || 0}</TableCell>
                      ))}
                      <TableCell>{(row.topCities || []).join(', ') || '—'}</TableCell>
                    </TableRow>
                  );
                })}
                {!(a.traceabilityOverview || []).length && (
                  <TableRow>
                    <TableCell colSpan={4 + traceabilityColumns.length}>
                      <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                        No scans yet. Figures appear here once people scan your product labels.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
