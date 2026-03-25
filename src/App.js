import './App.css';
import { BrowserRouter, Routes, Route, useParams, useSearchParams, Navigate } from 'react-router-dom';
import { StyledEngineProvider } from '@mui/material/styles';
import Page from './pages';
import PublicProductPage from './pages/PublicProductPage';

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
        <BrowserRouter>
          <Routes>
            <Route path="/product/:productId/:qrcodeId" element={<PublicProductPageWrapper />} />
            <Route path="/" element={<PublicProductRoute />} />
            <Route path="/admin/*" element={<Page />} />
          </Routes>
        </BrowserRouter>
      </StyledEngineProvider>
    </div>
  );
}

export default App;
