import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, Typography, TextField, Pagination } from '@mui/material';
import CircularProgressWithLabel from '../../components/CircularProgressBar';
import QRCode from '../../components/displayQRCode';
import SecurityQRCodeDialog from '../../components/SecurityQRCodeDialog';
import RegisterIdentifierPanel from '../../components/RegisterIdentifierPanel';

const ProductMintSection = ({
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
  onOpenSecurityDialog,
  canGenerate = true,
}) => {
  // Normal users (can't generate) see the QR codes expanded by default.
  const [showQRCodes, setShowQRCodes] = useState(!canGenerate);
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);
  const prevTotalRef = useRef(totalAmount);
  const prevProductRef = useRef(selectedProduct?._id);

  // Auto-reveal the QR code list right after new codes are generated, so the
  // newly minted codes appear at the bottom of the dialog without needing to
  // click "Show". Only react to a count increase for the same product — a
  // product switch just re-baselines the count and never auto-reveals.
  useEffect(() => {
    const productId = selectedProduct?._id;
    if (productId === prevProductRef.current && totalAmount > prevTotalRef.current) {
      setShowQRCodes(true);
    }
    prevProductRef.current = productId;
    prevTotalRef.current = totalAmount;
  }, [totalAmount, selectedProduct]);

  // Show 10 QR codes per page. The backend serves codes in batches of 100
  // (controlled by the parent's `page`/`setPage`), so a 10-per-page display
  // page maps to one of those batches plus an in-batch offset.
  const PAGE_SIZE = 10;
  const BACKEND_SIZE = 100;
  const total = Number(totalAmount) || 0;
  const [displayPage, setDisplayPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Reset to the first page whenever the product or its code count changes.
  useEffect(() => {
    setDisplayPage(1);
  }, [selectedProduct?._id, totalAmount]);

  // Keep the parent on the backend batch that holds the current display page.
  const backendPageFor = Math.floor(((displayPage - 1) * PAGE_SIZE) / BACKEND_SIZE) + 1;
  useEffect(() => {
    if (backendPageFor !== page) setPage(backendPageFor);
  }, [backendPageFor, page, setPage]);

  const offsetInBackend = ((displayPage - 1) * PAGE_SIZE) % BACKEND_SIZE;
  const pageCodes = (qrcodes || []).slice(offsetInBackend, offsetInBackend + PAGE_SIZE);
  const startItem = total === 0 ? 0 : (displayPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(displayPage * PAGE_SIZE, total);

  return (
    <Box>
      {canGenerate && (
      <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 400 }}>Generate QR Codes</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            type="number"
            label="Amount"
            variant="outlined"
            size="small"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
            sx={{ minWidth: 120 }}
            helperText={!selectedProduct ? "Select a product first" : ""}
            error={!selectedProduct}
          />
          <Button 
            variant="outlined" 
            onClick={batchMintHandler}
            disabled={!selectedProduct || !mintAmount || mintAmount <= 0}
            size="medium"
            sx={{ minWidth: 150 }}
          >
            Generate QR code
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={onGenerateSecurityQR}
            disabled={!selectedProduct || !mintAmount || mintAmount <= 0}
            size="medium"
            sx={{ minWidth: 180 }}
          >
            Generate Security QR code
          </Button>
          {isMinting && (
            <CircularProgressWithLabel value={mintingProgress} />
          )}
        </Box>
        {!selectedProduct && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
            Please select a product from the sidebar to generate QR codes
          </Typography>
        )}
      </Box>
      )}
      {canGenerate && selectedProduct && (
        <RegisterIdentifierPanel productId={selectedProduct._id} companyId={companyId} />
      )}
      {selectedProduct ? (
        <Box sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography>
              Qr Codes for Selected Product (Count: {totalAmount})
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowQRCodes((prev) => !prev)}
            >
              {showQRCodes ? 'Hide' : 'Show'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSecurityDialogOpen(true);
                if (onOpenSecurityDialog) onOpenSecurityDialog();
              }}
              disabled={!securityQRCodes || securityQRCodes.length === 0}
            >
              Show Security QR Codes
            </Button>
          </Box>
        {showQRCodes && (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
                my: 1.5,
              }}
            >
              <Button variant="outlined" size="small" onClick={onOpenPrint}>
                Print
              </Button>
              {total > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing {startItem}–{endItem} of {total}
                  </Typography>
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
                </Box>
              )}
            </Box>
            {showQRCodes && (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 1.5,
                  mt: 1,
                }}
              >
                {pageCodes.map((item, index) => (
                  <QRCode
                    key={offsetInBackend + index}
                    data={item}
                    identifer={identifiers[offsetInBackend + index] || []}
                  />
                ))}
              </Box>
            )}
            {total > PAGE_SIZE && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
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
              </Box>
            )}
          </>
        )}
        </Box>
      ) : (
        <Box sx={{ pt: 2 }}>
          <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Please select a product to generate QR codes
          </Typography>
        </Box>
      )}
      <SecurityQRCodeDialog
        open={securityDialogOpen}
        onClose={() => setSecurityDialogOpen(false)}
        securityQRCodes={securityQRCodes}
        identifiers={identifiers}
      />
    </Box>
  );
};

export default ProductMintSection;

