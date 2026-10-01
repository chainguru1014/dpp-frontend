// The look of the product page shoppers see after scanning (the "DPP
// experience"). A brand can change it per company; anything it leaves out
// falls back to these defaults, which match the Yometel DPP app.

// One per tab of the app's Product Lifecycle screen, in its default order.
export const DPP_SECTIONS = [
  { key: 'journey', label: 'Journey' },
  { key: 'care', label: 'Care' },
  { key: 'materials', label: 'Materials' },
  { key: 'dispose', label: 'Repair & recycle' },
  { key: 'traceability', label: 'Traceability' },
  { key: 'compliance', label: 'Compliance' },
];

export const DPP_FONTS = [
  { value: 'system', label: 'Standard', css: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif' },
  { value: 'serif', label: 'Classic (serif)', css: 'Georgia, "Times New Roman", serif' },
  { value: 'rounded', label: 'Rounded', css: '"Trebuchet MS", "Segoe UI", Verdana, sans-serif' },
  { value: 'mono', label: 'Technical (monospace)', css: '"Courier New", Consolas, monospace' },
];

export const DEFAULT_DPP_THEME = {
  pageBg: '#f4f7fc',
  cardBg: '#ffffff',
  accent: '#1b4f72',
  buttonText: '#ffffff',
  textColor: '#33415c',
  buttonRadius: 12,
  fontFamily: 'system',
  sections: DPP_SECTIONS.map((s) => ({ key: s.key, visible: true })),
};

const HEX = /^#[0-9a-fA-F]{6}$/;
const color = (value, fallback) => (HEX.test(String(value || '').trim()) ? String(value).trim() : fallback);

// Fills in anything missing or invalid, and keeps the section list complete
// (every known section exactly once, in the brand's order).
export function normalizeDppTheme(raw) {
  const t = raw && typeof raw === 'object' ? raw : {};
  const d = DEFAULT_DPP_THEME;
  const known = DPP_SECTIONS.map((s) => s.key);
  const seen = new Set();
  const sections = [];
  (Array.isArray(t.sections) ? t.sections : []).forEach((s) => {
    if (!s || !known.includes(s.key) || seen.has(s.key)) return;
    seen.add(s.key);
    sections.push({ key: s.key, visible: s.visible !== false });
  });
  known.forEach((key) => {
    if (!seen.has(key)) sections.push({ key, visible: true });
  });
  const radius = Number(t.buttonRadius);
  return {
    pageBg: color(t.pageBg, d.pageBg),
    cardBg: color(t.cardBg, d.cardBg),
    accent: color(t.accent, d.accent),
    buttonText: color(t.buttonText, d.buttonText),
    textColor: color(t.textColor, d.textColor),
    buttonRadius: Number.isFinite(radius) ? Math.max(0, Math.min(30, Math.round(radius))) : d.buttonRadius,
    fontFamily: DPP_FONTS.some((f) => f.value === t.fontFamily) ? t.fontFamily : d.fontFamily,
    sections,
  };
}

// Blend two #rrggbb colours; amount 0 = all a, 1 = all b.
const mix = (a, b, amount) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * amount).toString(16).padStart(2, '0')).join('')}`;
};

// The colour tokens the product page is drawn with, for a theme. Same
// derivation as the app's buildPalette (app/src/utils/dppTheme.ts), so the
// admin preview and the real page agree. The default theme gives exactly
// the standard Yometel colours.
export const dppPalette = (rawTheme) => {
  const t = normalizeDppTheme(rawTheme);
  const d = DEFAULT_DPP_THEME;
  const isDefault = ['pageBg', 'cardBg', 'accent', 'buttonText', 'textColor'].every((k) => t[k].toLowerCase() === d[k]);
  if (isDefault) {
    return {
      primary: '#1b4f72', primaryDark: '#123a56', headerLight: '#4a96dd', text: '#33415c', muted: '#7a8aa3',
      placeholder: '#9aa7bd', bg: '#f4f7fc', surface: '#ffffff', surfaceAlt: '#eef2f8', border: '#e7edf6',
      authBg: '#eef5fc', danger: '#c0392b', onDark: '#ffffff',
    };
  }
  return {
    primary: t.accent,
    primaryDark: mix(t.accent, '#000000', 0.25),
    headerLight: mix(t.accent, '#ffffff', 0.35),
    text: t.textColor,
    muted: mix(t.textColor, t.cardBg, 0.2),
    placeholder: mix(t.textColor, t.cardBg, 0.45),
    bg: t.pageBg,
    surface: t.cardBg,
    surfaceAlt: mix(t.cardBg, t.accent, 0.07),
    border: mix(t.cardBg, t.accent, 0.14),
    authBg: mix(t.cardBg, t.accent, 0.07),
    danger: '#c0392b',
    onDark: t.buttonText,
  };
};

export const dppFontCss = (value) => (DPP_FONTS.find((f) => f.value === value) || DPP_FONTS[0]).css;
export const dppSectionLabel = (key) => (DPP_SECTIONS.find((s) => s.key === key) || {}).label || key;
