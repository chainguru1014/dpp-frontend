import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Shared visual language with the Yometel DPP mobile app:
// dark-navy palette on a soft light-blue canvas, rounded cards, soft blue shadows.
//
// Readability rules (older users, laptops + iPads): everything is large and
// there is little of it per page — body text 17px, nothing smaller than
// ~14.5px, real bold for headings, secondary text dark enough to pass WCAG
// AA, and 48px targets everywhere (not only on touch screens).
const navy = '#1b4f72';     // dark navy (primary — matches app top bar/icons/fonts)
const navyDark = '#123a56'; // darkest navy (hover / gradient dark stop)
const blue = '#4a96dd';     // lighter azure (gradient light stop / accents)
const gray = '#51617a';     // secondary text — darkened from #6b7a93 for contrast
const buttonBlue = '#2f80c8';     // button blue (canonical app blue)
const buttonBlueDark = '#256aa8'; // button hover
const bg = '#f5f7fa';       // near-white / light gray canvas
const border = '#dfe5ec';

// Laptop-only density: below this width, AND only with a precise pointer
// (mouse/trackpad), buttons/inputs/tabs get a little denser so 1280x720 and
// 1366x768 screens fit more. Touch screens (iPads in landscape are 1024–1366
// wide too) never shrink — they get the large touch sizes below instead.
export const COMPACT_MAX_WIDTH = 1366;
export const compactMediaQuery = `@media (max-width:${COMPACT_MAX_WIDTH}px) and (pointer: fine)`;
export const touchMediaQuery = '@media (pointer: coarse)';

const theme = createTheme({
  palette: {
    primary: { main: navy, dark: navyDark, light: blue, contrastText: '#ffffff' },
    secondary: { main: gray, dark: '#3f4d62', contrastText: '#ffffff' },
    info: { main: '#2f6fb0', contrastText: '#ffffff' },
    success: { main: '#2e7d32' },
    error: { main: '#c0392b' },
    warning: { main: '#b26a00' },
    background: { default: bg, paper: '#ffffff' },
    text: { primary: '#16324a', secondary: gray, disabled: '#7d8a9c' },
    divider: border,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Poppins","Segoe UI",system-ui,-apple-system,Roboto,sans-serif',
    fontSize: 16,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600, fontSize: '1.9rem' },
    h6: { fontWeight: 600, fontSize: '1.35rem' },
    subtitle1: { fontWeight: 600, fontSize: '1.15rem' },
    subtitle2: { fontWeight: 600, fontSize: '1.02rem' },
    body1: { fontWeight: 400, fontSize: '1.0625rem', lineHeight: 1.6 },
    body2: { fontWeight: 400, fontSize: '1rem', lineHeight: 1.55 },
    caption: { fontSize: '0.9rem', lineHeight: 1.45 },
    overline: { fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.06em' },
    button: { textTransform: 'none', fontWeight: 500, fontSize: '1.0625rem' },
  },
  components: {
    // App-wide scrollbars in the brand blue (#428acb) on a
    // light blue track — same as the mobile app's web build
    // (app/public/index.html).
    MuiCssBaseline: {
      styleOverrides: {
        '*': { scrollbarWidth: 'thin', scrollbarColor: '#428acb #e6eef8' },
        '*::-webkit-scrollbar': { width: 10, height: 10 },
        '*::-webkit-scrollbar-track': { background: '#e6eef8' },
        '*::-webkit-scrollbar-thumb': { backgroundColor: '#428acb', borderRadius: 8, border: '2px solid #e6eef8' },
        '*::-webkit-scrollbar-thumb:hover': { backgroundColor: '#356fa6' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        // 48px target everywhere; only a little denser on mouse-driven
        // compact laptops.
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 500,
          minHeight: 48,
          paddingInline: 26,
          paddingBlock: 10,
          [compactMediaQuery]: {
            minHeight: 44,
            paddingInline: 20,
            paddingBlock: 8,
            fontSize: '1rem',
          },
        },
        sizeSmall: {
          minHeight: 40,
          paddingInline: 16,
          fontSize: '0.97rem',
          [compactMediaQuery]: { minHeight: 38, paddingInline: 14 },
          [touchMediaQuery]: { minHeight: 44 },
        },
        containedPrimary: {
          backgroundColor: buttonBlue,
          color: '#ffffff',
          '&:hover': { backgroundColor: buttonBlueDark },
        },
        outlinedPrimary: {
          color: buttonBlueDark,
          borderColor: buttonBlue,
          '&:hover': { borderColor: buttonBlueDark, backgroundColor: 'rgba(47,128,200,0.08)' },
        },
        textPrimary: {
          color: buttonBlueDark,
          '&:hover': { backgroundColor: 'rgba(47,128,200,0.08)' },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '1.0625rem',
          fontWeight: 500,
          minHeight: 54,
          [compactMediaQuery]: { minHeight: 46, fontSize: '1rem', paddingTop: 6, paddingBottom: 6 },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        sizeMedium: {
          padding: 12,
          [compactMediaQuery]: { padding: 10 },
        },
        sizeSmall: {
          padding: 6,
          [touchMediaQuery]: { padding: 10 },
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
        // Applied to the root <header> — keep in sync with the AppBar `sx` in
        // pages/index.js (this override otherwise wins over an inline `sx`).
        colorPrimary: {
          backgroundImage: 'linear-gradient(90deg, #4584db 0%, #4585db 60%, #4787d1 100%)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontSize: '1.0625rem',
          [compactMediaQuery]: { fontSize: '1rem' },
        },
        input: {
          [compactMediaQuery]: { paddingTop: 12.5, paddingBottom: 12.5 },
        },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { fontSize: '1.0625rem' } } },
    MuiFormHelperText: { styleOverrides: { root: { fontSize: '0.92rem', marginTop: 4 } } },
    MuiMenuItem: {
      styleOverrides: {
        root: { minHeight: 48, fontSize: '1.0625rem' },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 500, fontSize: '0.92rem' } } },
    MuiTooltip: {
      styleOverrides: { tooltip: { backgroundColor: navy, fontSize: 14, borderRadius: 8, padding: '6px 10px' } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { fontSize: '1rem', paddingTop: 14, paddingBottom: 14 },
        head: { fontWeight: 600, color: '#16324a' },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: { fontSize: '1rem' },
        columnHeaderTitle: { fontWeight: 600 },
      },
    },
    MuiAlert: { styleOverrides: { root: { fontSize: '1rem' } } },
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
          fontWeight: 600,
          fontSize: 22,
          padding: '18px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          [compactMediaQuery]: { fontSize: 18, padding: '12px 20px' },
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        // Re-add top padding under the gradient header so floating field labels aren't clipped.
        root: {
          '.MuiDialogTitle-root + &': { paddingTop: 24 },
          [compactMediaQuery]: {
            padding: '14px 20px',
            '.MuiDialogTitle-root + &': { paddingTop: 20 },
          },
        },
      },
    },
  },
});

// Scales the heading variants between breakpoints so they stay proportionate
// from 1280x720 laptops up to 2560px displays. Body/caption sizes are fixed
// above so they never shrink below the readable minimum.
export default responsiveFontSizes(theme, { breakpoints: ['sm', 'md', 'lg', 'xl'], factor: 2, variants: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] });
