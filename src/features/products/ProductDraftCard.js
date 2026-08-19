import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HistoryIcon from '@mui/icons-material/History';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SpaIcon from '@mui/icons-material/Spa';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ShieldIcon from '@mui/icons-material/Shield';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import { getFileUrl } from '../../helper';

const DETAIL_FACT_ROWS = [
  { key: 'material', icon: SpaIcon, label: (v) => `Material: ${v}` },
  { key: 'fit', icon: AccessibilityNewIcon, label: (v) => `Fit: ${v}` },
  { key: 'wash', icon: WaterDropIcon, label: (v) => `Wash: ${v}` },
  { key: 'durability', icon: ShieldIcon, label: (v) => `Durability: ${v}` },
  { key: 'traceableIdentity', icon: QrCode2Icon, label: (v) => v || 'Traceable product identity' },
];

// The "product info draft" preview card shown above the Products table when a
// row is selected — brand identity top-left, images strip on the right
// (horizontal-scrolls if it overflows), the 5 structured detail facts, and
// the 5 row-level actions (Preview DPP / Transfer History / Print Code /
// Edit / Remove) bottom-right.
export default function ProductDraftCard({ product, onPreview, onTransferHistory, onPrintCode, onEdit, onRemove }) {
  if (!product) return null;
  const brand = product.brandInfo || {};
  const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const facts = product.detailFacts || {};
  const filledFacts = DETAIL_FACT_ROWS.filter((row) => row.key === 'traceableIdentity' || facts[row.key]);

  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: 2, border: '2px solid', borderColor: 'primary.main', boxShadow: 1, p: 2.5, mb: 2 }}>
      {/* 1/3 detail : 2/3 images, both stretched to the same height so the
          images fill the card's full height (not just their own content). */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="stretch">
        <Box sx={{ flex: { md: '1 1 33.333%' }, minWidth: 0 }}>
          {/* Brand identity, top-left */}
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
            {brand.logoUrl ? (
              <Box
                component="img"
                src={getFileUrl(brand.logoUrl)}
                alt={brand.name || 'Brand logo'}
                sx={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
              />
            ) : null}
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {brand.name || 'Unbranded'}
              </Typography>
              {brand.detail && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ display: 'block', letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.65rem' }}
                >
                  {brand.detail}
                </Typography>
              )}
            </Box>
          </Stack>

          <Typography variant="h6" sx={{ fontWeight: 400 }}>{product.name || 'Untitled product'}</Typography>
          {product.model && (
            <Typography variant="body2" color="primary" sx={{ mb: 1.5 }}>{product.model}</Typography>
          )}

          <Stack spacing={0.75} sx={{ mt: 1.5 }}>
            {filledFacts.map(({ key, icon: Icon, label }) => (
              <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Icon sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="body2">{label(facts[key])}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Images — 2/3 of the card. Fixed size per image (not flexed to
            divide the row), 4 fit without scrolling at typical widths;
            horizontal scroll kicks in once they overflow. */}
        {images.length > 0 && (
          <Box sx={{ flex: { md: '1 1 66.666%' }, display: 'flex', gap: 1, overflowX: 'auto', minHeight: 260 }}>
            {images.map((img, i) => (
              <Box
                key={i}
                component="img"
                src={getFileUrl(img)}
                alt=""
                sx={{
                  width: 170,
                  height: 260,
                  flexShrink: 0,
                  objectFit: 'cover',
                  borderRadius: 1.5, border: '2px solid', borderColor: 'primary.main', bgcolor: '#fafafa',
                }}
              />
            ))}
          </Box>
        )}
      </Stack>

      <Stack direction="row" spacing={1.25} justifyContent="flex-end" flexWrap="wrap" useFlexGap sx={{ mt: 2.5 }}>
        <Button variant="outlined" color="primary" startIcon={<VisibilityIcon />} onClick={onPreview}>Preview DPP</Button>
        <Button variant="outlined" color="primary" startIcon={<HistoryIcon />} onClick={onTransferHistory}>Transfer History</Button>
        <Button variant="outlined" color="primary" startIcon={<PrintIcon />} onClick={onPrintCode}>Print Code</Button>
        <Button variant="outlined" color="primary" startIcon={<EditIcon />} onClick={onEdit}>Edit Product</Button>
        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={onRemove}>Remove Product</Button>
      </Stack>
    </Box>
  );
}
