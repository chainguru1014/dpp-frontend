import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardActionArea, CardContent, Typography, Grid, Stack, TextField, MenuItem, Button, Table,
  TableHead, TableRow, TableCell, TableBody, Paper, Collapse,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import SellIcon from '@mui/icons-material/Sell';
import PublicIcon from '@mui/icons-material/Public';
import VerifiedIcon from '@mui/icons-material/Verified';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import StorefrontIcon from '@mui/icons-material/StorefrontOutlined';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FavoriteIcon from '@mui/icons-material/Favorite';
import useSaveCounts from '../products/useSaveCounts';
import axios from 'axios';
import { getAnalytics, getCaptureStats, Backend_URL } from '../../helper';
import { useAuth } from '../auth/AuthContext';
import Loader from '../../components/Loader';

// Clearly different hues (was five similar blue-greys, hard to tell apart,
// especially for older eyes or colour-blind users). Navy/blue lead so the
// palette still matches the app.
const COLORS = ['#1b4f72', '#2f80c8', '#1b4f72', '#1b4f72', '#1b4f72', '#1b4f72', '#6b7a93'];

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
  <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 }, display: 'flex', alignItems: 'center', gap: 1.25, height: '100%', position: 'relative' }}>
    <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#eaf2fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon sx={{ fontSize: 24, color: 'primary.main' }} />
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography sx={{ color: 'primary.main', fontWeight: 400, fontSize: '1.45rem', lineHeight: 1.15 }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: '0.95rem', color: 'text.secondary', lineHeight: 1.3 }}>
        {label}
      </Typography>
      {delta != null && (
        <Typography variant="caption" sx={{ color: delta > 0 ? 'success.main' : delta < 0 ? 'error.main' : 'text.secondary', fontWeight: 400, display: 'block', whiteSpace: 'nowrap' }}>
          {delta === 0 ? 'No change in 30 days' : `${delta > 0 ? '▲ +' : '▼ '}${delta}% in 30 days`}
        </Typography>
      )}
      {sub && (
        <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 400, display: 'block' }}>
          {sub}
        </Typography>
      )}
    </Box>
    {linked && (
      <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', color: 'primary.main', fontSize: '0.85rem', fontWeight: 400 }}>
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
    <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
      <Typography variant="subtitle1" component="h2" sx={{ mb: 0.75 }}>
        {title}
      </Typography>
      {children}
    </CardContent>
  </Card>
);

const EmptyChart = ({ text = 'No scans yet.' }) => (
  <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>{text}</Typography>
);

// Pie chart (client example): the legend on top, a full pie with soft
// colours, white edges and each share written inside its slice.
// Dark blue first, then clearly different blues and blue-greys.
const PIE_COLORS = ['#1b4f72', '#2f80c8', '#5aa9e6', '#9cc9ef', '#24527a', '#4f7cac', '#7f9db9', '#c6dcef', '#3b6e8f', '#a7b8c9'];
const Donut = ({ segments, labels = CATEGORY_LABELS }) => {
  const items = [...segments].filter((s) => s.count > 0).sort((a, b) => b.count - a.count);
  const total = items.reduce((t, x) => t + x.count, 0);
  if (!total) return <EmptyChart />;
  const R = 100;
  const C = 110;
  let angle = -Math.PI / 2;
  const slices = items.map((s, i) => {
    const frac = s.count / total;
    const a0 = angle;
    const a1 = angle + frac * Math.PI * 2;
    angle = a1;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (a, r = R) => [C + r * Math.cos(a), C + r * Math.sin(a)];
    const [x0, y0] = p(a0);
    const [x1, y1] = p(a1);
    const d = items.length === 1
      ? `M ${C - R} ${C} A ${R} ${R} 0 1 1 ${C + R} ${C} A ${R} ${R} 0 1 1 ${C - R} ${C} Z`
      : `M ${C} ${C} L ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`;
    const [lx, ly] = p((a0 + a1) / 2, R * 0.62);
    return { key: s.category, d, color: PIE_COLORS[i % PIE_COLORS.length], pct: frac * 100, lx, ly };
  });
  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 1.5, rowGap: 0.5, mb: 1.5 }}>
        {items.map((s, i) => (
          <Box key={s.category} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box sx={{ width: 14, height: 11, borderRadius: '2px', bgcolor: PIE_COLORS[i % PIE_COLORS.length] }} />
            <Typography sx={{ fontSize: 13, color: '#4a5568' }}>{labels[s.category] || s.category}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <svg width="100%" height="230" viewBox="0 0 220 220" role="img" aria-label="Scans by item category" style={{ maxWidth: 260 }}>
          {slices.map((sl) => <path key={sl.key} d={sl.d} fill={sl.color} stroke="#fff" strokeWidth="1.5" />)}
          {slices.filter((sl) => sl.pct >= 4).map((sl) => (
            <g key={`t${sl.key}`}>
              <rect x={sl.lx - 18} y={sl.ly - 8} width="36" height="16" rx="3" fill="rgba(255,255,255,0.75)" />
              <text x={sl.lx} y={sl.ly + 4} textAnchor="middle" fontSize="10.5" fill="#333">{`${sl.pct.toFixed(1)}%`}</text>
            </g>
          ))}
        </svg>
      </Box>
    </Box>
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
const LineChart = ({ data, noun = 'scans', tall = false }) => {
  if (!data.length || !data.some((d) => d.count > 0)) return <EmptyChart text={`No ${noun} in the last 30 days.`} />;
  const leftPad = 34;
  const rightPad = 14;
  const topPad = 12;
  const plotWidth = tall ? 340 : 380;
  const plotHeight = tall ? 230 : 100;
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
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${noun} per day for the last 30 days`} style={{ display: 'block' }}>
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
    <Stack spacing={0.9}>
      {items.map((it, i) => (
        <Box key={it.country}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4, gap: 1 }}>
            <Typography variant="body1">{it.country}</Typography>
            <Typography variant="body1" sx={{ fontWeight: 400, whiteSpace: 'nowrap' }}>
              {it.count} <Typography component="span" variant="body2" color="text.secondary">({Math.round((it.count / total) * 100)}%)</Typography>
            </Typography>
          </Box>
          <Box sx={{ height: 8, borderRadius: 4, bgcolor: '#eef1f6', overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${(it.count / max) * 100}%`, bgcolor: COLORS[i % COLORS.length], borderRadius: 5 }} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
};

// A figure card (client dashboard): line icon, label, the number, the change.
const Stat = ({ icon: Icon, label, value, delta, sub, onClick }) => {
  const body = (
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Icon sx={{ fontSize: 34, color: 'primary.main', flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 13.5, color: 'text.secondary', lineHeight: 1.2 }} noWrap>{label}</Typography>
        <Typography sx={{ fontSize: 24, fontWeight: 600, color: '#1c2430', lineHeight: 1.25 }} noWrap>{typeof value === 'number' ? value.toLocaleString() : value}</Typography>
        {delta != null ? (
          <Typography sx={{ fontSize: 12.5, color: delta >= 0 ? 'primary.main' : 'error.main' }} noWrap>{`${delta > 0 ? '+' : ''}${delta}% in 30 days`}</Typography>
        ) : sub ? (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }} noWrap>{sub}</Typography>
        ) : null}
      </Box>
    </CardContent>
  );
  return (
    <Card sx={{ height: '100%' }}>
      {onClick ? <CardActionArea onClick={onClick} sx={{ height: '100%' }} aria-label={`${label}: ${value}`}>{body}</CardActionArea> : body}
    </Card>
  );
};

// Scans by country: name, bar, number and share on one line each.
const CountryRows = ({ items }) => {
  if (!items || !items.length) return <EmptyChart />;
  const total = items.reduce((t, x) => t + x.count, 0) || 1;
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <Stack spacing={0.9} sx={{ pt: 0.5 }}>
      {items.slice(0, 10).map((it) => (
        <Box key={it.country} sx={{ display: 'grid', gridTemplateColumns: '108px 1fr 64px 48px', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: 13.5 }} noWrap>{it.country}</Typography>
          <Box sx={{ height: 12, borderRadius: 1, bgcolor: '#eef1f6', overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${(it.count / max) * 100}%`, bgcolor: 'primary.main', opacity: 0.55 + 0.45 * (it.count / max), borderRadius: 1 }} />
          </Box>
          <Typography sx={{ fontSize: 13.5, textAlign: 'right' }}>{it.count.toLocaleString()}</Typography>
          <Typography sx={{ fontSize: 13.5, textAlign: 'right', color: 'text.secondary' }}>{`${((it.count / total) * 100).toFixed(1)}%`}</Typography>
        </Box>
      ))}
    </Stack>
  );
};

// Country name -> its two-letter ISO code ("Japan" -> "JP"), built once from
// the browser's own region names (Intl), plus a few common spellings.
const RETIRED_CODES = ['AN', 'BU', 'CS', 'DD', 'FX', 'NT', 'SU', 'TP', 'UK', 'YU', 'ZR'];
const COUNTRY_CODES = (() => {
  const map = {};
  try {
    const names = new Intl.DisplayNames(['en'], { type: 'region' });
    for (let a = 65; a <= 90; a += 1) {
      for (let b = 65; b <= 90; b += 1) {
        const code = String.fromCharCode(a, b);
        let name;
        try { name = names.of(code); } catch (e) { name = null; }
        // Retired / reserved codes the browser still names (DD = East Germany).
        if (!name || name === code || RETIRED_CODES.includes(code)) continue;
        // The first (standard) code wins: FR, not the old FX; GB, not UK.
        const key = name.toLowerCase();
        if (!map[key]) map[key] = code;
        // "Hong Kong SAR China" -> also "Hong Kong".
        const short = name.replace(/\s+SAR China$/, '').toLowerCase();
        if (!map[short]) map[short] = code;
      }
    }
  } catch (e) { /* no Intl: names stay as they are */ }
  Object.assign(map, { 'hong kong': 'HK', macau: 'MO', macao: 'MO', taiwan: 'TW', usa: 'US', 'united states of america': 'US', uk: 'GB', 'great britain': 'GB', uae: 'AE', 'south korea': 'KR', korea: 'KR', russia: 'RU', vietnam: 'VN', 'czech republic': 'CZ', turkey: 'TR' });
  return map;
})();
const countryCode = (name) => COUNTRY_CODES[String(name || '').trim().toLowerCase()] || name;

const EMPTY_FILTERS = { date_from: '', date_to: '', item_category: '', origin_country: '', destination_country: '', city: '' };
const activeFilterCount = (f) => Object.values(f).filter(Boolean).length;

export default function DashboardAnalytics({
  ownerKind = null, ownerId = null,
  onNavigateToScanHistory, onNavigateToCaptureHistory, onNavigateToProducts, onNavigateToGenerateCode, onNavigateToFavorites,
  filtersOpen = false, onActiveFilterCountChange,
  // The dashboard has two layers: four figures and two charts, then
  // everything else once "More analytics" is opened.
  moreOpen = false, onToggleMore,
  // Told the unfiltered totals once loaded (the setup strip ticks "scanned" from it).
  onTotalsLoaded,
  // "Needs your attention" (brands, Supervisors, super admin): the left half
  // of the first row, the six figures on the right in two columns (scans,
  // captures), the two charts below.
  attention = null,
}) {
  const [a, setA] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  useEffect(() => {
    setA(null);
    const cleaned = Object.fromEntries(Object.entries(appliedFilters).filter(([, v]) => v));
    getAnalytics(ownerKind, ownerId, cleaned).then((data) => {
      setA(data);
      if (onTotalsLoaded && !Object.keys(cleaned).length) onTotalsLoaded(data?.totals || {});
    });
  }, [ownerKind, ownerId, appliedFilters]);

  // Capture figures: super admin — every capture; company / Supervisor —
  // its company's; working employee — their own. Not shown to app users.
  const { token, company, isAppUser } = useAuth();
  const saveTotal = useSaveCounts().total;
  const [favCount, setFavCount] = useState(0);
  useEffect(() => {
    if (!isAppUser || !company?._id) return;
    axios.get(`${Backend_URL}engagement/album/list?user_id=${encodeURIComponent(company._id)}`)
      .then((r) => setFavCount((r.data?.data || []).length)).catch(() => {});
  }, [isAppUser, company?._id]);
  const isWorkingEmployee = company?.actorKind === 'Employee' && company?.employeeType !== 'supervisor';
  const showCaptures = !isAppUser;
  const [captureStats, setCaptureStats] = useState(null);
  useEffect(() => {
    if (!showCaptures || !token) return;
    getCaptureStats(token, { mine: isWorkingEmployee }).then(setCaptureStats);
  }, [showCaptures, token, isWorkingEmployee]);

  // Countries with at least one scan (from the backend, most-scanned first).
  // Older backends don't send destinationColumns — fall back to the country
  // keys they already put in each row's destinationBreakdown (incl. Others).
  const traceabilityColumns = a?.destinationColumns
    || Object.keys(a?.traceabilityOverview?.[0]?.destinationBreakdown || {});
  // Managed category names (super admin > Manage Categories), with the
  // built-in names as a fallback for older backends.
  const categoryLabels = { ...CATEGORY_LABELS, ...(a?.filterOptions?.itemCategoryLabels || {}) };

  const appliedCount = activeFilterCount(appliedFilters);
  useEffect(() => {
    onActiveFilterCountChange?.(appliedCount);
  }, [appliedCount, onActiveFilterCountChange]);

  if (!a) {
    return <Loader label="Loading your figures…" />;
  }

  const t = a.totals || {};
  const applied = appliedCount;

  // The client's dashboard (2026-11-24): six figures in a row; scans by
  // category, the 30-day trend and scans by country side by side; the
  // filters; then the traceability table.
  const sixStats = isAppUser
    ? [
      { key: 'scans', icon: QrCodeScannerIcon, label: 'My scans', value: t.scans ?? 0, delta: t.deltas?.scans, onClick: onNavigateToScanHistory },
      { key: 'favorites', icon: FavoriteIcon, label: 'Favorites', value: favCount, onClick: onNavigateToFavorites || onNavigateToProducts },
      { key: 'countries', icon: PublicIcon, label: 'Countries', value: t.countries ?? 0 },
    ]
    : [
      { key: 'scans', icon: QrCodeScannerIcon, label: 'Total Scans', value: t.scans ?? 0, delta: t.deltas?.scans, onClick: onNavigateToScanHistory },
      { key: 'items', icon: CheckroomIcon, label: 'Unique Items', value: t.uniqueItems ?? 0, delta: t.deltas?.uniqueItems, onClick: onNavigateToGenerateCode },
      { key: 'skus', icon: SellIcon, label: 'Unique SKUs', value: t.uniqueSkus ?? 0, delta: t.deltas?.uniqueSkus, onClick: onNavigateToProducts },
      { key: 'stores', icon: StorefrontIcon, label: 'Retail Stores', value: t.retailStores ?? 0, delta: t.deltas?.retailStores },
      { key: 'countries', icon: PublicIcon, label: 'Countries', value: t.countries ?? 0, sub: 'Where scanned' },
      { key: 'integrity', icon: VerifiedUserOutlinedIcon, label: 'Data Integrity', value: `${t.dataIntegrity ?? 100}%`, sub: 'Verified' },
    ];

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const sel = (label, k, options, all, render = (x) => x, minWidth = 120) => (
    <TextField select size="small" label={label} value={filters[k]} onChange={set(k)} sx={{ minWidth, flex: 1 }}>
      <MenuItem value="">{all}</MenuItem>
      {options.map((o) => <MenuItem key={o} value={o}>{render(o)}</MenuItem>)}
    </TextField>
  );
  // Hidden until the header's Filters button opens it; everything on one
  // line on wide screens (client request 2026-11-25).
  const filterBar = (
    <Collapse in={filtersOpen} unmountOnExit>
    <Paper sx={{ px: 2, py: 1.5, mb: 2, display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: { xs: 'wrap', lg: 'nowrap' } }}>
      <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }} value={filters.date_from} onChange={set('date_from')} sx={{ width: 150, flexShrink: 0 }} />
      <Typography color="text.secondary">~</Typography>
      <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }} value={filters.date_to} onChange={set('date_to')} sx={{ width: 150, flexShrink: 0 }} />
      {sel('Item Category', 'item_category', a.filterOptions?.itemCategories || [], 'All', (k) => categoryLabels[k] || k)}
      {sel('Origin Location', 'origin_country', a.filterOptions?.originCountries || [], 'All')}
      {sel('Destination Country', 'destination_country', a.filterOptions?.destinationCountries || [], 'All', undefined, 175)}
      {sel('City', 'city', a.filterOptions?.cities || [], 'All')}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
        <Button variant="contained" onClick={() => setAppliedFilters(filters)} sx={{ minWidth: 88 }}>Apply</Button>
        <Button onClick={() => { setFilters(EMPTY_FILTERS); setAppliedFilters(EMPTY_FILTERS); }}>Reset</Button>
      </Stack>
    </Paper>
    </Collapse>
  );

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {sixStats.map((c) => (
          <Grid item key={c.key} xs={12} sm={6} md={4} lg={12 / sixStats.length}>
            <Stat {...c} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Section title={isAppUser ? 'My scans by item category' : 'Scans by Item Category'}>
            <Donut segments={(a.categoryBreakdown || []).filter((x) => x.count > 0)} labels={categoryLabels} />
          </Section>
        </Grid>
        <Grid item xs={12} md={4}>
          <Section title="Scans Trend (Last 30 Days)">
            <LineChart data={a.scansByDay || []} tall />
          </Section>
        </Grid>
        <Grid item xs={12} md={4}>
          <Section title="Scans by Country (Destination)">
            <CountryRows items={a.countryBreakdown || []} />
          </Section>
        </Grid>
      </Grid>

      {filterBar}

      {!isAppUser && (
        <Paper sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" component="h2" sx={{ mb: 1 }}>Traceability Overview</Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ '& th': { fontSize: 13, color: 'text.secondary', bgcolor: '#f6f8fb', whiteSpace: 'nowrap', py: 0.5, lineHeight: 1.3 }, '& td': { fontSize: 13.5 } }}>
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={2}>Item Category</TableCell>
                  <TableCell rowSpan={2}>SKU / Style No.</TableCell>
                  <TableCell rowSpan={2} sx={{ minWidth: 190 }}>Origin Location</TableCell>
                  <TableCell rowSpan={2} align="center">Total Scanned (PCS)</TableCell>
                  {traceabilityColumns.length > 0 && (
                    <TableCell align="center" colSpan={traceabilityColumns.length}>Destination (Country)</TableCell>
                  )}
                  <TableCell rowSpan={2} align="center">Stores</TableCell>
                </TableRow>
                <TableRow>
                  {traceabilityColumns.map((c) => <TableCell key={c} align="center" title={c}>{countryCode(c)}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {(a.traceabilityOverview || []).map((row) => {
                  const CategoryIcon = CATEGORY_ICONS[row.itemCategory] || SellIcon;
                  return (
                    <TableRow key={`${row.skuStyleNumber || row.originCountry}-${row.itemCategory}`} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CategoryIcon sx={{ fontSize: 22, color: 'primary.main' }} />
                          {categoryLabels[row.itemCategory] || row.itemCategory}
                        </Box>
                      </TableCell>
                      <TableCell>{row.skuStyleNumber || '—'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.originCountry || '—'}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>{Number(row.totalScanned || 0).toLocaleString()}</TableCell>
                      {traceabilityColumns.map((c) => (
                        <TableCell key={c} align="center">{Number(row.destinationBreakdown?.[c] || 0).toLocaleString()}</TableCell>
                      ))}
                      <TableCell align="center">{row.stores ?? '—'}</TableCell>
                    </TableRow>
                  );
                })}
                {!(a.traceabilityOverview || []).length && (
                  <TableRow>
                    <TableCell colSpan={5 + traceabilityColumns.length}>
                      <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                        No scans yet. Figures appear here once people scan your product codes.
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
