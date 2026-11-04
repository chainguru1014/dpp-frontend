import { Backend_URL } from '../../helper';

// Talks to the RFID readers the same way the app's web build does
// (app/src/native/impinjRfid.web.ts and CorporateScannerScreen.tsx): a
// browser can't open the reader's LLRP socket itself, so the Impinj R700 is
// driven through the backend's /impinj-llrp/* routes. Keep the two in step.

export const IMPINJ_READER_DISPLAY_NAME = 'Impinj R700 (fixed reader)';

// Same defaults as the app's settings form (impinjRfidShared.ts).
export const IMPINJ_DEFAULT_READER_SETTINGS = {
  readerName: 'Main RFID Reader',
  ipAddress: '192.168.1.10',
  port: 5084,
  connectionTimeoutMs: 10000,
  autoReconnect: true,
  reconnectIntervalMs: 5000,
  maxReconnectAttempts: 10,
  unlimitedReconnectAttempts: false,
  autoConnectOnStartup: true,
};

// Reader types offered on the admin site (the app also has Yometel, a
// Bluetooth reader only a phone can use). Impinj reaches the real reader;
// Zebra connects virtually and takes its tags from /rfid/recent, like the
// app's web build.
export const RFID_READER_TYPES = [
  { key: 'impinj', label: 'Impinj' },
  { key: 'zebra', label: 'Zebra' },
];

// The app's polling: every 1.5 s, re-checking the reader's status every 10
// polls; virtual readers ask for tags seen in the last 5 s.
export const RFID_POLL_MS = 1500;
export const STATUS_CHECK_EVERY_N_TICKS = 10;
export const RFID_WINDOW_SECONDS = 5;

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

export const getImpinjReaderStatus = () => request('GET', 'status');
export const connectImpinjReader = () => request('POST', 'connect');
export const disconnectImpinjReader = () => request('POST', 'disconnect');
export const startImpinjReading = () => request('POST', 'start');
export const stopImpinjReading = () => request('POST', 'stop');
export const getImpinjTagsInView = () => request('GET', 'tags');
export const getImpinjReaderSettings = () => request('GET', 'settings');
export const updateImpinjReaderSettings = (settings) => request('PUT', 'settings', settings);

// The app's Connect for Impinj: check status first (a reader left connected
// by an earlier session would answer connect() with 409), connect if needed,
// then always issue start, because the service's isStarted flag can be
// stale. Throws with the reader's own error when either step fails.
export async function connectAndStartImpinj() {
  let status = await getImpinjReaderStatus();
  if (!status.isConnected) status = await connectImpinjReader();
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

// Tags from a virtual (Yometel/Zebra) connection; [] on any failure, as in the app.
export async function getRecentTags() {
  try {
    const res = await fetch(`${Backend_URL}rfid/recent?windowSeconds=${RFID_WINDOW_SECONDS}`);
    if (!res.ok) return [];
    const data = await res.json().catch(() => ({}));
    return data?.data?.tags || [];
  } catch (err) {
    return [];
  }
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
