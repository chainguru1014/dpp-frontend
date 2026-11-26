import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { APP_URL, previewQuery, usePreviewPages } from './previewPages';
import PreviewPageTabs from './PreviewPageTabs';

// The real shopper app in a phone frame, showing the product being edited
// (not saved yet) as shoppers will see it: the app opens /preview/draft and
// this sends it the product on every change (window.postMessage).
// `view` / `section`: the app page (and Details tab) shown; the buttons for
// them come from the app itself (previewPages.js), so they follow its pages.
export default function AppDraftPhone({ product, width = 300, view: viewProp, onView, section: sectionProp, onSection, showViews = true }) {
  const pages = usePreviewPages();
  const [ownSection, setOwnSection] = useState('');
  const section = sectionProp ?? ownSection;
  const setSection = onSection || setOwnSection;
  const frame = useRef(null);
  const [own, setOwn] = useState('product');
  const view = viewProp || own;
  const setView = onView || setOwn;
  const inner = width - 20;
  const scale = inner / 390;
  const src = `${APP_URL}/preview/draft${previewQuery(view, view === 'detail' ? section : '')}`;

  const send = useCallback(() => {
    try {
      // JSON round trip: only plain data crosses into the frame.
      frame.current?.contentWindow?.postMessage({ type: 'dpp-draft', product: JSON.parse(JSON.stringify(product || {})) }, APP_URL);
    } catch (e) { /* frame not ready yet */ }
  }, [product]);

  // On every change, and whenever the app (re)loads and asks for it.
  useEffect(() => { send(); }, [send]);
  useEffect(() => {
    const onMessage = (e) => {
      if (e.source === frame.current?.contentWindow && e.data?.type === 'dpp-draft-ready') send();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [send]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
      {showViews && (
        <PreviewPageTabs pages={pages} view={view} section={section} onView={(v) => { setView(v); setSection(''); }} onSection={setSection} small center />
      )}
      <Box sx={{ width, height: Math.round(844 * scale) + 20, flexShrink: 0, borderRadius: '44px', bgcolor: '#111', p: '10px', boxShadow: '0 18px 40px rgba(18,58,86,0.25)' }}>
        <Box sx={{ width: inner, height: Math.round(844 * scale), borderRadius: '34px', overflow: 'hidden', bgcolor: '#fff', position: 'relative' }}>
          <Box
            component="iframe"
            ref={frame}
            key={src}
            title="Shopper app preview"
            src={src}
            onLoad={send}
            sx={{ border: 0, width: 390, height: 844, transform: `scale(${scale})`, transformOrigin: '0 0', display: 'block' }}
          />
        </Box>
      </Box>
    </Box>
  );
}
