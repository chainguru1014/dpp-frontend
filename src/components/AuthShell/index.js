import React from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import background1 from '../../assets/background-1.jpg';
import background2 from '../../assets/background-2.jpg';
import background3 from '../../assets/background-3.jpg';

// Background slideshow — steps through the brand photos in a fixed order
// (1 → 3 → 2), cross-fading via opacity over FADE_DURATION_MS, then STOPS on
// the final image (background-2) rather than looping forever.
// Images are pre-compressed JPEGs (~200–700 KB) and preloaded on mount so the
// first frame paints fast and each transition is instant.
const SLIDER_IMAGES = [background1, background3, background2];
const SLIDE_DURATION_MS = 3500;
const FADE_DURATION_MS = 900;

// Cochin is a macOS/iOS system serif — falls through to the nearest
// look-alikes on Windows/Linux/Android, where it isn't installed.
const taglineFontFamily = 'Cochin, Georgia, "Times New Roman", Times, serif';

// Fluid size for the flanking taglines: was a fixed 1.15rem regardless of
// viewport, so it read oversized at 1280x720 and even at 1920x1080. Scales
// continuously with viewport width instead of jumping at breakpoints —
// 0.6rem at <=1280px wide, 0.7rem at 1920px, capping at 0.8rem by 2560px+
// (70% of the original 0.85/1/1.15rem scale, per request).
const taglineFontSize = 'clamp(0.6rem, calc(0.39rem + 0.26vw), 0.8rem)';

// Shared visual shell for every sign-in surface (consumer/brand AuthPage and
// the Staff Login page) — same background, flanking taglines, and card frame
// everywhere. Card background is deliberately near-transparent so the forest
// photo shows through. Only the card's inner content (the actual form)
// differs per caller, passed as `children`.
const AuthShell = ({ children, cardSx }) => {
  const [activeSlide, setActiveSlide] = React.useState(0);

  // Preload every slide up front so switching to it is instant (no blank flash
  // while the browser fetches a multi-hundred-KB photo mid-transition).
  React.useEffect(() => {
    SLIDER_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Advance once per SLIDE_DURATION_MS and stop on the last image — no wrap.
  React.useEffect(() => {
    if (activeSlide >= SLIDER_IMAGES.length - 1) return undefined;
    const id = setTimeout(() => setActiveSlide((i) => i + 1), SLIDE_DURATION_MS);
    return () => clearTimeout(id);
  }, [activeSlide]);

  return (
  <Box
    sx={{
      position: 'relative',
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
      px: { xs: 2, md: 6 },
      py: { xs: 4, md: 0 },
    }}
  >
    {/* Background slideshow — sits behind everything else (first child,
        absolutely positioned, no z-index needed since normal-flow siblings
        painted after it stack on top). Each slide is its own layer so the
        outgoing/incoming images cross-fade via opacity transition. */}
    <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {SLIDER_IMAGES.map((src, i) => (
        <Box
          key={src}
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: i === activeSlide ? 1 : 0,
            transition: `opacity ${FADE_DURATION_MS}ms ease`,
          }}
        />
      ))}
    </Box>

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
        maxWidth: 420,
        fontFamily: taglineFontFamily,
        // Establishes its own stacking context so it paints above the
        // absolutely-positioned slideshow layer regardless of DOM order —
        // without this, a plain (position:static) box paints BEHIND any
        // positioned sibling per CSS stacking rules, which is why this was
        // getting covered by the background slides.
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Typography variant="h4" sx={{ fontFamily: taglineFontFamily, fontWeight: 700, fontSize: taglineFontSize, lineHeight: 1.2 }}>
        Digital Product Passport
      </Typography>
      <Typography variant="h4" sx={{ fontFamily: taglineFontFamily, fontWeight: 700, fontSize: taglineFontSize, lineHeight: 1.2, fontStyle: 'italic', my: 0.3 }}>
        for
      </Typography>
      <Typography variant="h4" sx={{ fontFamily: taglineFontFamily, fontWeight: 700, fontSize: taglineFontSize, lineHeight: 1.2 }}>
        Circular Economy Environment
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
        // Same font/size as the left column (see below) — narrower max
        // width since this phrase has fewer characters.
        maxWidth: 340,
        fontFamily: taglineFontFamily,
        // See the left tagline's comment — same stacking-context fix.
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Typography variant="h4" sx={{ fontFamily: taglineFontFamily, fontWeight: 700, fontSize: taglineFontSize, lineHeight: 1.2 }}>
        Improved Traceability
      </Typography>
      <Typography variant="h4" sx={{ fontFamily: taglineFontFamily, fontWeight: 700, fontSize: taglineFontSize, lineHeight: 1.2, my: 0.3 }}>
        as
      </Typography>
      <Typography variant="h4" sx={{ fontFamily: taglineFontFamily, fontWeight: 700, fontSize: taglineFontSize, lineHeight: 1.2 }}>
        Your Concierge
      </Typography>
    </Box>
  </Box>
  );
};

export default AuthShell;
