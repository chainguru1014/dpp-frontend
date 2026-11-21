import React, { useEffect, useState } from 'react';
import { Box, Button, ButtonBase, Dialog, IconButton, Typography, useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PassportPhone from './PassportPhone';

const VIEWS = [['passport', 'Passport'], ['details', 'Details'], ['photos', 'Photos']];
const NOTES = {
  passport: 'Tap the rows, the buttons or the photo, as a shopper would.',
  details: 'About this product and its details, as shoppers read them.',
  photos: 'The product photos, full screen.',
};

// Preview (design HIG_Preview): the passport shoppers see, in an iPhone, with
// Passport / Details / Photos to jump between its pages, Edit product and Done.
// Same props as the old PreviewModal (open, setOpen, productInfo), plus onEdit.
export default function ProductPreviewDialog({ open, setOpen, onClose, productInfo, onEdit, theme }) {
  const [view, setView] = useState('passport');
  const small = useMediaQuery('(max-width:760px)');
  const short = useMediaQuery('(max-height:760px)');
  useEffect(() => { if (open) setView('passport'); }, [open, productInfo?._id]);
  const close = () => { if (setOpen) setOpen(false); if (onClose) onClose(); };
  const name = productInfo?.name || 'this product';
  return (
    <Dialog open={!!open} onClose={close} maxWidth="md" PaperProps={{ sx: { borderRadius: '32px', bgcolor: '#f4f6f9', p: { xs: 2, sm: 3 }, overflow: 'hidden' } }}>
      <Box sx={{ display: 'flex', flexDirection: small ? 'column' : 'row', gap: 3, alignItems: small ? 'center' : 'stretch' }}>
        <PassportPhone product={productInfo} view={view} onView={setView} width={short ? 250 : 300} theme={theme} />
        <Box sx={{ width: small ? '100%' : 300, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <IconButton onClick={close} aria-label="Close the preview" sx={{ position: 'absolute', top: -4, right: -4, bgcolor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', '&:hover': { bgcolor: '#fff' } }}>
            <CloseIcon />
          </IconButton>
          <Typography component="h2" sx={{ fontSize: 26, color: '#1c1c1e', pr: 6 }}>Preview</Typography>
          <Typography sx={{ fontSize: 15, color: '#5f6b78', mt: 1, lineHeight: 1.45 }}>
            This is the passport shoppers see when they scan {name}. {NOTES[view]}
          </Typography>
          <Box role="tablist" aria-label="Page" sx={{ display: 'flex', mt: 2.5, p: '3px', borderRadius: '999px', bgcolor: 'rgba(120,120,128,0.14)', alignSelf: 'flex-start' }}>
            {VIEWS.map(([key, label]) => {
              const on = view === key;
              return (
                <ButtonBase key={key} role="tab" aria-selected={on} onClick={() => setView(key)}
                  sx={{ px: 2, height: 34, borderRadius: '999px', fontSize: 15, color: '#1c1c1e', bgcolor: on ? '#fff' : 'transparent', boxShadow: on ? '0 2px 6px rgba(0,0,0,0.12)' : 'none' }}>
                  {label}
                </ButtonBase>
              );
            })}
          </Box>
          <Box sx={{ flex: 1, minHeight: 24 }} />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            {onEdit && <Button variant="outlined" onClick={() => { close(); onEdit(); }} sx={{ height: 44 }}>Edit product</Button>}
            <Button variant="contained" onClick={close} sx={{ height: 44, px: 3 }}>Done</Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
