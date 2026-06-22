import { createTheme } from '@mui/material/styles';

// Shared visual language with the Yometel DPP mobile app:
// bright-blue palette on a soft light-blue canvas, rounded cards, soft blue shadows.
const navy = '#2f80c8';     // bright azure (primary — matches app top bar)
const blue = '#4a96dd';     // lighter azure (hover / accents)
const gray = '#6b7a93';     // gray (secondary)
const bg = '#f5f7fa';       // near-white / light gray canvas
const border = '#e6eaf0';

const theme = createTheme({
  palette: {
    primary: { main: navy, dark: '#266aa8', light: blue, contrastText: '#ffffff' },
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
    // Larger, highly readable base size for field use (UI principle 1).
    fontSize: 15,
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
        // Min 44px touch target (Apple/Android/WCAG 2.2 target size).
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 400,
          minHeight: 44,
          paddingInline: 22,
          paddingBlock: 8,
        },
        sizeSmall: { minHeight: 36, paddingInline: 14 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontSize: '0.95rem', fontWeight: 400, minHeight: 48 },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        // Comfortable tap area for icon actions.
        sizeMedium: { padding: 10 },
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
          backgroundImage: `linear-gradient(120deg, ${navy} 0%, ${blue} 100%)`,
        },
      },
    },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10 } } },
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
          backgroundImage: `linear-gradient(120deg, ${navy} 0%, ${blue} 100%)`,
          color: '#ffffff',
          fontWeight: 400,
          fontSize: 18,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        // Re-add top padding under the gradient header so floating field labels aren't clipped.
        root: { '.MuiDialogTitle-root + &': { paddingTop: 24 } },
      },
    },
  },
});

export default theme;
