import { Backend_URL } from '../../helper';

// Talks to the RFID readers the same way the app's web build does
// (app/src/native/impinjRfid.web.ts and CorporateScannerScreen.tsx): a
// browser can't open the reader's LLRP socket itself, so the Impinj R700 is
// driven through the backend's /impinj-llrp/* routes. Keep the two in step.

export const IMPINJ_READER_DISPLAY_NAME = 'Impinj R700 (fixed reader)';

export { IMPINJ_DEFAULT_READER_SETTINGS } from './rfidReaderDefaults';

// Reader types offered on the admin site. Only Impinj works here; Yometel
// (a Bluetooth handheld) and Zebra are under construction, and the page
// says so when one is picked.
export const RFID_READER_TYPES = [
  { key: 'impinj', label: 'Impinj Fixed Reader' },
  { key: 'yometel', label: 'Yometel Fixed Reader', underConstruction: true },
  { key: 'zebra', label: 'Zebra Fixed Reader', underConstruction: true },
];

// The app's polling: every 1.5 s, re-checking the reader's status every 10 polls.
export const RFID_POLL_MS = 1500;
export const STATUS_CHECK_EVERY_N_TICKS = 10;

// Above the backend's own worst case for a start() sequence, as in the app.
const REQUEST_TIMEOUT_MS = 45000;

async function request(method, path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(`${Backend_URL}impinj-llrp/${path}`, {
      method,
      signal: controller.signal,
      ...(body !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
    });
  } catch (err) {
    throw new Error(
      err?.name === 'AbortError'
        ? 'Timed out reaching the Impinj reader service'
        : err?.message || 'Could not reach the Impinj reader service'
    );
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 204) return undefined;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && data.error) || `Impinj reader service error (HTTP ${res.status})`);
  }
  return data;
}

// Inside the Yometel DPP Manager desktop app (the dpp-desktop repo), its
// preload exposes window.electronImpinj, which reaches the reader directly
// on the local network; the app's web build switches to it the same way.
const desktop = typeof window !== 'undefined' ? window.electronImpinj : undefined;

// True only inside the desktop app (Windows, Mac or Linux). A web browser can't
// reach the reader, so the RFID Scan page is offered only here.
export const isDesktopApp = Boolean(desktop);
// 'win32' | 'darwin' | 'linux' from the desktop app, undefined in a browser
// (and in desktop builds from before the preload reported it).
export const desktopPlatform = desktop && desktop.platform;

export const getImpinjReaderStatus = () => (desktop ? desktop.getStatus() : request('GET', 'status'));
export const connectImpinjReader = () => (desktop ? desktop.connect() : request('POST', 'connect'));
export const disconnectImpinjReader = () => (desktop ? desktop.disconnect() : request('POST', 'disconnect'));
export const startImpinjReading = () => (desktop ? desktop.start() : request('POST', 'start'));
export const stopImpinjReading = () => (desktop ? desktop.stop() : request('POST', 'stop'));
export const getImpinjTagsInView = () => (desktop ? desktop.getTagsInView() : request('GET', 'tags'));
export const getImpinjReaderSettings = () => (desktop ? desktop.getSettings() : request('GET', 'settings'));
export const updateImpinjReaderSettings = (settings) => (desktop ? desktop.updateSettings(settings) : request('PUT', 'settings', settings));

// The app's Connect for Impinj: check status first (a reader left connected
// by an earlier session would answer connect() with 409), connect if needed,
// then always issue start, because the service's isStarted flag can be
// stale. Throws with the reader's own error when either step fails.
export async function connectAndStartImpinj() {
  // In the desktop app Connect always reconnects: it drops this app's old
  // connection and, if another device holds the reader, has the reader close
  // that one (desktop/impinjLlrpMain.js connectReader).
  let status;
  if (desktop) {
    status = await connectImpinjReader();
  } else {
    status = await getImpinjReaderStatus();
    if (!status.isConnected) status = await connectImpinjReader();
  }
  if (!status.isConnected) throw new Error(status.lastError || 'Could not connect to the reader.');
  const started = await startImpinjReading();
  if (!started.isStarted) throw new Error(started.lastError || 'Could not start reading.');
  return started;
}

// The app's Disconnect for Impinj: stop (ignoring failure), then disconnect.
export async function stopAndDisconnectImpinj() {
  await stopImpinjReading().catch(() => {});
  await disconnectImpinjReader();
}

// The product registered to a tag's EPC (same pmc/lookup call as the app),
// or null when the tag isn't registered.
export async function lookupTagProduct(epc) {
  try {
    const res = await fetch(`${Backend_URL}pmc/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_type: 'rfid', raw_value: epc }),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok && data.status === 'success' && data.data ? data.data : null;
  } catch (err) {
    return null;
  }
}

export const formatPrice = (price, currency) => {
  const n = Number(price);
  if (price === '' || price == null || !Number.isFinite(n)) return '';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'EUR' }).format(n);
  } catch (e) {
    return `${n} ${currency || ''}`.trim();
  }
};

// The full product, for the detail dialog.
export async function fetchProduct(productId) {
  try {
    const res = await fetch(`${Backend_URL}product/${encodeURIComponent(productId)}`);
    const data = await res.json().catch(() => ({}));
    return res.ok ? data?.data?.doc || data?.data || null : null;
  } catch (err) {
    return null;
  }
}
