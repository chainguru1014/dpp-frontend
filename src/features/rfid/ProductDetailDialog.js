import React, { useEffect, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogContent, Divider, Grid, IconButton, LinearProgress, Paper,
  Stack, Tab, Tabs, Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedIcon from '@mui/icons-material/Verified';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import MediaLightbox from '../../components/MediaLightbox';
import {
  CARE_SYMBOL_GLYPH, CARE_SYMBOL_LABEL, CARE_TIP_BY_ICON, JOURNEY_STAGES, SERVICE_ICON, formatUnitSpacing, toArray,
} from '../../components/PreviewModal';
import { getFileUrl, normalizeProductImages, normalizeProductVideos } from '../../helper';
import { readyServices } from '../../utils/circularity';
import { formatPrice } from './rfidReader';

const TABS = [
  { key: 'journey', label: 'Journey' },
  { key: 'materials', label: 'Materials' },
  { key: 'origin', label: 'Origin & Impact' },
  { key: 'care', label: 'Care' },
  { key: 'reuse', label: 'Reuse & Recycle' },
  { key: 'compliance', label: 'Compliance' },
];

const Empty = () => <Typography color="text.secondary" variant="body2">No information yet.</Typography>;

// Label / value pair; nothing when there is no value.
const Fact = ({ label, value }) => (value ? (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.4, display: 'block' }}>{label}</Typography>
    <Typography sx={{ fontWeight: 500, lineHeight: 1.35 }}>{value}</Typography>
  </Box>
) : null);

// Two lines of a long text, with Show more / Show less when it is longer.
function ClampedText({ text }) {
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);
  const measure = (el) => {
    if (el && !open) setLong(el.scrollHeight > el.clientHeight + 1);
  };
  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography
        ref={measure}
        color="text.secondary"
        sx={{ lineHeight: 1.6, ...(open ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }) }}
      >
        {text}
      </Typography>
      {(long || open) && (
        <Button size="small" onClick={() => setOpen((v) => !v)} sx={{ px: 0, minWidth: 0 }}>
          {open ? 'Show less' : 'Show more…'}
        </Button>
      )}
    </Box>
  );
}

const Section = ({ title, children }) => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
    {title && <Typography sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography>}
    {children}
  </Paper>
);

// A product's overview and lifecycle for a laptop screen: photos beside the
// main facts, then the lifecycle in tabs. Shows `product` straight away and
// swaps in the full record from `loadProduct` once it arrives.
export default function ProductDetailDialog({ open, product, loadProduct, onClose }) {
  const [full, setFull] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slide, setSlide] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const [tab, setTab] = useState('journey');

  useEffect(() => {
    setFull(null);
    setSlide(0);
    setTab('journey');
    if (!open || !loadProduct) return undefined;
    let alive = true;
    setLoading(true);
    loadProduct().then((p) => {
      if (!alive) return;
      setFull(p);
      setLoading(false);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product?._id]);

  const info = full || product || {};
  const slides = [
    ...normalizeProductImages(info.images).map((src) => ({ type: 'image', src })),
    ...normalizeProductVideos(info.videos).map((video) => ({ type: 'video', video })),
  ];
  const active = slides[Math.min(slide, Math.max(0, slides.length - 1))];
  const brand = info.brandInfo || {};
  const esg = info.traceabilityEsg || {};
  const madeIn = esg.originCountry || esg.madeIn || '';
  const price = formatPrice(info.price, info.currency);
  const website = String(brand.websiteUrl || '').trim();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: 3 } }}>
      {/* Gradient header bar, the same as the theme's DialogTitle. */}
      <Box sx={{ display: 'flex', alignItems: 'center', px: 3, py: 1, color: '#fff', backgroundImage: 'linear-gradient(135deg, #4a96dd 0%, #1b4f72 100%)' }}>
        <Typography sx={{ fontWeight: 600, fontSize: '1.1rem', flex: 1 }} noWrap>Product details</Typography>
        {loading && <CircularProgress size={20} sx={{ mr: 1, color: '#fff' }} />}
        <IconButton onClick={onClose} aria-label="Close" sx={{ color: '#fff' }}><CloseIcon /></IconButton>
      </Box>
      <DialogContent sx={{ px: 3, py: 2 }}>
        <Grid container spacing={3}>
          {/* Photos */}
          <Grid item xs={12} md={5}>
            <Box
              role={active ? 'button' : undefined}
              onClick={() => active && setLightbox(slides.indexOf(active))}
              sx={{
                // Sized to the window, so the dialog fits a laptop screen.
                height: 'clamp(200px, 30vh, 300px)', borderRadius: 2, bgcolor: 'grey.50', border: 1, borderColor: 'divider', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: active ? 'zoom-in' : 'default',
              }}
            >
              {active?.type === 'image' && <img src={getFileUrl(active.src)} alt="" style={{ height: '100%', maxWidth: '100%', objectFit: 'contain' }} />}
              {active?.type === 'video' && (
                <>
                  {active.video.videoId && <img src={`https://img.youtube.com/vi/${active.video.videoId}/hqdefault.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  <PlayCircleFilledIcon sx={{ position: 'absolute', fontSize: 56, color: '#fff' }} />
                </>
              )}
              {!active && <InventoryIcon sx={{ fontSize: 56, color: 'text.disabled' }} />}
            </Box>
            {slides.length > 1 && (
              <Stack direction="row" spacing={1} sx={{ mt: 1, overflowX: 'auto', pb: 0.5 }}>
                {slides.map((s, i) => (
                  <Box
                    key={i}
                    role="button"
                    aria-label={s.type === 'video' ? 'Video' : `Photo ${i + 1}`}
                    onClick={() => setSlide(i)}
                    sx={{
                      width: 52, height: 52, flexShrink: 0, borderRadius: 1.5, overflow: 'hidden', cursor: 'pointer', position: 'relative',
                      border: 2, borderColor: i === slide ? 'primary.main' : 'transparent', bgcolor: s.type === 'video' ? '#000' : 'grey.50',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {s.type === 'image' ? (
                      <img src={getFileUrl(s.src)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <>
                        {s.video.videoId && <img src={`https://img.youtube.com/vi/${s.video.videoId}/default.jpg`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                        <PlayCircleFilledIcon sx={{ position: 'relative', color: '#fff' }} />
                      </>
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </Grid>

          {/* Overview */}
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
              <Box sx={{ minWidth: 0 }}>
                {!!brand.name && <Typography sx={{ textTransform: 'uppercase', letterSpacing: '0.12em', color: 'text.secondary', fontWeight: 600, fontSize: '0.8rem' }}>{brand.name}</Typography>}
                <Typography sx={{ fontWeight: 700, fontSize: '1.7rem', lineHeight: 1.2 }}>{info.name || 'Unnamed product'}</Typography>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.75 }}>
                  {!!price && <Typography sx={{ fontWeight: 700, fontSize: '1.35rem', color: 'primary.main' }}>{price}</Typography>}
                  <Chip icon={<VerifiedIcon />} label="Genuine product" color="success" variant="outlined" size="small" />
                </Stack>
              </Box>
              {!!website && (
                <Button
                  variant="outlined"
                  endIcon={<OpenInNewIcon />}
                  sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                  onClick={() => window.open(/^https?:\/\//i.test(website) ? website : `https://${website}`, '_blank', 'noopener,noreferrer')}
                >
                  {brand.name ? `Brand: ${brand.name}` : 'Brand website'}
                </Button>
              )}
            </Stack>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, columnGap: 2, rowGap: 1 }}>
              <Fact label="Type" value={info.productType} />
              <Fact label="Color" value={info.color} />
              <Fact label="Size" value={info.size} />
              <Fact label="Model" value={info.model} />
              <Fact label="Made in" value={madeIn} />
              <Fact label="Manufactured" value={info.manufactureDate} />
            </Box>
            {!!info.aboutProduct && <ClampedText text={info.aboutProduct} />}
          </Grid>
        </Grid>

        {/* Lifecycle */}
        <Box sx={{ mt: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
            {TABS.map((tb) => <Tab key={tb.key} value={tb.key} label={tb.label} />)}
          </Tabs>
        </Box>
        <Box sx={{ pt: 2 }}>
          {tab === 'journey' && <JourneyTab info={info} />}
          {tab === 'materials' && <MaterialsTab info={info} />}
          {tab === 'origin' && <OriginTab info={info} />}
          {tab === 'care' && <CareTab info={info} />}
          {tab === 'reuse' && <ReuseTab info={info} />}
          {tab === 'compliance' && <ComplianceTab info={info} />}
        </Box>
      </DialogContent>
      <MediaLightbox open={lightbox != null} slides={slides} index={lightbox || 0} onClose={() => setLightbox(null)} />
    </Dialog>
  );
}

const careTipsOf = (info) => {
  const maintenance = info.maintenance || {};
  const tips = toArray(maintenance.tips).filter(Boolean);
  if (tips.length) return tips.map((primary) => ({ primary }));
  return toArray(maintenance.iconIds).filter(Boolean).map((id) => CARE_TIP_BY_ICON[id] || { primary: `${CARE_SYMBOL_LABEL[id] || id}.` });
};

function JourneyTab({ info }) {
  const esg = info.traceabilityEsg || {};
  const materials = toArray(info.materialSize?.materials);
  const services = readyServices(info);
  const tips = careTipsOf(info);
  const details = {
    materials: materials.map((m) => [m.material || '—', m.percent != null ? `${m.percent}%` : '']),
    manufacturing: [['Made in', esg.originCountry || esg.madeIn], ['Manufactured', info.manufactureDate], ['CO2 (production)', formatUnitSpacing(esg.co2Production)]],
    transportation: [['Shipping', esg.shippingLog], ['Distance', esg.distance], ['Emissions', formatUnitSpacing(esg.route?.emissions || esg.co2Transportation)]],
    use: tips.slice(0, 3).map((tip) => [tip.primary, '']),
    endOfLife: services.map((s) => [s.meta.shopperTitle, s.partnerName || '']),
  };
  return (
    <Grid container spacing={2}>
      {JOURNEY_STAGES.map((s, i) => {
        // Stages that are plain lists keep rows without a value.
        const listStage = ['materials', 'use', 'endOfLife'].includes(s.key);
        const shown = (details[s.key] || []).filter(([label, value]) => label && (value || listStage));
        return (
          <Grid item xs={12} sm={6} md key={s.key}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'primary.main', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <s.Icon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Step {i + 1}</Typography>
                  <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>{s.label}</Typography>
                </Box>
              </Stack>
              {shown.length ? shown.map(([label, value], ri) => (
                <Box key={ri} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, py: 0.5 }}>
                  <Typography variant="body2">{label}</Typography>
                  {!!value && <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>{value}</Typography>}
                </Box>
              )) : <Empty />}
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}

function MaterialsTab({ info }) {
  const materials = toArray(info.materialSize?.materials);
  const origins = toArray(info.traceabilityEsg?.materialOrigins);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Section title="Composition">
          {materials.length ? materials.map((m, i) => (
            <Box key={i} sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">{m.material || '—'}</Typography>
                <Typography variant="body2" color="text.secondary">{m.percent != null ? `${m.percent}%` : ''}</Typography>
              </Box>
              <LinearProgress variant="determinate" value={Math.max(0, Math.min(100, Number(m.percent) || 0))} sx={{ height: 8, borderRadius: 4, mt: 0.5 }} />
            </Box>
          )) : <Empty />}
        </Section>
      </Grid>
      <Grid item xs={12} md={6}>
        <Section title="Material origins">
          {origins.length ? origins.map((o, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1, borderBottom: i < origins.length - 1 ? 1 : 0, borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{o.material || '—'}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>{[o.country || o.origin, o.companyName].filter(Boolean).join(' · ') || '—'}</Typography>
            </Box>
          )) : <Empty />}
        </Section>
      </Grid>
    </Grid>
  );
}

function OriginTab({ info }) {
  const esg = info.traceabilityEsg || {};
  const impact = info.sustainabilityImpact || {};
  const sourced = Array.from(new Set(toArray(esg.materialOrigins).map((o) => o.country || o.origin).filter(Boolean)));
  const tiles = [
    ['CO2 (production)', formatUnitSpacing(esg.co2Production)],
    ['CO2 (transport)', formatUnitSpacing(esg.co2Transportation)],
    ...(Array.isArray(impact.items) && impact.items.length
      ? impact.items.map((it) => [it.label, formatUnitSpacing(it.value)])
      : [['CO2 avoided', impact.co2Avoided], ['Water saved', impact.waterSaved], ['Energy saved', impact.energySaved]]),
  ].filter(([, v]) => v);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={5}>
        <Section title="Origin">
          <Stack spacing={1.5}>
            <Fact label="Made in" value={esg.originCountry || esg.madeIn} />
            <Fact label="Materials sourced from" value={sourced.join(', ')} />
            <Fact label="Shipping" value={esg.shippingLog} />
            <Fact label="Distance" value={esg.distance} />
            {!(esg.originCountry || esg.madeIn || sourced.length || esg.shippingLog || esg.distance) && <Empty />}
          </Stack>
        </Section>
      </Grid>
      <Grid item xs={12} md={7}>
        <Section title="Environmental impact">
          {tiles.length ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 1.5 }}>
              {tiles.map(([label, value]) => (
                <Box key={label} sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 1.5 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', color: 'primary.main' }}>{value}</Typography>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                </Box>
              ))}
            </Box>
          ) : <Empty />}
        </Section>
      </Grid>
    </Grid>
  );
}

function CareTab({ info }) {
  const icons = toArray(info.maintenance?.iconIds).filter(Boolean);
  const tips = careTipsOf(info);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={5}>
        <Section title="Care symbols">
          {icons.length ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {icons.map((id, i) => (
                <Box key={`${id}-${i}`} sx={{ width: 76, textAlign: 'center' }}>
                  <Box sx={{ width: 52, height: 52, mx: 'auto', borderRadius: 2, border: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {CARE_SYMBOL_GLYPH[id] || '?'}
                  </Box>
                  <Typography variant="caption" color="text.secondary">{CARE_SYMBOL_LABEL[id] || id}</Typography>
                </Box>
              ))}
            </Box>
          ) : <Empty />}
        </Section>
      </Grid>
      <Grid item xs={12} md={7}>
        <Section title="Care tips">
          {tips.length ? tips.map((tip, i) => (
            <Stack key={i} direction="row" spacing={1} sx={{ py: 0.5 }}>
              <CheckCircleIcon color="primary" sx={{ fontSize: 18, mt: 0.25 }} />
              <Box>
                <Typography variant="body2">{tip.primary}</Typography>
                {!!tip.detail && <Typography variant="caption" color="text.secondary">{tip.detail}</Typography>}
              </Box>
            </Stack>
          )) : <Empty />}
        </Section>
      </Grid>
    </Grid>
  );
}

function ReuseTab({ info }) {
  const services = readyServices(info);
  if (!services.length) return <Empty />;
  return (
    <Grid container spacing={2}>
      {services.map((d) => {
        const Icon = SERVICE_ICON[d.kind];
        const facts = [[d.meta.cost.label, d.cost], [d.meta.time.label, d.time], [d.meta.note.label, d.note]].filter(([, v]) => v);
        return (
          <Grid item xs={12} md={6} key={d.kind}>
            <Section>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {Icon && <Icon color="primary" />}
                </Box>
                <Typography sx={{ fontWeight: 700 }}>{d.meta.shopperTitle}</Typography>
              </Stack>
              <Stack spacing={1.25}>
                {facts.map(([label, value]) => <Fact key={label} label={label} value={value} />)}
                {d.steps.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>How it works</Typography>
                    {d.steps.map((step, i) => <Typography key={i} variant="body2" sx={{ py: 0.25 }}>{i + 1}. {step}</Typography>)}
                  </Box>
                )}
                {(d.partnerName || d.email || d.phone) && (
                  <Typography variant="body2" color="text.secondary">{[d.partnerName, d.email, d.phone].filter(Boolean).join(' · ')}</Typography>
                )}
                {!!d.url && (
                  <Box>
                    <Button size="small" variant="outlined" endIcon={<OpenInNewIcon />} onClick={() => window.open(d.url, '_blank', 'noopener,noreferrer')}>
                      Open website
                    </Button>
                  </Box>
                )}
              </Stack>
            </Section>
          </Grid>
        );
      })}
    </Grid>
  );
}

function ComplianceTab({ info }) {
  const certifications = toArray(info.certifications).map((c) => (typeof c === 'string' ? { title: c } : c)).filter((c) => c && (c.title || c.content));
  const documents = [...toArray(info.files), ...toArray(info.manualsAndCerts?.files)].filter(Boolean);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={7}>
        <Section title="Certifications">
          {certifications.length ? certifications.map((c, i) => {
            const expired = !!c.validUntil && c.validUntil < today;
            const meta = [c.issuer && `Issued by ${c.issuer}`, c.number && `No. ${c.number}`, c.validUntil && `${expired ? 'Expired' : 'Valid until'} ${c.validUntil}`].filter(Boolean).join(' · ');
            return (
              <Stack key={i} direction="row" spacing={1.25} sx={{ py: 1, borderBottom: i < certifications.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                <VerifiedIcon sx={{ color: expired ? 'warning.main' : 'success.main', mt: 0.25 }} />
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>{c.title || '—'}</Typography>
                  {!!meta && <Typography variant="body2" color={expired ? 'warning.main' : 'text.secondary'}>{meta}</Typography>}
                  {!!c.content && <Typography variant="body2" color="text.secondary">{c.content}</Typography>}
                </Box>
              </Stack>
            );
          }) : <Empty />}
        </Section>
      </Grid>
      <Grid item xs={12} md={5}>
        <Stack spacing={2}>
          <Section title="Warranty">
            <Stack spacing={1.5}>
              <Fact label="Status" value={info.warrantyStatus} />
              <Fact label="Valid for" value={Number(info.warrantyValidYears) ? `${info.warrantyValidYears} years` : ''} />
              {!info.warrantyStatus && !Number(info.warrantyValidYears) && <Empty />}
            </Stack>
          </Section>
          {documents.length > 0 && (
            <Section title="Documents">
              {documents.map((doc, i) => (
                <Button key={i} startIcon={<PictureAsPdfIcon />} href={getFileUrl(String(doc))} target="_blank" rel="noopener noreferrer" sx={{ justifyContent: 'flex-start', display: 'flex' }}>
                  {decodeURIComponent(String(doc).split('/').pop() || 'Document')}
                </Button>
              ))}
            </Section>
          )}
        </Stack>
      </Grid>
    </Grid>
  );
}
