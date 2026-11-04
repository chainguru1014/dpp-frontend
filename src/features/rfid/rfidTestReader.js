// A pretend reader for trying the RFID Scan page without one (RFID_TEST_MODE
// in rfidReader.js). Connect and Disconnect only change state here; once
// connected, the dummy tags below come into view one by one. Tags with a
// productId show that real product; the others are unregistered tags.
// Nothing reaches the reader service, and nothing is saved.
import { IMPINJ_DEFAULT_READER_SETTINGS } from './rfidReaderDefaults';

const DUMMY_TAGS = [
  { epc: '3034257BF400A0C000000201', productId: '6a959caccac488c74bcdb336' },
  { epc: '3034257BF400A0C000000202', productId: '6ad76d79c5e62920bc172b68' },
  { epc: 'E28011700000020F1234ABCD' },
  { epc: '3034257BF400A0C000000203', productId: '6a959caccac488c74bcdb336' },
  { epc: '3034257BF400A0C000000204', productId: '6ad76d79c5e62920bc172b68' },
  { epc: 'E28011700000020F1234ABCE' },
];
// A new tag comes into view this often after connecting.
const REVEAL_EVERY_MS = 2500;

let connectedAt = null;
let settings = { ...IMPINJ_DEFAULT_READER_SETTINGS, availableAntennaPorts: [1, 2], enabledAntennaPorts: [1, 2] };
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const status = () => ({
  isConnected: connectedAt != null,
  isStarted: connectedAt != null,
  address: settings.ipAddress,
  firmwareVersion: null,
  modelName: 'Test reader',
  temperatureInCelsius: null,
  lastError: null,
  lastErrorAtUtc: null,
});

export const testReader = {
  status: async () => status(),
  connect: async () => {
    await wait(800);
    connectedAt = Date.now();
    return status();
  },
  disconnect: async () => {
    await wait(300);
    connectedAt = null;
    return status();
  },
  tags: async () => {
    if (connectedAt == null) return [];
    const now = new Date().toISOString();
    const shown = Math.min(DUMMY_TAGS.length, 1 + Math.floor((Date.now() - connectedAt) / REVEAL_EVERY_MS));
    return DUMMY_TAGS.slice(0, shown).map(({ epc }) => ({
      epc, antennaPort: 1, peakRssiInDbm: -55, tagSeenCount: 1, firstSeenTimeUtc: now, lastSeenTimeUtc: now, seenAt: now,
    }));
  },
  getSettings: async () => ({ ...settings }),
  updateSettings: async (next) => {
    settings = { ...next };
    return { ...settings };
  },
  productIdFor: (epc) => DUMMY_TAGS.find((t) => t.epc === epc)?.productId || null,
};
