// The design of the product page shoppers see after scanning (the "DPP
// experience"): colours, style, layout and a little brand content. A brand
// sets it per company; anything it leaves out falls back to these defaults,
// which are exactly the standard Yometel DPP app.
//
// The same shape and the same clean-up live in backend/utils/dppTheme.ts and
// app/src/utils/dppTheme.ts — change all three together.

// Lifecycle tabs: one per tab of the app's Product Lifecycle screen.
export const DPP_SECTIONS = [
  { key: 'journey', label: 'Journey' },
  { key: 'care', label: 'Care' },
  { key: 'materials', label: 'Materials' },
  { key: 'dispose', label: 'Repair & recycle' },
  { key: 'traceability', label: 'Traceability' },
  { key: 'compliance', label: 'Compliance' },
];

// Blocks of the Product Overview screen, below the product itself. `on` is
// whether the standard look shows the block.
export const DPP_BLOCKS = [
  { key: 'highlights', label: 'Key highlights', on: true },
  { key: 'lifecycle', label: 'Lifecycle preview', on: true },
  { key: 'about', label: 'About this product', on: false },
  { key: 'brand', label: 'About the brand', on: false },
  { key: 'message', label: 'Your message', on: false },
  { key: 'cta', label: 'Your button', on: false },
  { key: 'feedback', label: 'Helpful / Share buttons', on: true },
  { key: 'actions', label: 'Scan / Request ownership buttons', on: true },
];

export const DPP_FONTS = [
  { value: 'system', label: 'Standard', css: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif' },
  { value: 'serif', label: 'Classic (serif)', css: 'Georgia, "Times New Roman", serif' },
  { value: 'rounded', label: 'Rounded', css: '"Trebuchet MS", "Segoe UI", Verdana, sans-serif' },
  { value: 'mono', label: 'Technical (monospace)', css: '"Courier New", Consolas, monospace' },
];

// Choices offered for each style setting (first = the standard look).
export const DPP_CHOICES = {
  headerStyle: [{ value: 'gradient', label: 'Gradient' }, { value: 'solid', label: 'Plain colour' }],
  buttonStyle: [{ value: 'gradient', label: 'Gradient' }, { value: 'solid', label: 'Plain colour' }, { value: 'outline', label: 'Outline' }],
  cardStyle: [{ value: 'shadow', label: 'Soft shadow' }, { value: 'border', label: 'Thin border' }, { value: 'flat', label: 'Flat' }],
  tabStyle: [{ value: 'underline', label: 'Underline' }, { value: 'pills', label: 'Pills' }],
  textScale: [{ value: 'small', label: 'Small' }, { value: 'normal', label: 'Normal' }, { value: 'large', label: 'Large' }],
  heroLayout: [{ value: 'side', label: 'Photo beside the name' }, { value: 'top', label: 'Large photo on top' }],
};
export const DPP_TEXT_SCALE = { small: 0.92, normal: 1, large: 1.12 };

export const DEFAULT_DPP_THEME = {
  // Colours. headerColor / badgeColor left empty follow `accent`.
  pageBg: '#f4f7fc',
  cardBg: '#ffffff',
  accent: '#1b4f72',
  buttonText: '#ffffff',
  textColor: '#33415c',
  headerColor: '',
  badgeColor: '',
  // Style.
  headerStyle: 'gradient',
  buttonStyle: 'gradient',
  buttonRadius: 12,
  cardStyle: 'shadow',
  cardRadius: 16,
  tabStyle: 'underline',
  textScale: 'normal',
  fontFamily: 'system',
  // Layout.
  heroLayout: 'side',
  showProductId: true,
  blocks: DPP_BLOCKS.map((b) => ({ key: b.key, visible: b.on })),
  sections: DPP_SECTIONS.map((s) => ({ key: s.key, visible: true })),
  // Brand content for the "message" and "cta" blocks.
  message: { title: '', body: '' },
  cta: { label: '', url: '' },
};

const HEX = /^#[0-9a-fA-F]{6}$/;
const color = (value, fallback) => (HEX.test(String(value || '').trim()) ? String(value).trim() : fallback);
const choice = (value, options, fallback) => (options.some((o) => o.value === value) ? value : fallback);
const clampInt = (value, min, max, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : fallback;
};
const text = (value, max) => String(value ?? '').slice(0, max);

// An ordered show/hide list: every known key exactly once, in the brand's
// order; keys the brand never saw get their standard visibility.
const orderedList = (raw, known) => {
  const seen = new Set();
  const out = [];
  (Array.isArray(raw) ? raw : []).forEach((item) => {
    const def = item && known.find((k) => k.key === item.key);
    if (!def || seen.has(def.key)) return;
    seen.add(def.key);
    out.push({ key: def.key, visible: item.visible !== false });
  });
  known.forEach((def) => {
    if (!seen.has(def.key)) out.push({ key: def.key, visible: def.on !== false });
  });
  return out;
};

// Fills in anything missing or invalid, so a theme can always be drawn.
export function normalizeDppTheme(raw) {
  const t = raw && typeof raw === 'object' ? raw : {};
  const d = DEFAULT_DPP_THEME;
  return {
    pageBg: color(t.pageBg, d.pageBg),
    cardBg: color(t.cardBg, d.cardBg),
    accent: color(t.accent, d.accent),
    buttonText: color(t.buttonText, d.buttonText),
    textColor: color(t.textColor, d.textColor),
    headerColor: color(t.headerColor, ''),
    badgeColor: color(t.badgeColor, ''),
    headerStyle: choice(t.headerStyle, DPP_CHOICES.headerStyle, d.headerStyle),
    buttonStyle: choice(t.buttonStyle, DPP_CHOICES.buttonStyle, d.buttonStyle),
    buttonRadius: clampInt(t.buttonRadius, 0, 30, d.buttonRadius),
    cardStyle: choice(t.cardStyle, DPP_CHOICES.cardStyle, d.cardStyle),
    cardRadius: clampInt(t.cardRadius, 0, 28, d.cardRadius),
    tabStyle: choice(t.tabStyle, DPP_CHOICES.tabStyle, d.tabStyle),
    textScale: choice(t.textScale, DPP_CHOICES.textScale, d.textScale),
    fontFamily: DPP_FONTS.some((f) => f.value === t.fontFamily) ? t.fontFamily : d.fontFamily,
    heroLayout: choice(t.heroLayout, DPP_CHOICES.heroLayout, d.heroLayout),
    showProductId: t.showProductId !== false,
    blocks: orderedList(t.blocks, DPP_BLOCKS),
    sections: orderedList(t.sections, DPP_SECTIONS),
    message: { title: text(t.message?.title, 80), body: text(t.message?.body, 400) },
    cta: { label: text(t.cta?.label, 40), url: text(t.cta?.url, 300).trim() },
  };
}

// True when nothing differs from the standard look.
export const isDefaultDppTheme = (raw) => JSON.stringify(normalizeDppTheme(raw)) === JSON.stringify(DEFAULT_DPP_THEME);

// Blend two #rrggbb colours; amount 0 = all a, 1 = all b.
const mix = (a, b, amount) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * amount).toString(16).padStart(2, '0')).join('')}`;
};

// White or near-black, whichever reads better on the given colour.
const readableOn = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? '#1a1a1a' : '#ffffff';
};

// The colour tokens the product page is drawn with, for a theme. Same
// derivation as the app's buildPalette (app/src/utils/dppTheme.ts), so the
// admin preview and the real page agree. The default theme gives exactly
// the standard Yometel colours.
export const dppPalette = (rawTheme) => {
  const t = normalizeDppTheme(rawTheme);
  if (isDefaultDppTheme(t)) {
    return {
      primary: '#1b4f72', primaryDark: '#123a56', headerLight: '#4a96dd', header: '#1b4f72', text: '#33415c', muted: '#7a8aa3',
      placeholder: '#9aa7bd', bg: '#f4f7fc', surface: '#ffffff', surfaceAlt: '#eef2f8', border: '#e7edf6',
      authBg: '#eef5fc', danger: '#c0392b', onPrimary: '#ffffff', onHeader: '#ffffff', badge: '#1b4f72', onBadge: '#ffffff',
    };
  }
  const header = t.headerColor || t.accent;
  const badge = t.badgeColor || t.accent;
  return {
    primary: t.accent,
    primaryDark: mix(t.accent, '#000000', 0.25),
    header,
    // The light end of the header gradient; the same as `header` when plain.
    headerLight: t.headerStyle === 'solid' ? header : mix(header, '#ffffff', 0.35),
    text: t.textColor,
    muted: mix(t.textColor, t.cardBg, 0.2),
    placeholder: mix(t.textColor, t.cardBg, 0.45),
    bg: t.pageBg,
    surface: t.cardBg,
    surfaceAlt: mix(t.cardBg, t.accent, 0.07),
    border: mix(t.cardBg, t.accent, 0.14),
    authBg: mix(t.cardBg, badge, 0.1),
    danger: '#c0392b',
    onPrimary: t.buttonText,
    onHeader: readableOn(header),
    badge,
    onBadge: readableOn(badge),
  };
};

// How the main (filled) button is drawn, per the brand's button style.
export const dppButtonFill = (rawTheme) => {
  const t = normalizeDppTheme(rawTheme);
  const p = dppPalette(t);
  if (isDefaultDppTheme(t)) return { background: `linear-gradient(135deg, ${p.headerLight} 0%, ${p.primary} 100%)`, color: '#ffffff', border: 'none' };
  if (t.buttonStyle === 'outline') return { background: p.surface, color: p.primary, border: `1.5px solid ${p.primary}` };
  if (t.buttonStyle === 'solid') return { background: p.primary, color: p.onPrimary, border: 'none' };
  return { background: `linear-gradient(135deg, ${mix(p.primary, '#ffffff', 0.35)} 0%, ${p.primary} 100%)`, color: p.onPrimary, border: 'none' };
};

export const dppFontCss = (value) => (DPP_FONTS.find((f) => f.value === value) || DPP_FONTS[0]).css;
export const dppSectionLabel = (key) => (DPP_SECTIONS.find((s) => s.key === key) || {}).label || key;
export const dppBlockLabel = (key) => (DPP_BLOCKS.find((b) => b.key === key) || {}).label || key;
