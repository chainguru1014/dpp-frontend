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
import CasinoIcon from '@mui/icons-material/Casino';
import qrcode from 'qrcode';
import {
  registerProductIdentifier,
  listProductIdentifiers,
  deleteProductIdentifier,
} from '../../helper';
import CopyIconButton from '../CopyIconButton';
import { renderEan13ToDataUrl } from '../../utils/barcodeRenderer';

const SOURCE_TYPES = [
  { value: 'barcode', label: 'Barcode / GTIN' },
  { value: 'nfc', label: 'NFC Tag' },
  { value: 'rfid', label: 'RFID Tag' },
  { value: 'gs1dl', label: 'GS1 Digital Link' },
];

const PAGE_SIZE = 8;

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
      // 12 random digits; the barcode renderer itself computes/appends a
      // valid EAN-13 check digit, so just hand it 12 digits here.
      return randomDigits(12);
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
// barcode (canvas), async for gs1dl (qrcode.toDataURL).
const CodeImage = ({ sourceType, value }) => {
  const [image, setImage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (sourceType === 'barcode') {
      setImage(renderEan13ToDataUrl(value));
    } else if (sourceType === 'gs1dl') {
      qrcode.toDataURL(value).then((url) => { if (!cancelled) setImage(url); }).catch(() => setImage(null));
    } else {
      setImage(null);
    }
    return () => { cancelled = true; };
  }, [sourceType, value]);

  if (!image) return null;

  return (
    <Box sx={{ position: 'relative', display: 'inline-block', width: '100%', mb: 1 }}>
      <img src={image} alt={sourceType} style={{ width: '100%', display: 'block', background: '#fff' }} />
      <Tooltip title="Download image">
        <IconButton
          component="a"
          href={image}
          download={`${sourceType}-${value}.png`}
          size="small"
          sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: '#fff' } }}
        >
          <DownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
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
const RegisterIdentifierPanel = ({ productId, companyId, lockedSourceType }) => {
  const [identifiers, setIdentifiers] = useState([]);
  const [sourceType, setSourceType] = useState(lockedSourceType || 'barcode');
  const [rawValue, setRawValue] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  const activeLabel = SOURCE_TYPES.find((t) => t.value === sourceType)?.label || sourceType;
  const showsImage = sourceType === 'barcode' || sourceType === 'gs1dl';
  const visibleIdentifiers = useMemo(
    () => (lockedSourceType ? identifiers.filter((item) => item.source_type === lockedSourceType) : identifiers),
    [identifiers, lockedSourceType]
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

  const handleGenerate = () => {
    setRawValue(generateRandomValue(sourceType));
  };

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

  const handleDelete = async (id) => {
    if (await deleteProductIdentifier(id)) {
      await refresh();
    }
  };

  if (!productId) return null;

  return (
    <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
      {!lockedSourceType && (
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 400 }}>Registered Identifiers</Typography>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {lockedSourceType
          ? `Register this product's own ${activeLabel} so scanning it in the app resolves to this product and gets a PMC. Use this for identifiers printed outside this platform. "Generate" fills in a random test value — there's no real ${activeLabel.toLowerCase()} generation/reading engine wired in yet, so use it to exercise registration and PMC resolution until that's built.`
          : "Register this product's own barcode, GTIN, NFC tag, or RFID tag so scanning it in the app resolves to this product and gets a PMC. Use this for identifiers printed outside this platform — including barcodes from companies that don't follow the GS1 Digital Link standard."}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
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
          sx={{ minWidth: 240, flexGrow: 1 }}
        />
        <Tooltip title="Fill in a random test value (no real generation engine yet)">
          <Button variant="outlined" startIcon={<CasinoIcon />} onClick={handleGenerate}>
            Generate
          </Button>
        </Tooltip>
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
      {!companyId && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          Company information not available — cannot register identifiers.
        </Typography>
      )}
      {pageItems.length > 0 ? (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: showsImage ? 'repeat(auto-fill, minmax(180px, 1fr))' : 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 1.5,
            }}
          >
            {pageItems.map((item) => (
              <Box
                key={item._id}
                sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.default', position: 'relative' }}
              >
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(item._id)}
                    sx={{ position: 'absolute', top: 4, right: 4 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {!lockedSourceType && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    {SOURCE_TYPES.find((t) => t.value === item.source_type)?.label || item.source_type}
                  </Typography>
                )}
                {(item.source_type === 'barcode' || item.source_type === 'gs1dl') && (
                  <CodeImage sourceType={item.source_type} value={item.raw_value} />
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
                {item.note && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                    {item.note}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, p) => setPage(p)}
                color="primary"
                shape="rounded"
                size="small"
              />
            </Box>
          )}
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
