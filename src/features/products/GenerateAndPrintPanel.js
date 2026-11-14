import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, TextField, Typography, Pagination, ToggleButton, ToggleButtonGroup } from '@mui/material';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LanguageIcon from '@mui/icons-material/Language';
import SensorsIcon from '@mui/icons-material/Sensors';
import NfcIcon from '@mui/icons-material/Nfc';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import CodeList from './CodeList';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import LinkIcon from '@mui/icons-material/Link';
import qrcode from 'qrcode';
import CircularProgressWithLabel from '../../components/CircularProgressBar';
import QRCode from '../../components/displayQRCode';
import SecurityQRCode from '../../components/displaySecurityQRCode';
import RegisterIdentifierPanel from '../../components/RegisterIdentifierPanel';
import PrintDialog from '../../components/printModal/PrintDialog';
import { printSecurityQRCodes } from '../../helper';
import PairTagsDialog from './PairTagsDialog';

const SECURITY_BASE_URL = process.env.REACT_APP_SECURITY_BASE_URL || process.env.REACT_APP_WEB_BASE_URL || 'https://dpp.innosynch.com';

// `help` is one plain sentence under the tabs so a first-time user knows
// which code type to pick.
const TABS = [
  { key: 'qr', label: 'QR Code', icon: QrCode2Icon, short: 'The usual choice: one label per item', help: 'The usual choice. Each QR code is a unique label; scanning it with a phone opens this product\u2019s page.' },
  { key: 'securityQr', label: 'Security QR Code', icon: VerifiedUserIcon, short: 'Shoppers can check it is genuine', help: 'A QR code with a hidden security key, so shoppers can check the product is genuine. Use it for valuable items.' },
  { key: 'gs1dl', label: 'GS1 Digital Link', icon: LanguageIcon, short: 'Your GTIN as a link', help: 'For products that already have a GS1 barcode number (GTIN). Enter your GS1 link to connect it to this product.' },
  { key: 'rfid', label: 'RFID Tag', icon: SensorsIcon, short: 'Tags sewn in or attached', help: 'For RFID tags sewn into or attached to the product. Enter each tag\u2019s number (EPC) or import a list from a CSV file.' },
  { key: 'nfc', label: 'NFC Tag', icon: NfcIcon, short: 'Phones read it by touch', help: 'For NFC tags that phones read by touching them. Enter each tag\u2019s ID.' },
  { key: 'barcode', label: 'Barcode', icon: ViewWeekIcon, short: 'An existing EAN-13 barcode', help: 'For an existing printed barcode (EAN-13). Enter the 13-digit number to connect it to this product.' },
];

// 5 per row, filling the dialog's full width — same sizing for every tab
// that shows an image (QR, Security QR, and RegisterIdentifierPanel's own
// grid for GS1-DL/Barcode/RFID/NFC).
const GRID_SX = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 2, width: '100%' };

// Replaces the old single-section print view (ProductMintSection) with one
// tab per identifier format. QR/Security QR keep the existing mint+print
// flow; the other four reuse RegisterIdentifierPanel locked to one source
// type each. Every tab's generated/registered codes are always visible below
// its generate-or-register controls — no show/hide toggle.
const GenerateAndPrintPanel = ({
  selectedProduct,
  setSelectedProduct,
  companyId,
  mintAmount,
  setMintAmount,
  isMinting,
  mintingProgress,
  totalAmount,
  page,
  setPage,
  batchMintHandler,
  qrcodes,
  identifiers,
  onOpenPrint,
  securityQRCodes,
  onGenerateSecurityQR,
  onDeleteQrCode,
  onDeleteSecurityQrCode,
  canGenerate = true,
}) => {
  const [tab, setTab] = useState('qr');
  const [securityPrintOpen, setSecurityPrintOpen] = useState(false);
  const [pairOpen, setPairOpen] = useState(false);
  // QR codes as a list (default) or as pictures.
  const [qrView, setQrView] = useState('list');
  const [printFilter, setPrintFilter] = useState('all');

  // Same 10-per-display-page / 100-per-backend-batch split ProductMintSection
  // used — the backend serves codes in batches of 100 (parent's page/setPage).
  // qrcodes/identifiers are now { qrcode_id, ... } objects (only for ids that
  // actually still have a QRcode document — see backend qrcodeController),
  // not bare strings keyed by array position, so a deleted item just stops
  // appearing instead of leaving a positional gap.
  const PAGE_SIZE = 10;
  const BACKEND_SIZE = 100;
  const total = Number(totalAmount) || 0;
  const [displayPage, setDisplayPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Security QR codes are already fully loaded client-side (no backend
  // batching to coordinate) — just paginate the array in place.
  const [securityPage, setSecurityPage] = useState(1);
  const securityTotal = (securityQRCodes || []).length;
  const securityTotalPages = Math.max(1, Math.ceil(securityTotal / PAGE_SIZE));
  const securityPageCodes = (securityQRCodes || []).slice((securityPage - 1) * PAGE_SIZE, securityPage * PAGE_SIZE);
  const securityOffset = (securityPage - 1) * PAGE_SIZE;

  useEffect(() => {
    setDisplayPage(1);
    setSecurityPage(1);
  }, [selectedProduct?._id, totalAmount]);

  const backendPageFor = Math.floor(((displayPage - 1) * PAGE_SIZE) / BACKEND_SIZE) + 1;
  useEffect(() => {
    if (backendPageFor !== page) setPage(backendPageFor);
  }, [backendPageFor, page, setPage]);

  const offsetInBackend = ((displayPage - 1) * PAGE_SIZE) % BACKEND_SIZE;
  const printedCount = Number(selectedProduct?.printed_amount) || 0;
  const pageCodes = (qrcodes || []).slice(offsetInBackend, offsetInBackend + PAGE_SIZE)
    .filter((item) => printFilter === 'all' || (printFilter === 'printed') === (Number(item.qrcode_id) <= printedCount));
  const choosePrintFilter = (next) => {
    setPrintFilter(next);
    if (next === 'notPrinted') setDisplayPage(Math.min(totalPages, Math.floor(printedCount / PAGE_SIZE) + 1));
    else setDisplayPage(1);
  };
  const startItem = total === 0 ? 0 : (displayPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(displayPage * PAGE_SIZE, total);

  // identifiers is the { qrcode_id, identifiers }[] batch for the same
  // backend page qrcodes came from — match by id, not position.
  const identifiersByQrcodeId = useMemo(
    () => new Map((identifiers || []).map((entry) => [entry.qrcode_id, entry.identifiers])),
    [identifiers]
  );

  // Renders one PDF-ready item per Security QR code in the requested
  // 1-indexed position range — securityQRCodes is already sorted ascending
  // by security_qrcode_id (see backend getSecurityQRCodes), so position
  // matches that stable, never-reused sequence the same way a regular QR
  // code's position matches its qrcode_id. Carries the URL as `code` (printed
  // truncated under the image) and the item's `pmc` code (printed below
  // that) so the physical PMC is visible on the printed sheet.
  const securityItemsSource = async (fromN, toN) => {
    const slice = (securityQRCodes || []).slice(Math.max(0, fromN - 1), toN);
    return Promise.all(slice.map(async (item) => {
      const url = `${SECURITY_BASE_URL}/product/${item.encrypted_key}`;
      const img = await qrcode.toDataURL(url).catch(() => null);
      return { img, code: url, pmc: item.pmc_code };
    }));
  };

  const onMarkSecurityPrinted = async (count) => {
    const updated = await printSecurityQRCodes(selectedProduct._id, count);
    if (updated && setSelectedProduct) setSelectedProduct(updated);
    return updated?.security_printed_amount;
  };

  if (!selectedProduct) {
    return (
      <Typography color="text.secondary" sx={{ fontStyle: 'italic', pt: 2 }}>
        Please select a product to generate or register codes.
      </Typography>
    );
  }

  return (
    <Box>
      {/* Code types as cards, each with one line on what it is for. */}
      <Box role="radiogroup" aria-label="Type of code" sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 1.25, mb: 1.5 }}>
        {TABS.map((t) => {
          const on = tab === t.key;
          const Icon = t.icon;
          return (
            <Box
              key={t.key}
              component="button"
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setTab(t.key)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, textAlign: 'left', cursor: 'pointer', font: 'inherit',
                borderRadius: 3, border: '1.5px solid', borderColor: on ? '#1b4f72' : '#dfe5ec', bgcolor: on ? '#eef5fd' : '#fff', color: '#16324a',
                '&:hover': { borderColor: '#1b4f72' },
              }}
            >
              <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: on ? '#1b4f72' : '#e8f1fb', color: on ? '#fff' : '#1b4f72', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 15.5 }}>{t.label}</Typography>
                <Typography variant="body2" color="text.secondary">{t.short}</Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {TABS.find((t) => t.key === tab)?.help}
      </Typography>

      {tab === 'qr' && (
        <Box>
          {canGenerate && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <TextField
                type="number"
                label="How many QR codes?"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                inputProps={{ min: 1 }}
                helperText="One code per physical item."
                sx={{ width: 240 }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={batchMintHandler}
                disabled={!mintAmount || mintAmount <= 0 || isMinting}
                sx={{ mt: 0.5 }}
              >
                {isMinting ? 'Creating…' : `Create ${Number(mintAmount) > 0 ? Number(mintAmount) : ''} QR codes`}
              </Button>
              {isMinting && <CircularProgressWithLabel value={mintingProgress} />}
              <Box sx={{ flexGrow: 1 }} />
              {/* Tie RFID / NFC tags to individual items (one tag per QR code). */}
              <Button variant="outlined" startIcon={<LinkIcon />} onClick={() => setPairOpen(true)} disabled={total === 0} sx={{ mt: 0.5 }}>
                Pair tags with items
              </Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={onOpenPrint} disabled={total === 0} sx={{ mt: 0.5 }}>
                Download codes to print
              </Button>
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {total > 0
                ? `Showing ${startItem}–${endItem} of ${total} QR codes · ${Math.min(total, Number(selectedProduct?.printed_amount) || 0)} printed`
                : 'No QR codes yet. Enter how many you need and press Create.'}
            </Typography>
            {total > 0 && (
              <Box sx={{ display: 'flex', gap: 1 }} role="group" aria-label="Show">
                {[['all', 'All'], ['notPrinted', 'Not printed'], ['printed', 'Printed']].map(([key, label]) => (
                  <Chip
                    key={key}
                    label={label}
                    clickable
                    onClick={() => choosePrintFilter(key)}
                    color={printFilter === key ? 'primary' : 'default'}
                    variant={printFilter === key ? 'filled' : 'outlined'}
                    aria-pressed={printFilter === key}
                  />
                ))}
              </Box>
            )}
            {total > 0 && (
              <ToggleButtonGroup size="small" exclusive value={qrView} onChange={(e, v) => v && setQrView(v)} aria-label="Show codes as">
                <ToggleButton value="list">List</ToggleButton>
                <ToggleButton value="pictures">Pictures</ToggleButton>
              </ToggleButtonGroup>
            )}
            {total > PAGE_SIZE && (
              <Pagination
                count={totalPages}
                page={displayPage}
                onChange={(e, p) => setDisplayPage(p)}
                color="primary"
                shape="rounded"
                size="small"
                siblingCount={1}
                boundaryCount={1}
              />
            )}
          </Box>
          <PairTagsDialog open={pairOpen} onClose={() => setPairOpen(false)} product={selectedProduct} totalItems={total} />
          {qrView === 'list' ? (
            <CodeList
              codes={pageCodes}
              printedAmount={selectedProduct?.printed_amount || 0}
              identifiersByQrcodeId={identifiersByQrcodeId}
              onDelete={onDeleteQrCode}
            />
          ) : (
          <Box sx={GRID_SX}>
            {pageCodes.map((item) => (
              <QRCode
                key={item.qrcode_id}
                data={item.url}
                identifer={identifiersByQrcodeId.get(item.qrcode_id) || []}
                onDelete={onDeleteQrCode ? () => onDeleteQrCode(item.qrcode_id) : undefined}
              />
            ))}
          </Box>
          )}
        </Box>
      )}

      {tab === 'securityQr' && (
        <Box>
          {canGenerate && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <TextField
                type="number"
                label="How many Security QR codes?"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                inputProps={{ min: 1 }}
                helperText="One code per physical item."
                sx={{ width: 240 }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onGenerateSecurityQR}
                disabled={!mintAmount || mintAmount <= 0 || isMinting}
                sx={{ mt: 0.5 }}
              >
                {isMinting ? 'Creating…' : `Create ${Number(mintAmount) > 0 ? Number(mintAmount) : ''} Security QR codes`}
              </Button>
              {isMinting && <CircularProgressWithLabel value={mintingProgress} />}
              <Box sx={{ flexGrow: 1 }} />
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => setSecurityPrintOpen(true)}
                disabled={securityTotal === 0}
                sx={{ mt: 0.5 }}
              >
                Download codes to print
              </Button>
            </Box>
          )}
          {securityTotal > 0 ? (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {securityOffset + 1}–{Math.min(securityOffset + PAGE_SIZE, securityTotal)} of {securityTotal}
                </Typography>
                {securityTotal > PAGE_SIZE && (
                  <Pagination
                    count={securityTotalPages}
                    page={securityPage}
                    onChange={(e, p) => setSecurityPage(p)}
                    color="primary"
                    shape="rounded"
                    size="small"
                    siblingCount={1}
                    boundaryCount={1}
                  />
                )}
              </Box>
              <Box sx={GRID_SX}>
                {securityPageCodes.map((item) => (
                  <SecurityQRCode
                    key={item.security_qrcode_id}
                    data={item.encrypted_key}
                    identifer={item.pmc_code ? [{ type: 'PMC Code', serial: item.pmc_code }] : []}
                    onDelete={onDeleteSecurityQrCode ? () => onDeleteSecurityQrCode(item.security_qrcode_id) : undefined}
                  />
                ))}
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No Security QR codes yet. Enter how many you need and press Create.
            </Typography>
          )}
          <PrintDialog
            open={securityPrintOpen}
            setOpen={setSecurityPrintOpen}
            title="Print Security QR Codes"
            subtitle={selectedProduct?.name}
            totalAmount={securityTotal}
            printedAmount={selectedProduct?.security_printed_amount || 0}
            itemsSource={securityItemsSource}
            onMarkPrinted={onMarkSecurityPrinted}
            fileNamePrefix={`${selectedProduct?.name || 'product'}-security-qr`}
          />
        </Box>
      )}

      {tab === 'rfid' && (
        <RegisterIdentifierPanel
          productId={selectedProduct._id}
          companyId={companyId}
          lockedSourceType="rfid"
          product={selectedProduct}
          onProductChange={setSelectedProduct}
          enableCsvImport
        />
      )}
      {tab === 'nfc' && (
        <RegisterIdentifierPanel
          productId={selectedProduct._id}
          companyId={companyId}
          lockedSourceType="nfc"
          product={selectedProduct}
          onProductChange={setSelectedProduct}
        />
      )}
      {tab === 'gs1dl' && (
        <RegisterIdentifierPanel
          productId={selectedProduct._id}
          companyId={companyId}
          lockedSourceType="gs1dl"
          product={selectedProduct}
          onProductChange={setSelectedProduct}
        />
      )}
      {tab === 'barcode' && (
        <RegisterIdentifierPanel
          productId={selectedProduct._id}
          companyId={companyId}
          lockedSourceType="barcode"
          product={selectedProduct}
          onProductChange={setSelectedProduct}
        />
      )}
    </Box>
  );
};

export default GenerateAndPrintPanel;
