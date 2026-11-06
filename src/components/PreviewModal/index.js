import * as React from 'react';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SvgIcon from '@mui/material/SvgIcon';
import CropFreeIcon from '@mui/icons-material/CropFree';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import CategoryIcon from '@mui/icons-material/Category';
import PaletteIcon from '@mui/icons-material/Palette';
import StraightenIcon from '@mui/icons-material/Straighten';
import SpaIcon from '@mui/icons-material/Spa';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ShieldIcon from '@mui/icons-material/Shield';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import RecyclingIcon from '@mui/icons-material/Recycling';
import GridViewIcon from '@mui/icons-material/GridView';
import BuildIcon from '@mui/icons-material/Build';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import { readyServices } from '../../utils/circularity';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HubIcon from '@mui/icons-material/Hub';
import PlaceIcon from '@mui/icons-material/Place';
import CloudIcon from '@mui/icons-material/Cloud';
import BoltIcon from '@mui/icons-material/Bolt';
import VerifiedIcon from '@mui/icons-material/Verified';
import EcoIcon from '@mui/icons-material/Nature';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PublicIcon from '@mui/icons-material/Public';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import TimelineIcon from '@mui/icons-material/Timeline';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import WifiIcon from '@mui/icons-material/Wifi';
import Battery80Icon from '@mui/icons-material/Battery80';
import CameraIcon from '../../assets/camera_icon.png';
import YoutubeIcon from '../../assets/youtube-icon.png';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { Backend_URL, getFileUrl, normalizeProductVideos, normalizeProductImages } from '../../helper';
import { DPP_TEXT_SCALE, dppButtonFill, dppFontCss, dppPalette, normalizeDppTheme } from '../../utils/dppTheme';
import MediaLightbox from '../MediaLightbox';

// The colours this preview is drawn with: the app's own tokens (src/theme.ts)
// or, when the brand has its own look, the same tokens with its colours
// swapped in (utils/dppTheme.dppPalette). Row reads them through context.
const PaletteContext = React.createContext(dppPalette(null));

// The preview dialog is an iPhone 16: a 393 x 852 pt screen (54 pt status
// bar with the Dynamic Island, 34 pt home indicator) in a thin bezel, scaled
// down as a whole when the window is too small to show it at full size.
const IPHONE_16 = { width: 393, height: 852, statusBar: 54, homeIndicator: 34, radius: 55, bezel: 12 };
// The phone view below is drawn at a smaller scale than the app's real
// sizes (fonts, icons, bars); inside the iPhone frame it is enlarged by
// this much so it matches the app on a real iPhone 16.
const DEVICE_CONTENT_ZOOM = 1.2;

// The app's Lifecycle icon (Material "eco"), which @mui/icons-material does not ship.
const LeafIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M6.05 8.05c-2.73 2.73-2.73 7.15-.02 9.88 1.47-3.4 4.09-6.24 7.36-7.93-2.77 2.34-4.71 5.61-5.39 9.32 2.6 1.23 5.8.78 7.95-1.37C19.43 14.47 20 4 20 4S9.53 4.57 6.05 8.05z" />
  </SvgIcon>
);

// Overview blocks the app groups right under the photos.
const BUTTON_BLOCKS = ['feedback', 'actions'];

export const SERVICE_ICON = { repair: BuildIcon, resell: StorefrontIcon, rent: EventRepeatIcon, recycle: RecyclingIcon };

// Mirrors ProductLifecycleScreen's JOURNEY_STAGES in the app.
export const JOURNEY_STAGES = [
  { key: 'materials', label: 'Materials', Icon: SpaIcon },
  { key: 'manufacturing', label: 'Manufacturing', Icon: PrecisionManufacturingIcon },
  { key: 'transportation', label: 'Transportation', Icon: LocalShippingIcon },
  { key: 'use', label: 'Use Phase', Icon: CheckroomIcon },
  { key: 'endOfLife', label: 'Reuse & Recycling', Icon: RecyclingIcon },
];

const LIFECYCLE_TABS = [
  { key: 'journey', label: 'Journey' },
  { key: 'dispose', label: 'Reuse & Recycle' },
  { key: 'materials', label: 'Materials' },
  { key: 'traceability', label: 'Origin & Impact' },
  { key: 'care', label: 'Care' },
  { key: 'compliance', label: 'Compliance' },
];

// The section each Journey step opens (Transportation has none and shows its
// shipping details), and icons for sections no step covers -- those are
// listed after the steps. Same as the app's STAGE_TAB / TAB_ICON.
const STAGE_TAB = { materials: 'materials', manufacturing: 'traceability', transportation: null, use: 'care', endOfLife: 'dispose' };
const TAB_ICON = {
  journey: TimelineIcon,
  care: LocalLaundryServiceIcon,
  materials: SpaIcon,
  dispose: RecyclingIcon,
  traceability: PublicIcon,
  compliance: VerifiedUserIcon,
};

// Mirrors ProductLifecycleScreen's CARE_TIP_BY_ICON fallback (used when the
// brand hasn't supplied its own maintenance.tips list).
export const CARE_TIP_BY_ICON = {
  wash_30: { primary: 'Machine wash cold.', detail: 'Maximum 30°C' },
  wash_40: { primary: 'Machine wash warm.', detail: 'Maximum 40°C' },
  wash_50: { primary: 'Machine wash.', detail: 'Maximum 50°C' },
  wash_60: { primary: 'Machine wash hot.', detail: 'Maximum 60°C' },
  wash_70: { primary: 'Machine wash.', detail: 'Maximum 70°C' },
  dry_clean_P: { primary: 'Professional dry clean only.', detail: 'Perchloroethylene solvent' },
  dry_clean_F: { primary: 'Professional dry clean only.', detail: 'Hydrocarbon solvent' },
  iron_low: { primary: 'Iron on low heat, avoid steam.', detail: 'Max 110°C' },
  iron_med: { primary: 'Iron on medium heat.', detail: 'Max 150°C' },
  iron_high: { primary: 'Iron on high heat.', detail: 'Max 200°C' },
  bleach_no: { primary: 'Do not bleach.' },
  bleach_any: { primary: 'Any bleach may be used when needed.' },
  tumble_dry_low: { primary: 'Tumble dry on low heat.' },
  tumble_dry_high: { primary: 'Tumble dry on a normal / high setting.' },
};

export const CARE_SYMBOL_GLYPH = {
  wash_30: '30°', wash_40: '40°', wash_50: '50°', wash_60: '60°', wash_70: '70°',
  dry_clean_P: 'P', dry_clean_F: 'F',
  iron_low: '•', iron_med: '••', iron_high: '•••',
  bleach_no: '⌀', bleach_any: '△',
  tumble_dry_low: '○', tumble_dry_high: '◎',
};
export const CARE_SYMBOL_LABEL = {
  wash_30: 'Wash up to 30°C', wash_40: 'Wash up to 40°C', wash_50: 'Wash up to 50°C', wash_60: 'Wash up to 60°C', wash_70: 'Wash up to 70°C',
  dry_clean_P: 'Dry clean P', dry_clean_F: 'Dry clean F',
  iron_low: 'Iron low', iron_med: 'Iron med', iron_high: 'Iron high',
  bleach_no: 'Bleach no', bleach_any: 'Bleach any',
  tumble_dry_low: 'Tumble dry low', tumble_dry_high: 'Tumble dry high',
};

// "25kg" -> "25 kg" -- purely a spacing fix, never invents/changes the unit.
export const formatUnitSpacing = (raw) => {
  if (!raw) return raw;
  return String(raw).replace(/^(\s*[\d.,]+)\s*([a-zA-Zµ].*)$/, '$1 $2').trim();
};
export const toArray = (v) => (v == null ? [] : Array.isArray(v) ? v : typeof v === 'object' ? Object.values(v) : [v]);

// Generic label/value row -- mirrors ProductLifecycleScreen's <Row>. Renders
// nothing when there's no value so callers can list every possible field
// without hand-guarding each one.
function Row({ icon: Icon, label, value, onClick, chevron, expanded, arrow }) {
  const C = useContext(PaletteContext);
  if (!value) return null;
  return (
    <Box
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 1,
        borderBottom: `1px solid ${C.border}`,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {Icon && <Icon sx={{ fontSize: 18, color: C.primary }} />}
      <Typography sx={{ fontSize: 12, color: C.text, flex: 1 }}>{label}</Typography>
      <Typography sx={{ fontSize: 12, color: C.muted, textAlign: 'right' }}>{value}</Typography>
      {chevron && (expanded ? <ExpandLessIcon sx={{ fontSize: 18, color: C.muted }} /> : <ExpandMoreIcon sx={{ fontSize: 18, color: C.muted }} />)}
      {arrow && <ChevronRightIcon sx={{ fontSize: 18, color: C.muted }} />}
    </Box>
  );
}

// The shopper's product page as a phone screen: Product Overview and Product
// Lifecycle, as in the app, drawn from `productInfo` in the brand's look
// (`theme`: colours, font, button corners, which lifecycle tabs and in what
// order). Fills its parent — the preview dialog below, or the studio's
// Experience panel. `onClose` adds the close button (dialog only).
// iPhone 16 status bar (time, Dynamic Island, signal/Wi-Fi/battery) above
// the phone view and the home indicator below it. The status bar sits on the
// same gradient as the app's top bar, as on a real phone.
function DeviceShell({ device, gradient, C, children }) {
  if (!device) return children;
  const ink = C.onHeader;
  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: gradient }}>
      <Box sx={{ height: IPHONE_16.statusBar, flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', px: '32px', pt: '6px' }}>
        <Typography sx={{ flex: 1, fontSize: 17, fontWeight: 600, color: ink, fontFamily: '-apple-system, "SF Pro Text", "Segoe UI", sans-serif' }}>9:41</Typography>
        <Box aria-hidden sx={{ position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)', width: 125, height: 37, borderRadius: 20, bgcolor: '#000' }} />
        <Box aria-hidden sx={{ display: 'flex', alignItems: 'center', gap: '5px', color: ink }}>
          <SignalCellularAltIcon sx={{ fontSize: 19 }} />
          <WifiIcon sx={{ fontSize: 19 }} />
          <Battery80Icon sx={{ fontSize: 22, transform: 'rotate(90deg)' }} />
        </Box>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{children}</Box>
      <Box aria-hidden sx={{ height: IPHONE_16.homeIndicator, flexShrink: 0, bgcolor: C.surface, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pb: '8px' }}>
        <Box sx={{ width: 134, height: 5, borderRadius: 3, bgcolor: '#000' }} />
      </Box>
    </Box>
  );
}

export function DppPhoneView({ productInfo, theme, onClose, device = false }) {
  const look = useMemo(() => normalizeDppTheme(theme), [theme]);
  const C = useMemo(() => dppPalette(theme), [theme]);
  // Same diagonal direction as the app's top bar / buttons (see GradientButton /
  // AppLayout) -- a straight top-to-bottom gradient read as a visibly different
  // "atmosphere" next to the app once the app switched to this angle.
  const GRADIENT = `linear-gradient(135deg, ${C.headerLight} 0%, ${C.header} 100%)`;
  // Cards follow the brand's corner radius and card style.
  const card = {
    bgcolor: C.surface,
    borderRadius: `${look.cardRadius}px`,
    border: look.cardStyle === 'flat' ? 'none' : `1px solid ${C.border}`,
    p: 1.5,
    mx: 2,
    mt: 1,
    boxShadow: look.cardStyle === 'shadow' ? '0 4px 10px rgba(27,79,114,0.08)' : 'none',
  };
  const mainButton = useMemo(() => dppButtonFill(theme), [theme]);
  const cardTitle = { fontSize: 13, fontWeight: 700, color: C.primary, mb: 0.75 };
  const buttonRadius = `${look.buttonRadius}px`;
  // Lifecycle tabs in the brand's order, minus the ones it hides.
  const lifecycleTabs = useMemo(() => {
    const ordered = look.sections.filter((s) => s.visible).map((s) => LIFECYCLE_TABS.find((tb) => tb.key === s.key)).filter(Boolean);
    return ordered.length ? ordered : LIFECYCLE_TABS;
  }, [look]);

  const [slideIndex, setSlideIndex] = useState(0);
  // Slide index open in the full-screen viewer (null = closed).
  const [lightboxIndex, setLightboxIndex] = useState(null);
  // 'overview' mirrors ResultScreen (Product Overview); 'lifecycle' mirrors
  // ProductLifecycleScreen -- same two destinations as the app's product
  // bottom bar (its third item, Scan, doesn't apply inside a static preview).
  const [view, setView] = useState('overview');
  // The lifecycle page's steps: Journey steps whose section the brand shows,
  // then any shown section no step covers (e.g. Compliance).
  const lifecycleItems = useMemo(() => {
    const shown = new Set(lifecycleTabs.map((tb) => tb.key));
    const steps = JOURNEY_STAGES
      .filter((st) => !STAGE_TAB[st.key] || shown.has(STAGE_TAB[st.key]))
      .map((st) => ({ key: st.key, label: st.label, Icon: st.Icon, tab: STAGE_TAB[st.key] }));
    const covered = new Set(steps.map((it) => it.tab).filter(Boolean));
    const extra = lifecycleTabs
      .filter((tb) => tb.key !== 'journey' && !covered.has(tb.key))
      .map((tb) => ({ key: `tab-${tb.key}`, label: tb.label, Icon: TAB_ICON[tb.key] || InfoOutlinedIcon, tab: tb.key }));
    return [...steps, ...extra];
  }, [lifecycleTabs]);
  // The one expanded step; its row is pinned at the top of the page while
  // its content scrolls, as in the app.
  const [openItem, setOpenItem] = useState(null);
  const scrollerRef = useRef(null);
  const stepRowRefs = useRef({});
  useEffect(() => {
    if (!openItem) return undefined;
    const id = requestAnimationFrame(() => {
      const sc = scrollerRef.current;
      const row = stepRowRefs.current[openItem];
      if (!sc || !row) return;
      // Screen pixels -> the scroller's own units (the preview may be zoomed
      // or scaled down as a whole).
      const rect = sc.getBoundingClientRect();
      const perPx = rect.height ? sc.clientHeight / rect.height : 1;
      sc.scrollBy({ top: (row.getBoundingClientRect().top - rect.top) * perPx, behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(id);
  }, [openItem]);
  const [openOrigin, setOpenOrigin] = useState(null);
  const [openService, setOpenService] = useState(null);

  const info = productInfo || {};
  const images = normalizeProductImages(info.images);
  const videos = normalizeProductVideos(info.videos);
  const slides = [
    ...images.map((src) => ({ type: 'image', src })),
    ...videos.map((video) => ({ type: 'video', video })),
  ];
  const safeIndex = slides.length ? Math.min(slideIndex, slides.length - 1) : 0;
  const active = slides[safeIndex];

  const highlightRows = [
    info.name && { Icon: LocalOfferIcon, text: info.name, strong: true },
    info.productType && { Icon: CategoryIcon, text: `Type: ${info.productType}` },
    info.color && { Icon: PaletteIcon, text: `Color: ${info.color}` },
    info.size && { Icon: StraightenIcon, text: `Size: ${info.size}` },
  ].filter(Boolean);

  const go = (dir) => {
    if (!slides.length) return;
    setSlideIndex((i) => (i + dir + slides.length) % slides.length);
  };

  // Drag-to-swipe on the media box, alongside the existing left/right
  // click zones — pointer events cover both mouse-drag (desktop) and touch
  // (mobile web) in one handler. `justDraggedRef` suppresses the click
  // zones' own onClick right after a real drag, so a swipe doesn't also
  // fire a second, click-based navigation on release.
  const dragStateRef = useRef({ startX: 0, dragging: false });
  const justDraggedRef = useRef(false);
  const SWIPE_THRESHOLD_PX = 30;
  const handleSlidePointerDown = (e) => {
    dragStateRef.current = { startX: e.clientX, dragging: true };
  };
  const handleSlidePointerUp = (e) => {
    if (!dragStateRef.current.dragging) return;
    dragStateRef.current.dragging = false;
    const dx = e.clientX - dragStateRef.current.startX;
    if (Math.abs(dx) > SWIPE_THRESHOLD_PX) {
      justDraggedRef.current = true;
      go(dx < 0 ? 1 : -1);
    }
  };
  const handleSlidePointerLeave = () => {
    dragStateRef.current.dragging = false;
  };
  const handleSlideZoneClick = (dir) => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    go(dir);
  };

  const openLightbox = () => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    if (slides.length) setLightboxIndex(safeIndex);
  };

  const goToLifecycle = () => {
    setView('lifecycle');
    setOpenItem(null);
  };

  // ---- Lifecycle data (mirrors ProductLifecycleScreen's field mapping --
  // same backend model, so the field names line up directly). ----
  const maintenance = info.maintenance || {};
  const careIcons = toArray(maintenance.iconIds).filter(Boolean);
  const manualCareTips = toArray(maintenance.tips).filter(Boolean);
  const careTips = manualCareTips.length
    ? manualCareTips.map((tipText) => ({ primary: tipText }))
    : careIcons.map((id) => CARE_TIP_BY_ICON[id] || { primary: `${CARE_SYMBOL_LABEL[id] || id}.` });
  const materialSize = info.materialSize || {};
  const materials = toArray(materialSize.materials);
  const certifications = toArray(info.certifications)
    .map((c) => (typeof c === 'string' ? { title: c } : c))
    .filter((c) => c && (c.title || c.content));
  const esg = info.traceabilityEsg || {};
  const materialOrigins = toArray(esg.materialOrigins);
  const originCountry = esg.originCountry || esg.madeIn || '';
  const originCountries = Array.from(new Set(materialOrigins.map((o) => o.country || o.origin).filter(Boolean)));
  const routeInfo = esg.route || {};
  const impactRaw = info.sustainabilityImpact || {};
  const impactItems = (Array.isArray(impactRaw.items) && impactRaw.items.length
    ? impactRaw.items
    : [
        impactRaw.co2Avoided && { value: impactRaw.co2Avoided, label: 'CO2 Avoided', Icon: EcoIcon },
        impactRaw.waterSaved && { value: impactRaw.waterSaved, label: 'Water Saved', Icon: WaterDropIcon },
        impactRaw.energySaved && { value: impactRaw.energySaved, label: 'Energy Saved', Icon: BoltIcon },
      ].filter(Boolean));

  // Repair / resell / rent / recycle: only what the brand offers.
  const services = readyServices(info);

  const renderMediaBox = ({ size = 132, width, height, rounded = 1.5, bg = '#000', dots = true } = {}) => (
    <Box
      onPointerDown={slides.length > 1 ? handleSlidePointerDown : undefined}
      onPointerUp={slides.length > 1 ? handleSlidePointerUp : undefined}
      onPointerLeave={slides.length > 1 ? handleSlidePointerLeave : undefined}
      sx={{
        width: width ?? size,
        height: height ?? size,
        flexShrink: 0,
        position: 'relative',
        bgcolor: bg,
        borderRadius: rounded,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: slides.length > 1 ? 'pan-y' : undefined,
      }}
    >
      {active ? (
        // The middle of the box (between the left/right page zones) opens
        // the full-screen viewer — for photos as well as videos.
        <Box
          role="button"
          aria-label={active.type === 'video' ? 'Play video' : 'View full screen'}
          onClick={openLightbox}
          sx={{ width: '100%', height: '100%', position: 'relative', cursor: 'zoom-in', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {active.type === 'video' ? (
            <>
              {active.video.videoId && (
                <img
                  src={`https://img.youtube.com/vi/${active.video.videoId}/hqdefault.jpg`}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              <PlayCircleFilledIcon
                sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 44, color: '#fff' }}
              />
            </>
          ) : (
            <img src={getFileUrl(active.src)} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          )}
        </Box>
      ) : (
        <Typography sx={{ color: '#fff', fontSize: 12 }}>No image</Typography>
      )}

      {slides.length > 1 && dots && (
        <>
          <Box onClick={() => handleSlideZoneClick(-1)} sx={{ position: 'absolute', inset: '0 auto 0 0', width: '35%', cursor: 'pointer' }} />
          <Box onClick={() => handleSlideZoneClick(1)} sx={{ position: 'absolute', inset: '0 0 0 auto', width: '35%', cursor: 'pointer' }} />
          <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 6, display: 'flex', justifyContent: 'center', gap: 0.5 }}>
            {slides.map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: i === safeIndex ? 14 : 6,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: i === safeIndex ? C.headerLight : 'rgba(255,255,255,0.7)',
                }}
              />
            ))}
          </Box>
        </>
      )}
      {active && !dots && (
        <Box sx={{ position: 'absolute', right: 6, bottom: 6, width: 24, height: 24, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <ZoomOutMapIcon sx={{ fontSize: 14, color: '#fff' }} />
        </Box>
      )}
      {active && dots && (
        <Box sx={{ position: 'absolute', right: 6, bottom: 6, bgcolor: 'rgba(0,0,0,0.55)', borderRadius: 1, px: 0.5, py: 0.25 }}>
          {active.type === 'video' && !active.video.videoId ? (
            <PlayCircleFilledIcon sx={{ fontSize: 12, color: '#fff', display: 'block' }} />
          ) : (
            <img src={active.type === 'video' ? YoutubeIcon : CameraIcon} alt="" style={{ height: 12, width: 12, display: 'block' }} />
          )}
        </Box>
      )}
      {active && dots && size >= 100 && (
        <IconButton
          size="small"
          aria-label="View full screen"
          onClick={openLightbox}
          sx={{ position: 'absolute', right: 4, top: 4, zIndex: 1, color: '#fff', bgcolor: 'rgba(0,0,0,0.45)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
        >
          <ZoomOutMapIcon sx={{ fontSize: 16 }} />
        </IconButton>
      )}
    </Box>
  );

  const brand = info.brandInfo || {};
  // Slider with a column of thumbnails on its right, like the app's
  // Product Summary / Overview; tapping a thumbnail shows it in the slider.
  const renderMediaWithThumbs = () => (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>{renderMediaBox({ width: '100%', height: 200, bg: C.surface, dots: false })}</Box>
      {slides.length > 1 && (
        <Box sx={{ flexShrink: 0, height: 200, width: Math.ceil(slides.length / 4) * 45 + (Math.ceil(slides.length / 4) - 1) * 6, display: 'flex', flexDirection: 'column', flexWrap: 'wrap', alignContent: 'flex-start', gap: '6px' }}>
          {slides.map((sl, i) => (
            <Box
              key={i}
              role="button"
              aria-label={sl.type === 'video' ? 'Play video' : `Image ${i + 1}`}
              onClick={() => setSlideIndex(i)}
              sx={{
                width: 45,
                height: 45,
                boxSizing: 'border-box',
                flexShrink: 0,
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
                bgcolor: sl.type === 'video' ? '#000' : C.surface,
                border: i === safeIndex ? `2px solid ${C.primaryDark || C.primary}` : `1px solid ${C.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {sl.type === 'video' ? (
                <>
                  {sl.video.videoId && (
                    <img src={`https://img.youtube.com/vi/${sl.video.videoId}/default.jpg`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  <PlayCircleFilledIcon sx={{ position: 'relative', fontSize: 20, color: '#fff' }} />
                </>
              ) : (
                <img src={getFileUrl(sl.src)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );

  // The blocks of the Overview below the product card. The brand chooses
  // which show and in what order (theme.blocks); a block with nothing to
  // show (no highlights, no message written...) is skipped.
  const overviewBlocks = {
    highlights: () => highlightRows.length > 0 && (
      <Box sx={card}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
          <Typography sx={{ ...cardTitle, mb: 0, flex: 1 }}>Key Highlights</Typography>
          <Box
            role="button"
            onClick={goToLifecycle}
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.5, borderRadius: 999, ...mainButton, cursor: 'pointer' }}
          >
            <LeafIcon sx={{ fontSize: 15 }} />
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: 'inherit' }}>Lifecycle</Typography>
            <ChevronRightIcon sx={{ fontSize: 16 }} />
          </Box>
        </Box>
        {highlightRows.map((row, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.4 }}>
            <row.Icon sx={{ fontSize: 15, color: C.primary }} />
            <Typography sx={{ fontSize: 12, color: row.strong ? C.primary : C.text, fontWeight: row.strong ? 700 : 400 }}>{row.text}</Typography>
          </Box>
        ))}
      </Box>
    ),
    // The Lifecycle Preview strip is gone from the app; the Key Highlights
    // Lifecycle button and the bottom bar open the Lifecycle page.
    lifecycle: () => null,
    about: () => !!info.aboutProduct && (
      <Box sx={card}>
        <Typography sx={cardTitle}>About This Product</Typography>
        <Typography sx={{ fontSize: 12, color: C.text, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{info.aboutProduct}</Typography>
      </Box>
    ),
    brand: () => !!brand.name && (
      <Box sx={card}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
          {!!brand.logoUrl && <Box component="img" src={getFileUrl(brand.logoUrl)} alt="" sx={{ width: 32, height: 32, objectFit: 'contain', bgcolor: '#e6eaf0', borderRadius: 1, p: '2px' }} />}
          <Typography sx={{ ...cardTitle, mb: 0 }}>{brand.name}</Typography>
        </Box>
        {!!brand.detail && <Typography sx={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{brand.detail}</Typography>}
        {!!brand.websiteUrl && <Typography sx={{ fontSize: 12, fontWeight: 600, color: C.primary, mt: 0.75 }}>Visit website ›</Typography>}
      </Box>
    ),
    message: () => (!!look.message.title || !!look.message.body) && (
      <Box sx={card}>
        {!!look.message.title && <Typography sx={cardTitle}>{look.message.title}</Typography>}
        {!!look.message.body && <Typography sx={{ fontSize: 12, color: C.text, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{look.message.body}</Typography>}
      </Box>
    ),
    cta: () => !!look.cta.label && !!look.cta.url && (
      <Box sx={{ mx: 2, mt: 1, py: 1, borderRadius: buttonRadius, textAlign: 'center', fontSize: 13, fontWeight: 700, ...mainButton }}>
        {look.cta.label}
      </Box>
    ),
    feedback: () => (
      <Box sx={{ display: 'flex', gap: 1, mx: 2, mt: 1 }}>
        {[ThumbUpOffAltIcon, AddShoppingCartIcon, ThumbDownOffAltIcon].map((Ico, i) => (
          <Box key={i} sx={{ flex: 1, height: 36, borderRadius: 1.5, border: `1.5px solid ${C.primary}`, bgcolor: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ico sx={{ fontSize: 19, color: C.primary }} />
          </Box>
        ))}
      </Box>
    ),
    actions: () => (
      <Box sx={{ display: 'flex', gap: 1, mx: 2, mt: 1 }}>
        <Box sx={{ flex: 1, py: 1, borderRadius: buttonRadius, textAlign: 'center', fontSize: 13, fontWeight: 600, color: C.primary, border: `1.5px solid ${C.primary}`, bgcolor: C.surface }}>
          Brand Company
        </Box>
        <Box sx={{ flex: 1, py: 1, borderRadius: buttonRadius, textAlign: 'center', fontSize: 13, fontWeight: 700, ...mainButton }}>
          Scan Product
        </Box>
      </Box>
    ),
  };

  const renderOverview = () => (
    <>
      <Box sx={{ ...card, mt: 2 }}>{renderMediaWithThumbs()}</Box>
      {look.blocks.filter((b) => b.visible && BUTTON_BLOCKS.includes(b.key)).map((b) => (
        <React.Fragment key={b.key}>{overviewBlocks[b.key]?.()}</React.Fragment>
      ))}
      {look.blocks.filter((b) => b.visible && !BUTTON_BLOCKS.includes(b.key)).map((b) => (
        <React.Fragment key={b.key}>{overviewBlocks[b.key]?.()}</React.Fragment>
      ))}
    </>
  );

  // Transportation has no section of its own: its shipping details.
  const renderTransportDetail = () => (
    <Box sx={{ mx: 2, mt: 1, bgcolor: C.bg, borderRadius: 1.5, p: 1 }}>
      <Row label="Shipping Log" value={esg.shippingLog} />
      <Row label="Distance" value={esg.distance} />
      <Row label="Est. Emissions" value={formatUnitSpacing(routeInfo.emissions || esg.co2Transportation)} />
      {!esg.shippingLog && !esg.distance && !routeInfo.emissions && !esg.co2Transportation && (
        <Typography sx={{ fontSize: 11, color: C.muted }}>No data yet.</Typography>
      )}
    </Box>
  );

  // Lifecycle page: each step's row (round icon on a line to the next step);
  // the open step's section right below its row, which stays pinned at the
  // top while the section scrolls. Opening another step closes the first.
  const renderLifecycleList = () => (
    <Box sx={{ pt: 2.5 }}>
      {lifecycleItems.map((it, i) => {
        const isOpen = openItem === it.key;
        const last = i === lifecycleItems.length - 1;
        return (
          <React.Fragment key={it.key}>
            <Box
              ref={(el) => { stepRowRefs.current[it.key] = el; }}
              role="button"
              aria-expanded={isOpen}
              onClick={() => setOpenItem(isOpen ? null : it.key)}
              sx={{
                display: 'flex',
                gap: 1.5,
                px: 2,
                cursor: 'pointer',
                bgcolor: C.bg,
                ...(isOpen ? { position: 'sticky', top: 0, zIndex: 2, py: 0.75, mb: 0.5, borderBottom: `1px solid ${C.border}` } : {}),
              }}
            >
              <Box sx={{ width: 34, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <Box sx={{ width: 34, height: 34, borderRadius: '50%', bgcolor: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <it.Icon sx={{ fontSize: 17, color: '#fff' }} />
                </Box>
                {!last && !isOpen && <Box sx={{ width: 2, height: 14, bgcolor: C.primary, my: 0.5, borderRadius: 1 }} />}
              </Box>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 34 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.text }}>{it.label}</Typography>
                {isOpen ? <ExpandLessIcon sx={{ fontSize: 18, color: C.muted }} /> : <ExpandMoreIcon sx={{ fontSize: 18, color: C.muted }} />}
              </Box>
            </Box>
            {isOpen && (
              <Box sx={{ pb: 2 }}>
                {it.tab ? renderSection(it.tab) : renderTransportDetail()}
              </Box>
            )}
          </React.Fragment>
        );
      })}
      <Box sx={{ ...card, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <InfoOutlinedIcon sx={{ fontSize: 18, color: C.primary, mt: 0.25 }} />
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: C.text }}>Understanding the Product Lifecycle</Typography>
          <Typography sx={{ fontSize: 11, color: C.muted, mt: 0.25 }}>This page summarizes your product's full lifecycle journey. Tap any step to explore details.</Typography>
        </Box>
      </Box>
    </Box>
  );

  const renderCare = () => (
    <Box sx={{ pt: 1.5 }}>
      <Box sx={card}>
        <Typography sx={cardTitle}>Care Symbols</Typography>
        {careIcons.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {careIcons.map((id, i) => (
              <Box key={`${id}-${i}`} sx={{ width: 56, textAlign: 'center' }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 1.5, border: `1px solid ${C.border}`, mx: 'auto', mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: C.text }}>{CARE_SYMBOL_GLYPH[id] || '?'}</Typography>
                </Box>
                <Typography sx={{ fontSize: 9, color: C.muted, lineHeight: 1.1 }}>{CARE_SYMBOL_LABEL[id] || id}</Typography>
              </Box>
            ))}
          </Box>
        ) : <Typography sx={{ fontSize: 11, color: C.muted }}>No data yet.</Typography>}
      </Box>
      <Box sx={card}>
        <Typography sx={cardTitle}>Care Tips</Typography>
        {careTips.length > 0 ? careTips.map((tip, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', py: 0.5 }}>
            <CheckCircleIcon sx={{ fontSize: 14, color: C.primary, mt: 0.25 }} />
            <Box>
              <Typography sx={{ fontSize: 12, color: C.text }}>{tip.primary}</Typography>
              {!!tip.detail && <Typography sx={{ fontSize: 10, color: C.muted }}>{tip.detail}</Typography>}
            </Box>
          </Box>
        )) : <Typography sx={{ fontSize: 11, color: C.muted }}>No data yet.</Typography>}
      </Box>
      <Box sx={{ ...card, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <EcoIcon sx={{ fontSize: 18, color: '#2e7d32', mt: 0.25 }} />
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: C.text }}>Sustainability & Help</Typography>
          <Typography sx={{ fontSize: 11, color: C.muted, mt: 0.25 }}>Proper care extends the life of your product and reduces environmental impact.</Typography>
        </Box>
      </Box>
    </Box>
  );

  const renderMaterials = () => (
    <Box sx={{ pt: 1.5 }}>
      <Box sx={card}>
        <Typography sx={cardTitle}>Composition</Typography>
        {materials.length > 0 ? materials.map((m, i) => (
          <Box key={i} sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: 12, color: C.text }}>{m.material || '—'}</Typography>
              <Typography sx={{ fontSize: 12, color: C.muted }}>{m.percent != null ? `${m.percent}%` : ''}</Typography>
            </Box>
            <Box sx={{ height: 6, borderRadius: 3, bgcolor: C.surfaceAlt, overflow: 'hidden', mt: 0.5 }}>
              <Box sx={{ height: '100%', width: `${Math.max(2, Math.min(100, Number(m.percent) || 0))}%`, bgcolor: C.primary, borderRadius: 3 }} />
            </Box>
          </Box>
        )) : <Typography sx={{ fontSize: 11, color: C.muted }}>No data yet.</Typography>}

        {materialOrigins.length > 0 && (
          <>
            <Typography sx={{ ...cardTitle, mt: 1.5 }}>Material Origins</Typography>
            {materialOrigins.map((o, i) => {
              const key = `materials-${i}`;
              const isOpen = openOrigin === key;
              return (
                <Box key={i}>
                  <Box
                    role="button"
                    onClick={() => setOpenOrigin(isOpen ? null : key)}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}
                  >
                    <HubIcon sx={{ fontSize: 18, color: C.primary }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: C.text }}>{o.material || '—'}</Typography>
                      <Typography sx={{ fontSize: 10, color: C.muted }}>{[o.country || o.origin, o.companyName].filter(Boolean).join(' · ') || '—'}</Typography>
                    </Box>
                    {isOpen ? <ExpandLessIcon sx={{ fontSize: 18, color: C.muted }} /> : <ExpandMoreIcon sx={{ fontSize: 18, color: C.muted }} />}
                  </Box>
                  {isOpen && (
                    // Lives inside a white card, so it matches the card's own
                    // white instead of an unrelated gray fill -- with a
                    // hairline border so it still reads as a grouped section.
                    <Box sx={{ bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: 1.5, p: 1, mb: 1 }}>
                      <Row label="Material" value={o.material || '—'} />
                      <Row label="Company" value={o.companyName || '—'} />
                      <Row label="Country" value={o.country || o.origin || '—'} />
                    </Box>
                  )}
                </Box>
              );
            })}
          </>
        )}
      </Box>

      {certifications.length > 0 && (
        <Box sx={card}>
          <Typography sx={cardTitle}>Certifications</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {certifications.map((c, i) => (
              <Box key={i} sx={{ width: 64, textAlign: 'center' }}>
                <VerifiedIcon sx={{ fontSize: 26, color: C.primary }} />
                <Typography sx={{ fontSize: 9, color: C.text, lineHeight: 1.1, mt: 0.25 }}>{c.title}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Box sx={{ ...card, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <EcoIcon sx={{ fontSize: 18, color: '#2e7d32', mt: 0.25 }} />
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: C.text }}>Responsible Sourcing</Typography>
          <Typography sx={{ fontSize: 11, color: C.muted, mt: 0.25 }}>Materials are sourced with care for people and the environment.</Typography>
        </Box>
      </Box>
    </Box>
  );

  const renderReuseRecycle = () => (
    <Box sx={{ pt: 1.5 }}>
      <Box sx={card}>
        <Typography sx={cardTitle}>Extend the Life</Typography>
        {services.length === 0 && (
          <Typography sx={{ fontSize: 11, color: C.muted }}>The brand has not added repair, resale, rental or recycling information yet.</Typography>
        )}
        {services.map((d, i) => {
          const Icon = SERVICE_ICON[d.kind];
          const open = openService === d.kind;
          const facts = [[d.meta.cost.label, d.cost], [d.meta.time.label, d.time], [d.meta.note.label, d.note]].filter(([, v]) => v);
          return (
            <Box key={d.kind} sx={{ borderBottom: i < services.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <Box role="button" onClick={() => setOpenService(open ? null : d.kind)} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, cursor: 'pointer' }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: C.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon sx={{ fontSize: 16, color: C.primary }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: C.text }}>{d.meta.shopperTitle}</Typography>
                </Box>
                {open ? <ExpandLessIcon sx={{ fontSize: 18, color: C.muted }} /> : <ExpandMoreIcon sx={{ fontSize: 18, color: C.muted }} />}
              </Box>
              {open && (
                <Box sx={{ pl: 5, pb: 1.25 }}>
                  {facts.map(([label, value]) => (
                    <Box key={label} sx={{ mb: 0.5 }}>
                      <Typography sx={{ fontSize: 10, color: C.muted }}>{label}</Typography>
                      <Typography sx={{ fontSize: 11, color: C.text }}>{value}</Typography>
                    </Box>
                  ))}
                  {d.steps.length > 0 && (
                    <Box sx={{ mt: 0.5 }}>
                      <Typography sx={{ fontSize: 10, color: C.muted }}>How it works</Typography>
                      {d.steps.map((step, si) => (
                        <Typography key={si} sx={{ fontSize: 11, color: C.text, py: 0.2 }}>{si + 1}. {step}</Typography>
                      ))}
                    </Box>
                  )}
                  {(d.partnerName || d.email || d.phone) && (
                    <Typography sx={{ fontSize: 10, color: C.muted, mt: 0.5 }}>{[d.partnerName, d.email, d.phone].filter(Boolean).join(' · ')}</Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
                    {d.acceptRequests && (
                      <Box sx={{ ...mainButton, borderRadius: buttonRadius, px: 1.25, py: 0.6, fontSize: 11, fontWeight: 600 }}>{d.meta.button}</Box>
                    )}
                    {!!d.url && (
                      <Box
                        role="button"
                        onClick={() => window.open(d.url, '_blank', 'noopener,noreferrer')}
                        sx={{ border: `1px solid ${C.primary}`, color: C.primary, borderRadius: buttonRadius, px: 1.25, py: 0.6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Open website
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
      <Box sx={{ ...card, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <HelpOutlineIcon sx={{ fontSize: 18, color: C.primary, mt: 0.25 }} />
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: C.text }}>Need Help?</Typography>
          <Typography sx={{ fontSize: 11, color: C.muted, mt: 0.25 }}>Learn how to extend the life or responsibly dispose of your product.</Typography>
        </Box>
      </Box>
    </Box>
  );

  const renderOriginImpact = () => {
    const shippingKey = 'trace-shipping';
    const shippingOpen = openOrigin === shippingKey;
    return (
      <Box sx={{ pt: 1.5 }}>
        <Box sx={card}>
          <Row icon={PlaceIcon} label="Made in" value={originCountry} />
          <Row
            icon={HubIcon}
            label="Materials sourced from"
            value={originCountries.length ? `${originCountries.length} ${originCountries.length === 1 ? 'country' : 'countries'}` : ''}
            chevron
          />
          <Box role="button" onClick={() => setOpenOrigin(shippingOpen ? null : shippingKey)} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, cursor: 'pointer' }}>
            <LocalShippingIcon sx={{ fontSize: 18, color: C.primary }} />
            <Typography sx={{ fontSize: 12, color: C.text, flex: 1 }}>Shipping Route</Typography>
            {shippingOpen ? <ExpandLessIcon sx={{ fontSize: 18, color: C.muted }} /> : <ExpandMoreIcon sx={{ fontSize: 18, color: C.muted }} />}
          </Box>
          {shippingOpen && (
            <Box sx={{ bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: 1.5, p: 1, mb: 1 }}>
              <Row label="Shipping Log" value={esg.shippingLog || ''} />
              <Row label="Distance" value={esg.distance || ''} />
              <Row label="Est. Emissions" value={formatUnitSpacing(routeInfo.emissions || esg.co2Transportation || '')} />
            </Box>
          )}
        </Box>

        <Box sx={card}>
          <Typography sx={cardTitle}>Environmental Impact</Typography>
          <Row icon={CloudIcon} label="CO2 (Production)" value={formatUnitSpacing(esg.co2Production || '')} />
          <Row icon={LocalShippingIcon} label="CO2 (Transport)" value={formatUnitSpacing(esg.co2Transportation || '')} />
          {impactItems.map((it, i) => (
            <Row key={i} icon={it.Icon} label={it.label} value={formatUnitSpacing(it.value || '')} />
          ))}
        </Box>

        <Box sx={{ ...card, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <VerifiedIcon sx={{ fontSize: 18, color: C.primary, mt: 0.25 }} />
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: C.text }}>Verified Data</Typography>
            <Typography sx={{ fontSize: 11, color: C.muted, mt: 0.25 }}>This product's traceability data is verified using the digital passport.</Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  const documents = [...toArray(info.files), ...toArray(info.manualsAndCerts?.files)].filter(Boolean);
  const today = new Date().toISOString().slice(0, 10);

  // Mirrors ProductLifecycleScreen's Compliance tab.
  const renderCompliance = () => (
    <Box sx={{ pt: 1.5 }}>
      <Box sx={card}>
        <Typography sx={cardTitle}>Certifications</Typography>
        {certifications.length > 0 ? certifications.map((c, i) => {
          const expired = !!c.validUntil && c.validUntil < today;
          const covered = materials.filter((m) => m?.certificate && m.certificate === c.title).map((m) => m.material).filter(Boolean);
          const meta = [c.issuer && `Issued by ${c.issuer}`, c.number && `Certificate no. ${c.number}`, c.validUntil && `${expired ? 'Expired' : 'Valid until'} ${c.validUntil}`].filter(Boolean).join(' · ');
          return (
            <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', py: 0.75, borderBottom: i < certifications.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <VerifiedIcon sx={{ fontSize: 18, color: expired ? '#b26a00' : '#2e7d32', mt: 0.25 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: C.text }}>{c.title || '—'}{covered.length ? ` (${covered.join(', ')})` : ''}</Typography>
                {!!meta && <Typography sx={{ fontSize: 10, color: expired ? '#b26a00' : C.muted }}>{meta}</Typography>}
                {!!c.content && <Typography sx={{ fontSize: 10, color: C.muted }}>{c.content}</Typography>}
              </Box>
            </Box>
          );
        }) : <Typography sx={{ fontSize: 11, color: C.muted }}>No data yet.</Typography>}
      </Box>
      {documents.length > 0 && (
        <Box sx={card}>
          <Typography sx={cardTitle}>Documents</Typography>
          {documents.map((doc, i) => (
            <Row key={i} icon={PictureAsPdfIcon} label={decodeURIComponent(String(doc).split('/').pop() || 'Document')} value=" " />
          ))}
        </Box>
      )}
      <Box sx={card}>
        <Row icon={PlaceIcon} label="Country of Origin" value={originCountry} />
        <Row icon={ShieldIcon} label="Warranty" value={info.warrantyStatus} />
        <Row label="Valid for" value={Number(info.warrantyValidYears) ? `${info.warrantyValidYears} years` : ''} />
      </Box>
    </Box>
  );

  const renderSection = (key) => {
    switch (key) {
      case 'care': return renderCare();
      case 'materials': return renderMaterials();
      case 'dispose': return renderReuseRecycle();
      case 'traceability': return renderOriginImpact();
      case 'compliance': return renderCompliance();
      default: return null;
    }
  };

  return (
    <PaletteContext.Provider value={C}>
      <DeviceShell device={device} gradient={GRADIENT} C={C}>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          bgcolor: C.bg,
          // In the iPhone frame: enlarged to the app's real sizes, on the
          // shell's gradient (so the status bar and top bar are one piece).
          // Top half see-through (the top bar shows the shell's gradient), bottom
          // half the page colour (behind the bottom bar's rounded corners).
          ...(device ? { zoom: DEVICE_CONTENT_ZOOM, flex: 1, minHeight: 0, height: 'auto', bgcolor: 'transparent', background: `linear-gradient(to bottom, transparent 50%, ${C.bg} 50%)` } : {}),
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          // The brand's font, on every text in the phone.
          ...(look.fontFamily !== 'system' ? { '& .MuiTypography-root, & .MuiBox-root': { fontFamily: dppFontCss(look.fontFamily) } } : {}),
        }}
      >
        {/* Top bar + (when in Lifecycle view) the product header directly
            below it share ONE gradient background instead of each having
            its own -- two adjacent elements with independently-restarting
            gradients read as a visible seam even when the colors match. */}
        <Box sx={{ background: device ? 'transparent' : GRADIENT, flexShrink: 0 }}>
          <Box sx={{ height: 50, pl: 1.5, pr: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            {/* Empty spacer matching the Close button's width, so the title
                stays centered via space-between symmetry now that there's no
                back button on the left (this is a top-level preview, not a
                navigable screen -- closing the dialog is the only exit).
                `gap` + the title's own `noWrap`/`flex` keep a minimum
                breathing room from the close button even when the title text
                is long enough to otherwise crowd it. */}
            <Box sx={{ width: 40, flexShrink: 0 }} />
            <Typography id="preview-modal-title" noWrap sx={{ color: C.onHeader, fontSize: 16, fontWeight: 600, flex: 1, textAlign: 'center' }}>
              {view === 'lifecycle' ? 'Product Lifecycle' : 'Product Overview'}
            </Typography>
            {onClose ? (
              <Button onClick={onClose} aria-label="Close preview" sx={{ minWidth: 40, flexShrink: 0, color: C.onHeader }}>
                <CloseIcon fontSize="small" />
              </Button>
            ) : <Box sx={{ width: 40, flexShrink: 0 }} />}
          </Box>

        </Box>

        {/* Content layer with rounded top corners over the top bar's colour,
            as in the app. */}
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: device ? 'transparent' : `linear-gradient(90deg, ${C.headerLight}, ${C.header})` }}>
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: C.bg, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' }}>

        {/* Scrollable content layer */}
        <Box ref={scrollerRef} sx={{ flex: 1, minHeight: 0, overflow: 'auto', pb: 2 }}>
          {/* The brand's text size, approximated here by scaling the content. */}
          <Box sx={{ zoom: DPP_TEXT_SCALE[look.textScale] }}>
            {view === 'overview' ? renderOverview() : renderLifecycleList()}
          </Box>
        </Box>

        </Box>
        </Box>

        {/* Product bottom bar — Overview / Scan / Lifecycle, as in the app. Scan
            is only drawn here: there is no camera inside a preview. */}
        <Box
          sx={{
            flexShrink: 0,
            height: 58,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            px: 1,
            position: 'relative',
            zIndex: 1,
            bgcolor: C.surface,
            borderTop: `1px solid ${C.border}`,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
        >
          {[
            { key: 'overview', label: 'Overview', Icon: GridViewIcon },
            { key: 'lifecycle', label: 'Lifecycle', Icon: LeafIcon },
          ].map((tab, tabIndex) => {
            const active = view === tab.key;
            return (
              <React.Fragment key={tab.key}>
              {tabIndex === 1 && (
                <Box aria-hidden sx={{ flexShrink: 0, width: 54, height: 54, mt: '-22px', borderRadius: '50%', border: `3px solid ${C.surface}`, background: GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 8px rgba(27,79,114,0.25)' }}>
                  <CropFreeIcon sx={{ fontSize: 26, color: C.onHeader }} />
                </Box>
              )}
              <Box
                role="tab"
                aria-selected={active}
                onClick={() => setView(tab.key)}
                sx={{ flex: 1, position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <tab.Icon sx={{ fontSize: 22, color: active ? C.primary : '#7a8aa3' }} />
                <Typography sx={{ fontSize: 10, mt: 0.4, color: active ? C.primary : '#333', fontWeight: active ? 600 : 400 }}>
                  {tab.label}
                </Typography>
              </Box>
              </React.Fragment>
            );
          })}
        </Box>

        <MediaLightbox open={lightboxIndex !== null} slides={slides} index={lightboxIndex ?? 0} onClose={() => setLightboxIndex(null)} />
      </Box>
      </DeviceShell>
    </PaletteContext.Provider>
  );
}

// "Preview product page" dialog. `theme` is the look to draw with; when it
// is not given, the design of the product's own brand is loaded, so the
// preview always matches what that brand's shoppers see.
export default function PreviewModal({ open, setOpen, productInfo, theme }) {
  const [loadedTheme, setLoadedTheme] = useState(null);
  const rawCompany = productInfo?.company_id;
  const companyId = rawCompany && typeof rawCompany === 'object' ? rawCompany._id : rawCompany;
  // A company can have several brands, each with its own design.
  const brandName = String(productInfo?.brandInfo?.name || '');
  useEffect(() => {
    if (theme || !open || !companyId) return;
    let cancelled = false;
    fetch(`${Backend_URL}company/${encodeURIComponent(String(companyId))}/dpp-theme?brand=${encodeURIComponent(brandName)}`)
      .then((r) => r.json())
      .then((j) => { if (!cancelled) setLoadedTheme(j?.data?.dppTheme || null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [theme, open, companyId, brandName]);

  // Whole phone scaled down (never up) to fit 94% of the window.
  const outerW = IPHONE_16.width + IPHONE_16.bezel * 2;
  const outerH = IPHONE_16.height + IPHONE_16.bezel * 2;
  const fitScale = () => (typeof window === 'undefined' ? 1 : Math.min(1, (window.innerHeight * 0.94) / outerH, (window.innerWidth * 0.94) / outerW));
  const [scale, setScale] = useState(fitScale);
  useEffect(() => {
    if (!open) return undefined;
    const onResize = () => setScale(fitScale());
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Modal open={open} onClose={() => setOpen(false)} aria-labelledby="preview-modal-title">
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: outerW,
          height: outerH,
          transform: `translate(-50%, -50%) scale(${scale})`,
          p: `${IPHONE_16.bezel}px`,
          bgcolor: '#1d1d1f',
          borderRadius: `${IPHONE_16.radius + IPHONE_16.bezel}px`,
          boxShadow: '0 30px 80px rgba(0,0,0,0.45), inset 0 0 0 2px #3a3a3c',
          outline: 'none',
        }}
      >
        <Box sx={{ width: IPHONE_16.width, height: IPHONE_16.height, borderRadius: `${IPHONE_16.radius}px`, overflow: 'hidden', position: 'relative' }}>
          <DppPhoneView productInfo={productInfo} theme={theme || loadedTheme} onClose={() => setOpen(false)} device />
        </Box>
      </Box>
    </Modal>
  );
}
