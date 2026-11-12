import React from 'react';
import { Loader, Box } from '@yometel/dpp-admin';

// Centred spinner with a label while a page or panel loads.
export const Default = () => (
  <Box sx={{ width: 520, bgcolor: 'background.default' }}>
    <Loader />
  </Box>
);

export const CustomLabel = () => (
  <Box sx={{ width: 520, bgcolor: 'background.paper' }}>
    <Loader label="Loading products…" minHeight={160} />
  </Box>
);
