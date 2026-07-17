import React from 'react';
import { Box, Typography } from '@mui/material';

// Single-line "who are you" link shown at the bottom of both sign-in cards
// (consumer/brand AuthPage and StaffLoginPage), same pattern as the
// Sign In/Sign Up switch right above it: one question, one tap to switch.
const AudienceToggle = ({ value, onSelectConsumer, onSelectStaff }) => (
  <Box sx={{ textAlign: 'center', mt: 0.5 }}>
    <Typography
      component="span"
      onClick={value === 'staff' ? onSelectConsumer : onSelectStaff}
      sx={{
        color: 'primary.main',
        fontWeight: 400,
        fontSize: '0.95rem',
        cursor: 'pointer',
        '&:hover': { textDecoration: 'underline' },
      }}
    >
      {value === 'staff' ? 'Are you a normal consumer? Sign In' : 'Are you a staff employee? Sign In'}
    </Typography>
  </Box>
);

export default AudienceToggle;
