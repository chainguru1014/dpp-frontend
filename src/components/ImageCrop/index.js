import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Slider, Stack, Typography } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CloseIcon from '@mui/icons-material/Close';

// Move, zoom and crop a picture to the shape its place needs, before it is
// uploaded (client 2026-11-26: every image upload). Call from anywhere:
//
//   const file = await cropImage(pickedFile, { aspect: 4 / 5, title: 'Fit the product photo' });
//   if (!file) return; // cancelled
//
// The picture fills the frame; drag it to move, use the wheel or the slider
// to zoom. "Use whole picture" uploads it as it is. A non-image (PDF), an SVG
// or a GIF is returned unchanged. <ImageCropHost /> (mounted once at the
// root of the admin site) draws the dialog.
//
// Shapes used by the admin site (keep in step with the app's pictures):
export const CROP = {
  productPhoto: { aspect: 4 / 5, title: 'Fit the product photo', note: 'Product photos are shown 4:5 (portrait) in the app.' },
  logo: { aspect: 1, title: 'Fit the logo', note: 'Logos are shown square.' },
  // Same shape as CoverCropDialog (Brand and Profile pages): COVER_ASPECT 5.
  cover: { aspect: 5, title: 'Fit the cover picture', note: 'Covers are shown as a wide strip (5:1).' },
  icon: { aspect: 1, title: 'Fit the icon', note: 'Icons are shown square, small.' },
  avatar: { aspect: 1, round: true, title: 'Fit your profile picture', note: 'Shown in a circle.' },
  announcement: { aspect: 16 / 9, title: 'Fit the picture', note: 'Announcement pictures are shown 16:9.' },
};

let open = null;
export function cropImage(file, opts = {}) {
  if (!file || !/^image\/(png|jpe?g|webp|heic|heif|bmp)$/i.test(file.type || '') || opts.skip) return Promise.resolve(file || null);
  if (!open) return Promise.resolve(file);
  return new Promise((resolve) => open({ file, opts, resolve }));
}

/** Crop several files one after another (a cancelled one is left out). */
export async function cropFiles(files, opts = {}) {
  const list = Array.from(files || []);
  const out = [];
  for (let i = 0; i < list.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const f = await cropImage(list[i], { ...opts, step: list.length > 1 ? `${i + 1} of ${list.length}` : '' });
    if (f) out.push(f);
  }
  return out;
}

const loadImage = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => resolve({ img, url });
  img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
  img.src = url;
});

const STAGE_MAX_W = 520;
const STAGE_MAX_H = 420;
const OUT_MAX = 2000; // the longest side of the uploaded picture

export function ImageCropHost() {
  const [job, setJob] = useState(null);
  const [img, setImg] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const stageRef = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    open = (j) => setJob(j);
    return () => { open = null; };
  }, []);

  const aspect = job?.opts?.aspect || (img ? img.img.naturalWidth / img.img.naturalHeight : 1);
  const W = Math.round(Math.min(STAGE_MAX_W, STAGE_MAX_H * aspect));
  const H = Math.round(W / aspect);
  const base = img ? Math.max(W / img.img.naturalWidth, H / img.img.naturalHeight) : 1;
  const scale = base * zoom;
  const dw = img ? img.img.naturalWidth * scale : 0;
  const dh = img ? img.img.naturalHeight * scale : 0;
  const clamp = useCallback((p, w = dw, h = dh) => ({
    x: Math.min(0, Math.max(W - w, p.x)),
    y: Math.min(0, Math.max(H - h, p.y)),
  }), [W, H, dw, dh]);

  // A new picture: load it, fill the frame, centred.
  useEffect(() => {
    if (!job) return undefined;
    let alive = true;
    let url = '';
    setImg(null);
    setZoom(1);
    loadImage(job.file).then((loaded) => {
      url = loaded.url;
      if (!alive) { URL.revokeObjectURL(url); return; }
      const a = job.opts?.aspect || loaded.img.naturalWidth / loaded.img.naturalHeight;
      const w = Math.round(Math.min(STAGE_MAX_W, STAGE_MAX_H * a));
      const h = Math.round(w / a);
      const s = Math.max(w / loaded.img.naturalWidth, h / loaded.img.naturalHeight);
      setPos({ x: (w - loaded.img.naturalWidth * s) / 2, y: (h - loaded.img.naturalHeight * s) / 2 });
      setImg(loaded);
    }).catch(() => { if (alive) { job.resolve(job.file); setJob(null); } });
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
  }, [job]);

  // Zoom about the frame's centre.
  const setZoomAt = useCallback((next) => {
    const z = Math.max(1, Math.min(5, next));
    if (!img) { setZoom(z); return; }
    const ns = base * z;
    const ratio = ns / scale;
    const cx = W / 2;
    const cy = H / 2;
    const nw = img.img.naturalWidth * ns;
    const nh = img.img.naturalHeight * ns;
    setPos((p) => clamp({ x: cx - (cx - p.x) * ratio, y: cy - (cy - p.y) * ratio }, nw, nh));
    setZoom(z);
  }, [img, base, scale, W, H, clamp]);

  // The wheel zooms (a non-passive listener, so the page does not scroll).
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const onWheel = (e) => { e.preventDefault(); setZoomAt(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08)); };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [setZoomAt, zoom, img]);

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
  const onKeyDown = (e) => {
    const step = e.shiftKey ? 40 : 10;
    const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) { e.preventDefault(); setPos((p) => clamp({ x: p.x + moves[e.key][0], y: p.y + moves[e.key][1] })); }
    if (e.key === '+' || e.key === '=') setZoomAt(zoom * 1.1);
    if (e.key === '-') setZoomAt(zoom / 1.1);
  };

  const finish = (file) => {
    job?.resolve(file);
    setJob(null);
    setImg(null);
  };

  const apply = async () => {
    if (!img) return;
    setBusy(true);
    try {
      const sx = -pos.x / scale;
      const sy = -pos.y / scale;
      const sw = W / scale;
      const sh = H / scale;
      const outW = Math.round(Math.min(sw, aspect >= 1 ? OUT_MAX : OUT_MAX * aspect));
      const outH = Math.round(outW / aspect);
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      const keepAlpha = /png|webp/i.test(job.file.type);
      if (!keepAlpha) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, outW, outH); }
      ctx.drawImage(img.img, sx, sy, sw, sh, 0, 0, outW, outH);
      const type = keepAlpha ? 'image/png' : 'image/jpeg';
      const blob = await new Promise((r) => canvas.toBlob(r, type, 0.9));
      if (!blob) { finish(job.file); return; }
      const name = String(job.file.name || 'picture').replace(/\.[a-z0-9]+$/i, '') + (keepAlpha ? '.png' : '.jpg');
      finish(new File([blob], name, { type }));
    } finally {
      setBusy(false);
    }
  };

  const o = job?.opts || {};
  const ratioText = o.aspect ? (Math.abs(o.aspect - 1) < 0.01 ? '1:1' : Math.abs(o.aspect - 4 / 5) < 0.01 ? '4:5' : Math.abs(o.aspect - 16 / 9) < 0.01 ? '16:9' : `${Math.round(o.aspect * 10) / 10}:1`) : '';
  return (
    <Dialog open={!!job} onClose={busy ? undefined : () => finish(null)} maxWidth="md">
      <DialogTitle sx={{ pr: 7 }}>
        {o.title || 'Fit the picture'}{o.step ? <Typography component="span" color="text.secondary">{` · ${o.step}`}</Typography> : null}
        <IconButton onClick={() => finish(null)} aria-label="Cancel" disabled={busy} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Drag to move, scroll or use the slider to zoom.{o.note ? ` ${o.note}` : ''}{ratioText ? ` Frame ${ratioText}.` : ''}
        </Typography>
        <Box
          ref={stageRef}
          tabIndex={0}
          role="application"
          aria-label="Picture to crop. Drag or use the arrow keys to move it, + and - to zoom."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          sx={{ position: 'relative', width: W, height: H, mx: 'auto', overflow: 'hidden', borderRadius: 2, bgcolor: '#e9edf2', cursor: drag.current ? 'grabbing' : 'grab', touchAction: 'none', userSelect: 'none', outline: 'none', '&:focus-visible': { boxShadow: '0 0 0 3px #2f80c8' } }}
        >
          {img && (
            <Box component="img" src={img.url} alt="" draggable={false}
              sx={{ position: 'absolute', left: pos.x, top: pos.y, width: dw, height: dh, maxWidth: 'none', pointerEvents: 'none' }} />
          )}
          {/* The frame: a round mask for profile pictures, thirds lines to help place it. */}
          {o.round && <Box aria-hidden sx={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: '0 0 0 2000px rgba(10,20,30,0.45)', pointerEvents: 'none' }} />}
          <Box aria-hidden sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', border: '2px solid rgba(255,255,255,0.9)', borderRadius: o.round ? '50%' : 2,
            backgroundImage: 'linear-gradient(to right, transparent 33.2%, rgba(255,255,255,0.35) 33.3%, transparent 33.5%, transparent 66.5%, rgba(255,255,255,0.35) 66.6%, transparent 66.8%), linear-gradient(to bottom, transparent 33.2%, rgba(255,255,255,0.35) 33.3%, transparent 33.5%, transparent 66.5%, rgba(255,255,255,0.35) 66.6%, transparent 66.8%)' }} />
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2, maxWidth: W, mx: 'auto' }}>
          <IconButton size="small" onClick={() => setZoomAt(zoom / 1.15)} aria-label="Zoom out"><ZoomOutIcon /></IconButton>
          <Slider value={zoom} min={1} max={5} step={0.01} onChange={(e, v) => setZoomAt(v)} aria-label="Zoom" />
          <IconButton size="small" onClick={() => setZoomAt(zoom * 1.15)} aria-label="Zoom in"><ZoomInIcon /></IconButton>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => finish(null)} disabled={busy} sx={{ mr: 'auto' }}>Cancel</Button>
        <Button variant="outlined" onClick={() => finish(job.file)} disabled={busy}>Use whole picture</Button>
        <Button variant="contained" onClick={apply} disabled={busy || !img}>Apply</Button>
      </DialogActions>
    </Dialog>
  );
}
