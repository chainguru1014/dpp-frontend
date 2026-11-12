import React from 'react';
import { WebQRCode, Box } from '@yometel/dpp-admin';

// QR that opens the product's public web passport.
export const WebLink = () => (
  <Box sx={{ p: 3, width: 320 }}>
    <WebQRCode data="k9F2xQ7mLp" identifer={[{ type: 'RFID EPC', serial: '3034257BF7194E4000001A85' }]} />
  </Box>
);
