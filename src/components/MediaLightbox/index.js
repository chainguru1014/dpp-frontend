import React, { useEffect, useRef, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { getFileUrl } from '../../helper';
import { attachYoutubeSound, youtubeEmbedUrl } from '../../utils/youtubeSound';

// A YouTube video that plays with sound (see utils/youtubeSound); once the
// viewer uses the sound button, `muted` is sent to the player instead.
function YoutubeEmbed({ videoId, title, muted, touched }) {
  const ref = useRef(null);
  const stopAuto = useRef(() => {});
  useEffect(() => {
    stopAuto.current = attachYoutubeSound(ref.current);
    return () => stopAuto.current();
  }, [videoId]);
  useEffect(() => {
    if (!touched) return;
    stopAuto.current();
    try {
      ref.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: muted ? 'mute' : 'unMute', args: [] }), '*');
    } catch (e) { /* not loaded yet */ }
  }, [muted, touched]);
  return (
    <Box
      ref={ref}
      component="iframe"
      title={title}
      src={youtubeEmbedUrl(videoId)}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      sx={{ border: 0, width: '100%', height: '100%' }}
    />
  );
}

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
  // Videos play at once, with sound when the browser allows it (else muted);
  // the button at the bottom right turns the sound on / off.
  const [muted, setMuted] = useState(false);
  const [touched, setTouched] = useState(false);
  const videoRef = useRef(null);
  useEffect(() => { setMuted(false); setTouched(false); }, [current, open]);
  const playFile = () => {
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (p && p.catch) p.catch(() => { v.muted = true; setMuted(true); v.play().catch(() => {}); });
  };
  const toggleSound = () => {
    setTouched(true);
    setMuted((m) => {
      const next = !m;
      if (videoRef.current) { videoRef.current.muted = next; if (!next) videoRef.current.play().catch(() => {}); }
      return next;
    });
  };

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
          <YoutubeEmbed
            key={slide.video.videoId}
            videoId={slide.video.videoId}
            title={slide.video.description || 'Product video'}
            muted={muted}
            touched={touched}
          />
        )}
        {slide?.type === 'video' && !slide.video.videoId && slide.video.fileUrl && (
          <Box
            key={slide.video.fileUrl}
            component="video"
            ref={videoRef}
            src={getFileUrl(slide.video.fileUrl)}
            autoPlay
            loop
            playsInline
            muted={muted}
            onLoadedMetadata={playFile}
            onClick={() => { const v = videoRef.current; if (v) { if (v.paused) v.play().catch(() => {}); else v.pause(); } }}
            sx={{ maxWidth: '100%', maxHeight: '100%', bgcolor: '#000', cursor: 'pointer' }}
          />
        )}
      </Box>
      {slide?.type === 'video' && (
        <IconButton
          onClick={toggleSound}
          aria-label={muted ? 'Sound on' : 'Sound off'}
          sx={{ position: 'absolute', right: 16, bottom: 16, zIndex: 3, width: 48, height: 48, color: '#fff', bgcolor: 'rgba(0,0,0,0.55)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
        >
          {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
        </IconButton>
      )}
      {count > 1 && (
        <>
          <IconButton aria-label="Previous" onClick={() => go(-1)} sx={{ ...navButtonSx, left: 12 }}>
            <ChevronLeftIcon fontSize="large" />
          </IconButton>
          <IconButton aria-label="Next" onClick={() => go(1)} sx={{ ...navButtonSx, right: 12 }}>
            <ChevronRightIcon fontSize="large" />
          </IconButton>
          <Typography sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', color: '#fff', bgcolor: 'rgba(0,0,0,0.5)', px: 1.5, py: 0.25, borderRadius: 2, fontWeight: 400 }}>
            {current + 1} / {count}
          </Typography>
        </>
      )}
    </Dialog>
  );
}
