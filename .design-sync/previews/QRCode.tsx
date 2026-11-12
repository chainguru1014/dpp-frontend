import React from 'react';
import { QRCode, Box } from '@yometel/dpp-admin';

// A product item's QR code with its identifier and a copy button (Generate
// Code / product pages). `data` is the code payload, `identifer` the item's other identifiers ({ type, serial }[]; a 'PMC Code' entry gets its own copy row).
export const ProductCode = () => (
  <Box sx={{ p: 3, width: 320 }}>
    <QRCode data="https://dpp.innosynch.com/01/04512345678904/21/A7K2-9QX" identifer={[{ type: 'RFID EPC', serial: '3034257BF7194E4000001A85' }, { type: 'PMC Code', serial: 'PMC-0001-A7K2' }]} />
  </Box>
);

// With the delete action (codes list in edit mode).
export const Deletable = () => (
  <Box sx={{ p: 3, width: 320 }}>
    <QRCode data="https://dpp.innosynch.com/01/04512345678904/21/B3M8-1ZT" identifer={[{ type: 'NFC UID', serial: '04:A2:3B:1C:6F:80' }]} onDelete={() => {}} />
  </Box>
);
