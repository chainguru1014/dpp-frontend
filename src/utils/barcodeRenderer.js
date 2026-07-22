// Minimal, dependency-free EAN-13 barcode renderer (canvas -> PNG data URL).
// Table ported verbatim from the `python-barcode` library's
// barcode/charsets/ean.py (A/B/C module patterns, EDGE, MIDDLE, LEFT_PATTERN)
// rather than hand-derived, so the bar widths are known-correct — a wrong
// digit here produces an image that looks right but silently fails to scan.
const EDGE = '101';
const MIDDLE = '01010';
const CODES = {
  A: ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'],
  B: ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'],
  C: ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'],
};
// Which of A/B to use for each of the 6 left-hand digits, keyed by the
// (implied, unencoded) first digit of the 13-digit code.
const LEFT_PATTERN = [
  'AAAAAA', 'AABABB', 'AABBAB', 'AABBBA', 'ABAABB',
  'ABBAAB', 'ABBBAA', 'ABABAB', 'ABABBA', 'ABBABA',
];

export const calculateEan13CheckDigit = (first12) => {
  const digits = String(first12).replace(/\D/g, '').padStart(12, '0').slice(0, 12);
  let oddsum = 0;
  let evensum = 0;
  for (let i = 0; i < 12; i++) {
    const d = Number(digits[i]);
    // Position from the right (1-indexed) determines odd/even weighting.
    if ((12 - i) % 2 === 0) evensum += d;
    else oddsum += d;
  }
  return (10 - ((evensum + oddsum * 3) % 10)) % 10;
};

// Builds the full 12-13 digit EAN-13 value (appending a valid check digit
// unless one was already supplied and is correct).
export const toValidEan13 = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  const base = digits.slice(0, 12).padStart(12, '0');
  return `${base}${calculateEan13CheckDigit(base)}`;
};

// Returns the binary bar/space pattern string (1 = bar, 0 = space) for a
// 13-digit EAN value, or null if the input isn't a 13-digit numeric string.
const buildPattern = (ean13) => {
  if (!/^\d{13}$/.test(ean13)) return null;
  const patternKey = LEFT_PATTERN[Number(ean13[0])];
  let code = EDGE;
  for (let i = 0; i < 6; i++) {
    code += CODES[patternKey[i]][Number(ean13[i + 1])];
  }
  code += MIDDLE;
  for (let i = 7; i < 13; i++) {
    code += CODES.C[Number(ean13[i])];
  }
  code += EDGE;
  return code;
};

// Renders an EAN-13 barcode (auto-completing/validating the check digit) to
// a PNG data URL via an offscreen canvas. Returns null if the value can't be
// coerced into 12+ digits.
export const renderEan13ToDataUrl = (value, { moduleWidth = 2, height = 80, fontSize = 16 } = {}) => {
  const ean13 = toValidEan13(value);
  const pattern = buildPattern(ean13);
  if (!pattern) return null;

  const quietZone = moduleWidth * 10;
  const barsWidth = pattern.length * moduleWidth;
  const canvas = document.createElement('canvas');
  canvas.width = barsWidth + quietZone * 2;
  canvas.height = height + fontSize + 10;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000';
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '1') {
      ctx.fillRect(quietZone + i * moduleWidth, 0, moduleWidth, height);
    }
  }

  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(ean13, canvas.width / 2, height + fontSize);

  return canvas.toDataURL('image/png');
};
