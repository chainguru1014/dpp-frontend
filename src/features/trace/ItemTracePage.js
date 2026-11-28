import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, Chip, Link, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GppBadIcon from '@mui/icons-material/GppBad';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SpaIcon from '@mui/icons-material/Spa';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PageHeader from '../../components/PageHeader';
import ProductBar from '../../components/ProductBar';
import ProductChooser from '../../components/ProductChooser';
import Loader from '../../components/Loader';
import CopyIconButton from '../../components/CopyIconButton';
import { getTraceItem, getTraceProduct, searchTrace } from '../../helper';
import { processStepTypeLabel } from '../../utils/processStepTypes';
import { METHOD_LABELS } from './TracePage';

// Google Maps when a key is configured (REACT_APP_GOOGLE_MAPS_KEY), otherwise OpenStreetMap.
const USE_GOOGLE_MAPS = !!process.env.REACT_APP_GOOGLE_MAPS_KEY;
const ItemMap = React.lazy(() => (USE_GOOGLE_MAPS ? import('./GoogleItemMap') : import('./ItemMap')));
// Same green as the lifecycle line and dots on the map.
const LIFECYCLE_COLOR = '#1b4f72';
const LIFECYCLE_ICONS = { materials: SpaIcon, manufacturing: PrecisionManufacturingIcon, transport: LocalShippingIcon };

const IDENTIFIER_LABELS = { qr: 'QR code', barcode: 'Barcode', nfc: 'NFC tag', rfid: 'RFID tag', gs1dl: 'GS1 Digital Link' };

// One entry per kind of event: its icon, colour (also the map dot) and how
// to say it in a sentence.
const EVENT_KINDS = {
  created: { Icon: AddCircleOutlineIcon, color: '#5c6b84', title: () => 'Code created' },
  scan: {
    Icon: QrCodeScannerIcon,
    color: '#2f80c8',
    title: (e) => `${e.source === 'visit' ? 'Product page opened' : 'Scanned'} (${IDENTIFIER_LABELS[e.identifierType] || 'QR code'})`,
  },
  security_pass: { Icon: VerifiedUserIcon, color: '#1b4f72', title: () => 'Security QR check passed' },
  security_fail: { Icon: GppBadIcon, color: '#1b4f72', title: () => 'Security QR check failed' },
  capture: {
    Icon: AssignmentTurnedInIcon,
    color: '#1b4f72',
    title: (e) => `Work step recorded: ${e.step || processStepTypeLabel(e.stepType) || 'step'}`,
  },
  transfer: {
    Icon: SwapHorizIcon,
    color: '#1b4f72',
    title: (e) => `Ownership ${e.status === 'confirmed' ? 'transferred' : `transfer ${e.status}`} (${METHOD_LABELS[e.method] || e.method})`,
  },
};

const formatWhen = (d) => {
  try {
    return new Date(d).toLocaleString();
  } catch (e) {
    return '';
  }
};

const placeText = (place) => [place?.address, place?.city, place?.region, place?.country].filter(Boolean).join(', ');

const eventDetail = (e) => {
  if (e.kind === 'capture') return [e.worker && `by ${e.worker}`, e.refNumber && `ref ${e.refNumber}`].filter(Boolean).join(' · ');
  if (e.kind === 'transfer') return [e.from && `from ${e.from}`, e.to && `to ${e.to}`, e.quantity > 1 && `× ${e.quantity}`].filter(Boolean).join(' ');
  if (e.kind === 'scan' || e.kind === 'security_pass' || e.kind === 'security_fail') return e.byAppUser ? 'by a signed-in app user' : 'by a visitor';
  return '';
};

// The filters over the map and the activity list (client 2026-11-26): a
// date range, who it was and what came of it. Everything shows by default.
const WHO = [['all', 'All user types'], ['consumer', 'Consumers (signed in)'], ['visitor', 'Visitors (not signed in)'], ['staff', 'Staff (work steps)']];
const OUTCOME = [['all', 'All results'], ['genuine', 'Genuine scans'], ['failed', 'Security check failed'], ['work', 'Work steps'], ['transfer', 'Ownership transfers']];
const NO_FILTER = { from: '', to: '', who: 'all', outcome: 'all' };
const whoOf = (e) => (e.kind === 'capture' ? 'staff' : e.kind === 'transfer' ? 'consumer' : e.kind === 'created' ? '' : e.byAppUser ? 'consumer' : 'visitor');
const outcomeOf = (e) => ({ scan: 'genuine', security_pass: 'genuine', security_fail: 'failed', capture: 'work', transfer: 'transfer' }[e.kind] || '');
const passes = (e, flt) => {
  const t = new Date(e.at).getTime();
  if (flt.from && !(t >= new Date(`${flt.from}T00:00:00`).getTime())) return false;
  if (flt.to && !(t <= new Date(`${flt.to}T23:59:59.999`).getTime())) return false;
  if (flt.who !== 'all' && whoOf(e) !== flt.who) return false;
  if (flt.outcome !== 'all' && outcomeOf(e) !== flt.outcome) return false;
  return true;
};

function CodeLine({ label, value }) {
  if (!value) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>{label}:</Typography>
      <Typography variant="body2" sx={{ fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={value}>{value}</Typography>
      <CopyIconButton value={value} />
    </Box>
  );
}

function Timeline({ events, showItem, onOpenItem, emptyText }) {
  if (!events.length) {
    return <Typography color="text.secondary">{emptyText || <>Nothing has been recorded yet. Scans, recorded work steps and ownership transfers appear here as they happen.</>}</Typography>;
  }
  return (
    <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {events.map((e, i) => {
        const kind = EVENT_KINDS[e.kind] || EVENT_KINDS.scan;
        const where = placeText(e.place);
        const detail = eventDetail(e);
        return (
          <Box component="li" key={i} sx={{ display: 'flex', gap: 1.5, position: 'relative', pb: 2 }}>
            {i < events.length - 1 && <Box sx={{ position: 'absolute', left: 15, top: 32, bottom: 0, width: 2, bgcolor: 'divider' }} />}
            <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: kind.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <kind.Icon sx={{ fontSize: 18 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body1" sx={{ fontWeight: 400 }}>{kind.title(e)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {formatWhen(e.at)}{where ? ` · ${where}` : ''}
              </Typography>
              {detail && <Typography variant="body2" color="text.secondary">{detail}</Typography>}
              {showItem && e.itemId != null && (
                <Link component="button" type="button" variant="body2" onClick={() => onOpenItem(e.itemId)}>
                  Open item #{e.itemId}
                </Link>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

// "Product Journey": pick a product from the list (as on the Products page)
// to see everything recorded for it — every scan, staff capture and
// ownership transfer, newest first, and where each happened on a map. The
// search box narrows the list as you type; pressing Find looks the text up
// as a code (passport ID, QR link, serial, RFID/NFC tag, barcode/GTIN) and
// opens that one item's own history.
export default function ItemTracePage({
  token, products = [], productsLoading = false, showOwner = false, onReloadProducts,
  query, onQueryHandled, productId, onProductHandled,
}) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  // The product result we came from, so an item opened from it can go back.
  const [parent, setParent] = useState(null);
  const resultRef = useRef(null);

  // How the open view was loaded, so Refresh can load it again.
  const lastLoad = useRef(null);
  const load = (factory, opts) => { lastLoad.current = factory; return show(factory(), opts); };
  const show = async (request, { keepParent = false, scroll = true } = {}) => {
    setLoading(true);
    setError('');
    const res = await request;
    setLoading(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    if (!keepParent) setParent(null);
    setResult(res.data);
    if (scroll) setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const findCode = (q) => {
    const value = String(q || '').trim();
    if (value.length < 2) {
      setError('Type at least 2 characters, then press Find.');
      return;
    }
    setInput(value);
    load(() => searchTrace(token, value));
  };

  const openProduct = (id) => load(() => getTraceProduct(token, id));

  // A code typed into the top bar arrives through `query`; a product picked
  // elsewhere (the dashboard's "Analyze products") through `productId`.
  useEffect(() => {
    if (!query) return;
    findCode(query);
    if (onQueryHandled) onQueryHandled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
  useEffect(() => {
    if (!productId) return;
    setInput('');
    openProduct(productId);
    if (onProductHandled) onProductHandled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // With only one product there is nothing to choose: show its journey.
  const autoOpened = useRef(false);
  useEffect(() => {
    if (autoOpened.current || productsLoading || products.length !== 1 || query || productId || result || loading) return;
    autoOpened.current = true;
    load(() => getTraceProduct(token, products[0]._id), { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, productsLoading]);

  const openItem = (id, itemId) => {
    if (result?.type === 'product') setParent(result);
    load(() => getTraceItem(token, id, itemId), { keepParent: true });
  };

  // The box narrows the list by product name, model, brand or style number.
  const filteredProducts = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => [p.name, p.model, p.brandInfo?.name, p.skuStyleNumber, p.company_id?.name]
      .some((v) => String(v || '').toLowerCase().includes(q)));
  }, [products, input]);

  const allEvents = result?.timeline || [];
  const [flt, setFlt] = useState(NO_FILTER);
  const filtered = flt.from || flt.to || flt.who !== 'all' || flt.outcome !== 'all';
  const events = useMemo(() => (filtered ? allEvents.filter((e) => passes(e, flt)) : allEvents), [allEvents, flt, filtered]);
  const refresh = () => { if (lastLoad.current) show(lastLoad.current(), { keepParent: true, scroll: false }); };
  // Oldest first, so the line on the map follows the item's journey.
  const mapPoints = [...events]
    .reverse()
    .filter((e) => typeof e.place?.latitude === 'number' && typeof e.place?.longitude === 'number')
    .map((e) => ({
      lat: e.place.latitude,
      lng: e.place.longitude,
      color: (EVENT_KINDS[e.kind] || EVENT_KINDS.scan).color,
      // The bubble's colour and its GPS / IP mark (ItemMap).
      kind: e.kind === 'security_fail' ? 'problem' : e.kind === 'capture' ? 'staff' : e.kind === 'transfer' ? 'transfer' : 'genuine',
      viaIp: e.place?.source === 'ip',
      label: `${(EVENT_KINDS[e.kind] || EVENT_KINDS.scan).title(e)} — ${formatWhen(e.at)}`,
      // Shown on the map beside the dot: "Tokyo, Japan".
      place: [...new Set([e.place?.city, e.place?.country].filter(Boolean))].join(', ') || e.place?.region || '',
    }));
  const selectedId = result && result.type !== 'list' ? result.product?._id : undefined;
  // The product list shows while choosing; afterwards the product bar.
  const [pickingProduct, setPickingProduct] = useState(false);
  // The lifecycle the brand entered for the product, in order.
  const lifecycle = (result && result.type !== 'list' && result.lifecycle) || [];
  const lifecyclePoints = lifecycle
    .filter((s) => typeof s.latitude === 'number' && typeof s.longitude === 'number')
    .map((s) => ({ lat: s.latitude, lng: s.longitude, color: LIFECYCLE_COLOR, label: `${s.title}: ${s.detail}`, place: s.placeName || '', stage: s.stage || '' }));

  return (
    <Box>
      <PageHeader
        title="Product Journey"
        description="Click a product to see where and when it was scanned, handled by your employees or changed owner."
      />

      {/* The same product chooser as on every page; its box also looks a
          code up (Find code). Hidden once a product is chosen. */}
      {selectedId && !pickingProduct ? null : (
        <ProductChooser
          searchId="activity-search"
          query={input}
          onQueryChange={(v) => { setInput(v); setError(''); }}
          placeholder={showOwner ? 'Search by product or company, or enter a code' : 'Search by product, or enter a code'}
          onSubmit={() => findCode(input)}
          actions={(
            <Tooltip title="Look this text up as a code: passport ID, QR link, serial number, RFID or NFC tag, barcode">
              <span>
                <Button type="submit" variant="outlined" disabled={loading || input.trim().length < 2}>Find code</Button>
              </span>
            </Tooltip>
          )}
          products={filteredProducts}
          loading={productsLoading}
          selectedId={selectedId}
          showOwner={showOwner}
          emptyText="No products yet."
          onSelect={(row) => { setPickingProduct(false); openProduct(row._id); }}
        />
      )}

      <Box ref={resultRef} sx={{ mt: 2.5, scrollMarginTop: 16 }}>
        {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
        {loading && <Loader label="Loading the activity…" />}

        {!loading && result?.type === 'list' && (
          <Alert severity="info">
            {result.products.length === 0
              ? `No code matches “${input}”. Check it for typing mistakes: a code is only found when it’s entered in full.`
              : 'That isn’t a code. Click one of the products above to see its activity.'}
          </Alert>
        )}

        {!loading && result && result.type !== 'list' && (
          <Box>
            {result.type === 'item' && parent && (
              <Button startIcon={<ArrowBackIcon />} onClick={() => { setResult(parent); setParent(null); }} sx={{ mb: 1 }}>
                Back to all items of {parent.product.name || 'the product'}
              </Button>
            )}
            <ProductBar
              product={{ ...((products || []).find((p) => p._id === result.product?._id) || {}), ...result.product }}
              onChange={selectedId && !pickingProduct ? () => {
                setPickingProduct(true);
                // Up to the search box and the products to choose from.
                setTimeout(() => document.getElementById('activity-search')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
              } : undefined}
            >
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                <Chip size="small" color="primary" label={result.type === 'item' ? `Item #${result.item.qrcodeId}` : `All items (${result.product.totalCodes} codes)`} />
                {result.type === 'item' && <Chip size="small" variant="outlined" label={`Found by: ${result.matchedBy}`} />}
                {result.type === 'item' && result.item.blocked && (
                  <Chip size="small" color="error" label="Marked as suspected copy" title={result.item.blockedNote || undefined} />
                )}
              </Stack>
              {result.type === 'item' && (
                <Box sx={{ mt: 1 }}>
                  <CodeLine label="Passport ID" value={result.item.pmcCode} />
                  {result.item.identifiers.map((id, i) => (
                    <CodeLine key={`i${i}`} label={IDENTIFIER_LABELS[id.type] || id.type} value={id.value} />
                  ))}
                  {result.item.serials.map((s, i) => (
                    <CodeLine key={`s${i}`} label={`Serial${s.type ? ` (${s.type})` : ''}`} value={s.value} />
                  ))}
                </Box>
              )}
            </ProductBar>

            {/* Filters for the activity list and the map (all by default). */}
            <Box sx={{ bgcolor: '#fff', borderRadius: '20px', boxShadow: '0 1px 2px rgba(18,58,86,0.06)', px: 2, py: 1.5, mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
              <TextField type="date" size="small" label="From" value={flt.from} onChange={(e) => setFlt((v) => ({ ...v, from: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ width: 170 }} inputProps={{ max: flt.to || undefined }} />
              <Typography color="text.secondary">~</Typography>
              <TextField type="date" size="small" label="To" value={flt.to} onChange={(e) => setFlt((v) => ({ ...v, to: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ width: 170 }} inputProps={{ min: flt.from || undefined }} />
              <TextField select size="small" value={flt.who} onChange={(e) => setFlt((v) => ({ ...v, who: e.target.value }))} sx={{ minWidth: 210 }} inputProps={{ 'aria-label': 'User type' }}>
                {WHO.map(([k, l]) => <MenuItem key={k} value={k}>{l}</MenuItem>)}
              </TextField>
              <TextField select size="small" value={flt.outcome} onChange={(e) => setFlt((v) => ({ ...v, outcome: e.target.value }))} sx={{ minWidth: 210 }} inputProps={{ 'aria-label': 'Result' }}>
                {OUTCOME.map(([k, l]) => <MenuItem key={k} value={k}>{l}</MenuItem>)}
              </TextField>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refresh} disabled={loading}>Refresh</Button>
              <Button startIcon={<RestartAltIcon />} onClick={() => setFlt(NO_FILTER)} disabled={!filtered}>Reset</Button>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                {filtered ? `Showing ${events.length} of ${allEvents.length} activities` : `${allEvents.length} ${allEvents.length === 1 ? 'activity' : 'activities'}`}
              </Typography>
            </Box>

            {/* Lists take a third of the width, the map two thirds. */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 2fr)' }, gap: 2, alignItems: 'start' }}>
              <Stack spacing={2}>
              {/* What the brand entered for the product: materials, where it was made, how it was shipped. */}
              <Box sx={{ bgcolor: '#fff', borderRadius: '24px', boxShadow: '0 1px 2px rgba(18,58,86,0.06)', p: 2 }}>
                <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>Product lifecycle</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  From the product’s information: where its materials come from, where it was made and how it was shipped.
                </Typography>
                {lifecycle.length === 0 ? (
                  <Typography color="text.secondary">
                    No lifecycle places entered yet. Add the country of manufacture, material suppliers and shipping route in the product’s “Origin &amp; shipping” step.
                  </Typography>
                ) : (
                  <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
                    {lifecycle.map((s, i) => {
                      const StepIcon = LIFECYCLE_ICONS[s.stage] || SpaIcon;
                      return (
                        <Box component="li" key={i} sx={{ display: 'flex', gap: 1.5, position: 'relative', pb: i < lifecycle.length - 1 ? 2 : 0 }}>
                          {i < lifecycle.length - 1 && <Box sx={{ position: 'absolute', left: 15, top: 32, bottom: 0, width: 2, bgcolor: LIFECYCLE_COLOR, opacity: 0.4 }} />}
                          <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: LIFECYCLE_COLOR, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <StepIcon sx={{ fontSize: 18 }} />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body1" sx={{ fontWeight: 400 }}>{i + 1}. {s.title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {s.detail}{s.latitude == null ? ' · not found on the map' : ''}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
              <Box sx={{ bgcolor: '#fff', borderRadius: '24px', boxShadow: '0 1px 2px rgba(18,58,86,0.06)', p: 2 }}>
                <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>
                  {result.type === 'item' ? `History of item #${result.item.qrcodeId}` : `Activity for ${result.product?.name || 'this product'}`}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {result.type === 'item' ? 'This item only, newest first.' : `Only this product: all its ${result.product?.totalCodes ?? ''} codes, newest first.`.replace('all its  codes', 'all its codes')}
                </Typography>
                <Timeline
                  events={events}
                  showItem={result.type === 'product'}
                  onOpenItem={(itemId) => openItem(result.product._id, itemId)}
                  emptyText={filtered ? 'No activity matches these filters.' : undefined}
                />
              </Box>
              </Stack>
              <Box sx={{ bgcolor: '#fff', borderRadius: '24px', boxShadow: '0 1px 2px rgba(18,58,86,0.06)', p: 2, position: { lg: 'sticky' }, top: { lg: 0 } }}>
                <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>On the map</Typography>
                {/* Only this product's own activity, as circles (client 2026-11-26):
                    the lifecycle has its own panel on the left. */}
                {mapPoints.length ? (
                  <>
                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: '#2f80c8', border: '2px solid #fff', boxShadow: '0 0 0 1px #c5cbd6' }} />
                        <Typography variant="body2" color="text.secondary">Recorded activity ({mapPoints.length} of {events.length} with a place{filtered ? ', filtered' : ''})</Typography>
                      </Box>
                    </Stack>
                    <Suspense fallback={<Loader label="Loading the map…" />}>
                      <ItemMap points={mapPoints} height={520} />
                    </Suspense>
                  </>
                ) : (
                  <Typography color="text.secondary">{filtered ? 'No activity with a place matches these filters.' : 'No activity with a place yet. Located scans, work steps and transfers of this product appear here.'}</Typography>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
