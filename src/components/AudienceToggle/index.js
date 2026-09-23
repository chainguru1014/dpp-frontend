import React from 'react';
import { Box, Typography } from '@mui/material';
import theme from '../../theme';
import { useAuthShellBright } from '../AuthShell';

// Single-line "who are you" link shown at the bottom of both sign-in cards
// (consumer/brand AuthPage and StaffLoginPage), same pattern as the
// Sign In/Sign Up switch right below it: one question, one tap to switch.
// White + shadow (not primary blue) because the card background is
// transparent (see AuthShell) — plain blue text disappears into the photo.
// Over the bright final slide (background-2) that white becomes unreadable
// instead, so it flips to the app's dark navy there — see useAuthShellBright.
const AudienceToggle = ({ value, onSelectConsumer, onSelectStaff }) => {
  const isBright = useAuthShellBright();
  return (
  <Box sx={{ textAlign: 'center' }}>
    <Typography
      component="span"
      onClick={value === 'staff' ? onSelectConsumer : onSelectStaff}
      sx={{
        color: isBright ? theme.palette.primary.main : '#fff',
        textShadow: isBright ? 'none' : '0 1px 3px rgba(0,0,0,0.6)',
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
};

export default AudienceToggle;
