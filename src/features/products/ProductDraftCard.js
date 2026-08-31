import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HistoryIcon from '@mui/icons-material/History';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SpaIcon from '@mui/icons-material/Spa';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ShieldIcon from '@mui/icons-material/Shield';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import YouTube from 'react-youtube';
import { getFileUrl, normalizeProductVideos } from '../../helper';
import youtubeIcon from '../../assets/youtube-icon.png';

const DETAIL_FACT_ROWS = [
  { key: 'material', icon: SpaIcon, label: (v) => `Material: ${v}` },
  { key: 'fit', icon: AccessibilityNewIcon, label: (v) => `Fit: ${v}` },
  { key: 'wash', icon: WaterDropIcon, label: (v) => `Wash: ${v}` },
  { key: 'durability', icon: ShieldIcon, label: (v) => `Durability: ${v}` },
  { key: 'traceableIdentity', icon: QrCode2Icon, label: (v) => v || 'Traceable product identity' },
];

// One media cell in the right-hand strip. Each cell is exactly a quarter of the
// strip's width (minus gaps) so four sit fully visible on any laptop; a fifth+
// scrolls into view. `type` drives the small badge bottom-right — a camera for
// photos, the YouTube glyph for videos.
const MEDIA_GAP_PX = 8;
const cellSx = {
  position: 'relative',
  flex: `0 0 calc((100% - ${MEDIA_GAP_PX * 3}px) / 4)`,
  maxWidth: `calc((100% - ${MEDIA_GAP_PX * 3}px) / 4)`,
  height: 260,
  borderRadius: 1.5,
  border: '2px solid',
  borderColor: 'primary.main',
  bgcolor: '#fafafa',
  overflow: 'hidden',
};

function MediaBadge({ type }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        right: 6,
        bottom: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 22,
        borderRadius: '50%',
        bgcolor: 'rgba(0,0,0,0.55)',
      }}
    >
      {type === 'video' ? (
        <Box component="img" src={youtubeIcon} alt="video" sx={{ width: 14, height: 14, display: 'block' }} />
      ) : (
        <PhotoCameraIcon sx={{ fontSize: 14, color: '#fff' }} />
      )}
    </Box>
  );
}

function VideoCell({ video }) {
  const [playing, setPlaying] = React.useState(false);
  return (
    <Box sx={cellSx}>
      {playing ? (
        <YouTube
          videoId={video.videoId}
          opts={{ width: '100%', height: '100%', playerVars: { autoplay: 1 } }}
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <Box
          role="button"
          onClick={() => setPlaying(true)}
          sx={{ width: '100%', height: '100%', cursor: 'pointer' }}
        >
          <Box
            component="img"
            src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
            alt={video.description || 'Product video'}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <PlayCircleFilledIcon
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 44,
              color: '#fff',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))',
            }}
          />
        </Box>
      )}
      <MediaBadge type="video" />
    </Box>
  );
}

// The "product info draft" preview card shown above the Products table when a
// row is selected — brand identity top-left, media strip on the right (images
// first, then any YouTube videos, all quarter-width so four are always fully
// visible; horizontal-scrolls past four), the 5 structured detail facts, and
// the 5 row-level actions (Preview DPP / Transfer History / Print Code /
// Edit / Remove) bottom-right.
export default function ProductDraftCard({ product, onPreview, onTransferHistory, onPrintCode, onEdit, onRemove }) {
  if (!product) return null;
  const brand = product.brandInfo || {};
  const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const videos = normalizeProductVideos(product.videos);
  const facts = product.detailFacts || {};
  const filledFacts = DETAIL_FACT_ROWS.filter((row) => row.key === 'traceableIdentity' || facts[row.key]);
  const mediaCount = images.length + videos.length;
  const hasMedia = mediaCount > 0;

  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: 2, border: '2px solid', borderColor: 'primary.main', boxShadow: 1, p: 2.5, mb: 2 }}>
      {/* 1/3 detail : 2/3 media, both stretched to the same height so the
          media fills the card's full height (not just its own content). */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="stretch">
        <Box sx={{ flex: { md: '1 1 33.333%' }, minWidth: 0 }}>
          {/* Brand identity, top-left */}
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
            {brand.logoUrl ? (
              <Box
                component="img"
                src={getFileUrl(brand.logoUrl)}
                alt={brand.name || 'Brand logo'}
                sx={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
              />
            ) : null}
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {brand.name || 'Unbranded'}
              </Typography>
              {brand.detail && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ display: 'block', letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.65rem' }}
                >
                  {brand.detail}
                </Typography>
              )}
            </Box>
          </Stack>

          <Typography variant="h6" sx={{ fontWeight: 400 }}>{product.name || 'Untitled product'}</Typography>
          {product.model && (
            <Typography variant="body2" color="primary" sx={{ mb: 1.5 }}>{product.model}</Typography>
          )}

          <Stack spacing={0.75} sx={{ mt: 1.5 }}>
            {filledFacts.map(({ key, icon: Icon, label }) => (
              <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Icon sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="body2">{label(facts[key])}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Media — 2/3 of the card. Images first, then videos. Each cell is a
            quarter of the strip so four show fully at any laptop width; a
            fifth+ scrolls. Right-aligned so 1–3 items hug the card edge. */}
        {hasMedia && (
          <Box
            sx={{
              flex: { md: '1 1 66.666%' },
              display: 'flex',
              justifyContent: mediaCount > 4 ? 'flex-start' : 'flex-end',
              gap: `${MEDIA_GAP_PX}px`,
              overflowX: 'auto',
              minHeight: 260,
            }}
          >
            {images.map((img, i) => (
              <Box key={`img-${i}`} sx={cellSx}>
                <Box
                  component="img"
                  src={getFileUrl(img)}
                  alt=""
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <MediaBadge type="image" />
              </Box>
            ))}
            {videos.map((video, i) => (
              <VideoCell key={`vid-${i}`} video={video} />
            ))}
          </Box>
        )}
      </Stack>

      <Stack direction="row" spacing={1.25} justifyContent="flex-end" flexWrap="wrap" useFlexGap sx={{ mt: 2.5 }}>
        <Button variant="outlined" color="primary" startIcon={<VisibilityIcon />} onClick={onPreview}>Preview DPP</Button>
        <Button variant="outlined" color="primary" startIcon={<HistoryIcon />} onClick={onTransferHistory}>Transfer History</Button>
        <Button variant="outlined" color="primary" startIcon={<PrintIcon />} onClick={onPrintCode}>Print Code</Button>
        <Button variant="outlined" color="primary" startIcon={<EditIcon />} onClick={onEdit}>Edit Product</Button>
        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={onRemove}>Remove Product</Button>
      </Stack>
    </Box>
  );
}
