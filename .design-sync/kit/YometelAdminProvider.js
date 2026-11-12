import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { MemoryRouter } from 'react-router-dom';
import theme from '../../src/theme';
import GlobalFeedback from '../../src/components/GlobalFeedback';

/**
 * The admin site's look: the Yometel MUI theme (navy #1b4f72, Poppins, large
 * readable type, 48px targets), the CSS baseline, a router context, and the
 * global toast / confirm dialog (call notify() / confirmAction()). Wrap a
 * design in it once.
 */
export default function YometelAdminProvider({ children, feedback = true }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MemoryRouter>
        {children}
        {feedback && <GlobalFeedback />}
      </MemoryRouter>
    </ThemeProvider>
  );
}
