import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Shared visual language with the Yometel DPP mobile app:
// dark-navy palette on a soft light-blue canvas, rounded cards, soft blue shadows.
const navy = '#1b4f72';     // dark navy (primary — matches app top bar/icons/fonts)
const navyDark = '#123a56'; // darkest navy (hover / gradient dark stop)
const blue = '#4a96dd';     // lighter azure (gradient light stop / accents)
const gray = '#6b7a93';     // gray (secondary)
const bg = '#f5f7fa';       // near-white / light gray canvas
const border = '#e6eaf0';

// Below this viewport width (covers 1280x720/1366x768 client displays, not
// just phones/tablets), several MUI component defaults below shrink further
// than the xs/sm/md breakpoints already give them — chosen so 1920x1080+
// desktops are untouched while compact laptops/monitors get denser buttons,
// inputs, tabs, and dialog chrome instead of the full-size touch-target
// spacing meant for larger screens.
export const COMPACT_MAX_WIDTH = 1366;
export const compactMediaQuery = `@media (max-width:${COMPACT_MAX_WIDTH}px)`;

const theme = createTheme({
  palette: {
    primary: { main: navy, dark: navyDark, light: blue, contrastText: '#ffffff' },
    secondary: { main: gray, dark: '#55657f', contrastText: '#ffffff' },
    info: { main: gray, contrastText: '#ffffff' },
    success: { main: '#2e7d32' },
    error: { main: '#c0392b' },
    warning: { main: '#7a6a3a' },
    background: { default: bg, paper: '#ffffff' },
    text: { primary: navy, secondary: gray },
    divider: border,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Poppins","Segoe UI",system-ui,-apple-system,Roboto,sans-serif',
    // MUI's own default base size (was 15 — a touch smaller reads better app-wide).
    fontSize: 14,
    fontWeightBold: 400,
    h4: { fontWeight: 400 },
    h5: { fontWeight: 400 },
    h6: { fontWeight: 400, fontSize: '1.2rem' },
    subtitle1: { fontWeight: 400, fontSize: '1.02rem' },
    subtitle2: { fontWeight: 400, fontSize: '0.95rem' },
    body1: { fontWeight: 400, fontSize: '1rem' },
    body2: { fontWeight: 400, fontSize: '0.95rem' },
    button: { textTransform: 'none', fontWeight: 400, fontSize: '0.95rem' },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        // Min 44px touch target (Apple/Android/WCAG 2.2 target size) — relaxed
        // below COMPACT_MAX_WIDTH, where screen real estate is scarcer than
        // touch precision (mouse/trackpad, not a finger).
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 400,
          minHeight: 44,
          paddingInline: 22,
          paddingBlock: 8,
          [`@media (max-width:${COMPACT_MAX_WIDTH}px)`]: {
            minHeight: 36,
            paddingInline: 14,
            paddingBlock: 5,
            fontSize: '0.85rem',
          },
        },
        sizeSmall: {
          minHeight: 36,
          paddingInline: 14,
          [`@media (max-width:${COMPACT_MAX_WIDTH}px)`]: { minHeight: 30, paddingInline: 10 },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '0.95rem',
          fontWeight: 400,
          minHeight: 48,
          [`@media (max-width:${COMPACT_MAX_WIDTH}px)`]: { minHeight: 38, fontSize: '0.85rem', paddingTop: 6, paddingBottom: 6 },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        // Comfortable tap area for icon actions, denser below COMPACT_MAX_WIDTH.
        sizeMedium: {
          padding: 10,
          [`@media (max-width:${COMPACT_MAX_WIDTH}px)`]: { padding: 6 },
        },
      },
    },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 16 } } },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${border}`,
          boxShadow: '0 8px 24px rgba(31,51,97,0.08)',
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        colorPrimary: {
          backgroundColor: blue,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          [`@media (max-width:${COMPACT_MAX_WIDTH}px)`]: { fontSize: '0.9rem' },
        },
        input: {
          [`@media (max-width:${COMPACT_MAX_WIDTH}px)`]: { paddingTop: 12.5, paddingBottom: 12.5 },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 400 } } },
    MuiTooltip: {
      styleOverrides: { tooltip: { backgroundColor: navy, fontSize: 12, borderRadius: 8 } },
    },
    // Unified dialog look across the admin panel: rounded card + gradient header bar.
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 14, overflow: 'hidden' },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundImage: `linear-gradient(135deg, ${blue} 0%, ${navy} 100%)`,
          color: '#ffffff',
          fontWeight: 400,
          fontSize: 18,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          [`@media (max-width:${COMPACT_MAX_WIDTH}px)`]: { fontSize: 16, padding: '10px 16px' },
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        // Re-add top padding under the gradient header so floating field labels aren't clipped.
        root: {
          '.MuiDialogTitle-root + &': { paddingTop: 24 },
          [`@media (max-width:${COMPACT_MAX_WIDTH}px)`]: {
            padding: '12px 16px',
            '.MuiDialogTitle-root + &': { paddingTop: 18 },
          },
        },
      },
    },
  },
});

// Scales typography (h1-h6, body, etc.) up/down between breakpoints instead of
// staying fixed at the 1920x1080 sizes this palette was designed at — keeps
// text legible on low-res laptops (800x600-1366x768) without reading oversized
// on high-res/4K displays (2560x1600+).
export default responsiveFontSizes(theme, { breakpoints: ['xs', 'sm', 'md', 'lg', 'xl'], factor: 2.5 });
