import React, { useEffect, useRef, useState } from 'react';
import { Box, ButtonBase, Dialog, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// The photos side by side; drag (mouse or finger) left or right and let go
// onto the next or previous one, as in the app's photo viewer. Arrow keys
// work too. `fit`: 'cover' fills the frame (the app), 'contain' shows the
// whole photo.
export function PhotoTrack({ images, index, onIndex, fit = 'cover', sx, onTap }) {
  const box = useRef(null);
  const [dx, setDx] = useState(0);
  const drag = useRef(null);
  const count = images.length;
  const go = (i) => onIndex(Math.max(0, Math.min(count - 1, i)));

  const down = (e) => {
    if (count < 2) { drag.current = { x: e.clientX, t: Date.now(), w: 1, moved: false, still: true }; return; }
    drag.current = { x: e.clientX, t: Date.now(), w: box.current?.offsetWidth || 1, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    const d = drag.current;
    if (!d || d.still) return;
    let v = e.clientX - d.x;
    if (Math.abs(v) > 4) d.moved = true;
    // A little give at the first and last photo.
    if ((index === 0 && v > 0) || (index === count - 1 && v < 0)) v /= 3;
    setDx(v);
  };
  const up = (e) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const v = e.clientX - d.x;
    // A tap (no drag): onTap.
    if (!d.moved && Math.abs(v) < 5) { setDx(0); if (onTap) onTap(); return; }
    if (d.still) return;
    const fast = Math.abs(v) / Math.max(1, Date.now() - d.t) > 0.5;
    if ((v < -d.w * 0.18 || (fast && v < -20)) && index < count - 1) go(index + 1);
    else if ((v > d.w * 0.18 || (fast && v > 20)) && index > 0) go(index - 1);
    setDx(0);
  };

  return (
    <Box
      ref={box}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      sx={{ position: 'relative', overflow: 'hidden', touchAction: 'pan-y', cursor: count > 1 ? (drag.current ? 'grabbing' : 'grab') : 'default', userSelect: 'none', ...sx }}
    >
      <Box sx={{
        display: 'flex', height: '100%', width: `${count * 100}%`,
        transform: `translateX(calc(${(-index * 100) / Math.max(1, count)}% + ${dx}px))`,
        transition: dx ? 'none' : 'transform 260ms cubic-bezier(.2,.8,.2,1)',
      }}
      >
        {images.map((src, i) => (
          <Box key={`${src}-${i}`} sx={{ width: `${100 / Math.max(1, count)}%`, height: '100%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {Math.abs(i - index) <= 1 && (
              <Box component="img" src={src} alt="" draggable={false} sx={{ width: '100%', height: '100%', objectFit: fit, display: 'block', pointerEvents: 'none' }} />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function Thumbs({ images, index, onIndex, size = 52, dark = true }) {
  if (images.length < 2) return null;
  return (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
      {images.map((src, i) => (
        <ButtonBase key={`${src}-${i}`} onClick={() => onIndex(i)} aria-label={`Photo ${i + 1}`} aria-pressed={i === index}
          sx={{ width: size, height: size, borderRadius: '14px', overflow: 'hidden', flexShrink: 0, opacity: i === index ? 1 : 0.75,
            border: i === index ? `2.5px solid ${dark ? '#fff' : '#2a78bd'}` : `1px solid ${dark ? 'rgba(255,255,255,0.4)' : '#e3e8ef'}` }}>
          <Box component="img" src={src} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </ButtonBase>
      ))}
    </Box>
  );
}

// Full-screen viewer (the app's PhotoViewer for the web): the photo fills the
// window and is dragged left / right, the count on top, thumbnails at the
// bottom, arrows on the sides.
export default function PhotoViewerDialog({ open, images, index: start = 0, onClose, alt = '' }) {
  const [index, setIndex] = useState(start);
  useEffect(() => { if (open) setIndex(start); }, [open, start]);
  useEffect(() => {
    if (!open) return undefined;
    const key = (e) => {
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(images.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [open, images.length]);
  const round = { bgcolor: 'rgba(255,255,255,0.22)', color: '#fff', backdropFilter: 'blur(12px)', '&:hover': { bgcolor: 'rgba(255,255,255,0.32)' } };
  return (
    <Dialog open={!!open} onClose={onClose} fullScreen PaperProps={{ sx: { bgcolor: '#000', borderRadius: 0 } }} aria-label={alt || 'Photos'}>
      <PhotoTrack images={images} index={index} onIndex={setIndex} fit="contain" sx={{ position: 'absolute', inset: 0 }} />
      <Box sx={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none' }}>
        <IconButton onClick={onClose} aria-label="Close the photos" sx={{ ...round, pointerEvents: 'auto' }}><CloseIcon /></IconButton>
        <Box sx={{ height: 32, px: 1.75, borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.22)', color: '#fff', display: 'flex', alignItems: 'center', fontSize: 15 }}>{`${index + 1} / ${images.length}`}</Box>
        <Box sx={{ width: 40 }} />
      </Box>
      {images.length > 1 && (
        <>
          <IconButton onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} aria-label="Previous photo"
            sx={{ ...round, position: 'absolute', left: 16, top: '50%', mt: '-22px', display: { xs: 'none', sm: 'inline-flex' }, '&.Mui-disabled': { opacity: 0.3, color: '#fff' } }}><ChevronLeftIcon /></IconButton>
          <IconButton onClick={() => setIndex((i) => Math.min(images.length - 1, i + 1))} disabled={index === images.length - 1} aria-label="Next photo"
            sx={{ ...round, position: 'absolute', right: 16, top: '50%', mt: '-22px', display: { xs: 'none', sm: 'inline-flex' }, '&.Mui-disabled': { opacity: 0.3, color: '#fff' } }}><ChevronRightIcon /></IconButton>
          <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 24 }}>
            <Thumbs images={images} index={index} onIndex={setIndex} />
          </Box>
        </>
      )}
    </Dialog>
  );
}
