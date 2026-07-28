import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Pagination,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import qrcode from 'qrcode';
import {
  registerProductIdentifier,
  listProductIdentifiers,
  deleteProductIdentifier,
  printProductIdentifiers,
} from '../../helper';
import CopyIconButton from '../CopyIconButton';
import { renderEan13ToDataUrl, toValidEan13 } from '../../utils/barcodeRenderer';
import PrintDialog from '../printModal/PrintDialog';

const SOURCE_TYPES = [
  { value: 'barcode', label: 'Barcode / GTIN' },
  { value: 'nfc', label: 'NFC Tag' },
  { value: 'rfid', label: 'RFID Tag' },
  { value: 'gs1dl', label: 'GS1 Digital Link' },
];

const PAGE_SIZE = 10;
const MAX_BULK = 50;

// Just enough width for each type's actual value shape (short numeric
// barcode vs. a full GS1 Digital Link URL) instead of one wide field sized
// for the longest case.
const VALUE_WIDTH = {
  barcode: 160,
  nfc: 200,
  rfid: 220,
  gs1dl: 340,
};
const DEFAULT_VALUE_WIDTH = 240;

const randomDigits = (count) => Array.from({ length: count }, () => Math.floor(Math.random() * 10)).join('');
const randomHex = (bytes) => Array.from({ length: bytes }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('').toUpperCase();

// Random-value stubs for the four identifier types that have no real
// scanning/reading engine wired into this app yet (RFID has no reader at
// all; NFC/barcode/GS1-DL have no in-browser writer/generator hardware
// either) — good enough to exercise registration + PMC resolution + display
// end to end today. Swap for a real generator per type when that engine
// exists (e.g. an actual EPC allocation scheme for RFID, a real NFC tag
// writer flow, a company's actual GTIN range for barcodes).
const generateRandomValue = (sourceType) => {
  switch (sourceType) {
    case 'barcode':
      // Register the full 13-digit EAN-13 (12 random digits + the same check
      // digit renderEan13ToDataUrl/CodeImage computes for display) — a scan
      // of the rendered barcode returns all 13 digits, so the registered
      // raw_value must include the check digit too or lookup never matches.
      return toValidEan13(randomDigits(12));
    case 'gs1dl':
      return `https://id.gs1.org/01/${randomDigits(14)}/21/SN${randomDigits(6)}`;
    case 'nfc':
      return `NFC-${randomHex(7)}`;
    case 'rfid':
      return `RFID-${randomHex(12)}`;
    default:
      return '';
  }
};

// Renders the barcode/QR image for one identifier's value — sync for
// barcode (canvas), async for gs1dl (qrcode.toDataURL). Reports the finished
// data URL up via onReady so the parent card can put a download button for
// it in its own bottom-right action row (rather than overlaying the image).
const CodeImage = ({ sourceType, value, onReady }) => {
  const [image, setImage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (sourceType === 'barcode') {
      const url = renderEan13ToDataUrl(value);
      setImage(url);
      onReady?.(url);
    } else if (sourceType === 'gs1dl' && value) {
      qrcode.toDataURL(value).then((url) => {
        if (cancelled) return;
        setImage(url);
        onReady?.(url);
      }).catch((err) => {
        console.error('Failed to render GS1 Digital Link QR code:', err);
        setImage(null);
      });
    } else {
      setImage(null);
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceType, value]);

  if (!image) return null;

  return <img src={image} alt={sourceType} style={{ width: '100%', display: 'block', background: '#fff', marginBottom: 6 }} />;
};

// Lets a company register a barcode/GTIN/NFC/RFID identifier against a
// product ahead of time. Without this, scanning one of these in the app has
// no product_id to resolve against at all — unlike our own minted QR codes,
// which encode it directly (see backend productIdentifierController).
//
// `lockedSourceType`: when set (the Generate & Print page uses this — one
// tab per identifier type), the type picker is replaced with a fixed label
// and the list below only shows identifiers of that type, instead of a
// mixed list with a type dropdown.
const RegisterIdentifierPanel = ({ productId, companyId, lockedSourceType, product, onProductChange }) => {
  const [identifiers, setIdentifiers] = useState([]);
  const [sourceType, setSourceType] = useState(lockedSourceType || 'barcode');
  const [rawValue, setRawValue] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bulkAmount, setBulkAmount] = useState(5);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [page, setPage] = useState(1);
  const [imagesByItemId, setImagesByItemId] = useState({});
  const [printOpen, setPrintOpen] = useState(false);

  const activeLabel = SOURCE_TYPES.find((t) => t.value === sourceType)?.label || sourceType;
  const visibleIdentifiers = useMemo(
    () => (lockedSourceType ? identifiers.filter((item) => item.source_type === lockedSourceType) : identifiers),
    [identifiers, lockedSourceType]
  );
  // Stable oldest-first order for the print dialog's position-based ranges —
  // listProductIdentifiers returns newest-first (for the on-screen grid), but
  // a printed "position" needs to mean the same item forever, the same way a
  // regular QR code's position is its permanent qrcode_id.
  const printOrderIdentifiers = useMemo(
    () => [...visibleIdentifiers].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [visibleIdentifiers]
  );
  const totalPages = Math.max(1, Math.ceil(visibleIdentifiers.length / PAGE_SIZE));
  const pageItems = visibleIdentifiers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [lockedSourceType, productId]);

  const refresh = useCallback(async () => {
    if (!productId) {
      setIdentifiers([]);
      return;
    }
    setIdentifiers(await listProductIdentifiers(productId));
  }, [productId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRegister = async () => {
    if (!productId || !companyId || !rawValue.trim()) return;
    setSubmitting(true);
    try {
      const created = await registerProductIdentifier(productId, companyId, sourceType, rawValue.trim(), note.trim());
      if (created) {
        setRawValue('');
        setNote('');
        setPage(1);
        await refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk random generation — a stand-in for a real per-type generation/
  // reading engine (see generateRandomValue above), registering `amount`
  // random values of the locked type in one go.
  const handleBulkGenerate = async () => {
    const amount = Math.max(1, Math.min(MAX_BULK, Number(bulkAmount) || 0));
    if (!productId || !companyId || !amount) return;
    setBulkGenerating(true);
    try {
      for (let i = 0; i < amount; i++) {
        // eslint-disable-next-line no-await-in-loop
        await registerProductIdentifier(productId, companyId, sourceType, generateRandomValue(sourceType), '');
      }
      setPage(1);
      await refresh();
    } finally {
      setBulkGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    if (await deleteProductIdentifier(id)) {
      await refresh();
    }
  };

  // Renders one PDF-ready item per identifier in the requested 1-indexed
  // position range (see printOrderIdentifiers above) — barcode/gs1dl render
  // an image the same way CodeImage above does, with the raw value carried
  // as `code` so MyDocument can print a truncated reference under it; NFC/RFID
  // have no visual code, so the bare tag value is printed as truncated text
  // instead.
  const printItemsSource = async (fromN, toN) => {
    const slice = printOrderIdentifiers.slice(Math.max(0, fromN - 1), toN);
    return Promise.all(slice.map(async (item) => {
      if (item.source_type === 'barcode') {
        return { img: renderEan13ToDataUrl(item.raw_value), code: item.raw_value };
      }
      if (item.source_type === 'gs1dl' && item.raw_value) {
        const img = await qrcode.toDataURL(item.raw_value).catch(() => null);
        return { img, code: item.raw_value };
      }
      return { code: item.raw_value };
    }));
  };

  const onMarkPrinted = async (count) => {
    const updated = await printProductIdentifiers(productId, lockedSourceType, count);
    if (updated && onProductChange) onProductChange(updated);
    return updated?.identifier_printed_amounts?.[lockedSourceType];
  };

  if (!productId) return null;

  return (
    <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
      {!lockedSourceType && (
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 400 }}>Registered Identifiers</Typography>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {lockedSourceType
          ? `Register this product's own ${activeLabel} so scanning it in the app resolves to this product and gets a PMC. Use this for identifiers printed outside this platform.`
          : "Register this product's own barcode, GTIN, NFC tag, or RFID tag so scanning it in the app resolves to this product and gets a PMC. Use this for identifiers printed outside this platform — including barcodes from companies that don't follow the GS1 Digital Link standard."}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 1.5 }}>
        {!lockedSourceType && (
          <TextField
            select
            label="Type"
            size="small"
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            {SOURCE_TYPES.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>
        )}
        <TextField
          label={lockedSourceType ? `${activeLabel} value` : 'Barcode / GTIN / Tag value'}
          size="small"
          value={rawValue}
          onChange={(e) => setRawValue(e.target.value)}
          sx={{ width: lockedSourceType ? VALUE_WIDTH[lockedSourceType] || DEFAULT_VALUE_WIDTH : DEFAULT_VALUE_WIDTH }}
        />
        <TextField
          label="Note (optional)"
          size="small"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          sx={{ minWidth: 180 }}
        />
        <Button
          variant="contained"
          onClick={handleRegister}
          disabled={submitting || !rawValue.trim() || !companyId}
        >
          Register
        </Button>
      </Box>

      {/* Bulk generation — a stand-in for a real generation/reading engine
          per type (see generateRandomValue above). Intentionally a separate
          control from manual Register above: this creates and registers
          `amount` values immediately. */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
        <Button
          variant="outlined"
          onClick={() => setPrintOpen(true)}
          disabled={visibleIdentifiers.length === 0}
        >
          Print
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <TextField
            type="number"
            label="Amount"
            size="small"
            value={bulkAmount}
            onChange={(e) => setBulkAmount(e.target.value)}
            inputProps={{ min: 1, max: MAX_BULK }}
            sx={{ width: 100 }}
          />
          <Button
            variant="outlined"
            onClick={handleBulkGenerate}
            disabled={bulkGenerating || !companyId || !bulkAmount || Number(bulkAmount) < 1}
          >
            {bulkGenerating ? 'Generating…' : 'Generate'}
          </Button>
        </Box>
      </Box>
      <PrintDialog
        open={printOpen}
        setOpen={setPrintOpen}
        title={`Print ${activeLabel}`}
        totalAmount={visibleIdentifiers.length}
        printedAmount={product?.identifier_printed_amounts?.[lockedSourceType] || 0}
        itemsSource={printItemsSource}
        onMarkPrinted={onMarkPrinted}
        fileNamePrefix={`${product?.name || 'product'}-${lockedSourceType || sourceType}`}
      />

      {!companyId && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          Company information not available — cannot register identifiers.
        </Typography>
      )}
      {pageItems.length > 0 ? (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, visibleIdentifiers.length)} of {visibleIdentifiers.length}
            </Typography>
            {totalPages > 1 && (
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, p) => setPage(p)}
                color="primary"
                shape="rounded"
                size="small"
                siblingCount={1}
                boundaryCount={1}
              />
            )}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1.5 }}>
            {pageItems.map((item) => (
              <Box
                key={item._id}
                sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.default' }}
              >
                {!lockedSourceType && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    {SOURCE_TYPES.find((t) => t.value === item.source_type)?.label || item.source_type}
                  </Typography>
                )}
                {(item.source_type === 'barcode' || item.source_type === 'gs1dl') && (
                  <CodeImage
                    sourceType={item.source_type}
                    value={item.raw_value}
                    onReady={(url) => setImagesByItemId((prev) => (prev[item._id] === url ? prev : { ...prev, [item._id]: url }))}
                  />
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ wordBreak: 'break-all', flex: 1 }}>{item.raw_value}</Typography>
                  <CopyIconButton value={item.raw_value} />
                </Box>
                {item.pmc_code && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', flex: 1 }}>
                      {item.pmc_code}
                    </Typography>
                    <CopyIconButton value={item.pmc_code} />
                  </Box>
                )}
                {item.note && item.note.trim().toLowerCase() !== 'test value' && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                    {item.note}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
                  {imagesByItemId[item._id] && (
                    <Tooltip title="Download image">
                      <IconButton
                        component="a"
                        href={imagesByItemId[item._id]}
                        download={`${item.source_type}-${item.raw_value}.png`}
                        size="small"
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Remove">
                    <IconButton size="small" onClick={() => handleDelete(item._id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </Box>
        </>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          {lockedSourceType ? `No ${activeLabel} registered yet for this product.` : 'No identifiers registered yet for this product.'}
        </Typography>
      )}
    </Box>
  );
};

export default RegisterIdentifierPanel;
