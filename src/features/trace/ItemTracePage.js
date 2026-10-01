import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, Chip, IconButton, InputAdornment, Link, Stack, TextField, Tooltip, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GppBadIcon from '@mui/icons-material/GppBad';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PageHeader from '../../components/PageHeader';
import Loader from '../../components/Loader';
import CopyIconButton from '../../components/CopyIconButton';
import ProductsTable from '../products/ProductsTable';
import { getFileUrl, getTraceItem, getTraceProduct, searchTrace } from '../../helper';
import { processStepTypeLabel } from '../../utils/processStepTypes';
import { METHOD_LABELS } from './TracePage';

const ItemMap = React.lazy(() => import('./ItemMap'));

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
  security_pass: { Icon: VerifiedUserIcon, color: '#2e7d32', title: () => 'Security QR check passed' },
  security_fail: { Icon: GppBadIcon, color: '#d32f2f', title: () => 'Security QR check failed' },
  capture: {
    Icon: AssignmentTurnedInIcon,
    color: '#6a4fb3',
    title: (e) => `Staff capture: ${e.step || processStepTypeLabel(e.stepType) || 'step'}`,
  },
  transfer: {
    Icon: SwapHorizIcon,
    color: '#b26a00',
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

function ProductCard({ product, children }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', bgcolor: '#fff', borderRadius: 2, boxShadow: 1, p: 2, mb: 2 }}>
      <Box
        component="img"
        alt=""
        src={product.image ? getFileUrl(product.image) : undefined}
        sx={{ width: 84, height: 84, borderRadius: 1.5, objectFit: 'cover', bgcolor: '#eef1f6', flexShrink: 0, visibility: product.image ? 'visible' : 'hidden' }}
      />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {product.brandName && (
          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>{product.brandName}</Typography>
        )}
        <Typography variant="h6" component="h2">{product.name || 'Untitled product'}</Typography>
        <Typography variant="body2" color="text.secondary">
          {[product.model, product.color, product.size, product.skuStyleNumber && `Style ${product.skuStyleNumber}`].filter(Boolean).join(' · ')}
        </Typography>
        {children}
      </Box>
    </Box>
  );
}

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

function Timeline({ events, showItem, onOpenItem }) {
  if (!events.length) {
    return <Typography color="text.secondary">Nothing has been recorded yet. Scans, staff captures and ownership transfers appear here as they happen.</Typography>;
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
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{kind.title(e)}</Typography>
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

// "Product Activity": pick a product from the list (as on the Products page)
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

  const show = async (request, { keepParent = false } = {}) => {
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
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const findCode = (q) => {
    const value = String(q || '').trim();
    if (value.length < 2) {
      setError('Type at least 2 characters, then press Find.');
      return;
    }
    setInput(value);
    show(searchTrace(token, value));
  };

  const openProduct = (id) => show(getTraceProduct(token, id));

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

  const openItem = (id, itemId) => {
    if (result?.type === 'product') setParent(result);
    show(getTraceItem(token, id, itemId), { keepParent: true });
  };

  // The box narrows the list by product name, model, brand or style number.
  const filteredProducts = useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => [p.name, p.model, p.brandInfo?.name, p.skuStyleNumber, p.company_id?.name]
      .some((v) => String(v || '').toLowerCase().includes(q)));
  }, [products, input]);

  const events = result?.timeline || [];
  // Oldest first, so the line on the map follows the item's journey.
  const mapPoints = [...events]
    .reverse()
    .filter((e) => typeof e.place?.latitude === 'number' && typeof e.place?.longitude === 'number')
    .map((e) => ({
      lat: e.place.latitude,
      lng: e.place.longitude,
      color: (EVENT_KINDS[e.kind] || EVENT_KINDS.scan).color,
      label: `${(EVENT_KINDS[e.kind] || EVENT_KINDS.scan).title(e)} — ${formatWhen(e.at)}`,
    }));
  const selectedId = result && result.type !== 'list' ? result.product._id : undefined;

  return (
    <Box>
      <PageHeader
        title="Product Activity"
        description="Click a product to see where and when it was scanned, captured by staff or changed owner."
      />

      <Stack
        component="form"
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ mb: 2 }}
        onSubmit={(e) => {
          e.preventDefault();
          findCode(input);
        }}
      >
        <TextField
          id="activity-search"
          placeholder="Search by product or brand, or enter a code"
          inputProps={{ 'aria-label': 'Search products, or enter a code' }}
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(''); }}
          sx={{ flex: 1, maxWidth: 520, bgcolor: 'background.paper', borderRadius: 2 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
        <Tooltip title="Look this text up as a code: passport ID, QR link, serial number, RFID or NFC tag, barcode">
          <span>
            <Button type="submit" variant="outlined" disabled={loading || input.trim().length < 2}>Find code</Button>
          </span>
        </Tooltip>
        {onReloadProducts && (
          <Tooltip title="Reload the list">
            <IconButton onClick={onReloadProducts} color="primary" aria-label="Reload products"><RefreshIcon /></IconButton>
          </Tooltip>
        )}
      </Stack>

      <ProductsTable
        products={filteredProducts}
        loading={productsLoading}
        selectedId={selectedId}
        showOwner={showOwner}
        emptyText={input.trim()
          ? 'No product matches. If this is a code from a label or tag, press "Find code".'
          : 'No products yet.'}
        onSelectProduct={(row) => openProduct(row._id)}
      />

      <Box ref={resultRef} sx={{ mt: 2.5, scrollMarginTop: 16 }}>
        {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}
        {loading && <Loader label="Loading the activity…" />}

        {!loading && result?.type === 'list' && (
          <Alert severity="info">
            {result.products.length === 0
              ? `No code matches "${input}". Check it for typing mistakes — a code is only found when it is entered in full.`
              : 'That is not a code. Click one of the products above to see its activity.'}
          </Alert>
        )}

        {!loading && result && result.type !== 'list' && (
          <Box>
            {result.type === 'item' && parent && (
              <Button startIcon={<ArrowBackIcon />} onClick={() => { setResult(parent); setParent(null); }} sx={{ mb: 1 }}>
                Back to all items of {parent.product.name || 'the product'}
              </Button>
            )}
            <ProductCard product={result.product}>
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
            </ProductCard>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2, alignItems: 'start' }}>
              <Box sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, p: 2 }}>
                <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>
                  {result.type === 'item' ? 'History of this item' : 'Latest activity across all items'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Newest first.</Typography>
                <Timeline
                  events={events}
                  showItem={result.type === 'product'}
                  onOpenItem={(itemId) => openItem(result.product._id, itemId)}
                />
              </Box>
              <Box sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, p: 2, position: { lg: 'sticky' }, top: { lg: 0 } }}>
                <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>Where it happened</Typography>
                {mapPoints.length ? (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {mapPoints.length} of {events.length} events have a location. The line follows them in time order; the largest dot is the most recent.
                    </Typography>
                    <Suspense fallback={<Loader label="Loading the map…" />}>
                      <ItemMap points={mapPoints} />
                    </Suspense>
                  </>
                ) : (
                  <Typography color="text.secondary">None of these events has a location yet.</Typography>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
