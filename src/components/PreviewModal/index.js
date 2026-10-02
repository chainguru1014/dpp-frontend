import * as React from 'react';
import { useContext, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import IosShareIcon from '@mui/icons-material/IosShare';
import CategoryIcon from '@mui/icons-material/Category';
import PaletteIcon from '@mui/icons-material/Palette';
import StraightenIcon from '@mui/icons-material/Straighten';
import SpaIcon from '@mui/icons-material/Spa';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ShieldIcon from '@mui/icons-material/Shield';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import RecyclingIcon from '@mui/icons-material/Recycling';
import GridViewIcon from '@mui/icons-material/GridView';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import BuildIcon from '@mui/icons-material/Build';
import StorefrontIcon from '@mui/icons-material/Storefront';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HubIcon from '@mui/icons-material/Hub';
import PlaceIcon from '@mui/icons-material/Place';
import CloudIcon from '@mui/icons-material/Cloud';
import BoltIcon from '@mui/icons-material/Bolt';
import VerifiedIcon from '@mui/icons-material/Verified';
import EcoIcon from '@mui/icons-material/Nature';
import CameraIcon from '../../assets/camera_icon.png';
import YoutubeIcon from '../../assets/youtube-icon.png';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { Backend_URL, getFileUrl, normalizeProductVideos } from '../../helper';
import { DPP_TEXT_SCALE, dppButtonFill, dppFontCss, dppPalette, normalizeDppTheme } from '../../utils/dppTheme';
import VideoPlayerDialog from '../VideoPlayerDialog';

// The colours this preview is drawn with: the app's own tokens (src/theme.ts)
// or, when the brand has its own look, the same tokens with its colours
// swapped in (utils/dppTheme.dppPalette). Row reads them through context.
const PaletteContext = React.createContext(dppPalette(null));

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '400px',
  maxWidth: '92vw',
  height: '86vh',
  maxHeight: '820px',
  borderRadius: 3,
  boxShadow: 24,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const LIFECYCLE_STAGES = [
  { key: 'materials', label: 'Materials', Icon: SpaIcon },
  { key: 'manufacturing', label: 'Manufacturing', Icon: PrecisionManufacturingIcon },
  { key: 'transportation', label: 'Transportation', Icon: LocalShippingIcon },
  { key: 'use', label: 'Use Phase', Icon: CheckroomIcon },
  { key: 'endOfLife', label: 'End of Life', Icon: RecyclingIcon },
];

// Mirrors ProductLifecycleScreen's JOURNEY_STAGES in the app.
const JOURNEY_STAGES = [
  { key: 'materials', label: 'Materials', desc: 'Responsible sourcing of raw materials.', Icon: SpaIcon },
  { key: 'manufacturing', label: 'Manufacturing', desc: 'Assembled with quality and care.', Icon: PrecisionManufacturingIcon },
  { key: 'transportation', label: 'Transportation', desc: 'Shipped efficiently to reduce emissions.', Icon: LocalShippingIcon },
  { key: 'use', label: 'Use Phase', desc: 'Built to last and easy to care for.', Icon: CheckroomIcon },
  { key: 'endOfLife', label: 'Reuse & Recycling', desc: 'Repair, reuse, or recycle options.', Icon: RecyclingIcon },
];

const LIFECYCLE_TABS = [
  { key: 'journey', label: 'Journey' },
  { key: 'care', label: 'Care' },
  { key: 'materials', label: 'Materials' },
  { key: 'dispose', label: 'Reuse & Recycle' },
  { key: 'traceability', label: 'Origin & Impact' },
  { key: 'compliance', label: 'Compliance' },
];

// Mirrors ProductLifecycleScreen's CARE_TIP_BY_ICON fallback (used when the
// brand hasn't supplied its own maintenance.tips list).
const CARE_TIP_BY_ICON = {
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

const CARE_SYMBOL_GLYPH = {
  wash_30: '30°', wash_40: '40°', wash_50: '50°', wash_60: '60°', wash_70: '70°',
  dry_clean_P: 'P', dry_clean_F: 'F',
  iron_low: '•', iron_med: '••', iron_high: '•••',
  bleach_no: '⌀', bleach_any: '△',
  tumble_dry_low: '○', tumble_dry_high: '◎',
};
const CARE_SYMBOL_LABEL = {
  wash_30: 'Wash up to 30°C', wash_40: 'Wash up to 40°C', wash_50: 'Wash up to 50°C', wash_60: 'Wash up to 60°C', wash_70: 'Wash up to 70°C',
  dry_clean_P: 'Dry clean P', dry_clean_F: 'Dry clean F',
  iron_low: 'Iron low', iron_med: 'Iron med', iron_high: 'Iron high',
  bleach_no: 'Bleach no', bleach_any: 'Bleach any',
  tumble_dry_low: 'Tumble dry low', tumble_dry_high: 'Tumble dry high',
};

// "25kg" -> "25 kg" -- purely a spacing fix, never invents/changes the unit.
const formatUnitSpacing = (raw) => {
  if (!raw) return raw;
  return String(raw).replace(/^(\s*[\d.,]+)\s*([a-zA-Zµ].*)$/, '$1 $2').trim();
};
const toArray = (v) => (v == null ? [] : Array.isArray(v) ? v : typeof v === 'object' ? Object.values(v) : [v]);

// Generic label/value row -- mirrors ProductLifecycleScreen's <Row>. Renders
// nothing when there's no value so callers can list every possible field
// without hand-guarding each one.
function Row({ icon: Icon, label, value, onClick, chevron, expanded }) {
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
    </Box>
  );
}

// The shopper's product page as a phone screen: Product Overview and Product
// Lifecycle, as in the app, drawn from `productInfo` in the brand's look
// (`theme`: colours, font, button corners, which lifecycle tabs and in what
// order). Fills its parent — the preview dialog below, or the studio's
// Experience panel. `onClose` adds the close button (dialog only).
export function DppPhoneView({ productInfo, theme, onClose }) {
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
  const [dialogVideoId, setDialogVideoId] = useState(null);
  // 'overview' mirrors ResultScreen (Product Overview); 'lifecycle' mirrors
  // ProductLifecycleScreen -- same two destinations as the app's product
  // bottom bar (its third item, Scan, doesn't apply inside a static preview).
  const [view, setView] = useState('overview');
  const [lifecycleTab, setLifecycleTab] = useState('journey');
  useEffect(() => {
    if (!lifecycleTabs.some((tb) => tb.key === lifecycleTab)) setLifecycleTab(lifecycleTabs[0].key);
  }, [lifecycleTabs, lifecycleTab]);
  const [openStage, setOpenStage] = useState(null);
  const [openOrigin, setOpenOrigin] = useState(null);

  const info = productInfo || {};
  const images = info.images || [];
  const videos = normalizeProductVideos(info.videos);
  const slides = [
    ...images.map((src) => ({ type: 'image', src })),
    ...videos.map((video) => ({ type: 'video', video })),
  ];
  const safeIndex = slides.length ? Math.min(slideIndex, slides.length - 1) : 0;
  const active = slides[safeIndex];
  const facts = info.detailFacts || {};
  const productId = info._id || info.pmc_code || (info.token_id != null ? info.token_id : '');

  const highlightRows = [
    info.productType && { Icon: CategoryIcon, text: `Type: ${info.productType}` },
    info.color && { Icon: PaletteIcon, text: `Color: ${info.color}` },
    info.size && { Icon: StraightenIcon, text: `Size: ${info.size}` },
    facts.material && { Icon: SpaIcon, text: `Material: ${facts.material}` },
    facts.fit && { Icon: AccessibilityNewIcon, text: `Fit: ${facts.fit}` },
    facts.wash && { Icon: WaterDropIcon, text: `Wash: ${facts.wash}` },
    facts.durability && { Icon: ShieldIcon, text: `Durability: ${facts.durability}` },
  ].filter(Boolean);

  const go = (dir) => {
    if (!slides.length) return;
    setSlideIndex((i) => (i + dir + slides.length) % slides.length);
  };

  const goToLifecycle = () => {
    setView('lifecycle');
    setLifecycleTab(lifecycleTabs[0].key);
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
  const disposal = info.disposal || {};
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

  const disposeLinks = [
    { key: 'reuse', Icon: VolunteerActivismIcon, label: 'Reuse', sub: 'Give it a second life by donating.', url: disposal.reuseUrl },
    { key: 'repair', Icon: BuildIcon, label: 'Repair', sub: 'Find repair guides and local services.', url: disposal.repairUrl },
    { key: 'rental', Icon: StorefrontIcon, label: 'Rent or Resell', sub: 'List it for rent or resell to others.', url: disposal.rentalUrl },
    { key: 'dispose', Icon: DeleteOutlineIcon, label: 'Recycle or return', sub: 'Recycle or return through take-back.', url: disposal.disposeUrl },
  ];

  const renderMediaBox = ({ size = 132, rounded = 1.5 } = {}) => (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        position: 'relative',
        bgcolor: '#000',
        borderRadius: rounded,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {active ? (
        active.type === 'video' ? (
          <Box
            role="button"
            onClick={() => setDialogVideoId(active.video.videoId)}
            sx={{ width: '100%', height: '100%', position: 'relative', cursor: 'pointer' }}
          >
            <img
              src={`https://img.youtube.com/vi/${active.video.videoId}/hqdefault.jpg`}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <PlayCircleFilledIcon
              sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 44, color: '#fff' }}
            />
          </Box>
        ) : (
          <img src={getFileUrl(active.src)} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        )
      ) : (
        <Typography sx={{ color: '#fff', fontSize: 12 }}>No image</Typography>
      )}

      {slides.length > 1 && (
        <>
          <Box onClick={() => go(-1)} sx={{ position: 'absolute', inset: '0 auto 0 0', width: '35%', cursor: 'pointer' }} />
          <Box onClick={() => go(1)} sx={{ position: 'absolute', inset: '0 0 0 auto', width: '35%', cursor: 'pointer' }} />
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
      {active && (
        <Box sx={{ position: 'absolute', right: 6, bottom: 6, bgcolor: 'rgba(0,0,0,0.55)', borderRadius: 1, px: 0.5, py: 0.25 }}>
          <img src={active.type === 'video' ? YoutubeIcon : CameraIcon} alt="" style={{ height: 12, width: 12, display: 'block' }} />
        </Box>
      )}
    </Box>
  );

  const brand = info.brandInfo || {};
  const productText = (
    <>
      <Typography sx={{ fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.25 }}>
        {info.name || '—'}
      </Typography>
      {info.model && <Typography sx={{ fontSize: 12, color: C.muted, mt: 0.25 }}>{info.model}</Typography>}
      {look.showProductId && productId !== '' && (
        <Typography sx={{ fontSize: 11, color: C.placeholder, mt: 0.25 }}>ID: {productId}</Typography>
      )}
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, mt: 1, bgcolor: C.authBg, borderRadius: 1.5, px: 1, py: 0.75 }}>
        <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: C.badge, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckIcon sx={{ fontSize: 11, color: C.onBadge }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: C.text, lineHeight: 1.1 }}>Authenticated</Typography>
          <Typography sx={{ fontSize: 10, color: C.muted, lineHeight: 1.1 }}>Verified by Yometel</Typography>
        </Box>
      </Box>
    </>
  );

  // The blocks of the Overview below the product card. The brand chooses
  // which show and in what order (theme.blocks); a block with nothing to
  // show (no highlights, no message written...) is skipped.
  const overviewBlocks = {
    highlights: () => highlightRows.length > 0 && (
      <Box sx={card}>
        <Typography sx={cardTitle}>Key Highlights</Typography>
        {highlightRows.map((row, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.4 }}>
            <row.Icon sx={{ fontSize: 15, color: C.primary }} />
            <Typography sx={{ fontSize: 12, color: C.text }}>{row.text}</Typography>
          </Box>
        ))}
      </Box>
    ),
    lifecycle: () => (
      <Box sx={card}>
        <Typography sx={{ ...cardTitle, mb: 1.5 }}>Lifecycle Preview</Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {LIFECYCLE_STAGES.map((s, i) => (
            <React.Fragment key={s.key}>
              <Box sx={{ width: 58, textAlign: 'center' }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: C.surfaceAlt, mx: 'auto', mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.Icon sx={{ fontSize: 20, color: C.primary }} />
                </Box>
                <Typography sx={{ fontSize: 7.5, color: C.muted, lineHeight: 1.15, letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}>{s.label}</Typography>
              </Box>
              {i < LIFECYCLE_STAGES.length - 1 && (
                <Box sx={{ flex: 1, height: 2, bgcolor: C.primary, borderRadius: 1, mt: '19px' }} />
              )}
            </React.Fragment>
          ))}
        </Box>
        <Box
          role="button"
          onClick={goToLifecycle}
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.25, mt: 1.5, cursor: 'pointer' }}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: C.primary }}>View Full Lifecycle</Typography>
          <ChevronRightIcon sx={{ fontSize: 16, color: C.primary }} />
        </Box>
      </Box>
    ),
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
        {[ThumbUpOffAltIcon, ThumbDownOffAltIcon, IosShareIcon].map((Ico, i) => (
          <Box key={i} sx={{ flex: 1, height: 36, borderRadius: 1.5, border: `1px solid ${C.border}`, bgcolor: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ico sx={{ fontSize: 19, color: C.primary }} />
          </Box>
        ))}
      </Box>
    ),
    actions: () => (
      <Box sx={{ display: 'flex', gap: 1, mx: 2, mt: 1 }}>
        <Box sx={{ flex: 1, py: 1, borderRadius: buttonRadius, textAlign: 'center', fontSize: 13, fontWeight: 700, ...mainButton }}>
          Scan Product
        </Box>
        <Box sx={{ flex: 1, py: 1, borderRadius: buttonRadius, textAlign: 'center', fontSize: 13, fontWeight: 600, color: C.primary, border: `1px solid ${C.primary}`, bgcolor: C.surface }}>
          Request ownership
        </Box>
      </Box>
    ),
  };

  const renderOverview = () => (
    <>
      {/* Product card — photo beside the name, or a large photo on top. */}
      <Box sx={{ ...card, mt: 2 }}>
        {look.heroLayout === 'top' ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.25 }}>{renderMediaBox({ size: 220 })}</Box>
            {productText}
          </>
        ) : (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            {renderMediaBox()}
            <Box sx={{ flex: 1, minWidth: 0 }}>{productText}</Box>
          </Box>
        )}
      </Box>
      {look.blocks.filter((b) => b.visible).map((b) => (
        <React.Fragment key={b.key}>{overviewBlocks[b.key]?.()}</React.Fragment>
      ))}
    </>
  );

  const renderJourney = () => (
    <Box sx={{ pt: 1.5 }}>
      {!!info.aboutProduct && (
        <Box sx={{ ...card, mb: 1.5 }}>
          <Typography sx={cardTitle}>About This Product</Typography>
          <Typography sx={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{info.aboutProduct}</Typography>
        </Box>
      )}
      {JOURNEY_STAGES.map((s, i) => {
        const isOpen = openStage === s.key;
        return (
          <Box key={s.key} sx={{ display: 'flex', gap: 1.5, px: 2 }}>
            <Box sx={{ alignItems: 'center', width: 34, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ width: 34, height: 34, borderRadius: '50%', bgcolor: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.Icon sx={{ fontSize: 17, color: '#fff' }} />
              </Box>
              {i < JOURNEY_STAGES.length - 1 && <Box sx={{ flex: 1, width: 2, bgcolor: C.border, my: 0.5, minHeight: 20 }} />}
            </Box>
            <Box role="button" onClick={() => setOpenStage(isOpen ? null : s.key)} sx={{ flex: 1, pb: 2.5, cursor: 'pointer' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.label}</Typography>
                {isOpen ? <ExpandLessIcon sx={{ fontSize: 18, color: C.muted }} /> : <ExpandMoreIcon sx={{ fontSize: 18, color: C.muted }} />}
              </Box>
              <Typography sx={{ fontSize: 11, color: C.muted, mt: 0.25 }}>{s.desc}</Typography>
              {isOpen && (
                // Journey rows sit directly on the tab's own background (not
                // inside a white card), so the expanded detail matches that
                // background instead of an unrelated gray block -- mirrors
                // the app's jDetail/cardDetail split.
                <Box sx={{ mt: 1, bgcolor: C.bg, borderRadius: 1.5, p: 1 }}>
                  {s.key === 'materials' && (materials.length ? materials.map((m, mi) => (
                    <Row key={mi} label={m.material || '—'} value={m.percent != null ? `${m.percent}%` : ''} />
                  )) : <Typography sx={{ fontSize: 11, color: C.muted }}>No data yet.</Typography>)}
                  {s.key === 'manufacturing' && (
                    <>
                      <Row label="Country of Manufacture" value={originCountry} />
                      <Row label="Manufacture Date" value={info.manufactureDate} />
                      <Row label="Brand" value={info.brandInfo?.name} />
                      <Row label="CO2 (Production)" value={formatUnitSpacing(esg.co2Production)} />
                    </>
                  )}
                  {s.key === 'transportation' && (
                    <>
                      <Row label="Shipping Log" value={esg.shippingLog} />
                      <Row label="Distance" value={esg.distance} />
                      <Row label="Est. Emissions" value={formatUnitSpacing(routeInfo.emissions || esg.co2Transportation)} />
                    </>
                  )}
                  {s.key === 'use' && (careTips.length ? careTips.slice(0, 3).map((tip, ti) => (
                    <Typography key={ti} sx={{ fontSize: 11, color: C.text, py: 0.3 }}>• {tip.primary}</Typography>
                  )) : <Typography sx={{ fontSize: 11, color: C.muted }}>No data yet.</Typography>)}
                  {s.key === 'endOfLife' && (disposeLinks.some((d) => d.url) ? disposeLinks.filter((d) => d.url).map((d) => (
                    <Typography key={d.key} sx={{ fontSize: 11, color: C.text, py: 0.3 }}>• {d.label}: {d.sub}</Typography>
                  )) : <Typography sx={{ fontSize: 11, color: C.muted }}>No data yet.</Typography>)}
                </Box>
              )}
            </Box>
          </Box>
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
        {disposeLinks.map((d, i) => (
          <Box
            key={d.key}
            role={d.url ? 'button' : undefined}
            onClick={d.url ? () => window.open(d.url, '_blank', 'noopener,noreferrer') : undefined}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 1,
              borderBottom: i < disposeLinks.length - 1 ? `1px solid ${C.border}` : 'none',
              cursor: d.url ? 'pointer' : 'default',
              opacity: d.url ? 1 : 0.5,
            }}
          >
            <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: C.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <d.Icon sx={{ fontSize: 16, color: C.primary }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: C.text }}>{d.label}</Typography>
              <Typography sx={{ fontSize: 10, color: C.muted }}>{d.sub}</Typography>
            </Box>
            {!!d.url && <ChevronRightIcon sx={{ fontSize: 18, color: C.muted }} />}
          </Box>
        ))}
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

  const renderLifecycleTabContent = () => {
    switch (lifecycleTab) {
      case 'journey': return renderJourney();
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
      <Box
        sx={{
          width: '100%',
          height: '100%',
          bgcolor: C.bg,
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
        <Box sx={{ background: GRADIENT, flexShrink: 0 }}>
          <Box sx={{ height: 50, px: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Empty spacer matching the Close button's width, so the title
                stays centered via space-between symmetry now that there's no
                back button on the left (this is a top-level preview, not a
                navigable screen -- closing the dialog is the only exit). */}
            <Box sx={{ width: 40 }} />
            <Typography id="preview-modal-title" sx={{ color: C.onHeader, fontSize: 16, fontWeight: 600 }}>
              {view === 'lifecycle' ? 'Product Lifecycle' : 'Product Overview'}
            </Typography>
            {onClose ? (
              <Button onClick={onClose} aria-label="Close preview" sx={{ minWidth: 40, color: C.onHeader }}>
                <CloseIcon fontSize="small" />
              </Button>
            ) : <Box sx={{ width: 40 }} />}
          </Box>

          {view === 'lifecycle' && (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', px: 2, pb: 1.5 }}>
              {renderMediaBox({ size: 66, rounded: 1 })}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: C.onHeader, lineHeight: 1.2 }}>{info.name || '—'}</Typography>
                {info.model && <Typography sx={{ fontSize: 11, color: C.onHeader, opacity: 0.9, mt: 0.2 }}>{info.model}</Typography>}
                {look.showProductId && productId !== '' && <Typography sx={{ fontSize: 10, color: C.onHeader, opacity: 0.7, mt: 0.1 }}>ID: {productId}</Typography>}
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, mt: 0.75 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: C.onHeader, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckIcon sx={{ fontSize: 10, color: C.header }} />
                  </Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: C.onHeader }}>Genuine product</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {view === 'lifecycle' && (
          <Box sx={{ display: 'flex', bgcolor: C.surface, borderBottom: `1px solid ${C.border}`, overflowX: 'auto', flexShrink: 0 }}>
            {lifecycleTabs.map((tb) => (
              <Box
                key={tb.key}
                role="tab"
                aria-selected={lifecycleTab === tb.key}
                onClick={() => setLifecycleTab(tb.key)}
                sx={look.tabStyle === 'pills' ? {
                  flex: '0 0 auto',
                  px: 1.5,
                  py: 0.6,
                  my: 0.75,
                  ml: 0.75,
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderRadius: 999,
                  bgcolor: lifecycleTab === tb.key ? C.primary : C.surfaceAlt,
                } : {
                  flex: '0 0 auto',
                  px: 1.5,
                  py: 1,
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderBottom: lifecycleTab === tb.key ? `2px solid ${C.primary}` : '2px solid transparent',
                }}
              >
                <Typography sx={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', color: lifecycleTab === tb.key ? (look.tabStyle === 'pills' ? C.onPrimary : C.primary) : C.muted }}>
                  {tb.label}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Scrollable content layer */}
        <Box sx={{ flex: 1, overflow: 'auto', pb: 2 }}>
          {/* The brand's text size, approximated here by scaling the content. */}
          <Box sx={{ zoom: DPP_TEXT_SCALE[look.textScale] }}>
            {view === 'overview' ? renderOverview() : renderLifecycleTabContent()}
          </Box>
        </Box>

        {/* Product bottom bar — Overview / Lifecycle, matching the app's
            product bar (its Scan item doesn't apply inside a static preview). */}
        <Box
          sx={{
            flexShrink: 0,
            height: 58,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            px: 1,
            bgcolor: C.surface,
            borderTop: `1px solid ${C.border}`,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
        >
          {[
            { key: 'overview', label: 'Overview', Icon: GridViewIcon },
            { key: 'lifecycle', label: 'Lifecycle', Icon: AutorenewIcon },
          ].map((tab) => {
            const active = view === tab.key;
            return (
              <Box
                key={tab.key}
                role="tab"
                aria-selected={active}
                onClick={() => setView(tab.key)}
                sx={{ flex: 1, position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <tab.Icon sx={{ fontSize: 22, color: active ? C.primary : '#7a8aa3' }} />
                <Typography sx={{ fontSize: 10, mt: 0.4, color: active ? C.primary : '#333', fontWeight: active ? 600 : 400 }}>
                  {tab.label}
                </Typography>
                {active && <Box sx={{ position: 'absolute', bottom: 0, width: 34, height: 3, borderRadius: 1, bgcolor: C.primary }} />}
              </Box>
            );
          })}
        </Box>

        <VideoPlayerDialog open={Boolean(dialogVideoId)} onClose={() => setDialogVideoId(null)} videoId={dialogVideoId} />
      </Box>
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

  return (
    <Modal open={open} onClose={() => setOpen(false)} aria-labelledby="preview-modal-title">
      <Box sx={modalStyle}>
        <DppPhoneView productInfo={productInfo} theme={theme || loadedTheme} onClose={() => setOpen(false)} />
      </Box>
    </Modal>
  );
}
