import React from 'react';
import { Stat, Box } from '@yometel/dpp-admin';

// Figure tile (print dialog summary): label over a value; `highlight` tints it.
export const Row = () => (
  <Box sx={{ p: 3, display: 'flex', gap: 1.5, width: 560 }}>
    <Stat label="Codes" value={120} />
    <Stat label="Per sheet" value={24} />
    <Stat label="Sheets" value={5} highlight />
  </Box>
);
