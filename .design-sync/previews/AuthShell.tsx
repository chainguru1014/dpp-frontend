import React from 'react';
import { AuthShell, Typography, TextField, Button, Box } from '@yometel/dpp-admin';

// The sign-in backdrop: full-screen store photo with a frosted glass card
// for any sign-in / consent content.
export const WithForm = () => (
  <Box sx={{ width: 1100, height: 720, position: 'relative', overflow: 'hidden' }}>
    <AuthShell>
      <Typography variant="h5" component="h1" sx={{ textAlign: 'center', mb: 2 }}>Sign in</Typography>
      <TextField fullWidth label="Email" placeholder="you@company.com" sx={{ mb: 2 }} />
      <Button fullWidth variant="contained" size="large">Send verification code</Button>
    </AuthShell>
  </Box>
);
