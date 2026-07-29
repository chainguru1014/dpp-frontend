// Shortens a long code/URL to "first9 ... last4" so it reads as an
// at-a-glance reference instead of a wrapping wall of characters — the full
// value is still recoverable by scanning the image, copying it, or looking
// it up via its PMC. Shared by the printed PDF (RFID/NFC text-only items,
// which have no image) and the on-screen Registered Identifiers grid
// (components/RegisterIdentifierPanel).
export const truncateCode = (text) => {
  const str = String(text || '');
  if (str.length <= 16) return str;
  return `${str.slice(0, 9)} ... ${str.slice(-4)}`;
};
