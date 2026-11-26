import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, IconButton, Typography, useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AppDraftPhone from './AppDraftPhone';
import { APP_URL, previewQuery, usePreviewPages } from './previewPages';
import PreviewPageTabs, { previewNote } from './PreviewPageTabs';

// The pages to show (Product, Summary, Details and its tabs) and their notes
// come from the shopper app itself (previewPages.js): when the app's pages
// change, this follows.

// The real shopper app in a phone: a 390 x 844 page drawn at the frame's size.
// The app opens it from /preview/<product>[/<item>]?page=summary|detail and
// then works exactly as on a phone (photo slider, gallery, tabs, back).
function AppPhone({ productId, qrcodeId, view, section, width }) {
  const inner = width - 20;
  const scale = inner / 390;
  const src = `${APP_URL}/preview/${encodeURIComponent(productId)}${qrcodeId != null && qrcodeId !== '' ? `/${encodeURIComponent(qrcodeId)}` : ''}${previewQuery(view, view === 'detail' ? section : '')}`;
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
  const pages = usePreviewPages();
  const [view, setView] = useState('product');
  const [section, setSection] = useState('');
  const small = useMediaQuery('(max-width:760px)');
  const short = useMediaQuery('(max-height:760px)');
  useEffect(() => { if (open) { setView('product'); setSection(''); } }, [open, productInfo?._id]);
  const close = () => { if (setOpen) setOpen(false); if (onClose) onClose(); };
  const name = productInfo?.name || 'this product';
  const productId = productInfo?._id || productInfo?.id;
  const qrcodeId = productInfo?.token_id ?? productInfo?.qrcodeId;
  const phoneW = short ? 270 : 320;
  return (
    <Dialog open={!!open} onClose={close} maxWidth="md" PaperProps={{ sx: { borderRadius: '32px', bgcolor: '#f4f6f9', p: { xs: 2, sm: 3 }, overflow: 'hidden' } }}>
      <Box sx={{ display: 'flex', flexDirection: small ? 'column' : 'row', gap: 3, alignItems: small ? 'center' : 'stretch' }}>
        {productId
          ? <AppPhone productId={productId} qrcodeId={qrcodeId} view={view} section={section} width={phoneW} />
          : <AppDraftPhone product={productInfo} view={view} onView={setView} section={section} onSection={setSection} showViews={false} width={phoneW} />}
        <Box sx={{ width: small ? '100%' : 300, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <IconButton onClick={close} aria-label="Close the preview" sx={{ position: 'absolute', top: -4, right: -4, bgcolor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', '&:hover': { bgcolor: '#fff' } }}>
            <CloseIcon />
          </IconButton>
          <Typography component="h2" sx={{ fontSize: 26, color: '#1c1c1e', pr: 6 }}>Preview</Typography>
          <Typography sx={{ fontSize: 15, color: '#5f6b78', mt: 1, lineHeight: 1.45 }}>
            {productId
              ? <>This is what shoppers see when they scan {name}. {previewNote(pages, view, section)}</>
              : <>This is the passport shoppers will see for {name}. Save the product to try it in the app.</>}
          </Typography>
          {!!productId && (
            <Box sx={{ mt: 2.5 }}>
              <PreviewPageTabs pages={pages} view={view} section={section} onView={(v) => { setView(v); setSection(''); }} onSection={setSection} />
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
