import React from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import background1 from '../../assets/background-1.jpg';

// Cochin is a macOS/iOS system serif — falls through to the nearest
// look-alikes on Windows/Linux/Android, where it isn't installed.
const taglineFontFamily = 'Cochin, Georgia, "Times New Roman", Times, serif';

// Shared visual shell for every sign-in surface (consumer/brand AuthPage and
// the Staff Login page) — same background, flanking taglines, and card frame
// everywhere. Card background is deliberately near-transparent so the forest
// photo shows through. Only the card's inner content (the actual form)
// differs per caller, passed as `children`.
const AuthShell = ({ children, cardSx }) => (
  <Box
    sx={{
      width: '100vw',
      maxWidth: '100vw',
      // `dvh` (not `vh`) so this tracks the *actual visible* viewport as
      // iOS Safari's address bar/toolbar hides and shows, and as the
      // on-screen keyboard opens for the code-input step — using a static
      // `vh` here while the card below also caps itself in viewport units
      // let the two disagree on the true visible height, which is what
      // made the card's top content (logo/title) ride up and overlap the
      // newly-appeared "Enter the 6-digit code…" row once the keyboard
      // opened.
      // On xs, the taglines now stack above/below the card (single grid
      // column, see gridTemplateColumns below) instead of flanking it, so
      // the three of them together can be taller than one screen — `auto` +
      // scroll there, vs. the fixed viewport-locked hero layout on md+.
      height: { xs: 'auto', md: '100dvh' },
      minHeight: '100dvh',
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: '1fr auto 1fr' },
      alignItems: 'center',
      justifyItems: 'center',
      columnGap: { xs: 0, md: 6 },
      rowGap: { xs: 3, md: 0 },
      boxSizing: 'border-box',
      overflow: { xs: 'auto', md: 'hidden' },
      backgroundImage: `url(${background1})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      px: { xs: 2, md: 6 },
      py: { xs: 4, md: 0 },
    }}
  >
    {/* Left tagline — its own grid column (not a flex sibling nudged with a
        transform hack) so the card in the middle column stays truly
        centered on the page regardless of how long this text is. */}
    <Box
      sx={{
        // Shown on every device (was hidden below `md`) — stacks above the
        // card on narrow screens since it's alone in the single xs grid
        // column (see gridTemplateColumns above).
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifySelf: { xs: 'center', md: 'end' },
        textAlign: 'center',
        color: '#fff',
        textShadow: '0 2px 8px rgba(0,0,0,0.55)',
        // Wider than the right column, at a smaller font size (1.3rem here
        // vs 1.6rem there) — this phrase has ~50% more characters, so
        // matching font sizes made this block noticeably taller/heavier
        // than the right one despite both being 3 lines. Scaling the font
        // down roughly by sqrt(charCountRight / charCountLeft) balances the
        // two blocks' rendered "ink area" instead.
        maxWidth: 420,
        fontFamily: taglineFontFamily,
      }}
    >
      <Typography variant="h4" sx={{ fontFamily: taglineFontFamily, fontWeight: 700, fontSize: '1.3rem', lineHeight: 1.2 }}>
        Digital Product Passport
      </Typography>
      <Typography variant="h4" sx={{ fontFamily: taglineFontFamily, fontWeight: 700, fontSize: '1.3rem', lineHeight: 1.2, fontStyle: 'italic', my: 0.3 }}>
        for
      </Typography>
      <Typography variant="h4" sx={{ fontFamily: taglineFontFamily, fontWeight: 700, fontSize: '1.3rem', lineHeight: 1.2 }}>
        Circular Economy &amp; Environment
      </Typography>
    </Box>

    {/* Auth card */}
    <Box
      sx={{
        width: { xs: '100%', sm: 360 },
        maxWidth: '92vw',
        maxHeight: { xs: '94dvh', sm: '82dvh' },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: alpha('#f3f4f6', 0.2),
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        borderRadius: 3,
        boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
        px: { xs: 2.5, sm: 4 },
        py: { xs: 3, sm: 4.5 },
        fontFamily: taglineFontFamily,
        '& .MuiTypography-root': { fontFamily: taglineFontFamily },
        ...cardSx,
      }}
    >
      {children}
    </Box>

    {/* Right tagline — mirrors the left column so the card in between is
        flanked symmetrically instead of only having text on one side. */}
    <Box
      sx={{
        // Shown on every device (was hidden below `md`) — stacks below the
        // card on narrow screens since it's alone in the single xs grid
        // column (see gridTemplateColumns above).
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifySelf: { xs: 'center', md: 'start' },
        textAlign: 'center',
        color: '#fff',
        textShadow: '0 2px 8px rgba(0,0,0,0.55)',
        // Narrower + larger font than the left column — see its comment;
        // this phrase has fewer characters, so a bigger font here keeps the
        // two blocks' visual weight comparable instead of this one reading
        // as the lighter/smaller of the pair.
        maxWidth: 340,
        fontFamily: taglineFontFamily,
      }}
    >
      <Typography variant="h4" sx={{ fontFamily: taglineFontFamily, fontWeight: 700, fontSize: '1.6rem', lineHeight: 1.2 }}>
        Improved Traceability
      </Typography>
      {/* Italicized to match the left column's "for" — both are the
          connector word joining the two noun phrases either side of it. */}
      <Typography variant="h4" sx={{ fontFamily: taglineFontFamily, fontWeight: 700, fontSize: '1.6rem', lineHeight: 1.2, fontStyle: 'italic', my: 0.3 }}>
        as
      </Typography>
      <Typography variant="h4" sx={{ fontFamily: taglineFontFamily, fontWeight: 700, fontSize: '1.6rem', lineHeight: 1.2 }}>
        Your Concierge
      </Typography>
    </Box>
  </Box>
);

export default AuthShell;
