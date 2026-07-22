import React, { useEffect, useState } from 'react';
import { Box, Button, Tab, Tabs, TextField, Typography, Pagination } from '@mui/material';
import CircularProgressWithLabel from '../../components/CircularProgressBar';
import QRCode from '../../components/displayQRCode';
import SecurityQRCode from '../../components/displaySecurityQRCode';
import RegisterIdentifierPanel from '../../components/RegisterIdentifierPanel';

const TABS = [
  { key: 'qr', label: 'QR Code' },
  { key: 'securityQr', label: 'Security QR Code' },
  { key: 'rfid', label: 'RFID Tag' },
  { key: 'nfc', label: 'NFC Tag' },
  { key: 'gs1dl', label: 'GS1 Digital Link' },
  { key: 'barcode', label: 'Barcode' },
];

// Replaces the old single-section print view (ProductMintSection) with one
// tab per identifier format. QR/Security QR keep the existing mint+print
// flow; the other four reuse RegisterIdentifierPanel locked to one source
// type each. Every tab's generated/registered codes are always visible below
// its generate-or-register controls — no show/hide toggle.
const GenerateAndPrintPanel = ({
  selectedProduct,
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
  canGenerate = true,
}) => {
  const [tab, setTab] = useState('qr');

  // Same 10-per-display-page / 100-per-backend-batch split ProductMintSection
  // used — the backend serves codes in batches of 100 (parent's page/setPage).
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
  const pageCodes = (qrcodes || []).slice(offsetInBackend, offsetInBackend + PAGE_SIZE);
  const startItem = total === 0 ? 0 : (displayPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(displayPage * PAGE_SIZE, total);

  if (!selectedProduct) {
    return (
      <Typography color="text.secondary" sx={{ fontStyle: 'italic', pt: 2 }}>
        Please select a product to generate or register codes.
      </Typography>
    );
  }

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(e, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {TABS.map((t) => (
          <Tab key={t.key} value={t.key} label={t.label} />
        ))}
      </Tabs>

      {tab === 'qr' && (
        <Box>
          {canGenerate && (
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <TextField
                type="number"
                label="Amount"
                variant="outlined"
                size="small"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                sx={{ minWidth: 120 }}
              />
              <Button
                variant="contained"
                onClick={batchMintHandler}
                disabled={!mintAmount || mintAmount <= 0}
                sx={{ minWidth: 150 }}
              >
                Generate QR code
              </Button>
              <Button variant="outlined" onClick={onOpenPrint} disabled={total === 0}>
                Print
              </Button>
              {isMinting && <CircularProgressWithLabel value={mintingProgress} />}
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {total > 0 ? `Showing ${startItem}–${endItem} of ${total}` : 'No QR codes generated yet.'}
            </Typography>
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
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1.5 }}>
            {pageCodes.map((item, index) => (
              <QRCode key={offsetInBackend + index} data={item} identifer={identifiers[offsetInBackend + index] || []} />
            ))}
          </Box>
        </Box>
      )}

      {tab === 'securityQr' && (
        <Box>
          {canGenerate && (
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <TextField
                type="number"
                label="Amount"
                variant="outlined"
                size="small"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                sx={{ minWidth: 120 }}
              />
              <Button
                variant="contained"
                onClick={onGenerateSecurityQR}
                disabled={!mintAmount || mintAmount <= 0}
                sx={{ minWidth: 200 }}
              >
                Generate Security QR code
              </Button>
              {isMinting && <CircularProgressWithLabel value={mintingProgress} />}
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
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {securityPageCodes.map((item, index) => (
                  <Box
                    key={securityOffset + index}
                    sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}
                  >
                    <SecurityQRCode data={item} identifer={identifiers[securityOffset + index] || []} />
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No Security QR Codes generated yet.
            </Typography>
          )}
        </Box>
      )}

      {tab === 'rfid' && (
        <RegisterIdentifierPanel productId={selectedProduct._id} companyId={companyId} lockedSourceType="rfid" />
      )}
      {tab === 'nfc' && (
        <RegisterIdentifierPanel productId={selectedProduct._id} companyId={companyId} lockedSourceType="nfc" />
      )}
      {tab === 'gs1dl' && (
        <RegisterIdentifierPanel productId={selectedProduct._id} companyId={companyId} lockedSourceType="gs1dl" />
      )}
      {tab === 'barcode' && (
        <RegisterIdentifierPanel productId={selectedProduct._id} companyId={companyId} lockedSourceType="barcode" />
      )}
    </Box>
  );
};

export default GenerateAndPrintPanel;
