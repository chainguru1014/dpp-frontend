import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, ButtonBase, Chip, IconButton, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SpaIcon from '@mui/icons-material/SpaOutlined';
import StraightenIcon from '@mui/icons-material/StraightenOutlined';
import WaterDropIcon from '@mui/icons-material/WaterDropOutlined';
import ShieldIcon from '@mui/icons-material/ShieldOutlined';
import QrCodeIcon from '@mui/icons-material/QrCode2';
import EditIcon from '@mui/icons-material/Edit';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { getFileUrl, getProductTransfers, getYoutubeVideoId, isVideoFileUrl } from '../../helper';
import MediaLightbox from '../../components/MediaLightbox';
import { METHOD_LABELS, StatusChip } from '../trace/TracePage';

// Products page, a product chosen (client design 2026-11-24):
//  - a card: the brand, the product's name and line, its key facts with
//    icons, and four photos in a row that move with < > — under them Edit
//    product, Preview product, Generate code and Remove;
//  - its ownership history: date range, status, method and search filters
//    over a table of transfers (time, product, from, to, method).
const FACTS = [
  ['material', SpaIcon, 'Material'],
  ['fit', StraightenIcon, 'Fit'],
  ['wash', WaterDropIcon, 'Wash'],
  ['durability', ShieldIcon, 'Durability'],
];
const ymd = (d) => {
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? '' : `${x.getFullYear()}/${String(x.getMonth() + 1).padStart(2, '0')}/${String(x.getDate()).padStart(2, '0')}`;
};
const hm = (d) => {
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? '' : `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`;
};

// The ownership-transfer list under the product is hidden (client request
// 2026-11-25); set to true to show it again.
const SHOW_TRANSFERS = false;

// actionsLeft: the buttons in the left column under the facts, two a row
// (shoppers, client 2026-11-28) instead of under the photos.
export default function ProductShowcase({ product, onEdit, onPreview, onCodes, onRemove, onChange, onSustainability, actionsLeft = false }) {
  // Photos, then videos (as in the app); each tile says which it is with an
  // icon at its bottom right (client 2026-11-26).
  const images = useMemo(() => {
    // slide: what the full-screen viewer (MediaLightbox) shows for it.
    const photos = (Array.isArray(product?.images) ? product.images : []).filter((x) => typeof x === 'string' && x.trim())
      .map((x) => ({ kind: 'image', src: getFileUrl(x), slide: { type: 'image', src: x } }));
    const videos = (Array.isArray(product?.videos) ? product.videos : []).map((v) => {
      const url = typeof v === 'string' ? v : v?.url || '';
      const description = (typeof v === 'object' && v?.description) || '';
      const poster = typeof v === 'object' && v?.poster ? getFileUrl(v.poster) : '';
      const yt = getYoutubeVideoId(url);
      if (yt) return { kind: 'video', src: poster || `https://img.youtube.com/vi/${yt}/hqdefault.jpg`, slide: { type: 'video', video: { url, description, videoId: yt, fileUrl: '' } } };
      if (isVideoFileUrl(url)) return { kind: 'video', src: poster, file: getFileUrl(url), slide: { type: 'video', video: { url, description, videoId: '', fileUrl: url } } };
      return null;
    }).filter(Boolean);
    return [...photos, ...videos];
  }, [product]);
  const [start, setStart] = useState(0);
  useEffect(() => { setStart(0); }, [product?._id]);
  // A photo or video clicked: shown on the whole screen (close with X).
  const [viewAt, setViewAt] = useState(-1);
  const slides = useMemo(() => images.map((m) => m.slide), [images]);
  const shown = [0, 1, 2, 3].map((k) => (images.length ? images[(start + k) % images.length] : null)).slice(0, Math.min(4, Math.max(1, images.length)));
  const step = (d) => setStart((s) => (images.length ? (s + d + images.length) % images.length : 0));

  const brand = product?.brandInfo || {};
  const facts = product?.detailFacts || {};
  const buttons = [
    onEdit && { label: 'Edit Product', icon: <EditIcon fontSize="small" />, onClick: onEdit, primary: true },
    onPreview && { label: 'Preview Product', icon: <PhoneIphoneIcon fontSize="small" />, onClick: onPreview },
    onCodes && { label: 'Generate Code', icon: <QrCodeIcon fontSize="small" />, onClick: onCodes },
    onSustainability && { label: 'Sustainability', icon: <SpaIcon fontSize="small" />, onClick: onSustainability },
    onRemove && { label: 'Remove', icon: <DeleteOutlineIcon fontSize="small" />, onClick: onRemove, danger: true },
  ].filter(Boolean);

  // Ownership history
  const [rows, setRows] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [q, setQ] = useState('');
  const load = async () => {
    if (!SHOW_TRANSFERS || !product?._id) return;
    setRows(null);
    const res = await getProductTransfers(product._id);
    setRows(res?.data || []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [product?._id]);
  const filtered = (rows || []).filter((r) => {
    const t = new Date(r.createdAt).getTime();
    if (from && t < new Date(`${from}T00:00:00`).getTime()) return false;
    if (to && t > new Date(`${to}T23:59:59`).getTime()) return false;
    if (status && r.status !== status) return false;
    if (method && r.method !== method) return false;
    const text = `${r.from_owner?.name || ''} ${r.to_owner?.name || ''} ${product?.name || ''}`.toLowerCase();
    return !q.trim() || text.includes(q.trim().toLowerCase());
  });
  const methods = [...new Set((rows || []).map((r) => r.method).filter(Boolean))];

  return (
    <Box>
      <Paper sx={{ p: 2.5, mb: 2, border: '2px solid', borderColor: 'primary.main', borderRadius: '20px' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(260px, 340px) 1fr' }, gap: 2.5, alignItems: 'start' }}>
          <Box>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
              {brand.logoUrl && <Box component="img" src={getFileUrl(brand.logoUrl)} alt="" sx={{ width: 40, height: 40, objectFit: 'contain' }} />}
              <Box>
                <Typography sx={{ fontWeight: 600, letterSpacing: 2, fontSize: 15, color: 'primary.main' }}>{String(brand.name || '').toUpperCase()}</Typography>
                {!!brand.tagline && <Typography sx={{ fontSize: 10.5, letterSpacing: 1.5, color: 'primary.main' }}>{String(brand.tagline).toUpperCase()}</Typography>}
              </Box>
            </Stack>
            <Typography sx={{ fontSize: 26, fontWeight: 400, lineHeight: 1.15, color: '#0f2a4a' }}>{String(product?.name || '').toUpperCase()}</Typography>
            <Typography sx={{ fontSize: 17, color: 'primary.main', mt: 0.5, pb: 1.5, mb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>{product?.model || product?.productType || ''}</Typography>
            <Stack spacing={1.1}>
              {FACTS.filter(([k]) => facts[k]).map(([k, Icon, label]) => (
                <Stack key={k} direction="row" spacing={1.25} alignItems="center">
                  <Icon sx={{ color: 'primary.main', fontSize: 21 }} />
                  <Typography sx={{ fontSize: 14.5 }}>{label}: {facts[k]}</Typography>
                </Stack>
              ))}
              <Stack direction="row" spacing={1.25} alignItems="center">
                <QrCodeIcon sx={{ color: 'primary.main', fontSize: 21 }} />
                <Typography sx={{ fontSize: 14.5 }}>Traceable product identity</Typography>
              </Stack>
            </Stack>
            {actionsLeft && buttons.length > 0 && (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.25, mt: 2.5 }}>
                {buttons.map((b) => (
                  <ButtonBase key={b.label} onClick={b.onClick}
                    sx={{ height: 40, borderRadius: '20px', gap: 0.75, fontSize: 14, border: '1px solid', borderColor: 'primary.main', color: 'primary.main', '&:hover': { bgcolor: '#eef5fd' } }}>
                    {b.icon}{b.label}
                  </ButtonBase>
                ))}
              </Box>
            )}
            {onChange && <Button variant="contained" fullWidth startIcon={<SwapHorizIcon />} onClick={onChange} sx={{ mt: 2.5, height: 44, maxWidth: 300 }}>Change product</Button>}
          </Box>

          {/* Four photos; < > move along one at a time (round the end). Each
              button sits under its photo. */}
          <Box sx={{ position: 'relative' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
              {shown.map((img, k) => (
                <Box key={`${start}-${k}`}>
                  <Box
                    component={img ? 'button' : 'div'}
                    type={img ? 'button' : undefined}
                    onClick={img ? () => setViewAt((start + k) % images.length) : undefined}
                    aria-label={img ? `Show ${img.kind === 'video' ? 'video' : 'photo'} ${((start + k) % images.length) + 1} full screen` : undefined}
                    sx={{ position: 'relative', width: '100%', p: 0, font: 'inherit', cursor: img ? 'zoom-in' : 'default', aspectRatio: '3 / 4.4', borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: '#eef1f4', display: 'block' }}>
                    {img && img.src && <Box component="img" src={img.src} alt={`${product?.name || ''} ${k + 1}`} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                    {img && !img.src && img.file && <Box component="video" src={img.file} muted preload="metadata" playsInline sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', bgcolor: '#000' }} />}
                    {img && (
                      <Box aria-label={img.kind === 'video' ? 'Video' : 'Photo'} title={img.kind === 'video' ? 'Video' : 'Photo'}
                        sx={{ position: 'absolute', right: 8, bottom: 8, width: 30, height: 30, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                        {img.kind === 'video' ? <PlayArrowIcon sx={{ fontSize: 20, color: '#1c1c1e' }} /> : <ImageOutlinedIcon sx={{ fontSize: 18, color: '#1c1c1e' }} />}
                      </Box>
                    )}
                  </Box>
                  {!actionsLeft && buttons[k] && (buttons[k].primary ? (
                    // The New product button's gradient.
                    <Button variant="contained" fullWidth startIcon={buttons[k].icon} onClick={buttons[k].onClick} sx={{ mt: 1, height: 38 }}>{buttons[k].label}</Button>
                  ) : (
                    <ButtonBase
                      onClick={buttons[k].onClick}
                      sx={{
                        mt: 1, width: '100%', height: 38, borderRadius: '19px', gap: 0.75, fontSize: 14,
                        border: '1px solid', borderColor: buttons[k].danger ? 'error.light' : 'primary.main', color: buttons[k].danger ? 'error.main' : 'primary.main', '&:hover': { bgcolor: buttons[k].danger ? '#fdf1f1' : '#eef5fd' },
                      }}
                    >
                      {buttons[k].icon}{buttons[k].label}
                    </ButtonBase>
                  ))}
                </Box>
              ))}
            </Box>
            {images.length > 4 && (
              <>
                <IconButton aria-label="Previous photo" onClick={() => step(-1)} sx={{ position: 'absolute', left: -14, top: '38%', bgcolor: '#fff', boxShadow: 2, '&:hover': { bgcolor: '#fff' } }}><ChevronLeftIcon /></IconButton>
                <IconButton aria-label="Next photo" onClick={() => step(1)} sx={{ position: 'absolute', right: -14, top: '38%', bgcolor: '#fff', boxShadow: 2, '&:hover': { bgcolor: '#fff' } }}><ChevronRightIcon /></IconButton>
              </>
            )}
          </Box>
        </Box>
      </Paper>

      <MediaLightbox open={viewAt >= 0} slides={slides} index={Math.max(0, viewAt)} onClose={() => setViewAt(-1)} />

      {SHOW_TRANSFERS && (<>
      {/* The filters on one line. */}
      <Paper sx={{ p: 1.5, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: { xs: 'wrap', lg: 'nowrap' } }}>
        <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }} value={from} onChange={(e) => setFrom(e.target.value)} sx={{ width: 160, flexShrink: 0 }} />
        <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }} value={to} onChange={(e) => setTo(e.target.value)} sx={{ width: 160, flexShrink: 0 }} />
        <TextField size="small" select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ width: 150, flexShrink: 0 }}>
          <MenuItem value="">All</MenuItem>
          {['pending', 'confirmed', 'rejected', 'cancelled'].map((x) => <MenuItem key={x} value={x}><StatusChip status={x} /></MenuItem>)}
        </TextField>
        <TextField size="small" select label="Method" value={method} onChange={(e) => setMethod(e.target.value)} sx={{ width: 150, flexShrink: 0 }}>
          <MenuItem value="">All</MenuItem>
          {methods.map((m) => <MenuItem key={m} value={m}>{METHOD_LABELS[m] || m}</MenuItem>)}
        </TextField>
        <TextField size="small" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} sx={{ flex: 1, minWidth: 180 }} />
        <IconButton aria-label="Reload" onClick={load} color="primary"><RefreshIcon /></IconButton>
      </Paper>

      <Paper sx={{ px: 2, py: 1 }}>
        <Table size="small" sx={{ '& th': { color: 'primary.main', fontWeight: 600 } }}>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>From (owner)</TableCell>
              <TableCell>To (buyer)</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows == null ? (
              <TableRow><TableCell colSpan={6}><Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>Loading…</Typography></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6}><Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>{rows.length ? 'No transfers match the filters.' : 'No ownership changes for this product yet.'}</Typography></TableCell></TableRow>
            ) : filtered.map((r) => (
              <TableRow key={r._id} hover>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{ymd(r.createdAt)}&nbsp;&nbsp;&nbsp;{hm(r.createdAt)}</TableCell>
                <TableCell>{String(product?.name || '').toUpperCase()}</TableCell>
                <TableCell>{r.from_owner?.name || '—'}</TableCell>
                <TableCell>{r.to_owner?.name || '—'}</TableCell>
                <TableCell>{METHOD_LABELS[r.method] || r.method || '—'}</TableCell>
                <TableCell><StatusChip status={r.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      </>)}
    </Box>
  );
}
