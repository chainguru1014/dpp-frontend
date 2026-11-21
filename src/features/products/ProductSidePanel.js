import React, { useEffect, useState } from 'react';
import { Box, Button, ButtonBase, Dialog, IconButton, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import HistoryIcon from '@mui/icons-material/History';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getFileUrl } from '../../helper';
import { PassportScore } from './PassportReadinessPanel';
import { passportCompleteness } from '../../utils/passportCompleteness';

const INK = '#1c1c1e';
const SECONDARY = '#5f6b78';

// The selected product, beside the Products list, laid out like the phone
// app's passport: a large photo with a strip of thumbnails, brand and name,
// the passport bar, the facts as grouped rows, Edit, Codes / Preview, then
// Ownership history and Remove as rows.
export default function ProductSidePanel({ product, onClose, onEdit, onCodes, onPreview, onHistory, onRemove, onCompletePassport }) {
  const [index, setIndex] = useState(0);
  const [openPhoto, setOpenPhoto] = useState(false);
  useEffect(() => { setIndex(0); }, [product?._id]);
  if (!product) return null;
  const brand = product.brandInfo || {};
  const images = (Array.isArray(product.images) ? product.images.filter(Boolean) : []).slice(0, 8);
  const main = images[index] || images[0];
  const { percent, done, total } = passportCompleteness(product);
  const missing = total - done;
  const minted = Number(product.total_minted_amount) || 0;
  const printed = Number(product.printed_amount) || 0;
  const material = (product.materialSize?.materials || []).map((m) => m.material).filter(Boolean).join(', ');
  const price = product.price ? new Intl.NumberFormat('en-IE', { style: 'currency', currency: product.currency || 'EUR', maximumFractionDigits: 0 }).format(product.price) : '';
  const facts = [
    ['Category', product.itemCategory ? String(product.itemCategory).replace(/([a-z])([A-Z])/g, '$1 $2') : ''],
    ['Price', price],
    ['Material', material],
    ['Made in', product.traceabilityEsg?.madeIn || product.materialSize?.manufacturingCountry || ''],
    ['Codes', minted ? `${minted.toLocaleString()} · ${printed.toLocaleString()} printed` : 'None yet'],
  ].filter(([, v]) => v);

  const row = { display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 46, px: 2, width: '100%', textAlign: 'left', justifyContent: 'flex-start' };

  return (
    <Box component="aside" aria-label={product.name}
      sx={{ bgcolor: '#fff', borderRadius: '28px', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, position: { lg: 'sticky' }, top: { lg: 84 }, boxShadow: '0 1px 2px rgba(18,58,86,0.04)' }}>
      <Box sx={{ position: 'relative' }}>
        {main ? (
          <ButtonBase onClick={() => setOpenPhoto(true)} aria-label="Show the photo large" sx={{ display: 'block', width: '100%', borderRadius: '22px', overflow: 'hidden' }}>
            <Box component="img" src={getFileUrl(main)} alt={product.name} sx={{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', bgcolor: '#eef1f4' }} />
          </ButtonBase>
        ) : (
          <Box sx={{ aspectRatio: '4 / 3', borderRadius: '22px', bgcolor: '#eef1f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">No photo yet</Typography>
          </Box>
        )}
        {onClose && (
          <IconButton onClick={onClose} aria-label="Close the product details" sx={{ position: 'absolute', top: 10, right: 10, width: 36, height: 36, bgcolor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', color: INK, '&:hover': { bgcolor: '#fff' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      {images.length > 1 && (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
          {images.map((src, i) => (
            <ButtonBase key={`${src}-${i}`} onClick={() => setIndex(i)} aria-label={`Photo ${i + 1}`} aria-pressed={i === index}
              sx={{ width: i === index ? 54 : 48, height: i === index ? 54 : 48, borderRadius: '12px', overflow: 'hidden', border: i === index ? '2.5px solid #2a78bd' : '1px solid #e3e8ef' }}>
              <Box component="img" src={getFileUrl(src)} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </ButtonBase>
          ))}
        </Box>
      )}
      <Dialog open={openPhoto} onClose={() => setOpenPhoto(false)} maxWidth="md"
        PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', position: 'relative' } }}>
        <IconButton onClick={() => setOpenPhoto(false)} aria-label="Close the photo" sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.45)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}>
          <CloseIcon />
        </IconButton>
        {main && <Box component="img" src={getFileUrl(main)} alt={product.name} sx={{ display: 'block', maxWidth: '90vw', maxHeight: '86vh', objectFit: 'contain', borderRadius: '20px', bgcolor: '#fff' }} />}
      </Dialog>

      <Box sx={{ px: 1 }}>
        {brand.name && <Typography sx={{ fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: SECONDARY }}>{brand.name}</Typography>}
        <Typography sx={{ fontSize: 22, color: INK, lineHeight: 1.25 }}>{product.name}</Typography>
        {product.model && <Typography sx={{ fontSize: 15, color: SECONDARY }}>{product.model}</Typography>}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.25 }}>
          <Typography sx={{ fontSize: 14, color: SECONDARY, width: 64 }}>Passport</Typography>
          <PassportScore product={product} width={150} />
        </Box>
        {missing > 0 && onCompletePassport && (
          <Button size="small" onClick={onCompletePassport} sx={{ px: 0, minHeight: 0, py: 0.25 }}>
            {missing} {missing === 1 ? 'thing' : 'things'} missing: add {missing === 1 ? 'it' : 'them'}
          </Button>
        )}
        {percent === 100 && <Typography sx={{ fontSize: 14, color: '#1b4f72' }}>The passport is complete.</Typography>}
      </Box>

      <Box sx={{ bgcolor: '#f4f6f9', borderRadius: '20px', overflow: 'hidden' }}>
        {facts.map(([k, v], i) => (
          <Box key={k} sx={{ ...row, borderTop: i ? '1px solid #e8eaed' : 0 }}>
            <Typography sx={{ fontSize: 15, color: INK, flexShrink: 0 }}>{k}</Typography>
            <Typography sx={{ fontSize: 15, color: SECONDARY, flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</Typography>
          </Box>
        ))}
      </Box>

      {onEdit && <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit} fullWidth sx={{ height: 48 }}>Edit product</Button>}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {onCodes && <Button variant="outlined" startIcon={<QrCode2Icon />} onClick={onCodes} sx={{ flex: 1, height: 44 }}>Codes</Button>}
        <Button variant="outlined" startIcon={<PhoneIphoneIcon />} onClick={onPreview} sx={{ flex: 1, height: 44 }}>Preview</Button>
      </Box>
      <Box sx={{ bgcolor: '#f4f6f9', borderRadius: '20px', overflow: 'hidden' }}>
        <ButtonBase onClick={onHistory} sx={row}>
          <HistoryIcon sx={{ color: '#2a78bd' }} />
          <Typography sx={{ fontSize: 15, color: INK, flex: 1 }}>Ownership history</Typography>
          <ChevronRightIcon sx={{ color: '#b4bcc6' }} />
        </ButtonBase>
        {onRemove && (
          <ButtonBase onClick={onRemove} sx={{ ...row, borderTop: '1px solid #e8eaed' }}>
            <DeleteOutlineIcon sx={{ color: '#1b4f72' }} />
            <Typography sx={{ fontSize: 15, color: '#1b4f72', flex: 1 }}>Remove product</Typography>
          </ButtonBase>
        )}
      </Box>
    </Box>
  );
}
