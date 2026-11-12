import React from 'react';
import { SecurityQRCode, Box } from '@yometel/dpp-admin';

// Security (copy-detection) QR: encodes the product link with the item's
// encrypted key.
export const SecurityCode = () => (
  <Box sx={{ p: 3, width: 320 }}>
    <SecurityQRCode data="k9F2xQ7mLp" identifer={[{ type: 'RFID EPC', serial: '3034257BF7194E4000001A85' }]} />
  </Box>
);

export const Deletable = () => (
  <Box sx={{ p: 3, width: 320 }}>
    <SecurityQRCode data="Zt4Rw8nB2c" identifer={[]} onDelete={() => {}} />
  </Box>
);
