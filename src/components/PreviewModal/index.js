import * as React from 'react';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import CheckIcon from '@mui/icons-material/Check';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import IosShareIcon from '@mui/icons-material/IosShare';
import CategoryIcon from '@mui/icons-material/Category';
import PaletteIcon from '@mui/icons-material/Palette';
import StraightenIcon from '@mui/icons-material/Straighten';
import SpaIcon from '@mui/icons-material/Spa';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ShieldIcon from '@mui/icons-material/Shield';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import RecyclingIcon from '@mui/icons-material/Recycling';
import GridViewIcon from '@mui/icons-material/GridView';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CameraIcon from '../../assets/camera_icon.png';
import YoutubeIcon from '../../assets/youtube-icon.png';
import { getFileUrl, normalizeProductVideos } from '../../helper';
import VideoPlayerDialog from '../VideoPlayerDialog';

// Brand tokens — kept in sync with the app's src/theme.ts so this admin preview
// reads like the consumer "Product Overview" screen (ResultScreen).
const C = {
  primary: '#2f80c8',
  primaryDark: '#2568a8',
  headerLight: '#4a96dd',
  text: '#33415c',
  muted: '#7a8aa3',
  placeholder: '#9aa7bd',
  bg: '#f4f7fc',
  surface: '#ffffff',
  surfaceAlt: '#eef2f8',
  border: '#e7edf6',
  authBg: '#eef5fc',
};

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '400px',
  maxWidth: '92vw',
  height: '86vh',
  maxHeight: '820px',
  bgcolor: C.bg,
  borderRadius: 3,
  boxShadow: 24,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const card = {
  bgcolor: C.surface,
  borderRadius: 2,
  border: `1px solid ${C.border}`,
  p: 1.5,
  mx: 2,
  mt: 1,
  boxShadow: '0 4px 10px rgba(47,128,200,0.08)',
};

const cardTitle = { fontSize: 13, fontWeight: 700, color: C.primary, mb: 0.75 };

const LIFECYCLE_STAGES = [
  { key: 'materials', label: 'Materials', Icon: SpaIcon },
  { key: 'manufacturing', label: 'Manufacturing', Icon: PrecisionManufacturingIcon },
  { key: 'transportation', label: 'Transportation', Icon: LocalShippingIcon },
  { key: 'use', label: 'Use Phase', Icon: CheckroomIcon },
  { key: 'endOfLife', label: 'End of Life', Icon: RecyclingIcon },
];

export default function PreviewModal({ open, setOpen, productInfo }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [dialogVideoId, setDialogVideoId] = useState(null);

  const info = productInfo || {};
  const images = info.images || [];
  const videos = normalizeProductVideos(info.videos);
  const slides = [
    ...images.map((src) => ({ type: 'image', src })),
    ...videos.map((video) => ({ type: 'video', video })),
  ];
  const safeIndex = slides.length ? Math.min(slideIndex, slides.length - 1) : 0;
  const active = slides[safeIndex];
  const facts = info.detailFacts || {};
  const productId = info._id || info.pmc_code || (info.token_id != null ? info.token_id : '');

  const highlightRows = [
    info.productType && { Icon: CategoryIcon, text: `Type: ${info.productType}` },
    info.color && { Icon: PaletteIcon, text: `Color: ${info.color}` },
    info.size && { Icon: StraightenIcon, text: `Size: ${info.size}` },
    facts.material && { Icon: SpaIcon, text: `Material: ${facts.material}` },
    facts.fit && { Icon: AccessibilityNewIcon, text: `Fit: ${facts.fit}` },
    facts.wash && { Icon: WaterDropIcon, text: `Wash: ${facts.wash}` },
    facts.durability && { Icon: ShieldIcon, text: `Durability: ${facts.durability}` },
  ].filter(Boolean);

  const go = (dir) => {
    if (!slides.length) return;
    setSlideIndex((i) => (i + dir + slides.length) % slides.length);
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)} aria-labelledby="preview-modal-title">
      <Box sx={style}>
        {/* Top bar — gradient, matches AppLayout */}
        <Box
          sx={{
            height: 50,
            px: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: `linear-gradient(180deg, ${C.headerLight} 0%, ${C.primary} 100%)`,
            flexShrink: 0,
          }}
        >
          <Button onClick={() => setOpen(false)} sx={{ minWidth: 40, color: '#fff' }}>
            <ArrowBackIcon fontSize="small" />
          </Button>
          <Typography sx={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>Product Overview</Typography>
          <Box sx={{ width: 40, display: 'flex', justifyContent: 'center', color: '#fff' }}>
            <NotificationsNoneIcon fontSize="small" />
          </Box>
        </Box>

        {/* Scrollable content layer */}
        <Box sx={{ flex: 1, overflow: 'auto', pb: 2 }}>
          {/* Product card — image (left) + name / model / ID / Authenticated (right) */}
          <Box sx={{ ...card, mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Box
                sx={{
                  width: 132,
                  height: 132,
                  flexShrink: 0,
                  position: 'relative',
                  bgcolor: '#000',
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {active ? (
                  active.type === 'video' ? (
                    <Box
                      role="button"
                      onClick={() => setDialogVideoId(active.video.videoId)}
                      sx={{ width: '100%', height: '100%', position: 'relative', cursor: 'pointer' }}
                    >
                      <img
                        src={`https://img.youtube.com/vi/${active.video.videoId}/hqdefault.jpg`}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <PlayCircleFilledIcon
                        sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 44, color: '#fff' }}
                      />
                    </Box>
                  ) : (
                    <img src={getFileUrl(active.src)} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  )
                ) : (
                  <Typography sx={{ color: '#fff', fontSize: 12 }}>No image</Typography>
                )}

                {slides.length > 1 && (
                  <>
                    <Box onClick={() => go(-1)} sx={{ position: 'absolute', inset: '0 auto 0 0', width: '35%', cursor: 'pointer' }} />
                    <Box onClick={() => go(1)} sx={{ position: 'absolute', inset: '0 0 0 auto', width: '35%', cursor: 'pointer' }} />
                    <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 6, display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      {slides.map((_, i) => (
                        <Box
                          key={i}
                          sx={{
                            width: i === safeIndex ? 14 : 6,
                            height: 6,
                            borderRadius: 3,
                            bgcolor: i === safeIndex ? C.primary : 'rgba(255,255,255,0.7)',
                          }}
                        />
                      ))}
                    </Box>
                  </>
                )}
                {active && (
                  <Box sx={{ position: 'absolute', right: 6, bottom: 6, bgcolor: 'rgba(0,0,0,0.55)', borderRadius: 1, px: 0.5, py: 0.25 }}>
                    <img src={active.type === 'video' ? YoutubeIcon : CameraIcon} alt="" style={{ height: 12, width: 12, display: 'block' }} />
                  </Box>
                )}
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.25 }}>
                  {info.name || '—'}
                </Typography>
                {info.model && <Typography sx={{ fontSize: 12, color: C.muted, mt: 0.25 }}>{info.model}</Typography>}
                {productId !== '' && (
                  <Typography sx={{ fontSize: 11, color: C.placeholder, mt: 0.25 }}>ID: {productId}</Typography>
                )}
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    mt: 1,
                    bgcolor: C.authBg,
                    borderRadius: 1.5,
                    px: 1,
                    py: 0.75,
                  }}
                >
                  <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckIcon sx={{ fontSize: 11, color: '#fff' }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: C.text, lineHeight: 1.1 }}>Authenticated</Typography>
                    <Typography sx={{ fontSize: 10, color: C.muted, lineHeight: 1.1 }}>Verified by Yometel</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Key Highlights */}
          {highlightRows.length > 0 && (
            <Box sx={card}>
              <Typography sx={cardTitle}>Key Highlights</Typography>
              {highlightRows.map((row, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.4 }}>
                  <row.Icon sx={{ fontSize: 15, color: C.primary }} />
                  <Typography sx={{ fontSize: 12, color: C.text }}>{row.text}</Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Lifecycle Preview */}
          <Box sx={card}>
            <Typography sx={{ ...cardTitle, mb: 1.5 }}>Lifecycle Preview</Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              {LIFECYCLE_STAGES.map((s, i) => (
                <React.Fragment key={s.key}>
                  <Box sx={{ width: 58, textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: C.surfaceAlt,
                        mx: 'auto',
                        mb: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <s.Icon sx={{ fontSize: 20, color: C.primary }} />
                    </Box>
                    <Typography sx={{ fontSize: 9, color: C.muted, lineHeight: 1.1 }}>{s.label}</Typography>
                  </Box>
                  {i < LIFECYCLE_STAGES.length - 1 && (
                    <Box sx={{ flex: 1, height: 2, bgcolor: C.primary, borderRadius: 1, mt: '19px' }} />
                  )}
                </React.Fragment>
              ))}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.25, mt: 1.5 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: C.primary }}>View Full Lifecycle</Typography>
              <ChevronRightIcon sx={{ fontSize: 16, color: C.primary }} />
            </Box>
          </Box>

          {/* Like / Dislike / Share */}
          <Box sx={{ display: 'flex', gap: 1, mx: 2, mt: 1 }}>
            {[ThumbUpOffAltIcon, ThumbDownOffAltIcon, IosShareIcon].map((Ico, i) => (
              <Box
                key={i}
                sx={{
                  flex: 1,
                  height: 36,
                  borderRadius: 1.5,
                  border: `1px solid ${C.border}`,
                  bgcolor: C.surface,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ico sx={{ fontSize: 19, color: C.primary }} />
              </Box>
            ))}
          </Box>

          {/* Contact Owner | Scan Another Product */}
          <Box sx={{ display: 'flex', gap: 1, mx: 2, mt: 1 }}>
            <Box
              sx={{
                flex: 1,
                py: 1,
                borderRadius: 1.5,
                textAlign: 'center',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                background: `linear-gradient(180deg, ${C.headerLight} 0%, ${C.primary} 100%)`,
              }}
            >
              Contact Owner
            </Box>
            <Box
              sx={{
                flex: 1,
                py: 1,
                borderRadius: 1.5,
                textAlign: 'center',
                fontSize: 13,
                fontWeight: 600,
                color: C.primary,
                border: `1px solid ${C.primary}`,
                bgcolor: C.surface,
              }}
            >
              Scan Another Product
            </Box>
          </Box>
        </Box>

        {/* Product bottom bar — Overview / Lifecycle / More (matches AppLayout) */}
        <Box
          sx={{
            flexShrink: 0,
            height: 58,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            px: 1,
            bgcolor: C.surface,
            borderTop: `1px solid ${C.border}`,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
        >
          {[
            { label: 'Overview', Icon: GridViewIcon, active: true },
            { label: 'Lifecycle', Icon: AutorenewIcon, active: false },
            { label: 'More', Icon: MoreHorizIcon, active: false },
          ].map((tab) => (
            <Box key={tab.label} sx={{ flex: 1, position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <tab.Icon sx={{ fontSize: 22, color: tab.active ? C.primary : '#7a8aa3' }} />
              <Typography sx={{ fontSize: 10, mt: 0.4, color: tab.active ? C.primary : '#333', fontWeight: tab.active ? 600 : 400 }}>
                {tab.label}
              </Typography>
              {tab.active && (
                <Box sx={{ position: 'absolute', bottom: 0, width: 34, height: 3, borderRadius: 1, bgcolor: C.primary }} />
              )}
            </Box>
          ))}
        </Box>

        <VideoPlayerDialog open={Boolean(dialogVideoId)} onClose={() => setDialogVideoId(null)} videoId={dialogVideoId} />
      </Box>
    </Modal>
  );
}
