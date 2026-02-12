import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Link from '@mui/material/Link';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useState } from 'react';
import { Slide } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';
import YouTube from 'react-youtube';
import CameraIcon from '../../assets/camera_icon.png';
import PDFIcon from '../../assets/pdf.png';
import { getFileUrl } from '../../helper';
import { CareSymbol } from '../CareSymbols';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const TAB_LABELS = ['Product', 'Material/Size', 'Maintenance', 'Dispose', 'Traceability/ESG'];

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '400px',
  maxHeight: '90vh',
  bgcolor: '#fff',
  borderRadius: 3,
  boxShadow: 24,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  width: '400px',
  height: '60vh',
};

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 2, overflow: 'auto', maxHeight: 320 }}>{children}</Box>}
    </div>
  );
}

export default function PreviewModal({ open, setOpen, productInfo }) {
  const [tabValue, setTabValue] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [viewPDF, setViewPDF] = useState(false);
  const [currentPDF, setCurrentPDF] = useState(null);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getYoutubeVideoIDFromUrl = (url) => {
    const videoid = url && url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/);
    return videoid ? videoid[1] : null;
  };

  const opts = { width: '100%', height: 240, playerVars: { autoplay: 0 } };

  const info = productInfo || {};
  const images = info.images || [];
  const materialSize = info.materialSize || { size: '', materials: [] };
  const maintenance = info.maintenance || { iconIds: [], description: '' };
  const disposal = info.disposal || { repairUrl: '', reuseUrl: '', rentalUrl: '', disposeUrl: '' };
  const traceabilityEsg = info.traceabilityEsg || {
    madeIn: '',
    materialOrigins: [],
    shippingLog: '',
    distance: '',
    co2Production: '',
    co2Transportation: '',
  };

  const detailLines = (info.detail || '')
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <Modal open={open} onClose={() => setOpen(false)} aria-labelledby="preview-modal-title" aria-describedby="preview-modal-description">
      <Box sx={style}>
        <Modal open={viewPDF} onClose={() => setViewPDF(false)} aria-labelledby="pdf-modal-title">
          <Box sx={modalStyle}>
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <Viewer fileUrl={getFileUrl(currentPDF)} />
            </Worker>
          </Box>
        </Modal>

        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: '#1976d2' }}>Yometel</Typography>
        </Box>

        {/* Center: slidable image */}
        <Box sx={{ position: 'relative', width: '100%', minHeight: 280, bgcolor: '#e8eef2' }}>
          {images.length > 0 ? (
            <Slide transitionDuration={200} autoplay={false} onChange={(_, next) => setCurrentSlideIndex(next)}>
              {images.map((slideImage, index) => (
                <div key={index}>
                  <Box sx={{ width: '100%', height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e8eef2' }}>
                    <img src={getFileUrl(slideImage)} alt="" style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain' }} />
                  </Box>
                </div>
              ))}
            </Slide>
          ) : (
            <Box sx={{ width: '100%', height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>No image</Typography>
            </Box>
          )}
          {images.length > 0 && (
            <Box sx={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 0.5, color: '#fff', bgcolor: 'rgba(0,0,0,0.4)', px: 1, py: 0.5, borderRadius: 2 }}>
              <img src={CameraIcon} alt="" style={{ height: 14, width: 14 }} />
              <Typography sx={{ fontSize: 12 }}>{currentSlideIndex + 1}/{images.length}</Typography>
            </Box>
          )}
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile aria-label="DPP preview tabs">
            {TAB_LABELS.map((label, i) => (
              <Tab key={i} label={label} id={`preview-tab-${i}`} aria-controls={`preview-tabpanel-${i}`} sx={{ fontSize: 12, minHeight: 44 }} />
            ))}
          </Tabs>
        </Box>

        {/* Tab content */}
        <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#fafafa' }}>
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 2 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#1976d2', mb: 0.5 }}>{info.name || '—'}</Typography>
              <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: 0.5 }}>{info.model || '—'}</Typography>
              {info._id && <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1 }}>Product ID: {info._id}</Typography>}
              {detailLines.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {detailLines.map((line, i) => (
                    <Typography key={i} component="span" sx={{ fontSize: 13, mr: 1 }}>• {line}</Typography>
                  ))}
                </Box>
              )}
              {(info.videos || []).length > 0 && (
                <Box sx={{ mt: 2 }}>
                  {(info.videos || []).map((video, idx) => {
                    const videoId = getYoutubeVideoIDFromUrl(video?.url);
                    if (!videoId) return null;
                    return <YouTube key={idx} videoId={videoId} opts={opts} />;
                  })}
                </Box>
              )}
              {(info.files || []).length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.5, mt: 2 }}>
                  {(info.files || []).map((file, i) => (
                    <Button key={i} size="small" onClick={() => { setViewPDF(true); setCurrentPDF(file); }}>
                      <img src={PDFIcon} style={{ height: 24, width: 24 }} alt="PDF" />
                    </Button>
                  ))}
                </Box>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 2 }}>
              {images[0] && (
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  <img src={getFileUrl(images[0])} alt="" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', background: '#eee', borderRadius: 1 }} />
                </Box>
              )}
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1976d2' }}>Material</Typography>
              <Typography sx={{ fontSize: 14, mb: 1 }}>Size : {materialSize.size || '—'}</Typography>
              {info._id && <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1 }}>Product ID: {info._id}</Typography>}
              {(materialSize.materials || []).map((row, i) => (
                <Typography key={i} sx={{ fontSize: 13 }}>{row.material || '—'} {row.percent != null ? `${row.percent}%` : ''}</Typography>
              ))}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 2 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1976d2', mb: 1 }}>Maintenance</Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1 }}>Selected care symbols</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {(maintenance.iconIds || []).length > 0
                  ? (maintenance.iconIds || []).map((id) => (
                      <CareSymbol key={id} iconId={id} selected size={48} />
                    ))
                  : (
                      <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic' }}>No care symbols selected</Typography>
                    )}
              </Box>
              {maintenance.description && <Typography sx={{ fontSize: 13, whiteSpace: 'pre-line' }}>{maintenance.description}</Typography>}
              <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1976d2', mb: 0.5 }}>DPP</Typography>
                <Typography sx={{ fontSize: 12 }}>Traceability</Typography>
                <Typography sx={{ fontSize: 12 }}>More punchy product information</Typography>
                <Typography sx={{ fontSize: 12 }}>Contributing to Supply Chain & Sustainability</Typography>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 2 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1976d2', mb: 1 }}>URL</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {disposal.repairUrl && <Box><Typography component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>Repair </Typography><Link href={disposal.repairUrl} target="_blank" rel="noopener noreferrer" sx={{ fontSize: 13 }}>Repair</Link></Box>}
                {disposal.reuseUrl && <Box><Typography component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>Reuse </Typography><Link href={disposal.reuseUrl} target="_blank" rel="noopener noreferrer" sx={{ fontSize: 13 }}>Reuse</Link></Box>}
                {disposal.rentalUrl && <Box><Typography component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>Rental </Typography><Link href={disposal.rentalUrl} target="_blank" rel="noopener noreferrer" sx={{ fontSize: 13 }}>Rental</Link></Box>}
                {disposal.disposeUrl && <Box><Typography component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>Dispose </Typography><Link href={disposal.disposeUrl} target="_blank" rel="noopener noreferrer" sx={{ fontSize: 13 }}>Dispose</Link></Box>}
              </Box>
              <Box sx={{ mt: 2, py: 1.5, px: 2, bgcolor: '#2e7d32', color: '#fff', borderRadius: 1, display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Reduce Disposal</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Save Environment</Typography>
              </Box>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 2 }}>Inquiry</Typography>
              <Link href="https://www.Yometel.com" target="_blank" rel="noopener noreferrer" sx={{ fontSize: 13 }}>https://www.Yometel.com</Link>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 2 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1976d2', mb: 1 }}>Made in</Typography>
              <Typography sx={{ fontSize: 13, mb: 1 }}>{traceabilityEsg.madeIn || '—'}</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1976d2', mb: 0.5 }}>Material origins</Typography>
              {(traceabilityEsg.materialOrigins || []).map((row, i) => (
                <Typography key={i} sx={{ fontSize: 13 }}>{row.material || '—'} {row.companyName || ''}</Typography>
              ))}
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1976d2', mt: 2, mb: 0.5 }}>Shipping</Typography>
              <Typography sx={{ fontSize: 13 }}>{traceabilityEsg.shippingLog || '—'}</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1976d2', mt: 1, mb: 0.5 }}>Distance</Typography>
              <Typography sx={{ fontSize: 13 }}>{traceabilityEsg.distance || '—'}</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1976d2', mt: 1, mb: 0.5 }}>CO2 by Production</Typography>
              <Typography sx={{ fontSize: 13 }}>{traceabilityEsg.co2Production || '—'}</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1976d2', mt: 1, mb: 0.5 }}>CO2 by Transportation</Typography>
              <Typography sx={{ fontSize: 13 }}>{traceabilityEsg.co2Transportation || '—'}</Typography>
            </Box>
          </TabPanel>
        </Box>
      </Box>
    </Modal>
  );
}
