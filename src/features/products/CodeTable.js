import React, { useEffect, useState } from 'react';
import { Box, Chip, Dialog, DialogContent, IconButton, Tooltip, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import qrcode from 'qrcode';
import { notifySuccess } from '../../utils/feedbackBus';
import { downloadQrImage } from './CodeList';

// A small QR picture for a table row.
export const QrThumb = ({ data }) => {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let alive = true;
    qrcode.toDataURL(String(data || ''), { margin: 1, width: 96 }).then((url) => { if (alive) setSrc(url); }).catch(() => {});
    return () => { alive = false; };
  }, [data]);
  return src
    ? <Box component="img" src={src} alt="" sx={{ width: 44, height: 44, flex: 'none', border: '1px solid #e3e8ef', borderRadius: 1, bgcolor: '#fff' }} />
    : <Box sx={{ width: 44, height: 44, flex: 'none', borderRadius: 1, bgcolor: '#f2f5f9' }} />;
};

// A picture (barcode image) or an icon (RFID / NFC) in the same 44 px box.
export const ImageThumb = ({ src, icon: Icon, wide = false }) => (
  <Box sx={{ width: wide ? 72 : 44, height: 44, flex: 'none', border: '1px solid #e3e8ef', borderRadius: 1, bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
    {src ? <Box component="img" src={src} alt="" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      : Icon ? <Icon sx={{ color: '#1b4f72' }} /> : null}
  </Box>
);

// Codes as a table, one row each, the same for every code type on Generate
// Code (QR, Security QR, GS1 Digital Link, RFID, NFC, Barcode): the code with
// its picture, its number, whether it is printed, and Copy / Download /
// Remove.
//   rows: [{ key, thumb, code, sub, number, printed, onDelete, downloadUrl, downloadName, downloadQr }]
//   downloadQr: the QR's content; Download makes its picture on click.
// The big picture of a code (QR or barcode), with its text and Copy.
function CodePreview({ open, onClose, qr, src, title, onCopy }) {
  const [qrSrc, setQrSrc] = useState('');
  useEffect(() => {
    if (!open || !qr) return;
    qrcode.toDataURL(String(qr), { margin: 2, width: 420 }).then(setQrSrc).catch(() => {});
  }, [open, qr]);
  const img = qr ? qrSrc : src;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
      <IconButton aria-label="Close" onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8 }}><CloseIcon /></IconButton>
      <DialogContent sx={{ pt: 5, textAlign: 'center' }}>
        {img && <Box component="img" src={img} alt="" sx={{ width: '100%', maxWidth: qr ? 320 : 360, height: 'auto', imageRendering: 'pixelated', bgcolor: '#fff' }} />}
        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
          <Typography sx={{ fontFamily: 'Consolas, monospace', fontSize: 13.5, wordBreak: 'break-all' }}>{title}</Typography>
          <IconButton size="small" aria-label="Copy" onClick={onCopy}><ContentCopyIcon fontSize="small" /></IconButton>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// A small copy button after a value.
const CopyBtn = ({ text, label, onCopy }) => (
  <Tooltip title={`Copy ${label}`}>
    <IconButton size="small" aria-label={`Copy ${label}`} onClick={(e) => { e.stopPropagation(); onCopy(text); }} sx={{ ml: 0.25, p: 0.5 }}>
      <ContentCopyIcon sx={{ fontSize: 16 }} />
    </IconButton>
  </Tooltip>
);

export default function CodeTable({ rows = [], codeLabel = 'Code', numberLabel = 'Number', copyNoun = 'code' }) {
  const [preview, setPreview] = useState(null);
  if (!rows.length) return null;
  const copy = (text) => {
    try {
      navigator.clipboard.writeText(text);
      notifySuccess('Copied.');
    } catch (e) { /* clipboard blocked */ }
  };
  const cols = 'minmax(0, 2.2fr) minmax(150px, 1fr) 120px 130px';
  return (
    <Box sx={{ bgcolor: '#fff', border: '1px solid #dfe5ec', borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: cols, gap: 2, px: 2, py: 1.25, bgcolor: '#f2f5f9', fontWeight: 400, color: '#16324a', fontSize: 15 }}>
        <span>{codeLabel}</span><span>{numberLabel}</span><span>Printed</span><span />
      </Box>
      {rows.map((row) => (
        <Box key={row.key} sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr) auto', md: cols }, gap: 2, alignItems: 'center', px: 2, py: 1, borderTop: '1px solid #e8edf3' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            {/* A QR or barcode picture opens big. */}
            {(row.previewQr || row.previewSrc) ? (
              <Box component="button" type="button" onClick={() => setPreview(row)} aria-label={`Show the code for ${row.code}`} sx={{ p: 0, border: 0, bgcolor: 'transparent', cursor: 'zoom-in', borderRadius: 1, '&:hover': { boxShadow: '0 0 0 2px #2f80c8' } }}>
                {row.thumb}
              </Box>
            ) : row.thumb}
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                <Typography noWrap sx={{ fontFamily: 'Consolas, monospace', fontSize: 14, minWidth: 0 }} title={row.code}>{row.code}</Typography>
                <CopyBtn text={row.code} label={`the ${copyNoun}`} onCopy={copy} />
              </Box>
              {!!row.sub && <Typography variant="body2" color="text.secondary" noWrap title={row.sub}>{row.sub}</Typography>}
            </Box>
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', minWidth: 0 }}>
            <Typography color="text.secondary" noWrap>{row.number}</Typography>
            {!!row.pmc && <CopyBtn text={row.pmc} label="the Passport ID" onCopy={copy} />}
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            {row.printed == null ? null : row.printed
              ? <Chip size="small" label="Printed" sx={{ bgcolor: '#eef5fd', color: '#1b4f72', fontWeight: 400 }} />
              : <Chip size="small" label="Not printed" sx={{ bgcolor: '#eef3f9', color: '#1b4f72', fontWeight: 400 }} />}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
            {row.downloadUrl && (
              <Tooltip title="Download the picture">
                <IconButton component="a" href={row.downloadUrl} download={row.downloadName || 'code.png'} aria-label={`Download the picture of ${row.code}`}><DownloadIcon /></IconButton>
              </Tooltip>
            )}
            {!row.downloadUrl && row.downloadQr && (
              <Tooltip title="Download the picture">
                <IconButton onClick={() => downloadQrImage(row.downloadQr, row.downloadName || 'qr-code.png')} aria-label={`Download the picture of ${row.code}`}><DownloadIcon /></IconButton>
              </Tooltip>
            )}
            {row.onDelete && (
              <Tooltip title="Remove this code">
                <IconButton aria-label={`Remove ${row.code}`} color="error" onClick={row.onDelete}><DeleteIcon /></IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      ))}
      <CodePreview
        open={!!preview}
        onClose={() => setPreview(null)}
        qr={preview?.previewQr}
        src={preview?.previewSrc}
        title={preview?.code || ''}
        onCopy={() => preview && copy(preview.code)}
      />
    </Box>
  );
}
