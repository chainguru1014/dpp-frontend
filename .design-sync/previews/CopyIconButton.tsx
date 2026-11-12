import React from 'react';
import { CopyIconButton, Box, Typography, Paper } from '@yometel/dpp-admin';

// Small copy-to-clipboard icon beside a code or ID; shows a tick once copied.
export const BesideCode = () => (
  <Box sx={{ p: 3 }}>
    <Paper variant="outlined" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 1 }}>
      <Typography sx={{ fontFamily: 'monospace' }}>01/04512345678904/21/A7K2-9QX</Typography>
      <CopyIconButton value="01/04512345678904/21/A7K2-9QX" />
    </Paper>
  </Box>
);

export const Medium = () => (
  <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
    <Typography>Product ID 6a959caccac488c74bcdb336</Typography>
    <CopyIconButton value="6a959caccac488c74bcdb336" size="medium" />
  </Box>
);
