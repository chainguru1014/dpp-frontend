import './App.css';
import { BrowserRouter, Routes, Route, useParams, useSearchParams, Navigate } from 'react-router-dom';
import { StyledEngineProvider } from '@mui/material/styles';
import Page from './pages';
import PublicProductPage from './pages/PublicProductPage';

function PublicProductRoute() {
  const [searchParams] = useSearchParams();
  const qrcodeKey = searchParams.get('qrcode');
  
  if (qrcodeKey) {
    return <PublicProductPage qrcodeKey={qrcodeKey} />;
  }
  
  // If no qrcode parameter, show admin page
  return <Page />;
}

function PublicProductPageWrapper() {
  const { key } = useParams();
  return <PublicProductPage qrcodeKey={key} />;
}

function App() {
  return (
    <div className="App">
      <StyledEngineProvider injectFirst>
        <BrowserRouter>
          <Routes>
            <Route path="/product/:key" element={<PublicProductPageWrapper />} />
            <Route path="/" element={<PublicProductRoute />} />
            <Route path="/admin/*" element={<Page />} />
          </Routes>
        </BrowserRouter>
      </StyledEngineProvider>
    </div>
  );
}

export default App;
