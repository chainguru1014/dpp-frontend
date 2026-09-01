import './App.css';
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useParams, useSearchParams, Navigate } from 'react-router-dom';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import GlobalLoadingBar from './components/GlobalLoadingBar';
import Loader from './components/Loader';

// Route-level code splitting. The consumer scan landing (PublicProductPage) is
// by far the most-hit "first visit", so the heavy admin panel (`./pages` — MUI
// DataGrid, PDF tooling, socket.io, the whole dashboard) and the staff app are
// pulled only when their route is actually entered, not on every page load.
const Page = lazy(() => import('./pages'));
const PublicProductPage = lazy(() => import('./pages/PublicProductPage'));
const StaffApp = lazy(() => import('./features/employee-auth/StaffApp'));

const RouteFallback = () => <Loader label="Loading…" minHeight="100vh" />;

function PublicProductRoute() {
  const [searchParams] = useSearchParams();
  const qrcodeKey = searchParams.get('qrcode');

  if (qrcodeKey) {
    // Backward compatibility: qrcode can be a full URL, extract /product/:id/:qrcodeId if present.
    const match = String(qrcodeKey).match(/\/product\/([^/?#]+)\/([^/?#]+)/i);
    if (match) {
      return <Navigate to={`/product/${encodeURIComponent(match[1])}/${encodeURIComponent(match[2])}`} replace />;
    }
    return <PublicProductPage qrcodeKey={qrcodeKey} />;
  }

  // If no qrcode parameter, show admin page
  return <Page />;
}

function PublicProductPageWrapper() {
  const { productId, qrcodeId } = useParams();
  return <PublicProductPage productId={productId} qrcodeId={qrcodeId} />;
}

function App() {
  return (
    <div className="App">
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <GlobalLoadingBar />
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/product/:productId/:qrcodeId" element={<PublicProductPageWrapper />} />
                <Route path="/" element={<PublicProductRoute />} />
                <Route path="/admin/*" element={<Page />} />
                <Route path="/staff/*" element={<StaffApp />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ThemeProvider>
      </StyledEngineProvider>
    </div>
  );
}

export default App;
