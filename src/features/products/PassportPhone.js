import React, { useEffect, useMemo, useState } from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import FactoryOutlinedIcon from '@mui/icons-material/FactoryOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RecyclingOutlinedIcon from '@mui/icons-material/RecyclingOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import FlightOutlinedIcon from '@mui/icons-material/FlightOutlined';
import StraightenOutlinedIcon from '@mui/icons-material/StraightenOutlined';
import Co2OutlinedIcon from '@mui/icons-material/Co2Outlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import IosShareIcon from '@mui/icons-material/IosShare';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import HomeIcon from '@mui/icons-material/Home';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { getFileUrl } from '../../helper';
import { readyServices } from '../../utils/circularity';
import { PhotoTrack, Thumbs } from '../../components/PhotoSlider';

// The phone app's product pages, drawn for the admin web with the product
// being edited, so a brand sees exactly what shoppers get and can use it the
// same way:
//   Passport (app PassportView): the photo fading into a blurred copy of
//     itself, thumbnails, Like / Cart / Not for me, Details, and the Brand /
//     Materials / Made in / Care / Service & resale rows;
//   Details pages (app PassportDetailsScreen): About + Details, Materials,
//     Made in (with the shipping), Care, Service & resale;
//   Brand page (app BrandDetailScreen);
//   the full-screen photo viewer, dragged left / right.
// Back (top left) returns through the pages opened, as in the app.
// Drawn at the iPhone 16's 393 x 852 pt and scaled to `width`.

const SCREEN = { w: 393, h: 852, radius: 55, bezel: 12 };
const BG = '#10263a';
const TONE = '#1b4f72';
const W2 = 'rgba(255,255,255,0.74)';
const ACC = '#a9cdf0';
const INK = '#1c1c1e';
const GRADIENT = 'linear-gradient(135deg,#2a78bd,#1b4f72)';
const DARK_GLASS = { bgcolor: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(20px)' };
const SHARE_COLORS = ['#7fb6ea', '#c7ddf3', '#4d8fd0', '#e8f1fb', '#a9cdf0'];
const SEG = { repair: 'Repair', resell: 'Resell', rent: 'Rent', recycle: 'Recycle' };
const NO_SCROLLBAR = { scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } };

const text = (v) => String(v ?? '').trim();
const list = (v) => (Array.isArray(v) ? v : []);
const imgSrc = (img) => getFileUrl(typeof img === 'string' ? img : img?.src || img?.url || '');

function priceText(p) {
  if (!p.price) return '';
  try {
    return new Intl.NumberFormat('en-IE', { style: 'currency', currency: p.currency || 'EUR', maximumFractionDigits: 2 }).format(p.price);
  } catch (e) {
    return `${p.currency || ''} ${p.price}`.trim();
  }
}

// "Automatic chronograph · Automatic chronograph · 42 mm steel": a part the
// next one already says is left out (as in the app).
function passportLine(p) {
  const parts = [priceText(p), text(p.productType), text(p.model) || text(p.size)].filter(Boolean);
  return parts.filter((v, i) => !parts.some((o, j) => j !== i && o.toLowerCase().includes(v.toLowerCase()) && (o.length > v.length || j < i))).join(' · ');
}

function Backdrop({ image }) {
  return (
    <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', bgcolor: BG }} aria-hidden>
      {image && <Box component="img" src={image} alt="" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(40px)', transform: 'scale(1.3)' }} />}
      <Box sx={{ position: 'absolute', inset: 0, bgcolor: TONE, opacity: 0.55 }} />
    </Box>
  );
}

const Circle = ({ children, onClick, label, size = 40 }) => (
  <ButtonBase onClick={onClick} aria-label={label}
    sx={{ width: size, height: size, borderRadius: '50%', color: INK, bgcolor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)', boxShadow: '0 2px 10px rgba(0,0,0,0.12)', pointerEvents: 'auto' }}>
    {children}
  </ButtonBase>
);

function TabBar({ light = false }) {
  const tabs = [[HomeIcon, 'Home'], [QrCodeScannerIcon, 'Scan', true], [FavoriteIcon, 'Favorites'], [AccountCircleIcon, 'Account']];
  return (
    <Box sx={{ position: 'absolute', left: 20, right: 20, bottom: 22, height: 64, borderRadius: '32px', bgcolor: light ? 'rgba(255,255,255,0.6)' : 'rgba(240,243,247,0.5)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', px: 0.5, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 4 }} aria-hidden>
      {tabs.map(([Icon, label, on]) => (
        <Box key={label} sx={{ flex: 1, height: 56, borderRadius: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: on ? 'rgba(120,120,128,0.16)' : 'transparent', color: on ? '#2a78bd' : INK }}>
          <Icon sx={{ fontSize: 26 }} />
          <Typography sx={{ fontSize: 11, color: 'inherit', fontFamily: 'inherit' }}>{label}</Typography>
        </Box>
      ))}
    </Box>
  );
}

// Rows on dark glass, as the app's Section: icon / number, label (+ sub),
// value, chevron when it opens something.
function Section({ title, rows = [], children }) {
  return (
    <Box sx={{ mt: 2.25 }}>
      {title && <Typography sx={{ color: W2, fontSize: 13, letterSpacing: '0.02em', px: '34px', pb: 0.75, fontFamily: 'inherit' }}>{title.toUpperCase()}</Typography>}
      <Box sx={{ mx: 2, borderRadius: '24px', overflow: 'hidden', ...DARK_GLASS }}>
        {children}
        {rows.map((r, i) => {
          const Icon = r.icon;
          return (
            <ButtonBase key={`${r.label}-${i}`} onClick={r.onClick} disabled={!r.onClick}
              sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 50, py: 1.25, px: 2, textAlign: 'left', borderTop: (i > 0 || children) ? '1px solid rgba(255,255,255,0.14)' : 0 }}>
              {r.num != null && <Box sx={{ width: 26, height: 26, borderRadius: '13px', bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', flexShrink: 0 }}>{r.num}</Box>}
              {Icon && <Box sx={{ width: 30, height: 30, borderRadius: '9px', bgcolor: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon sx={{ fontSize: 17, color: '#fff' }} /></Box>}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ color: '#fff', fontSize: r.num != null ? 15 : 17, lineHeight: 1.3, fontFamily: 'inherit' }}>{r.label}</Typography>
                {r.sub && <Typography sx={{ color: W2, fontSize: 13, lineHeight: 1.35, fontFamily: 'inherit' }}>{r.sub}</Typography>}
              </Box>
              {r.value && <Typography sx={{ color: W2, fontSize: 15, maxWidth: '50%', textAlign: 'right', fontFamily: 'inherit' }}>{r.value}</Typography>}
              {r.onClick && <ChevronRightIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.55)', flexShrink: 0 }} />}
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}
const Para = ({ children }) => <Typography sx={{ color: '#fff', fontSize: 15, lineHeight: 1.45, p: 2, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{children}</Typography>;

const STEP_TITLE = { materials: 'Materials', manufacturing: 'Made in', transport: 'Transport', care: 'Care', service: 'Service & resale' };

function DetailsPage({ p, step, open }) {
  const [kind, setKind] = useState(null);
  const t = p.traceabilityEsg || {};
  const route = t.route || {};
  const materials = list(p.materialSize?.materials).map((m) => ({ name: text(m?.material), pct: Number(m?.percent) || 0, origin: text(m?.origin) })).filter((m) => m.name);
  const origins = list(t.materialOrigins).map((o) => ({ name: text(o?.material), country: text(o?.country), company: text(o?.companyName) }));
  const originOf = (name) => origins.find((o) => o.name.toLowerCase() === name.toLowerCase());
  const care = p.maintenance || {};
  const tips = list(care.tips).map(text).filter(Boolean);
  const services = useMemo(() => readyServices(p), [p]);

  if (!step) {
    const details = [
      ['Type', text(p.productType)], ['Model', text(p.model)], ['Color', text(p.color)], ['Size', text(p.size)],
      ['Style number', text(p.skuStyleNumber)], ['Item ID', text(p.pmc_code) || '#1'],
    ].filter(([, v]) => v).map(([label, value]) => ({ label, value }));
    return (
      <>
        {text(p.aboutProduct) && <Section title="About this product"><Para>{p.aboutProduct}</Para></Section>}
        {details.length > 0 && <Section title="Details" rows={details} />}
        {!text(p.aboutProduct) && !details.length && <Section><Para>Nothing added yet.</Para></Section>}
      </>
    );
  }
  if (step === 'materials') {
    const total = materials.reduce((a, m) => a + m.pct, 0) || 1;
    return (
      <>
        {materials.length ? (
          <Section title="Composition" rows={materials.map((m) => {
            const o = originOf(m.name);
            return { label: m.name, sub: [o?.company, o?.country || m.origin].filter(Boolean).join(' · '), value: m.pct ? `${m.pct}%` : '' };
          })} />
        ) : <Section><Para>Nothing added yet.</Para></Section>}
        {materials.some((m) => m.pct) && (
          <Section title="Share by weight">
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', height: 12, borderRadius: '6px', overflow: 'hidden', gap: '2px' }}>
                {materials.map((m, i) => <Box key={m.name} sx={{ flex: m.pct / total, bgcolor: SHARE_COLORS[i % SHARE_COLORS.length] }} />)}
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.75, mt: 1.25 }}>
                {materials.map((m, i) => (
                  <Box key={m.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '5px', bgcolor: SHARE_COLORS[i % SHARE_COLORS.length] }} />
                    <Typography sx={{ color: W2, fontSize: 13, fontFamily: 'inherit' }}>{m.name}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Section>
        )}
      </>
    );
  }
  if (step === 'manufacturing') {
    return (
      <>
        <Section rows={[
          { icon: FactoryOutlinedIcon, label: 'Made in', value: text(t.madeIn) || text(t.originCountry) || '—' },
          text(t.co2Production) && { icon: Co2OutlinedIcon, label: 'CO₂ from production', value: text(t.co2Production) },
        ].filter(Boolean)} />
        {origins.length > 0 && <Section title="Where materials come from" rows={origins.map((o) => ({ icon: PlaceOutlinedIcon, label: o.name, sub: [o.company, o.country].filter(Boolean).join(' · ') }))} />}
        {(text(route.origin) || text(route.destination) || text(route.mode) || text(t.distance) || text(t.co2Transportation)) && (
          <Section title="Transport" rows={[
            { icon: RouteOutlinedIcon, label: 'Route', value: [text(route.origin || t.originCountry), text(route.destination)].filter(Boolean).join(' → ') || '—' },
            text(route.mode) && { icon: FlightOutlinedIcon, label: 'Shipped by', value: text(route.mode) },
            text(t.distance) && { icon: StraightenOutlinedIcon, label: 'Distance', value: text(t.distance) },
            text(t.co2Transportation) && { icon: Co2OutlinedIcon, label: 'CO₂ from transport', value: text(t.co2Transportation) },
          ].filter(Boolean)} />
        )}
      </>
    );
  }
  if (step === 'transport') {
    return (
      <>
        <Section rows={[
          { icon: RouteOutlinedIcon, label: 'Route', value: [text(route.origin || t.originCountry), text(route.destination)].filter(Boolean).join(' → ') || '—' },
          text(route.mode) && { icon: FlightOutlinedIcon, label: 'Shipped by', value: text(route.mode) },
          text(t.distance) && { icon: StraightenOutlinedIcon, label: 'Distance', value: text(t.distance) },
          text(t.co2Transportation) && { icon: Co2OutlinedIcon, label: 'CO₂ from transport', value: text(t.co2Transportation) },
        ].filter(Boolean)} />
      </>
    );
  }
  if (step === 'care') {
    return (
      <>
        {text(care.description) && <Section><Para>{care.description}</Para></Section>}
        {tips.length > 0 && <Section title="Care tips" rows={tips.map((tip, i) => ({ label: tip, num: i + 1 }))} />}
        {!text(care.description) && !tips.length && <Section><Para>Nothing added yet.</Para></Section>}
        {!!Number(p.warrantyValidYears) && <Section rows={[{ icon: VerifiedUserOutlinedIcon, label: 'Warranty', value: `${p.warrantyValidYears} years` }]} />}
      </>
    );
  }
  // service
  const service = services.find((x) => x.kind === kind) || services[0];
  if (!service) return <Section><Para>This brand doesn’t offer services for this product yet.</Para></Section>;
  return (
    <>
      <Box sx={{ display: 'flex', mx: 2, mt: 2, borderRadius: '22px', p: '3px', height: 44, gap: '2px', ...DARK_GLASS }}>
        {services.map((x) => {
          const on = x.kind === service.kind;
          return (
            <ButtonBase key={x.kind} onClick={() => setKind(x.kind)} sx={{ flex: 1, borderRadius: '19px', bgcolor: on ? '#fff' : 'transparent', color: on ? BG : '#fff', fontSize: 15, fontFamily: 'inherit' }}>
              {SEG[x.kind]}
            </ButtonBase>
          );
        })}
      </Box>
      <Section>
        <Box sx={{ p: 2 }}>
          {text(service.summary) && <Typography sx={{ color: '#fff', fontSize: 15, lineHeight: 1.45, fontFamily: 'inherit' }}>{service.summary}</Typography>}
          {text(service.partnerName) && <Typography sx={{ color: W2, fontSize: 13, mt: 0.75, fontFamily: 'inherit' }}>{`Provided by ${service.partnerName}`}</Typography>}
        </Box>
      </Section>
      {service.acceptRequests && (
        <Box sx={{ mx: 2, mt: 1.75, height: 52, borderRadius: '26px', backgroundImage: GRADIENT, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, fontSize: 17 }}>
          <BuildOutlinedIcon sx={{ fontSize: 20 }} />{service.meta?.button || 'Send request'}
        </Box>
      )}
      {list(service.steps).length > 0 && <Section title="How it works" rows={service.steps.map((x, i) => ({ label: x, num: i + 1 }))} />}
      {(text(service.cost) || text(service.time) || text(service.note)) && (
        <Section rows={[
          text(service.cost) && { icon: PaymentsOutlinedIcon, label: 'Cost', sub: service.cost },
          text(service.time) && { icon: ScheduleOutlinedIcon, label: 'Time', sub: service.time },
          text(service.note) && { icon: InfoOutlinedIcon, label: 'Good to know', sub: service.note },
        ].filter(Boolean)} />
      )}
      {(text(service.url) || text(service.email) || text(service.phone)) && (
        <Section rows={[
          text(service.url) && { icon: LanguageOutlinedIcon, label: 'Website', onClick: () => {} },
          text(service.email) && { icon: EmailOutlinedIcon, label: service.email, onClick: () => {} },
          text(service.phone) && { icon: PhoneOutlinedIcon, label: service.phone, onClick: () => {} },
        ].filter(Boolean)} />
      )}
    </>
  );
}

// The app's Brand page: the cover under the top bar, the logo card, name,
// about, website, Share company, and this product under Products.
function BrandPage({ p, main }) {
  const b = p.brandInfo || {};
  const cover = text(b.coverUrl) ? imgSrc(b.coverUrl) : '';
  return (
    <Box sx={{ position: 'absolute', inset: 0, bgcolor: '#f4f7fc', overflowY: 'auto', pb: '110px', ...NO_SCROLLBAR }}>
      <Box sx={{ height: 260, position: 'relative', bgcolor: '#c9d6e6', backgroundImage: cover ? `url(${cover})` : 'linear-gradient(120deg,#2b3a4d,#4a6a8a 60%,#9fb8d6)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <Box sx={{ mx: 2, mt: '-46px', position: 'relative', bgcolor: '#fff', borderRadius: '24px', px: 2.5, pb: 2.5, pt: 6, textAlign: 'center', boxShadow: '0 4px 14px rgba(18,58,86,0.08)' }}>
        <Box sx={{ position: 'absolute', top: -40, left: '50%', ml: '-40px', width: 80, height: 80, borderRadius: '40px', bgcolor: '#fff', border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {text(b.logoUrl)
            ? <Box component="img" src={imgSrc(b.logoUrl)} alt="" sx={{ width: '82%', height: '82%', objectFit: 'contain' }} />
            : <ApartmentOutlinedIcon sx={{ fontSize: 34, color: '#2a78bd' }} />}
        </Box>
        <Typography sx={{ fontSize: 24, color: INK, fontFamily: 'inherit' }}>{text(b.name) || 'Brand'}</Typography>
        {text(b.tagline) && <Typography sx={{ fontSize: 15, color: '#5f6b78', fontFamily: 'inherit' }}>{b.tagline}</Typography>}
        {text(b.detail) && <Typography sx={{ fontSize: 15, color: '#3c4a57', mt: 1, lineHeight: 1.45, fontFamily: 'inherit' }}>{b.detail}</Typography>}
      </Box>
      {text(b.websiteUrl) && (
        <Box sx={{ mx: 2, mt: 1.5, bgcolor: '#fff', borderRadius: '20px', minHeight: 50, px: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LanguageOutlinedIcon sx={{ color: '#2a78bd', fontSize: 20 }} />
          <Typography sx={{ flex: 1, fontSize: 16, color: INK, fontFamily: 'inherit' }} noWrap>{b.websiteUrl.replace(/^https?:\/\//, '')}</Typography>
          <ChevronRightIcon sx={{ color: '#b4bcc6' }} />
        </Box>
      )}
      <Box sx={{ mx: 2, mt: 1.5, height: 48, borderRadius: '24px', border: '1.5px solid #2a78bd', color: '#2a78bd', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, fontSize: 16 }}>
        <ShareOutlinedIcon sx={{ fontSize: 18 }} />Share company
      </Box>
      <Typography sx={{ mx: 2.5, mt: 2.5, mb: 1, fontSize: 20, color: INK, fontFamily: 'inherit' }}>Products</Typography>
      <Box sx={{ mx: 2, bgcolor: '#fff', borderRadius: '20px', p: 1.25, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 56, height: 56, borderRadius: '14px', bgcolor: '#eef1f4', backgroundImage: main ? `url(${main})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 16, color: INK, fontFamily: 'inherit' }}>{text(p.name) || 'Product name'}</Typography>
          <Typography noWrap sx={{ fontSize: 14, color: '#5f6b78', fontFamily: 'inherit' }}>{priceText(p)}</Typography>
        </Box>
      </Box>
    </Box>
  );
}

/** The screen inside the phone. `view` / `onView` ('passport' | 'details' |
 *  'photos') let the Preview dialog jump to a page; everything else is a
 *  page stack inside the phone. */
export function PassportScreen({ product, view = 'passport', onView = () => {} }) {
  const p = product || {};
  const images = list(p.images).map(imgSrc).filter(Boolean).slice(0, 8);
  const [index, setIndex] = useState(0);
  const [stack, setStack] = useState([{ page: 'passport' }]);
  const [viewer, setViewer] = useState(false);
  const [liked, setLiked] = useState('');
  const [inCart, setInCart] = useState(false);
  useEffect(() => { setIndex(0); }, [p._id, images.length]);
  // The dialog's Passport / Details / Photos.
  useEffect(() => {
    if (view === 'photos') { setViewer(true); return; }
    setViewer(false);
    setStack(view === 'details' ? [{ page: 'passport' }, { page: 'details', step: null }] : [{ page: 'passport' }]);
  }, [view]);
  const top = stack[stack.length - 1];
  const push = (entry) => setStack((s) => [...s, entry]);
  const back = () => {
    if (stack.length > 1) {
      const next = stack.slice(0, -1);
      setStack(next);
      if (next.length === 1) onView('passport');
    }
  };
  const main = images[index] || images[0] || '';
  const brandName = text(p.brandInfo?.name);
  const materialNames = list(p.materialSize?.materials).map((m) => text(m?.material).replace(/\s*\(.*\)\s*/g, '')).filter(Boolean);
  const open = (step) => push({ page: 'details', step });

  const topBar = (right) => (
    <Box sx={{ position: 'absolute', top: 58, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 3, pointerEvents: 'none' }}>
      <Circle label="Back" onClick={back}><ChevronLeftIcon /></Circle>
      <Box sx={{ display: 'flex', gap: 1.25 }}>{right}</Box>
    </Box>
  );

  let page;
  if (top.page === 'brand') {
    page = (
      <>
        <BrandPage p={p} main={main} />
        {topBar(<Circle label="Share"><IosShareIcon sx={{ fontSize: 20 }} /></Circle>)}
        <TabBar light />
      </>
    );
  } else if (top.page === 'details') {
    const step = top.step;
    const stageH = Math.round(SCREEN.w * (step ? 0.42 : 0.36));
    page = (
      <>
        <Backdrop image={main} />
        <Box sx={{ position: 'absolute', inset: 0, overflowY: 'auto', pb: '110px', ...NO_SCROLLBAR }}>
          <Box sx={{ height: stageH, position: 'relative', WebkitMaskImage: 'linear-gradient(180deg,#000 55%,transparent 100%)', maskImage: 'linear-gradient(180deg,#000 55%,transparent 100%)' }}>
            {main && <Box component="img" src={main} alt="" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.1))' }} />
          </Box>
          <Box sx={{ mt: step ? '-64px' : `${Math.max(110, stageH - 30) - stageH}px`, position: 'relative' }}>
            {step && <Typography sx={{ color: '#fff', fontSize: 34, lineHeight: 1.2, px: 2.5, fontFamily: 'inherit' }}>{STEP_TITLE[step]}</Typography>}
            {step && <Typography noWrap sx={{ color: W2, fontSize: 15, px: 2.5, mt: 0.25, fontFamily: 'inherit' }}>{text(p.name)}</Typography>}
            <DetailsPage p={p} step={step} open={open} />
          </Box>
        </Box>
        {topBar(<Circle label="Share"><IosShareIcon sx={{ fontSize: 20 }} /></Circle>)}
        {!step && (
          <Box sx={{ position: 'absolute', top: 58, left: 66, right: 66, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
            <Box sx={{ maxWidth: '100%', px: 2, height: 40, borderRadius: '20px', bgcolor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center' }}>
              <Typography noWrap sx={{ fontSize: 15, color: INK, fontFamily: 'inherit' }}>{text(p.name) || 'Product name'}</Typography>
            </Box>
          </Box>
        )}
        <TabBar />
      </>
    );
  } else {
    const buttons = [
      { label: liked === 'like' ? 'Liked' : 'Like', on: liked === 'like', icon: liked === 'like' ? ThumbUpIcon : ThumbUpOutlinedIcon, onClick: () => setLiked((v) => (v === 'like' ? '' : 'like')) },
      { label: inCart ? 'In cart' : 'Add to cart', on: inCart, icon: inCart ? ShoppingCartCheckoutIcon : ShoppingCartOutlinedIcon, onClick: () => setInCart((v) => !v) },
      { label: liked === 'dislike' ? 'Marked not for me' : 'Not for me', on: liked === 'dislike', icon: liked === 'dislike' ? ThumbDownIcon : ThumbDownOutlinedIcon, onClick: () => setLiked((v) => (v === 'dislike' ? '' : 'dislike')) },
    ];
    const rows = [
      { icon: ApartmentOutlinedIcon, label: 'Brand', value: brandName, onClick: () => push({ page: 'brand' }) },
      { icon: SpaOutlinedIcon, label: 'Materials', value: materialNames.slice(0, 2).join(', ') || text(p.detailFacts?.material), onClick: () => open('materials') },
      { icon: FactoryOutlinedIcon, label: 'Made in', value: text(p.traceabilityEsg?.madeIn), onClick: () => open('manufacturing') },
      { icon: InfoOutlinedIcon, label: 'Care', value: text(p.detailFacts?.durability), onClick: () => open('care') },
      { icon: RecyclingOutlinedIcon, label: 'Service & resale', value: '', onClick: () => open('service') },
    ];
    const line = passportLine(p);
    page = (
      <>
        <Backdrop image={main} />
        <Box sx={{ position: 'absolute', inset: 0, overflowY: 'auto', pb: '110px', ...NO_SCROLLBAR }}>
          {/* The photo: dragged left / right like the app; a tap opens Photos. */}
          <Box aria-label="Show the photos" role="button" sx={{ width: '100%', height: 306, position: 'relative', WebkitMaskImage: 'linear-gradient(180deg,#000 68%,transparent 100%)', maskImage: 'linear-gradient(180deg,#000 68%,transparent 100%)' }}>
            {images.length > 0 && <PhotoTrack images={images} index={Math.min(index, images.length - 1)} onIndex={setIndex} onTap={() => setViewer(true)} sx={{ position: 'absolute', inset: 0 }} />}
            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 25%)', pointerEvents: 'none' }} />
          </Box>
          {images.length > 1 && (
            <Box sx={{ mt: '-78px', position: 'relative', display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
              {images.slice(0, 5).map((src, i) => {
                const on = i === index;
                return (
                  <ButtonBase key={`t${i}`} onClick={() => setIndex(i)} aria-label={`Photo ${i + 1}`} aria-pressed={on}
                    sx={{ width: on ? 64 : 56, height: on ? 64 : 56, borderRadius: '14px', overflow: 'hidden', border: on ? '2.5px solid #fff' : '1px solid rgba(255,255,255,0.4)' }}>
                    <Box component="img" src={src} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </ButtonBase>
                );
              })}
            </Box>
          )}
          <Box sx={{ px: 3, mt: images.length > 1 ? 1.75 : '-60px', position: 'relative' }}>
            {brandName && <Typography sx={{ fontSize: 13, letterSpacing: '0.08em', color: ACC, fontFamily: 'inherit' }}>{brandName.toUpperCase()}</Typography>}
            <Typography sx={{ fontSize: 26, color: '#fff', lineHeight: 1.25, fontFamily: 'inherit' }}>{text(p.name) || 'Product name'}</Typography>
            {line && <Typography sx={{ fontSize: 15, color: W2, mt: 0.25, fontFamily: 'inherit' }}>{line}</Typography>}
          </Box>
          <Box sx={{ display: 'flex', gap: 1.25, mx: 2, mt: 2 }}>
            {buttons.map((b) => {
              const Icon = b.icon;
              return (
                <Box key={b.label} sx={{ position: 'relative' }}>
                  <ButtonBase onClick={b.onClick} aria-label={b.label} aria-pressed={b.on}
                    sx={{ width: 52, height: 52, borderRadius: '26px', color: '#fff', ...(b.on ? { backgroundImage: GRADIENT, border: '2px solid rgba(255,255,255,0.85)', boxShadow: '0 8px 20px rgba(0,0,0,0.25)' } : DARK_GLASS) }}>
                    <Icon sx={{ fontSize: 23 }} />
                  </ButtonBase>
                  {b.on && (
                    <Box sx={{ position: 'absolute', top: -3, right: -3, width: 20, height: 20, borderRadius: '10px', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <CheckIcon sx={{ fontSize: 13, color: TONE }} />
                    </Box>
                  )}
                </Box>
              );
            })}
            <ButtonBase onClick={() => { open(null); onView('details'); }} sx={{ flex: 1, height: 52, borderRadius: '26px', backgroundImage: GRADIENT, color: '#fff', gap: 1, fontSize: 16, boxShadow: '0 8px 20px rgba(0,0,0,0.25)', fontFamily: 'inherit' }}>
              <ArticleOutlinedIcon sx={{ fontSize: 19 }} />Details
            </ButtonBase>
          </Box>
          <Box sx={{ mt: 0 }}>
            <Section rows={rows} />
          </Box>
        </Box>
        {topBar(<>
          <Circle label="Share"><IosShareIcon sx={{ fontSize: 20 }} /></Circle>
          <Circle label="More"><MoreHorizIcon /></Circle>
        </>)}
        <TabBar />
      </>
    );
  }

  return (
    <Box sx={{ position: 'absolute', inset: 0 }}>
      {page}
      {/* The app's full-screen photo viewer: drag the photo left / right. */}
      {viewer && (
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: '#000', zIndex: 6 }}>
          <PhotoTrack images={images} index={index} onIndex={setIndex} sx={{ position: 'absolute', inset: 0 }} />
          <Box sx={{ position: 'absolute', top: 58, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'none' }}>
            <Circle label="Close the photos" onClick={() => { setViewer(false); if (view === 'photos') onView('passport'); }}><CloseIcon /></Circle>
            <Box sx={{ height: 32, px: 1.75, borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.22)', color: '#fff', display: 'flex', alignItems: 'center', fontSize: 15 }}>{images.length ? `${index + 1} / ${images.length}` : 'No photos'}</Box>
            <Box sx={{ width: 40 }} />
          </Box>
          <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 34 }}>
            <Thumbs images={images} index={index} onIndex={setIndex} />
          </Box>
        </Box>
      )}
    </Box>
  );
}

/** The passport in an iPhone 16 frame, `width` px wide. Controlled (view,
 *  onView) or on its own. */
export default function PassportPhone({ product, width = 300, view: viewProp, onView }) {
  const [own, setOwn] = useState('passport');
  const view = viewProp || own;
  const setView = onView || setOwn;
  const outerW = SCREEN.w + SCREEN.bezel * 2;
  const outerH = SCREEN.h + SCREEN.bezel * 2;
  const scale = width / outerW;
  return (
    <Box aria-label="Preview of the shopper’s product page" sx={{ width, height: Math.round(outerH * scale), flexShrink: 0, position: 'relative', mx: 'auto' }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, width: outerW, height: outerH, transform: `scale(${scale})`, transformOrigin: 'top left', p: `${SCREEN.bezel}px`, bgcolor: '#1d1d1f', borderRadius: `${SCREEN.radius + SCREEN.bezel}px`, boxShadow: '0 18px 44px rgba(0,0,0,0.28), inset 0 0 0 2px #3a3a3c' }}>
        <Box sx={{ width: SCREEN.w, height: SCREEN.h, borderRadius: `${SCREEN.radius}px`, overflow: 'hidden', position: 'relative', bgcolor: BG, fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, system-ui, sans-serif', '& .MuiTypography-root': { fontFamily: 'inherit' } }}>
          <PassportScreen product={product} view={view} onView={setView} />
          <Box sx={{ position: 'absolute', top: 11, left: '50%', ml: '-63px', width: 126, height: 37, borderRadius: '20px', bgcolor: '#000', zIndex: 7 }} aria-hidden />
          <Box sx={{ position: 'absolute', bottom: 8, left: '50%', ml: '-70px', width: 140, height: 5, borderRadius: '3px', bgcolor: 'rgba(255,255,255,0.7)', zIndex: 7 }} aria-hidden />
        </Box>
      </Box>
    </Box>
  );
}
