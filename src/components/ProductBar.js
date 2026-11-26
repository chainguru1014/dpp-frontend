import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { getFileUrl } from '../helper';
import { PassportScore } from '../features/products/PassportReadinessPanel';

// The product a page is working on, in one bar at the top, the same on every
// page (pair of ProductChooser): photo, name, model and company, its
// passport, the page's own buttons (`right`) and "Change product".
// `children`: extra lines under the name (e.g. Product Journey's item chips).
export default function ProductBar({ product, onChange, right, children }) {
  if (!product) return null;
  const thumb = (Array.isArray(product.images) && product.images[0]) || product.image || null;
  const line = [product.model, product.brandInfo?.name || product.brandName].filter(Boolean).join(' · ');
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', p: 1.75, mb: 2.5, bgcolor: '#fff', border: '1px solid #dfe5ec', borderRadius: 4, boxShadow: '0 8px 24px rgba(31,51,97,0.08)' }}>
      <Box sx={{ width: 56, height: 56, flex: 'none', borderRadius: 2, bgcolor: '#f2f5f9', border: '1px solid #e3e8ef', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: children ? 'flex-start' : 'center' }}>
        {thumb && <Box component="img" src={getFileUrl(thumb)} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </Box>
      <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
        <Typography noWrap sx={{ fontWeight: 400, fontSize: 18, color: '#16324a' }}>{product.name || 'Untitled product'}</Typography>
        {line && <Typography noWrap color="text.secondary">{line}</Typography>}
        {children}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">Passport</Typography>
        <PassportScore product={product} width={110} />
      </Box>
      {right}
      {onChange && <Button variant="outlined" startIcon={<SwapHorizIcon />} onClick={onChange}>Change product</Button>}
    </Box>
  );
}
