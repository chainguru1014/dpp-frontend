import React from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import background1 from '../../assets/background-1.jpg';

// Shared visual shell for every sign-in surface (consumer/brand AuthPage and
// the Staff Login page) — same background, left tagline, and card frame
// everywhere. Card background is deliberately near-transparent so the forest
// photo shows through. Only the card's inner content (the actual form)
// differs per caller, passed as `children`.
const AuthShell = ({ children, cardSx }) => (
  <Box
    sx={{
      width: '100vw',
      maxWidth: '100vw',
      height: '100dvh',
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: { xs: 0, md: 10 },
      boxSizing: 'border-box',
      overflow: 'hidden',
      backgroundImage: `url(${background1})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      px: { xs: 2, md: 6 },
    }}
  >
    {/* Left tagline */}
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        color: '#fff',
        textShadow: '0 2px 8px rgba(0,0,0,0.55)',
        maxWidth: 340,
        flexShrink: 0,
        transform: 'translateX(-100px)',
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
        Digital Product
        <br />
        Passport
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.4 }}>
        for
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
        Traceability
        <br />
        Environment
      </Typography>
    </Box>

    {/* Auth card */}
    <Box
      sx={{
        width: { xs: '100%', sm: 360 },
        maxWidth: '92vw',
        maxHeight: { xs: '94vh', sm: '82vh' },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: alpha('#f3f4f6', 0.2),
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        border: '2px solid',
        borderColor: '#1B5E20',
        borderRadius: 3,
        boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
        px: { xs: 2.5, sm: 4 },
        py: { xs: 3, sm: 4.5 },
        ...cardSx,
      }}
    >
      {children}
    </Box>
  </Box>
);

export default AuthShell;
