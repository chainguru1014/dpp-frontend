import React from 'react';
import { Box, Typography } from '@mui/material';
import theme from '../../theme';

// Single-line "who are you" link shown at the bottom of both sign-in cards
// (consumer/brand AuthPage and StaffLoginPage), same pattern as the
// Sign In/Sign Up switch right below it: one question, one tap to switch.
// White + shadow (not primary blue) because the card background is
// transparent (see AuthShell) — plain blue text disappears into the forest photo.
const AudienceToggle = ({ value, onSelectConsumer, onSelectStaff }) => (
  <Box sx={{ textAlign: 'center' }}>
    <Typography
      component="span"
      onClick={value === 'staff' ? onSelectConsumer : onSelectStaff}
      sx={{
        color: '#fff',
        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
        fontWeight: 400,
        fontSize: '0.8rem',
        lineHeight: 1.2,
        // Matches the buttons' font (AuthShell blanket-applies its
        // decorative Cochin serif to every Typography in the card, but this
        // utility link should read like a button, not the tagline).
        fontFamily: theme.typography.fontFamily,
        cursor: 'pointer',
        '&:hover': { textDecoration: 'underline' },
      }}
    >
      {value === 'staff' ? 'Are you a normal consumer? Sign In' : 'Are you a staff employee? Sign In'}
    </Typography>
  </Box>
);

export default AudienceToggle;
