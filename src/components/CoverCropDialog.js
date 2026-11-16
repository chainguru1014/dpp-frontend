import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Slider, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import OpenWithIcon from '@mui/icons-material/OpenWith';

// The shape every cover photo is cut to (wide banner). Brand and profile
// pages show covers at this shape, so what is chosen here is what shows.
export const COVER_ASPECT = 3;
const OUT_WIDTH = 1800; // pixels of the saved picture
const MAX_ZOOM = 4;

// Cut a cover photo before it is uploaded: the picture fills a frame of the
// cover's shape; drag it to move, use the slider (or the mouse wheel) to zoom.
// "Use this cover" hands back the cut picture as a JPEG File.
export default function CoverCropDialog({ file, onCancel, onDone, aspect = COVER_ASPECT, title = 'Cut your cover photo' }) {
  const frameRef = useRef(null);
  const [src, setSrc] = useState('');
  const [natural, setNatural] = useState(null); // { w, h }
  const [frameW, setFrameW] = useState(720);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // image top-left in the frame
  const drag = useRef(null);
  const [saving, setSaving] = useState(false);

  const frameH = frameW / aspect;

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setSrc(url);
    setNatural(null);
    setZoom(1);
    const img = new Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // The frame's real width (the dialog decides it).
  useEffect(() => {
    if (!file) return undefined;
    const measure = () => { if (frameRef.current) setFrameW(frameRef.current.clientWidth || 720); };
    const id = setTimeout(measure, 0);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(id); window.removeEventListener('resize', measure); };
  }, [file]);

  const baseScale = natural ? Math.max(frameW / natural.w, frameH / natural.h) : 1;
  const scale = baseScale * zoom;
  const imgW = natural ? natural.w * scale : 0;
  const imgH = natural ? natural.h * scale : 0;

  const clamp = (p, w = imgW, h = imgH) => ({
    x: Math.min(0, Math.max(frameW - w, p.x)),
    y: Math.min(0, Math.max(frameH - h, p.y)),
  });

  // Start centred whenever a picture loads or the frame changes size.
  useEffect(() => {
    if (!natural) return;
    const s = Math.max(frameW / natural.w, frameH / natural.h);
    setZoom(1);
    setPos({ x: (frameW - natural.w * s) / 2, y: (frameH - natural.h * s) / 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [natural, frameW]);

  // Zoom around the frame's centre.
  const zoomTo = (next) => {
    const z = Math.min(MAX_ZOOM, Math.max(1, next));
    if (!natural) { setZoom(z); return; }
    const cx = frameW / 2;
    const cy = frameH / 2;
    const ratio = z / zoom;
    const w = natural.w * baseScale * z;
    const h = natural.h * baseScale * z;
    setZoom(z);
    setPos(clamp({ x: cx - (cx - pos.x) * ratio, y: cy - (cy - pos.y) * ratio }, w, h));
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, start: pos };
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const d = drag.current;
    setPos(clamp({ x: d.start.x + (e.clientX - d.x), y: d.start.y + (e.clientY - d.y) }));
  };
  const onPointerUp = () => { drag.current = null; };

  const save = async () => {
    if (!natural || saving) return;
    setSaving(true);
    try {
      const img = new Image();
      img.src = src;
      await img.decode();
      const outW = Math.min(OUT_WIDTH, Math.round(frameW / scale));
      const outH = Math.round(outW / aspect);
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, -pos.x / scale, -pos.y / scale, frameW / scale, frameH / scale, 0, 0, outW, outH);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (blob) onDone(new File([blob], `cover-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!file} onClose={onCancel} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        {title}
        <IconButton onClick={onCancel} aria-label="Close" sx={{ color: 'inherit' }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, color: 'text.secondary' }}>
          <OpenWithIcon fontSize="small" />
          <Typography variant="body2">Drag the photo to move it. Zoom with the slider or the mouse wheel. Only the part inside the frame is kept.</Typography>
        </Stack>
        <Box
          ref={frameRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={(e) => zoomTo(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08))}
          sx={{
            position: 'relative', width: '100%', height: frameH, overflow: 'hidden', borderRadius: 2,
            bgcolor: '#1f2b38', cursor: drag.current ? 'grabbing' : 'grab', touchAction: 'none', userSelect: 'none',
            outline: '3px solid #2f80c8', outlineOffset: -3,
          }}
          aria-label="Cover photo frame"
        >
          {src && natural && (
            <Box
              component="img"
              src={src}
              alt=""
              draggable={false}
              sx={{ position: 'absolute', left: pos.x, top: pos.y, width: imgW, height: imgH, maxWidth: 'none', pointerEvents: 'none' }}
            />
          )}
        </Box>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2, px: 1 }}>
          <IconButton onClick={() => zoomTo(zoom / 1.2)} aria-label="Zoom out" disabled={zoom <= 1}><ZoomOutIcon /></IconButton>
          <Slider value={zoom} min={1} max={MAX_ZOOM} step={0.01} onChange={(e, v) => zoomTo(v)} aria-label="Zoom" sx={{ flex: 1 }} />
          <IconButton onClick={() => zoomTo(zoom * 1.2)} aria-label="Zoom in" disabled={zoom >= MAX_ZOOM}><ZoomInIcon /></IconButton>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={!natural || saving}>{saving ? 'Saving…' : 'Use this cover'}</Button>
      </DialogActions>
    </Dialog>
  );
}
