import React, { useState } from 'react';
import { Box, Button, Typography, TextField } from '@mui/material';
import CircularProgressWithLabel from '../../components/CircularProgressBar';
import QRCode from '../../components/displayQRCode';
import SecurityQRCodeDialog from '../../components/SecurityQRCodeDialog';

const ProductMintSection = ({
  selectedProduct,
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
}) => {
  const [showQRCodes, setShowQRCodes] = useState(false);
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);

  return (
    <Box>
      <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Generate QR Codes</Typography>
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
            {totalAmount > 0 && (
              <>
                <Typography component="span">Page:&nbsp;</Typography>
                <a
                  style={{
                    cursor: 'pointer',
                    color: 'blue',
                    fontSize: 16,
                  }}
                  onClick={() => {
                    if (page > 1) setPage(page - 1);
                  }}
                >
                  {'<- Prev '}
                </a>
                &nbsp;&nbsp;{page}&nbsp;&nbsp;
                <a
                  style={{
                    cursor: 'pointer',
                    color: 'blue',
                    fontSize: 16,
                  }}
                  onClick={() => {
                    if (page < Math.ceil(totalAmount / 100)) setPage(page + 1);
                  }}
                >
                  {'Next ->'}
                </a>
                <br />
                <Typography>
                  Items:{' '}
                  {(page - 1) * 100 + 1} -{' '}
                  {page === Math.ceil(totalAmount / 100) && totalAmount % 100
                    ? totalAmount % 100 + (page - 1) * 100
                    : page * 100}
                </Typography>
              </>
            )}
            <br />
            <Button variant="outlined" onClick={onOpenPrint}>
              Print
            </Button>
            <br />
            {showQRCodes && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                {qrcodes.map((item, index) => (
                  <QRCode
                    key={index}
                    data={item}
                    identifer={identifiers[index] || []}
                  />
                ))}
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

