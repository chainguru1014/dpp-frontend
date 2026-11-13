import React, { useState } from 'react';
import { Box, Button, IconButton, Menu, MenuItem, ListItemIcon, Stack, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CloseIcon from '@mui/icons-material/Close';
import { getFileUrl } from '../../helper';
import { PassportScore } from './PassportReadinessPanel';
import { passportCompleteness } from '../../utils/passportCompleteness';

// The selected product, beside the Products list: photos, passport, a few
// facts, then Edit, Codes and Preview. Ownership history and Remove are
// under "More", so the red Remove never sits next to Edit.
export default function ProductSidePanel({ product, onClose, onEdit, onCodes, onPreview, onHistory, onRemove, onCompletePassport }) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  if (!product) return null;
  const brand = product.brandInfo || {};
  const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
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
      sx={{ bgcolor: '#fff', borderRadius: 4, border: '1px solid #dfe5ec', boxShadow: '0 8px 24px rgba(31,51,97,0.08)', p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.75, position: { lg: 'sticky' }, top: { lg: 8 } }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Box sx={{ flex: 1, height: 220, borderRadius: 3, bgcolor: '#f2f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {images[0] ? <Box component="img" src={getFileUrl(images[0])} alt={product.name} sx={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
            : <Typography color="text.secondary">No photo yet</Typography>}
        </Box>
        {images.length > 1 && (
          <Stack spacing={1} sx={{ width: 74 }}>
            <Box component="img" src={getFileUrl(images[1])} alt="" sx={{ width: 74, height: 106, objectFit: 'cover', borderRadius: 2, border: '1px solid #e3e8ef' }} />
            {images.length > 2 && (
              <Box sx={{ height: 106, borderRadius: 2, bgcolor: '#f2f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>+{images.length - 2}</Box>
            )}
          </Stack>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {brand.name && <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#2f68b3' }}>{brand.name}</Typography>}
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#16324a', lineHeight: 1.25 }}>{product.name}</Typography>
          {product.model && <Typography color="text.secondary">{product.model}</Typography>}
        </Box>
        {onClose && <IconButton onClick={onClose} aria-label="Close the product details"><CloseIcon /></IconButton>}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ width: 70 }}>Passport</Typography>
        <PassportScore product={product} width={160} />
      </Box>
      {missing > 0 && onCompletePassport && (
        <Button size="small" onClick={onCompletePassport} sx={{ alignSelf: 'flex-start', mt: -1, px: 0 }}>
          {missing} {missing === 1 ? 'thing' : 'things'} missing: add {missing === 1 ? 'it' : 'them'}
        </Button>
      )}
      {percent === 100 && <Typography variant="body2" sx={{ color: '#1e6b34', mt: -1 }}>The passport is complete.</Typography>}
      <Box sx={{ display: 'grid', gridTemplateColumns: '96px minmax(0, 1fr)', rowGap: 0.75, columnGap: 1, fontSize: 15 }}>
        {facts.map(([k, v]) => (
          <React.Fragment key={k}>
            <Typography variant="body2" color="text.secondary">{k}</Typography>
            <Typography variant="body2">{v}</Typography>
          </React.Fragment>
        ))}
      </Box>
      {onEdit && <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit} fullWidth>Edit product</Button>}
      <Stack direction="row" spacing={1.25}>
        {onCodes && <Button variant="outlined" startIcon={<QrCode2Icon />} onClick={onCodes} sx={{ flex: 1 }}>Codes</Button>}
        <Button variant="outlined" startIcon={<PhoneIphoneIcon />} onClick={onPreview} sx={{ flex: 1 }}>Preview</Button>
      </Stack>
      <Button startIcon={<MoreHorizIcon />} onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ alignSelf: 'flex-start' }}
        aria-haspopup="menu" aria-expanded={!!menuAnchor}>
        More
      </Button>
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { setMenuAnchor(null); onHistory(); }}>
          <ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon>Ownership history
        </MenuItem>
        {onRemove && (
          <MenuItem onClick={() => { setMenuAnchor(null); onRemove(); }} sx={{ color: 'error.main' }}>
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>Remove product
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
