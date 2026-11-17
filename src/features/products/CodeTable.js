import React, { useEffect, useState } from 'react';
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import qrcode from 'qrcode';
import { notifySuccess } from '../../utils/feedbackBus';

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
//   rows: [{ key, thumb, code, sub, number, printed, onDelete, downloadUrl, downloadName }]
export default function CodeTable({ rows = [], codeLabel = 'Code', numberLabel = 'Number', copyNoun = 'code' }) {
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
      <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: cols, gap: 2, px: 2, py: 1.25, bgcolor: '#f2f5f9', fontWeight: 600, color: '#16324a', fontSize: 15 }}>
        <span>{codeLabel}</span><span>{numberLabel}</span><span>Printed</span><span />
      </Box>
      {rows.map((row) => (
        <Box key={row.key} sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr) auto', md: cols }, gap: 2, alignItems: 'center', px: 2, py: 1, borderTop: '1px solid #e8edf3' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            {row.thumb}
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ fontFamily: 'Consolas, monospace', fontSize: 14 }} title={row.code}>{row.code}</Typography>
              {!!row.sub && <Typography variant="body2" color="text.secondary" noWrap title={row.sub}>{row.sub}</Typography>}
            </Box>
          </Box>
          <Typography sx={{ display: { xs: 'none', md: 'block' } }} color="text.secondary" noWrap>{row.number}</Typography>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            {row.printed == null ? null : row.printed
              ? <Chip size="small" label="Printed" sx={{ bgcolor: '#e6f4ea', color: '#1e6b34', fontWeight: 600 }} />
              : <Chip size="small" label="Not printed" sx={{ bgcolor: '#eef3f9', color: '#1b4f72', fontWeight: 600 }} />}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
            <Tooltip title={`Copy the ${copyNoun}`}>
              <IconButton aria-label={`Copy ${row.code}`} onClick={() => copy(row.code)}><ContentCopyIcon /></IconButton>
            </Tooltip>
            {row.downloadUrl && (
              <Tooltip title="Download the picture">
                <IconButton component="a" href={row.downloadUrl} download={row.downloadName || 'code.png'} aria-label={`Download the picture of ${row.code}`}><DownloadIcon /></IconButton>
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
    </Box>
  );
}
