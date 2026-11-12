import React from 'react';
import { RfidIcon, Box, Typography } from '@yometel/dpp-admin';

// The RFID tag icon as an MUI SvgIcon: takes fontSize / color / sx like any
// MUI icon.
export const Sizes = () => (
  <Box sx={{ p: 3, display: 'flex', gap: 3, alignItems: 'flex-end' }}>
    <RfidIcon fontSize="small" color="primary" />
    <RfidIcon color="primary" />
    <RfidIcon fontSize="large" color="primary" />
    <RfidIcon sx={{ fontSize: 56 }} color="primary" />
  </Box>
);

export const InMenuRow = () => (
  <Box sx={{ p: 3, display: 'flex', gap: 1.5, alignItems: 'center' }}>
    <RfidIcon color="primary" />
    <Typography variant="subtitle1">RFID Scan</Typography>
  </Box>
);
