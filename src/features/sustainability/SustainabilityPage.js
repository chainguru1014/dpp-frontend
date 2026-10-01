import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Link,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import EcoIcon from '@mui/icons-material/Spa';
import Co2Icon from '@mui/icons-material/Co2';
import PublicIcon from '@mui/icons-material/Public';
import VerifiedIcon from '@mui/icons-material/Verified';
import RecyclingIcon from '@mui/icons-material/Recycling';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import FactoryIcon from '@mui/icons-material/Factory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import GrassIcon from '@mui/icons-material/Grass';
import GroupsIcon from '@mui/icons-material/Groups';
import GavelIcon from '@mui/icons-material/Gavel';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EditIcon from '@mui/icons-material/Edit';
import PageHeader from '../../components/PageHeader';
import Loader from '../../components/Loader';
import { getFileUrl } from '../../helper';
import lcaImage from '../../assets/LCA.png';
import esgImage from '../../assets/ESG.png';

const LCA_LEARN_MORE_URL =
  'https://www.greenstory.io/blogs/how-leo-workwear-uses-verified-data-to-showcase-sustainability-with-green-story';

// CO2 values are typed as free text on the product form ("25 kg",
// "0.2 t", "18.6 kg CO2e"). Read them as kilograms where possible.
const parseKg = (value) => {
  const text = String(value || '').replace(/,/g, '').toLowerCase();
  const m = text.match(/(-?\d+(?:\.\d+)?)\s*(kg|g|t|tonnes?|tons?)?/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  const unit = m[2] || 'kg';
  if (unit === 'g') return n / 1000;
  if (unit.startsWith('t')) return n * 1000;
  return n;
};
const formatKg = (kg) => (kg == null ? '—' : `${kg >= 100 ? Math.round(kg) : Math.round(kg * 10) / 10} kg CO₂e`);

const DISPOSAL_LINKS = [
  { key: 'repairUrl', label: 'Repair' },
  { key: 'reuseUrl', label: 'Resell / reuse' },
  { key: 'rentalUrl', label: 'Rent' },
  { key: 'disposeUrl', label: 'Recycle / dispose' },
];

// Everything the page shows for one product, derived from the fields the
// product form already collects (no invented figures).
const summarise = (p) => {
  const esg = p.traceabilityEsg || {};
  const route = esg.route || {};
  const materials = Array.isArray(p.materialSize?.materials) ? p.materialSize.materials.filter((m) => m && m.material) : [];
  const origins = Array.isArray(esg.materialOrigins) ? esg.materialOrigins.filter((o) => o && (o.material || o.companyName)) : [];
  const certs = (Array.isArray(p.certifications) ? p.certifications : [])
    .map((c) => (typeof c === 'string' ? { title: c } : c))
    .filter((c) => c && c.title);
  const impact = p.sustainabilityImpact || {};
  const impactItems = Array.isArray(impact.items) ? impact.items.filter((i) => i && (i.value || i.label)) : [];
  const disposal = p.disposal || {};
  const endOfLife = DISPOSAL_LINKS.filter((d) => disposal[d.key]);
  const co2Production = parseKg(esg.co2Production);
  const co2Transport = parseKg(esg.co2Transportation) ?? parseKg(route.emissions);
  const co2Total = co2Production == null && co2Transport == null ? null : (co2Production || 0) + (co2Transport || 0);
  const madeIn = esg.madeIn || esg.originCountry || '';
  const careCount = (p.maintenance?.iconIds || []).length + (p.maintenance?.tips || []).length;

  // Data completeness: the sustainability facts a DPP should carry.
  const checks = [
    ['Materials', materials.length > 0],
    ['Country of manufacture', !!madeIn],
    ['Material suppliers', origins.length > 0],
    ['CO₂ from production', co2Production != null],
    ['CO₂ from transport', co2Transport != null],
    ['Shipping route', !!(route.origin || route.destination || esg.shippingLog)],
    ['Certifications', certs.length > 0],
    ['Care instructions', careCount > 0],
    ['Repair / reuse / recycling links', endOfLife.length > 0],
    ['Impact figures', impactItems.length > 0 || !!(impact.co2Avoided || impact.waterSaved || impact.energySaved)],
  ];
  const done = checks.filter((c) => c[1]).length;

  return {
    p, esg, route, materials, origins, certs, impact, impactItems, endOfLife, disposal,
    co2Production, co2Transport, co2Total, madeIn, careCount,
    checks, completeness: Math.round((done / checks.length) * 100),
    missing: checks.filter((c) => !c[1]).map((c) => c[0]),
  };
};

const Kpi = ({ icon: Icon, value, label }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 }, display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#e8f5ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon sx={{ color: '#2e7d32' }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.35rem', color: 'primary.main', lineHeight: 1.2 }}>{value}</Typography>
        <Typography color="text.secondary" sx={{ fontSize: '0.95rem', lineHeight: 1.3 }}>{label}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const Completeness = ({ value, dense }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: dense ? 120 : 200 }}>
    <LinearProgress
      variant="determinate"
      value={value}
      sx={{ flex: 1, height: dense ? 8 : 10, borderRadius: 5, bgcolor: '#eef1f6', '& .MuiLinearProgress-bar': { bgcolor: value >= 70 ? '#2e7d32' : value >= 40 ? '#d9822b' : '#c0392b' } }}
      aria-label={`Sustainability data ${value}% complete`}
    />
    <Typography sx={{ fontWeight: 600, width: 44, textAlign: 'right' }}>{value}%</Typography>
  </Box>
);

const Stage = ({ icon: Icon, title, children, empty }) => (
  <Paper variant="outlined" sx={{ p: 1.5, height: '100%', borderRadius: 2 }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
      <Box sx={{ width: 34, height: 34, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon sx={{ color: '#fff', fontSize: 20 }} />
      </Box>
      <Typography variant="subtitle1" component="h3">{title}</Typography>
    </Stack>
    {empty ? <Typography color="text.secondary">Not added yet</Typography> : children}
  </Paper>
);

const Line = ({ label, value }) => (value ? (
  <Typography variant="body2" sx={{ mb: 0.5 }}>
    <Box component="span" sx={{ color: 'text.secondary' }}>{label}: </Box>{value}
  </Typography>
) : null);

// Sustainability page: life-cycle (LCA) and ESG information for the
// products this account can see — replaces the old ownership-transfer log
// in the menu (transfers remain available per product: Ownership History).
export default function SustainabilityPage({ products = [], loading = false, canEdit = false, isAppUser = false, onEditProduct }) {
  const rows = useMemo(() => products.map(summarise), [products]);
  const [selectedId, setSelectedId] = useState('');
  useEffect(() => {
    if (!rows.length) return;
    if (!rows.some((r) => r.p._id === selectedId)) setSelectedId(rows[0].p._id);
  }, [rows, selectedId]);
  const current = rows.find((r) => r.p._id === selectedId) || null;

  const withCo2 = rows.filter((r) => r.co2Total != null);
  const avgCo2 = withCo2.length ? withCo2.reduce((s, r) => s + r.co2Total, 0) / withCo2.length : null;
  const countries = new Set(rows.map((r) => r.madeIn).filter(Boolean));
  const certified = rows.filter((r) => r.certs.length > 0).length;
  const circular = rows.filter((r) => r.endOfLife.length > 0).length;
  const avgCompleteness = rows.length ? Math.round(rows.reduce((s, r) => s + r.completeness, 0) / rows.length) : 0;

  return (
    <Box>
      <PageHeader
        title="Sustainability"
        icon={EcoIcon}
        description={isAppUser
          ? 'Where your products come from, what they are made of, their carbon footprint and how to repair, reuse or recycle them.'
          : 'Materials, origin, carbon footprint and end-of-life options for your products.'}
      />

      {/* LCA (left) and ESG (right) pictures at the top of the page. */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          { img: lcaImage, title: 'Life Cycle Assessment (LCA)', text: 'The environmental impact of a product at every stage: materials, manufacturing, transport, use and end of life.', bg: '#10221f', fit: 'contain' },
          { img: esgImage, title: 'ESG analysis', text: 'Environmental, Social and Governance performance of the product and its supply chain.', bg: '#ffffff', fit: 'contain' },
        ].map((b) => (
          <Grid item xs={12} md={6} key={b.title}>
            <Card sx={{ height: '100%' }}>
              <Box
                component="img"
                src={b.img}
                alt={b.title}
                sx={{ display: 'block', width: '100%', height: { xs: 160, md: 180, xl: 210 }, objectFit: b.fit, bgcolor: b.bg, borderBottom: '1px solid', borderColor: 'divider' }}
              />
              <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
                <Typography variant="subtitle1" component="h2">{b.title}</Typography>
                <Typography variant="body2" color="text.secondary">{b.text}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {loading && !rows.length ? (
        <Loader label="Loading products…" />
      ) : !rows.length ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {isAppUser
              ? 'You don’t own any products yet. Sustainability information appears here for products you own.'
              : 'No products yet. Sustainability information appears here once you add products.'}
          </Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={4} xl={2.4}><Kpi icon={Inventory2Icon} value={`${avgCompleteness}%`} label="Data complete (average)" /></Grid>
            <Grid item xs={12} sm={6} md={4} xl={2.4}><Kpi icon={Co2Icon} value={avgCo2 == null ? '—' : formatKg(avgCo2)} label="Carbon footprint (average)" /></Grid>
            <Grid item xs={12} sm={6} md={4} xl={2.4}><Kpi icon={PublicIcon} value={countries.size} label="Countries of manufacture" /></Grid>
            <Grid item xs={12} sm={6} md={6} xl={2.4}><Kpi icon={VerifiedIcon} value={`${certified} of ${rows.length}`} label="Have certifications" /></Grid>
            <Grid item xs={12} sm={12} md={6} xl={2.4}><Kpi icon={RecyclingIcon} value={`${circular} of ${rows.length}`} label="Can be repaired, reused or recycled" /></Grid>
          </Grid>

          {current && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
                <TextField
                  select
                  label="Product"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  sx={{ minWidth: { md: 380 } }}
                >
                  {rows.map((r) => (
                    <MenuItem key={r.p._id} value={r.p._id}>
                      {r.p.name}{r.p.model ? ` — ${r.p.model}` : ''}
                    </MenuItem>
                  ))}
                </TextField>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography color="text.secondary">Sustainability data complete:</Typography>
                  <Completeness value={current.completeness} />
                  {canEdit && onEditProduct && current.missing.length > 0 && (
                    <Button variant="outlined" startIcon={<EditIcon />} onClick={() => onEditProduct(current.p)}>
                      Add missing information
                    </Button>
                  )}
                </Stack>
              </Stack>
              {current.missing.length > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Not added yet: {current.missing.join(', ')}.
                </Typography>
              )}

              {/* LCA: the five life-cycle stages */}
              <Typography variant="h6" component="h2" sx={{ mb: 1 }}>Life cycle (LCA)</Typography>
              <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                <Grid item xs={12} sm={6} lg={2.4}>
                  <Stage icon={GrassIcon} title="1. Materials" empty={!current.materials.length && !current.origins.length}>
                    {current.materials.map((m, i) => (
                      <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
                        {m.material}{m.percent ? ` ${m.percent}%` : ''}{m.origin ? ` · ${m.origin}` : ''}
                      </Typography>
                    ))}
                    {current.origins.map((o, i) => (
                      <Typography key={`o${i}`} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {[o.material, o.companyName, o.country].filter(Boolean).join(' · ')}
                      </Typography>
                    ))}
                  </Stage>
                </Grid>
                <Grid item xs={12} sm={6} lg={2.4}>
                  <Stage icon={FactoryIcon} title="2. Manufacturing" empty={!current.madeIn && current.co2Production == null && !current.p.manufactureDate}>
                    <Line label="Made in" value={current.madeIn} />
                    <Line label="Date" value={current.p.manufactureDate} />
                    <Line label="CO₂" value={current.co2Production != null ? formatKg(current.co2Production) : ''} />
                  </Stage>
                </Grid>
                <Grid item xs={12} sm={6} lg={2.4}>
                  <Stage icon={LocalShippingIcon} title="3. Transport" empty={!current.route.origin && !current.route.destination && !current.esg.shippingLog && current.co2Transport == null}>
                    <Line label="Route" value={[current.route.origin, current.route.destination].filter(Boolean).join(' → ') || current.esg.shippingLog} />
                    <Line label="By" value={current.route.mode} />
                    <Line label="Distance" value={current.esg.distance} />
                    <Line label="CO₂" value={current.co2Transport != null ? formatKg(current.co2Transport) : ''} />
                  </Stage>
                </Grid>
                <Grid item xs={12} sm={6} lg={2.4}>
                  <Stage icon={CheckroomIcon} title="4. Use" empty={!current.careCount && !current.p.warrantyStatus && !current.p.warrantyValidYears}>
                    <Line label="Care" value={current.careCount ? `${(current.p.maintenance?.iconIds || []).length} care symbols, ${(current.p.maintenance?.tips || []).length} tips` : ''} />
                    <Line label="Warranty" value={current.p.warrantyValidYears ? `${current.p.warrantyValidYears} years` : current.p.warrantyStatus} />
                  </Stage>
                </Grid>
                <Grid item xs={12} sm={12} lg={2.4}>
                  <Stage icon={RecyclingIcon} title="5. End of life" empty={!current.endOfLife.length}>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      {current.endOfLife.map((d) => (
                        <Chip
                          key={d.key}
                          label={d.label}
                          component="a"
                          href={current.disposal[d.key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          clickable
                          icon={<OpenInNewIcon />}
                          variant="outlined"
                          color="success"
                        />
                      ))}
                    </Stack>
                  </Stage>
                </Grid>
              </Grid>

              {/* ESG */}
              <Typography variant="h6" component="h2" sx={{ mb: 1 }}>ESG</Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={4}>
                  <Stage icon={EcoIcon} title="Environmental" empty={current.co2Total == null && !current.impactItems.length && !current.impact.waterSaved && !current.impact.energySaved && !current.impact.co2Avoided}>
                    <Line label="Carbon footprint" value={current.co2Total != null ? formatKg(current.co2Total) : ''} />
                    {current.impactItems.map((it, i) => (
                      <Line key={i} label={it.label || 'Impact'} value={it.value} />
                    ))}
                    {!current.impactItems.length && (
                      <>
                        <Line label="CO₂ avoided" value={current.impact.co2Avoided} />
                        <Line label="Water saved" value={current.impact.waterSaved} />
                        <Line label="Energy saved" value={current.impact.energySaved} />
                      </>
                    )}
                  </Stage>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stage icon={GroupsIcon} title="Social" empty={!current.certs.length && !current.origins.length}>
                    {current.certs.length > 0 && (
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                        {current.certs.map((c, i) => (
                          <Chip
                            key={i}
                            label={c.title}
                            icon={c.icon ? <Box component="img" src={getFileUrl(c.icon)} alt="" sx={{ width: 18, height: 18, borderRadius: '50%' }} /> : <VerifiedIcon />}
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    )}
                    <Line label="Known suppliers" value={current.origins.length ? `${current.origins.length} named in the supply chain` : ''} />
                  </Stage>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stage icon={GavelIcon} title="Governance">
                    <Line label="Traceable codes issued" value={String(current.p.total_minted_amount || 0)} />
                    <Line label="Style / SKU" value={current.p.skuStyleNumber} />
                    <Line label="Brand" value={current.p.brandInfo?.name} />
                    <Line label="Data complete" value={`${current.completeness}%`} />
                  </Stage>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* All products at a glance */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 0.5 }}>All products</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Click a product to see its full life cycle above.</Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Made in</TableCell>
                    <TableCell>Main materials</TableCell>
                    <TableCell align="right">Carbon footprint</TableCell>
                    <TableCell>Certifications</TableCell>
                    <TableCell>End of life</TableCell>
                    <TableCell>Data complete</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow
                      key={r.p._id}
                      hover
                      selected={r.p._id === selectedId}
                      onClick={() => { setSelectedId(r.p._id); window.scrollTo?.(0, 0); }}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Link component="button" type="button" underline="hover" onClick={() => setSelectedId(r.p._id)} sx={{ textAlign: 'left' }}>
                          {r.p.name}
                        </Link>
                      </TableCell>
                      <TableCell>{r.madeIn || '—'}</TableCell>
                      <TableCell>{r.materials.slice(0, 2).map((m) => `${m.material}${m.percent ? ` ${m.percent}%` : ''}`).join(', ') || '—'}</TableCell>
                      <TableCell align="right">{formatKg(r.co2Total)}</TableCell>
                      <TableCell>{r.certs.length ? r.certs.map((c) => c.title).join(', ') : '—'}</TableCell>
                      <TableCell>{r.endOfLife.length ? r.endOfLife.map((d) => d.label).join(', ') : '—'}</TableCell>
                      <TableCell><Completeness value={r.completeness} dense /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Figures come from the information entered for each product.{' '}
            <Link href={LCA_LEARN_MORE_URL} target="_blank" rel="noopener noreferrer">
              Learn more about life-cycle data
            </Link>.
          </Typography>
        </>
      )}
    </Box>
  );
}
