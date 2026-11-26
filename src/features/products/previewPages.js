import { useEffect, useState } from 'react';

// The shopper app's pages that the product Preview and the editor's phone
// can show. The app itself sends the list when a /preview/... page loads
// ({ type: 'dpp-preview-pages', version, pages }; app src/preview/previewPages.ts),
// so the page buttons, their notes and the Details tabs follow the app as it
// is deployed. The last list received is kept (this browser) and FALLBACK is
// used until the first one arrives.
export const APP_URL = (process.env.REACT_APP_WEB_BASE_URL || 'https://dpp.innosynch.com').replace(/\/$/, '');

const STORE_KEY = 'dppPreviewPages';
const FALLBACK = [
  { key: 'product', label: 'Product', note: 'The page shoppers see first after scanning.' },
  { key: 'summary', label: 'Summary', note: 'Photos and videos, brand and name, and the buttons.' },
  { key: 'detail', label: 'Details', note: 'The product passport.', sections: [] },
];

const valid = (pages) => Array.isArray(pages) && pages.length > 0
  && pages.every((p) => p && typeof p.key === 'string' && typeof p.label === 'string');

const load = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORE_KEY) || 'null');
    if (saved && valid(saved.pages)) return saved.pages;
  } catch (e) { /* none saved */ }
  return FALLBACK;
};

let current = typeof window !== 'undefined' ? load() : FALLBACK;
const listeners = new Set();
let origin = '';
try { origin = new URL(APP_URL).origin; } catch (e) { origin = ''; }

if (typeof window !== 'undefined') {
  window.addEventListener('message', (e) => {
    if (origin && e.origin !== origin) return;
    if (e.data?.type !== 'dpp-preview-pages' || !valid(e.data.pages)) return;
    const next = e.data.pages;
    if (JSON.stringify(next) === JSON.stringify(current)) return;
    current = next;
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify({ version: e.data.version, pages: next })); } catch (err) { /* storage full */ }
    listeners.forEach((fn) => fn(next));
  });
}

/** The app's preview pages (re-renders when the app sends a newer list). */
export function usePreviewPages() {
  const [pages, setPages] = useState(current);
  useEffect(() => {
    listeners.add(setPages);
    setPages(current);
    return () => { listeners.delete(setPages); };
  }, []);
  return pages;
}

/** ?page=...[&section=...] for a preview address. */
export const previewQuery = (view, section) => `?page=${encodeURIComponent(view)}${section ? `&section=${encodeURIComponent(section)}` : ''}`;
