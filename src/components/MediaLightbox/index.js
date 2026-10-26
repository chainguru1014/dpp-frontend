import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getFileUrl } from '../../helper';

const navButtonSx = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 2,
  color: '#fff',
  bgcolor: 'rgba(0,0,0,0.5)',
  '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
};

// Full-screen view of a product's photos and videos, opened by clicking the
// media in a preview. `slides` are { type: 'image', src } or
// { type: 'video', video } where video comes from normalizeProductVideos
// (a YouTube videoId, or the fileUrl of an uploaded video).
export default function MediaLightbox({ open, slides, index = 0, onClose }) {
  const [current, setCurrent] = useState(index);
  useEffect(() => {
    if (open) setCurrent(index);
  }, [open, index]);

  const count = slides?.length || 0;
  const go = (dir) => setCurrent((i) => (i + dir + count) % count);

  useEffect(() => {
    if (!open || count < 2) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, count]);

  const slide = count ? slides[Math.min(current, count - 1)] : null;

  return (
    <Dialog
      open={open && !!slide}
      onClose={onClose}
      fullScreen
      PaperProps={{ sx: { bgcolor: '#000', position: 'relative', overflow: 'hidden' } }}
    >
      <IconButton
        onClick={onClose}
        aria-label="Close full screen"
        sx={{ position: 'absolute', top: 12, right: 12, zIndex: 3, color: '#fff', bgcolor: 'rgba(0,0,0,0.55)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
      >
        <CloseIcon />
      </IconButton>
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 0, sm: 7 } }}>
        {slide?.type === 'image' && (
          <Box component="img" src={getFileUrl(slide.src)} alt="" sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        )}
        {slide?.type === 'video' && slide.video.videoId && (
          <Box
            key={slide.video.videoId}
            component="iframe"
            title={slide.video.description || 'Product video'}
            src={`https://www.youtube.com/embed/${slide.video.videoId}?autoplay=1&rel=0&modestbranding=1`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            sx={{ border: 0, width: '100%', height: '100%' }}
          />
        )}
        {slide?.type === 'video' && !slide.video.videoId && slide.video.fileUrl && (
          <Box
            key={slide.video.fileUrl}
            component="video"
            src={getFileUrl(slide.video.fileUrl)}
            controls
            autoPlay
            playsInline
            sx={{ maxWidth: '100%', maxHeight: '100%', bgcolor: '#000' }}
          />
        )}
      </Box>
      {count > 1 && (
        <>
          <IconButton aria-label="Previous" onClick={() => go(-1)} sx={{ ...navButtonSx, left: 12 }}>
            <ChevronLeftIcon fontSize="large" />
          </IconButton>
          <IconButton aria-label="Next" onClick={() => go(1)} sx={{ ...navButtonSx, right: 12 }}>
            <ChevronRightIcon fontSize="large" />
          </IconButton>
          <Typography sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', color: '#fff', bgcolor: 'rgba(0,0,0,0.5)', px: 1.5, py: 0.25, borderRadius: 2, fontWeight: 600 }}>
            {current + 1} / {count}
          </Typography>
        </>
      )}
    </Dialog>
  );
}
