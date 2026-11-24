import React, { useEffect, useState } from 'react';
import { Box, Button, ButtonBase, Dialog, IconButton, Typography, useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AppDraftPhone from './AppDraftPhone';

const APP_URL = (process.env.REACT_APP_WEB_BASE_URL || 'https://dpp.innosynch.com').replace(/\/$/, '');

// Summary = the shopper app's product summary; Details = its passport.
// Product = the page Scan opens (photo, Like / Cart / Not for me, Product
// Information); Summary = its product summary; Details = its passport.
const VIEWS = [['product', 'Product'], ['summary', 'Summary'], ['detail', 'Details']];
const NOTES = {
  product: 'The page shoppers see first after scanning: the photo, Like, Cart, Not for me and Product Information.',
  summary: 'Tap the photos and videos, and Brand, Product Detail or Recommendations, as a shopper would.',
  detail: 'Overview, Materials, Journey, Impact and History, as shoppers read them.',
};

// The real shopper app in a phone: a 390 x 844 page drawn at the frame's size.
// The app opens it from /preview/<product>[/<item>]?page=summary|detail and
// then works exactly as on a phone (photo slider, gallery, tabs, back).
function AppPhone({ productId, qrcodeId, view, width }) {
  const inner = width - 20;
  const scale = inner / 390;
  const src = `${APP_URL}/preview/${encodeURIComponent(productId)}${qrcodeId != null && qrcodeId !== '' ? `/${encodeURIComponent(qrcodeId)}` : ''}?page=${view}`;
  return (
    <Box sx={{ width, height: Math.round(844 * scale) + 20, flexShrink: 0, borderRadius: '44px', bgcolor: '#111', p: '10px', boxShadow: '0 18px 40px rgba(18,58,86,0.25)' }}>
      <Box sx={{ width: inner, height: Math.round(844 * scale), borderRadius: '34px', overflow: 'hidden', bgcolor: '#fff', position: 'relative' }}>
        <Box
          component="iframe"
          key={src}
          title="Shopper app preview"
          src={src}
          sx={{ border: 0, width: 390, height: 844, transform: `scale(${scale})`, transformOrigin: '0 0', display: 'block' }}
        />
      </Box>
    </Box>
  );
}

// Preview: the shopper app's own product summary and passport for this
// product, in a phone, with Summary / Details to jump between them, Edit
// product and Done. A product not saved yet has no app page: the drawn
// passport (PassportPhone) shows instead.
// Same props as the old PreviewModal (open, setOpen, productInfo), plus onEdit.
export default function ProductPreviewDialog({ open, setOpen, onClose, productInfo, onEdit, theme }) {
  const [view, setView] = useState('product');
  const small = useMediaQuery('(max-width:760px)');
  const short = useMediaQuery('(max-height:760px)');
  useEffect(() => { if (open) setView('product'); }, [open, productInfo?._id]);
  const close = () => { if (setOpen) setOpen(false); if (onClose) onClose(); };
  const name = productInfo?.name || 'this product';
  const productId = productInfo?._id || productInfo?.id;
  const qrcodeId = productInfo?.token_id ?? productInfo?.qrcodeId;
  const phoneW = short ? 270 : 320;
  return (
    <Dialog open={!!open} onClose={close} maxWidth="md" PaperProps={{ sx: { borderRadius: '32px', bgcolor: '#f4f6f9', p: { xs: 2, sm: 3 }, overflow: 'hidden' } }}>
      <Box sx={{ display: 'flex', flexDirection: small ? 'column' : 'row', gap: 3, alignItems: small ? 'center' : 'stretch' }}>
        {productId
          ? <AppPhone productId={productId} qrcodeId={qrcodeId} view={view} width={phoneW} />
          : <AppDraftPhone product={productInfo} view={view} onView={setView} showViews={false} width={phoneW} />}
        <Box sx={{ width: small ? '100%' : 300, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <IconButton onClick={close} aria-label="Close the preview" sx={{ position: 'absolute', top: -4, right: -4, bgcolor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', '&:hover': { bgcolor: '#fff' } }}>
            <CloseIcon />
          </IconButton>
          <Typography component="h2" sx={{ fontSize: 26, color: '#1c1c1e', pr: 6 }}>Preview</Typography>
          <Typography sx={{ fontSize: 15, color: '#5f6b78', mt: 1, lineHeight: 1.45 }}>
            {productId
              ? <>This is what shoppers see when they scan {name}. {NOTES[view]}</>
              : <>This is the passport shoppers will see for {name}. Save the product to try it in the app.</>}
          </Typography>
          {!!productId && (
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
          )}
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
