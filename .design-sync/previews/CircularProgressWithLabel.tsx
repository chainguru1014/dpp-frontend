import React from 'react';
import { CircularProgressWithLabel, Box, Typography } from '@yometel/dpp-admin';

// Determinate ring with the percentage inside (uploads, setup progress).
export const Values = () => (
  <Box sx={{ p: 3, display: 'flex', gap: 4, alignItems: 'center' }}>
    {[12, 48, 75, 100].map((v) => (
      <Box key={v} sx={{ textAlign: 'center' }}>
        <CircularProgressWithLabel value={v} size={64} />
      </Box>
    ))}
  </Box>
);

export const InContext = () => (
  <Box sx={{ p: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
    <CircularProgressWithLabel value={60} size={56} />
    <Box>
      <Typography variant="subtitle1">Uploading product photos</Typography>
      <Typography color="text.secondary">3 of 5 done</Typography>
    </Box>
  </Box>
);
