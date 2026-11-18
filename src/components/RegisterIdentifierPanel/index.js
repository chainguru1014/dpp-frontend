import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Divider,
  Pagination,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SensorsIcon from '@mui/icons-material/Sensors';
import NfcIcon from '@mui/icons-material/Nfc';
import qrcode from 'qrcode';
import {
  registerProductIdentifier,
  bulkRegisterProductIdentifiers,
  listProductIdentifiers,
  deleteProductIdentifier,
  printProductIdentifiers,
} from '../../helper';
import { renderEan13ToDataUrl, toValidEan13 } from '../../utils/barcodeRenderer';
import CodeTable, { ImageThumb, QrThumb } from '../../features/products/CodeTable';
import { parseIdentifierCsv } from '../../utils/parseIdentifierCsv';
import PrintDialog from '../printModal/PrintDialog';
import { confirmAction } from '../../utils/feedbackBus';

const SOURCE_TYPES = [
  { value: 'barcode', label: 'Barcode / GTIN' },
  { value: 'nfc', label: 'NFC Tag' },
  { value: 'rfid', label: 'RFID Tag' },
  { value: 'gs1dl', label: 'GS1 Digital Link' },
];

const PAGE_SIZE = 10;
// The field for a code the brand already has, per type.
const EXISTING_LABEL = {
  barcode: 'Existing barcode',
  gs1dl: 'Existing GS1 link',
  rfid: 'Tag number (EPC)',
  nfc: 'Tag ID',
};
const MAX_GENERATE = 500;

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

// Lets a company register a barcode/GTIN/NFC/RFID identifier against a
// product ahead of time. Without this, scanning one of these in the app has
// no product_id to resolve against at all — unlike our own minted QR codes,
// which encode it directly (see backend productIdentifierController).
//
// `lockedSourceType`: when set (the Generate & Print page uses this — one
// tab per identifier type), the type picker is replaced with a fixed label
// and the list below only shows identifiers of that type, instead of a
// mixed list with a type dropdown.
const RegisterIdentifierPanel = ({ productId, companyId, lockedSourceType, product, onProductChange, enableCsvImport = false }) => {
  const [identifiers, setIdentifiers] = useState([]);
  const [sourceType, setSourceType] = useState(lockedSourceType || 'barcode');
  const [rawValue, setRawValue] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvSummary, setCsvSummary] = useState(null);
  const [page, setPage] = useState(1);
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
  // Each code's place in the print order (1 = printed first).
  const printPosition = useMemo(() => new Map(printOrderIdentifiers.map((item, i) => [item._id, i + 1])), [printOrderIdentifiers]);
  const printedCount = Number(product?.identifier_printed_amounts?.[lockedSourceType] || 0);
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

  // Create new codes (GS1 Digital Link, Barcode), like Create on QR codes:
  //  - Barcode: EAN-13 numbers in GS1's in-store range (prefix 2), which a
  //    company may use for its own items without registering them;
  //  - GS1 Digital Link: the product's GTIN with a serial number per item
  //    (https://id.gs1.org/01/<GTIN-14>/21/<serial>).
  const canGenerate = lockedSourceType === 'barcode' || lockedSourceType === 'gs1dl';
  const gtinDigits = String(product?.gtin || '').replace(/\D/g, '');
  const ownGtin14 = gtinDigits.length >= 8 && gtinDigits.length <= 14 ? gtinDigits.padStart(14, '0') : '';
  // No GTIN on the product yet: an in-house one (GS1's restricted range,
  // starting with 2, as Barcode's Create uses), fixed per product so its
  // serial numbers continue. Adding the product's own GS1 GTIN replaces it.
  const internalGtin14 = useMemo(() => {
    const hex = String(productId || '').replace(/[^0-9a-f]/gi, '').slice(-10);
    if (!hex) return '';
    const body = String(parseInt(hex, 16) % 100000000000).padStart(11, '0');
    return toValidEan13(`2${body}`).padStart(14, '0');
  }, [productId]);
  const gtin14 = ownGtin14 || internalGtin14;
  const [genAmount, setGenAmount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const handleGenerate = async () => {
    const amount = Math.max(1, Math.min(MAX_GENERATE, Number(genAmount) || 0));
    if (!productId || !companyId || !amount) return;
    const taken = new Set(identifiers.map((i) => i.raw_value));
    const values = [];
    if (lockedSourceType === 'barcode') {
      let guard = 0;
      while (values.length < amount && guard < amount * 20) {
        guard += 1;
        const d12 = `2${Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join('')}`;
        const code = toValidEan13(d12);
        if (!taken.has(code) && !values.includes(code)) values.push(code);
      }
    } else if (gtin14) {
      // Next free serial numbers after the ones this product already has.
      const used = identifiers
        .filter((i) => i.source_type === 'gs1dl')
        .map((i) => Number(String(i.raw_value).split('/21/')[1]) || 0);
      let serial = Math.max(0, ...used);
      while (values.length < amount) {
        serial += 1;
        const link = `https://id.gs1.org/01/${gtin14}/21/${String(serial).padStart(6, '0')}`;
        if (!taken.has(link)) values.push(link);
      }
    }
    if (!values.length) return;
    setGenerating(true);
    try {
      const result = await bulkRegisterProductIdentifiers(productId, companyId, lockedSourceType, values.map((v) => ({ raw_value: v, note: '' })));
      if (result) {
        setPage(1);
        await refresh();
      }
    } finally {
      setGenerating(false);
    }
  };

  // CSV import — a real-world alternative to handleBulkGenerate's random
  // stub values, for identifier types that come pre-generated by an outside
  // party (e.g. RFID tags a hardware vendor ships as a CSV of EPCs). Parses
  // client-side and sends the whole file as one bulk request rather than
  // looping registerProductIdentifier per row.
  const handleCsvFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file again later
    if (!file || !productId || !companyId) return;
    setCsvImporting(true);
    setCsvSummary(null);
    try {
      const text = await file.text();
      const rows = parseIdentifierCsv(text);
      if (rows.length === 0) {
        setCsvSummary({ inserted: 0, skipped: 0, errors: [{ message: 'No valid rows found in file' }] });
        return;
      }
      const result = await bulkRegisterProductIdentifiers(productId, companyId, sourceType, rows);
      if (result) {
        setCsvSummary(result);
        setPage(1);
        await refresh();
      }
    } finally {
      setCsvImporting(false);
    }
  };

  const handleDelete = async (id) => {
    const sure = await confirmAction({
      title: `Remove this ${activeLabel || 'identifier'}?`,
      message: 'Scanning it will no longer open this product.',
      confirmText: 'Remove',
      danger: true,
    });
    if (!sure) return;
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
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 400 }}>Codes you already have</Typography>
      )}
      {!lockedSourceType && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Register this product's own barcode, GTIN, NFC tag or RFID tag so scanning it in the app opens this product. Use this for codes printed outside this platform.
        </Typography>
      )}
      {/* One line above the table:
          - GS1 Digital Link / Barcode: Create N new codes (like QR codes);
          - a code you already have: its number, a note, Add;
          - at the right: Download to print, Import CSV (RFID). */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.25, mb: 2 }}>
        {canGenerate && (
          <>
            <TextField
              type="number"
              label="How many?"
              value={genAmount}
              onChange={(e) => setGenAmount(e.target.value)}
              inputProps={{ min: 1, max: MAX_GENERATE }}
              sx={{ width: 110 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleGenerate}
              disabled={generating || !companyId || !(Number(genAmount) > 0) || (lockedSourceType === 'gs1dl' && !gtin14)}
              title={lockedSourceType === 'gs1dl' && !gtin14 ? 'Save the product first.' : undefined}
              sx={{ height: 48, whiteSpace: 'nowrap' }}
            >
              {generating ? 'Creating…' : `Create ${Number(genAmount) > 0 ? Number(genAmount) : ''}`}
            </Button>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          </>
        )}
        {!lockedSourceType && (
          <TextField
            select
            label="Type"
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
          label={lockedSourceType ? (EXISTING_LABEL[lockedSourceType] || 'Code you have') : 'Barcode / GTIN / tag number'}
          value={rawValue}
          onChange={(e) => setRawValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
          sx={{ flex: '1 1 220px', minWidth: 190, maxWidth: 320 }}
        />
        <TextField
          label="Note"
          placeholder="Optional"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          sx={{ flex: '0 1 140px', minWidth: 110 }}
        />
        <Button
          variant="outlined"
          onClick={handleRegister}
          disabled={submitting || !rawValue.trim() || !companyId}
          sx={{ height: 48, px: 2.5 }}
        >
          Add
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => setPrintOpen(true)}
          disabled={visibleIdentifiers.length === 0}
          sx={{ height: 48, whiteSpace: 'nowrap' }}
        >
          Download to print
        </Button>
        {enableCsvImport && (
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFileIcon />}
            disabled={csvImporting || !companyId}
            sx={{ height: 48, whiteSpace: 'nowrap' }}
          >
            {csvImporting ? 'Importing…' : 'Import CSV'}
            <input
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={handleCsvFile}
            />
          </Button>
        )}
      </Box>
      {canGenerate && lockedSourceType === 'gs1dl' && !ownGtin14 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: -1, mb: 1.5 }}>
          This product has no GTIN yet, so Create uses an in-house number ({gtin14}). To use your GS1 number, add the GTIN in Edit product &gt; Basics.
        </Typography>
      )}
      {enableCsvImport && csvSummary && (
        <Typography
          variant="body2"
          color={csvSummary.errors?.length ? 'error' : 'text.secondary'}
          sx={{ mb: 2 }}
        >
          Imported {csvSummary.inserted}, skipped {csvSummary.skipped} duplicate(s)
          {csvSummary.errors?.length ? `, ${csvSummary.errors.length} error(s)` : ''}.
        </Typography>
      )}
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
          {/* The same table as QR codes: the code and its picture, its
              position (printing goes in this order), printed or not. */}
          <CodeTable
            codeLabel={lockedSourceType ? activeLabel : 'Code'}
            numberLabel="No. / Passport ID"
            rows={pageItems.map((item) => {
              const position = printPosition.get(item._id) || 0;
              const type = item.source_type;
              const barcodeImg = type === 'barcode' ? renderEan13ToDataUrl(item.raw_value) : '';
              return {
                key: item._id,
                thumb: type === 'barcode' ? <ImageThumb src={barcodeImg} wide />
                  : type === 'gs1dl' ? <QrThumb data={item.raw_value} />
                    : <ImageThumb icon={type === 'nfc' ? NfcIcon : SensorsIcon} />,
                code: item.raw_value,
                sub: [item.note && item.note.trim().toLowerCase() !== 'test value' ? item.note : '', !lockedSourceType ? (SOURCE_TYPES.find((x) => x.value === type)?.label || type) : ''].filter(Boolean).join(' · '),
                number: [position ? `#${position}` : '', item.pmc_code].filter(Boolean).join(' · '),
                printed: lockedSourceType ? position > 0 && position <= printedCount : undefined,
                downloadUrl: barcodeImg || undefined,
                downloadName: `${type}-${item.raw_value}.png`,
                onDelete: () => handleDelete(item._id),
              };
            })}
          />
        </>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          {lockedSourceType ? `No ${activeLabel} added to this product yet.` : 'No codes added to this product yet.'}
        </Typography>
      )}
    </Box>
  );
};

export default RegisterIdentifierPanel;
