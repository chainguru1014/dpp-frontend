import React from 'react';
import { Box, ButtonBase } from '@mui/material';

// The page buttons over / beside a preview phone (Product, Summary,
// Details), and under Details its tabs (Overview, Materials, ...), as the
// app lists them (see previewPages.js).
const Pill = ({ items, value, onChange, label, small }) => (
  <Box role="tablist" aria-label={label} sx={{ display: 'flex', flexWrap: 'wrap', p: '3px', borderRadius: '999px', bgcolor: 'rgba(120,120,128,0.14)', alignSelf: 'flex-start', maxWidth: '100%' }}>
    {items.map((it) => {
      const on = value === it.key;
      return (
        <ButtonBase key={it.key} role="tab" aria-selected={on} onClick={() => onChange(it.key)}
          sx={{ px: small ? 1.25 : 2, height: small ? 30 : 34, borderRadius: '999px', fontSize: small ? 13 : 15, color: '#1c1c1e', bgcolor: on ? '#fff' : 'transparent', boxShadow: on ? '0 2px 6px rgba(0,0,0,0.12)' : 'none' }}>
          {it.label}
        </ButtonBase>
      );
    })}
  </Box>
);

export default function PreviewPageTabs({ pages, view, onView, small, center }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: center ? 'center' : 'flex-start' }}>
      <Pill items={pages} value={view} onChange={onView} label="Page" small={small} />
      {/* The Details tabs (Overview, Materials, ...) are not repeated here
          (client 2026-11-28): they are tapped in the phone, as in the app. */}
    </Box>
  );
}

/** The note for what is shown (the tab's own note on Details). */
export const previewNote = (pages, view, section) => {
  const page = pages.find((p) => p.key === view);
  const sec = page?.sections?.find((s) => s.key === section) || page?.sections?.[0];
  return [page?.note, sec?.note].filter(Boolean).join(' ');
};
