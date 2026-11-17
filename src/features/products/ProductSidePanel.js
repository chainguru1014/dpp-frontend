import React, { useState } from 'react';
import { Box, Button, ButtonBase, Dialog, IconButton, Stack, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { getFileUrl } from '../../helper';
import { PassportScore } from './PassportReadinessPanel';
import { passportCompleteness } from '../../utils/passportCompleteness';

// The selected product, beside the Products list: its photos the way the
// app's Product summary shows them (a grid of three framed squares; click
// one to see it large), passport, a few facts, then Edit, Codes / Preview,
// and Ownership history / Remove on the last line.
export default function ProductSidePanel({ product, onClose, onEdit, onCodes, onPreview, onHistory, onRemove, onCompletePassport }) {
  const [openPhoto, setOpenPhoto] = useState('');
  if (!product) return null;
  const brand = product.brandInfo || {};
  const images = (Array.isArray(product.images) ? product.images.filter(Boolean) : []).slice(0, 9);
  const { percent, done, total } = passportCompleteness(product);
  const missing = total - done;
  const minted = Number(product.total_minted_amount) || 0;
  const printed = Number(product.printed_amount) || 0;
  const material = (product.materialSize?.materials || []).map((m) => [m.percentage && `${m.percentage}%`, m.material].filter(Boolean).join(' ')).filter(Boolean).join(', ');
  const facts = [
    ['Category', product.itemCategory ? String(product.itemCategory).replace(/([a-z])([A-Z])/g, '$1 $2') : ''],
    ['Material', material],
    ['Made in', product.materialSize?.manufacturingCountry || product.manufacturingCountry || ''],
    ['Codes', minted ? `${minted.toLocaleString()} · ${printed.toLocaleString()} printed` : 'None yet'],
  ].filter(([, v]) => v);

  return (
    <Box component="aside" aria-label={product.name}
      sx={{ bgcolor: '#fff', borderRadius: 4, border: '1px solid #dfe5ec', boxShadow: '0 8px 24px rgba(31,51,97,0.08)', p: 2, display: 'flex', flexDirection: 'column', gap: 1.25, position: { lg: 'sticky' }, top: { lg: 8 } }}>
      {images.length ? (
        // One row of four framed squares (more photos: "+N" on the last).
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 0.75 }}>
          {images.slice(0, 4).map((src, i) => {
            const more = i === 3 && images.length > 4 ? images.length - 3 : 0;
            return (
              <ButtonBase
                key={`${src}-${i}`}
                onClick={() => setOpenPhoto(src)}
                aria-label={`Photo ${i + 1}: show it large`}
                sx={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 2.5, border: '2px solid #1b4f72', bgcolor: '#fff', p: 0.5, overflow: 'hidden' }}
              >
                <Box component="img" src={getFileUrl(src)} alt="" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                {!!more && (
                  <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(22,50,74,0.55)', color: '#fff', fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+{more}</Box>
                )}
              </ButtonBase>
            );
          })}
        </Box>
      ) : (
        <Box sx={{ height: 72, borderRadius: 3, bgcolor: '#f2f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">No photo yet</Typography>
        </Box>
      )}
      <Dialog open={!!openPhoto} onClose={() => setOpenPhoto('')} maxWidth="md"
        PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', position: 'relative' } }}>
        <IconButton onClick={() => setOpenPhoto('')} aria-label="Close the photo" sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.45)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}>
          <CloseIcon />
        </IconButton>
        {openPhoto && <Box component="img" src={getFileUrl(openPhoto)} alt={product.name} sx={{ display: 'block', maxWidth: '90vw', maxHeight: '82vh', objectFit: 'contain', borderRadius: 2, bgcolor: '#fff' }} />}
      </Dialog>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {brand.name && <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#2f68b3' }}>{brand.name}</Typography>}
          <Typography sx={{ fontSize: 19, fontWeight: 700, color: '#16324a', lineHeight: 1.25 }}>{product.name}</Typography>
          {product.model && <Typography variant="body2" color="text.secondary">{product.model}</Typography>}
        </Box>
        {onClose && <IconButton size="small" onClick={onClose} aria-label="Close the product details"><CloseIcon /></IconButton>}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ width: 70 }}>Passport</Typography>
        <PassportScore product={product} width={160} />
      </Box>
      {missing > 0 && onCompletePassport && (
        <Button size="small" onClick={onCompletePassport} sx={{ alignSelf: 'flex-start', mt: -0.75, px: 0, minHeight: 0, py: 0 }}>
          {missing} {missing === 1 ? 'thing' : 'things'} missing: add {missing === 1 ? 'it' : 'them'}
        </Button>
      )}
      {percent === 100 && <Typography variant="body2" sx={{ color: '#1e6b34', mt: -1 }}>The passport is complete.</Typography>}
      <Box sx={{ display: 'grid', gridTemplateColumns: '84px minmax(0, 1fr)', rowGap: 0.25, columnGap: 1, fontSize: 14 }}>
        {facts.map(([k, v]) => (
          <React.Fragment key={k}>
            <Typography variant="body2" color="text.secondary">{k}</Typography>
            <Typography variant="body2">{v}</Typography>
          </React.Fragment>
        ))}
      </Box>
      {onEdit && <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit} fullWidth sx={{ height: 42 }}>Edit product</Button>}
      <Stack direction="row" spacing={1}>
        {onCodes && <Button variant="outlined" startIcon={<QrCode2Icon />} onClick={onCodes} sx={{ flex: 1, height: 40 }}>Codes</Button>}
        <Button variant="outlined" startIcon={<PhoneIphoneIcon />} onClick={onPreview} sx={{ flex: 1, height: 40 }}>Preview</Button>
      </Stack>
      <Stack direction="row" spacing={1}>
        <Button variant="text" startIcon={<HistoryIcon />} onClick={onHistory} sx={{ flex: 1.4, height: 38, whiteSpace: 'nowrap', fontSize: 14, bgcolor: '#f2f5f9', '&:hover': { bgcolor: '#e8eef6' } }}>Ownership history</Button>
        {onRemove && (
          <Button variant="text" color="error" startIcon={<DeleteIcon />} onClick={onRemove} sx={{ flex: 1, height: 38, bgcolor: '#fdecec', '&:hover': { bgcolor: '#fbdcdc' } }}>Remove</Button>
        )}
      </Stack>
    </Box>
  );
}
