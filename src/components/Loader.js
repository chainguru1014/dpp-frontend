import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

// Centered loading spinner used for pending data across the admin panel.
export default function Loader({ label = 'Loading…', minHeight = 220 }) {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
      }}
    >
      <CircularProgress />
      {label && (
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      )}
    </Box>
  );
}
