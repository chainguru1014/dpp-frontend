import React, { useEffect, useState } from 'react';
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import qrcode from 'qrcode';
import { notifySuccess } from '../../utils/feedbackBus';

// A small QR picture for a list row.
const QrThumb = ({ data }) => {
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

// QR codes as a list (one row each) instead of a wall of pictures: the code,
// its number, whether it has been printed yet and the tags paired with it.
// Codes are printed in order, so the first `printedAmount` are printed.
export default function CodeList({ codes = [], printedAmount = 0, identifiersByQrcodeId, onDelete }) {
  if (!codes.length) return null;
  const copy = (text) => {
    try {
      navigator.clipboard.writeText(text);
      notifySuccess('Link copied.');
    } catch (e) { /* clipboard blocked */ }
  };
  return (
    <Box sx={{ bgcolor: '#fff', border: '1px solid #dfe5ec', borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: 'minmax(0, 2.4fr) 120px 140px 110px', gap: 2, px: 2, py: 1.25, bgcolor: '#f2f5f9', fontWeight: 600, color: '#16324a', fontSize: 15 }}>
        <span>Code</span><span>Number</span><span>Printed</span><span />
      </Box>
      {codes.map((item) => {
        const printed = Number(item.qrcode_id) <= Number(printedAmount || 0);
        const tags = identifiersByQrcodeId?.get(item.qrcode_id) || [];
        return (
          <Box key={item.qrcode_id} sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr) auto', md: 'minmax(0, 2.4fr) 120px 140px 110px' }, gap: 2, alignItems: 'center', px: 2, py: 1, borderTop: '1px solid #e8edf3' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
              <QrThumb data={item.url} />
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontFamily: 'Consolas, monospace', fontSize: 14 }} title={item.url}>{item.url}</Typography>
                {tags.length > 0 && (
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {tags.map((t) => (t.type === 'PMC Code' ? t.serial : `${t.type}: ${t.serial}`)).filter(Boolean).join(' · ')}
                  </Typography>
                )}
              </Box>
            </Box>
            <Typography sx={{ display: { xs: 'none', md: 'block' } }} color="text.secondary">#{item.qrcode_id}</Typography>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              {printed
                ? <Chip size="small" label="Printed" sx={{ bgcolor: '#e6f4ea', color: '#1e6b34', fontWeight: 600 }} />
                : <Chip size="small" label="Not printed" sx={{ bgcolor: '#eef3f9', color: '#1b4f72', fontWeight: 600 }} />}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
              <Tooltip title="Copy the link">
                <IconButton aria-label={`Copy the link of code ${item.qrcode_id}`} onClick={() => copy(item.url)}><ContentCopyIcon /></IconButton>
              </Tooltip>
              {onDelete && (
                <Tooltip title="Remove this code">
                  <IconButton aria-label={`Remove code ${item.qrcode_id}`} color="error" onClick={() => onDelete(item.qrcode_id)}><DeleteIcon /></IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
