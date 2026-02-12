import React, { useState } from 'react';
import { Box, Button, Typography, TextField } from '@mui/material';
import CircularProgressWithLabel from '../../components/CircularProgressBar';
import QRCode from '../../components/displayQRCode';

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
}) => {
  const [showQRCodes, setShowQRCodes] = useState(false);

  if (!selectedProduct) return null;

  return (
    <Box>
      <Box>
        <Typography>Generate QR code</Typography>
        <br />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            type="number"
            label="amount"
            variant="outlined"
            size="small"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
          />
          &nbsp;
          <Button 
            variant="outlined" 
            onClick={batchMintHandler}
            disabled={!selectedProduct || !mintAmount || mintAmount <= 0}
          >
            Generate QR code
          </Button>
          &nbsp;
          {isMinting && (
            <CircularProgressWithLabel value={mintingProgress} />
          )}
        </Box>
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
            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
              {qrcodes.map((item, index) => (
                <QRCode
                  key={index}
                  data={item}
                  identifer={identifiers[index] || []}
                />
              ))}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default ProductMintSection;

