import React, { useEffect, useState } from 'react';
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
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import IosShareIcon from '@mui/icons-material/IosShare';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import HomeIcon from '@mui/icons-material/Home';
import CropFreeIcon from '@mui/icons-material/CropFree';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { getFileUrl } from '../../helper';
import { readyServices } from '../../utils/circularity';

// The phone app's passport (app/src/components/PassportView.tsx), drawn for
// the admin web: the photo fading into a blurred copy of itself, thumbnails,
// brand, name and price, Like / Cart / Not for me and Details, then the
// Brand / Materials / Made in / Care / Service rows on dark glass. Rows and
// Details open the dark details pages; a tap on the photo opens Photos.
// Drawn at the iPhone 16's 393 x 852 pt and scaled to `width`.

const SCREEN = { w: 393, h: 852, radius: 55, bezel: 12 };
const BG = '#10263a';
const TONE = '#1b4f72';
const W2 = 'rgba(255,255,255,0.74)';
const ACC = '#a9cdf0';
const GRADIENT = 'linear-gradient(135deg,#2a78bd,#1b4f72)';
const DARK_GLASS = { bgcolor: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(20px)' };

const text = (v) => String(v ?? '').trim();
const list = (v) => (Array.isArray(v) ? v : []);
const imgSrc = (img) => getFileUrl(typeof img === 'string' ? img : img?.src || img?.url || '');
const nice = (v) => { const x = text(v).replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase(); return x ? x[0].toUpperCase() + x.slice(1) : ''; };

function priceText(p) {
  if (!p.price) return '';
  try {
    return new Intl.NumberFormat('en-IE', { style: 'currency', currency: p.currency || 'EUR', maximumFractionDigits: 2 }).format(p.price);
  } catch (e) {
    return `${p.currency || ''} ${p.price}`.trim();
  }
}

// What each row and the details pages show for this product.
function facts(p) {
  const brand = p.brandInfo || {};
  const materials = list(p.materialSize?.materials).filter((m) => text(m?.material));
  const t = p.traceabilityEsg || {};
  const m = p.maintenance || {};
  const services = readyServices(p);
  return {
    brand: text(brand.name),
    materials: materials.map((x) => x.material).join(', '),
    madeIn: text(t.madeIn) || text(t.originCountry) || text(p.materialSize?.manufacturingCountry),
    care: text(m.description) || list(m.tips).filter(Boolean)[0] || '',
    service: services.map((s) => s.meta?.shopperTitle).filter(Boolean).join(', '),
    materialRows: materials.map((x) => [x.material, [x.percent ? `${Number(x.percent) || 0}%` : '', x.origin].filter(Boolean).join(' · ')]),
    madeRows: [
      ['Made in', text(t.madeIn) || text(t.originCountry)],
      ['Country of origin', text(t.originCountry)],
      ['Shipping', text(t.shippingLog) || [t.route?.origin, t.route?.destination].filter((v) => text(v)).join(' → ')],
      ['CO2 from production', text(t.co2Production)],
      ['CO2 from transport', text(t.co2Transportation)],
    ].filter(([, v]) => v),
    careTips: [text(m.description), ...list(m.tips).map(text)].filter(Boolean),
    services,
    detailRows: [
      ['Type', nice(p.productType || p.itemCategory)], ['Model', text(p.model)], ['Colour', text(p.color)], ['Size', text(p.size)],
      ['Style number', text(p.skuStyleNumber)], ['Made on', text(p.manufactureDate)], ['Warranty', text(p.warrantyStatus)],
    ].filter(([, v]) => v),
    brandRows: [['Name', text(brand.name)], ['Tagline', text(brand.tagline)], ['Website', text(brand.website || brand.url)]].filter(([, v]) => v),
  };
}

function Backdrop({ image }) {
  return (
    <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', bgcolor: BG }} aria-hidden>
      {image && <Box component="img" src={image} alt="" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(40px)', transform: 'scale(1.3)' }} />}
      <Box sx={{ position: 'absolute', inset: 0, bgcolor: TONE, opacity: 0.55 }} />
    </Box>
  );
}

const Circle = ({ children, onClick, label, light = true, size = 40 }) => (
  <ButtonBase onClick={onClick} aria-label={label}
    sx={{ width: size, height: size, borderRadius: '50%', color: light ? '#1c1c1e' : '#fff', bgcolor: light ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.16)', backdropFilter: 'blur(16px)', boxShadow: '0 2px 10px rgba(0,0,0,0.12)' }}>
    {children}
  </ButtonBase>
);

function TabBar() {
  const tabs = [[HomeIcon, 'Home'], [CropFreeIcon, 'Scan', true], [FavoriteBorderIcon, 'Favorites'], [AccountCircleOutlinedIcon, 'Account']];
  return (
    <Box sx={{ position: 'absolute', left: 16, right: 16, bottom: 22, height: 64, borderRadius: '32px', bgcolor: 'rgba(240,243,247,0.88)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', px: 0.75, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }} aria-hidden>
      {tabs.map(([Icon, label, on]) => (
        <Box key={label} sx={{ flex: 1, height: 52, borderRadius: '26px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: on ? 'rgba(120,120,128,0.16)' : 'transparent', color: on ? '#2a78bd' : '#1c1c1e' }}>
          <Icon sx={{ fontSize: 22 }} />
          <Typography sx={{ fontSize: 11, color: 'inherit' }}>{label}</Typography>
        </Box>
      ))}
    </Box>
  );
}

const Rows = ({ rows }) => (
  <Box sx={{ mx: 2, borderRadius: '24px', overflow: 'hidden', ...DARK_GLASS }}>
    {rows.map((r, i) => {
      const Icon = r.icon;
      return (
        <ButtonBase key={r.label} onClick={r.onClick} disabled={!r.onClick}
          sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 50, py: 1.25, px: 2, textAlign: 'left', borderTop: i ? '1px solid rgba(255,255,255,0.14)' : 0 }}>
          {Icon && <Box sx={{ width: 30, height: 30, borderRadius: '9px', bgcolor: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon sx={{ fontSize: 17, color: '#fff' }} /></Box>}
          <Typography sx={{ fontSize: 17, color: '#fff', flexShrink: 0, maxWidth: '55%' }} noWrap>{r.label}</Typography>
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.75 }}>
            {r.value && <Typography sx={{ fontSize: 15, color: W2, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: r.wrap ? 'normal' : 'nowrap' }}>{r.value}</Typography>}
            {r.onClick && <ChevronRightIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.55)', flexShrink: 0 }} />}
          </Box>
        </ButtonBase>
      );
    })}
  </Box>
);

const Card = ({ title, children }) => (
  <Box sx={{ mx: 2, mt: 2, p: 2.25, borderRadius: '24px', ...DARK_GLASS }}>
    {title && <Typography sx={{ color: W2, fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase', mb: 0.75 }}>{title}</Typography>}
    {children}
  </Box>
);

const STEP_TITLES = { overview: 'Details', brand: 'Brand', materials: 'Materials', made: 'Made in', care: 'Care', service: 'Service & resale' };

/** The screen inside the phone. view: 'passport' | 'details' | 'photos'. */
export function PassportScreen({ product, view, onView }) {
  const p = product || {};
  const images = list(p.images).map(imgSrc).filter(Boolean).slice(0, 8);
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState('overview');
  const [liked, setLiked] = useState('');
  const [inCart, setInCart] = useState(false);
  useEffect(() => { setIndex(0); }, [p._id, images.length]);
  const main = images[index] || images[0] || '';
  const f = facts(p);
  const line = [priceText(p), text(p.model)].filter(Boolean).join(' · ');
  const open = (s) => { setStep(s); onView('details'); };
  const header = (title, onBack) => (
    <Box sx={{ position: 'relative', zIndex: 2, pt: '58px', px: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Circle onClick={onBack} label="Back"><ChevronLeftIcon /></Circle>
      <Typography sx={{ color: '#fff', fontSize: 20, flex: 1 }} noWrap>{title}</Typography>
    </Box>
  );

  if (view === 'photos') {
    return (
      <Box sx={{ position: 'absolute', inset: 0, bgcolor: '#000' }}>
        {main && <Box component="img" src={main} alt={p.name || ''} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        <Box sx={{ position: 'absolute', top: 58, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Circle onClick={() => onView('passport')} label="Close the photos"><CloseIcon /></Circle>
          <Box sx={{ height: 32, px: 1.75, borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.22)', color: '#fff', display: 'flex', alignItems: 'center', fontSize: 15 }}>{images.length ? `${index + 1} / ${images.length}` : 'No photos'}</Box>
          <Box sx={{ width: 40 }} />
        </Box>
        {images.length > 1 && (
          <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 34, display: 'flex', gap: 1, justifyContent: 'center' }}>
            {images.map((src, i) => (
              <ButtonBase key={`v${i}`} onClick={() => setIndex(i)} aria-label={`Photo ${i + 1}`}
                sx={{ width: 52, height: 52, borderRadius: '14px', overflow: 'hidden', border: i === index ? '2.5px solid #fff' : '1px solid rgba(255,255,255,0.4)' }}>
                <Box component="img" src={src} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </ButtonBase>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  if (view === 'details') {
    const pairs = (rows) => rows.map(([k, v]) => ({ label: k, value: v, wrap: true }));
    let body;
    if (step === 'materials') body = f.materialRows.length ? <Rows rows={pairs(f.materialRows)} /> : <Card><Typography sx={{ color: W2 }}>Nothing added yet.</Typography></Card>;
    else if (step === 'made') body = f.madeRows.length ? <Rows rows={pairs(f.madeRows)} /> : <Card><Typography sx={{ color: W2 }}>Nothing added yet.</Typography></Card>;
    else if (step === 'brand') body = f.brandRows.length ? <Rows rows={pairs(f.brandRows)} /> : <Card><Typography sx={{ color: W2 }}>Nothing added yet.</Typography></Card>;
    else if (step === 'care') {
      body = (
        <Card>
          {f.careTips.length ? f.careTips.map((c, i) => <Typography key={i} sx={{ color: '#fff', fontSize: 15, lineHeight: 1.45, mb: 0.75 }}>{c}</Typography>) : <Typography sx={{ color: W2 }}>Nothing added yet.</Typography>}
        </Card>
      );
    } else if (step === 'service') {
      body = f.services.length ? f.services.map((s) => (
        <Card key={s.kind} title={s.meta?.shopperTitle}>
          {text(s.summary) && <Typography sx={{ color: '#fff', fontSize: 15, lineHeight: 1.45 }}>{s.summary}</Typography>}
          {[text(s.cost) && `${s.meta?.cost?.label || 'Cost'}: ${s.cost}`, text(s.time) && `${s.meta?.time?.label || 'Time'}: ${s.time}`].filter(Boolean).map((x) => <Typography key={x} sx={{ color: W2, fontSize: 14, mt: 0.5 }}>{x}</Typography>)}
        </Card>
      )) : <Card><Typography sx={{ color: W2 }}>Nothing added yet.</Typography></Card>;
    } else {
      body = (
        <>
          <Card title="About this product">
            <Typography sx={{ color: '#fff', fontSize: 15, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{text(p.aboutProduct) || 'Nothing added yet.'}</Typography>
          </Card>
          <Card title="Details">
            {f.detailRows.length ? f.detailRows.map(([k, v], i) => (
              <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1, borderTop: i ? '1px solid rgba(255,255,255,0.14)' : 0 }}>
                <Typography sx={{ color: '#fff', fontSize: 15 }}>{k}</Typography>
                <Typography sx={{ color: W2, fontSize: 15, textAlign: 'right' }}>{v}</Typography>
              </Box>
            )) : <Typography sx={{ color: W2 }}>Nothing added yet.</Typography>}
          </Card>
        </>
      );
    }
    return (
      <Box sx={{ position: 'absolute', inset: 0 }}>
        <Backdrop image={main} />
        {header(STEP_TITLES[step] || 'Details', () => { setStep('overview'); onView('passport'); })}
        <Box sx={{ position: 'absolute', inset: 0, top: 110, overflowY: 'auto', pb: '110px', pt: 1, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
          <Box sx={{ px: 3, mb: 1.5 }}>
            {f.brand && <Typography sx={{ fontSize: 13, letterSpacing: '0.08em', color: ACC }}>{f.brand.toUpperCase()}</Typography>}
            <Typography sx={{ fontSize: 24, color: '#fff', lineHeight: 1.25 }}>{text(p.name) || 'Product name'}</Typography>
          </Box>
          {body}
        </Box>
        <TabBar />
      </Box>
    );
  }

  const buttons = [
    { label: liked === 'like' ? 'Liked' : 'Like', on: liked === 'like', icon: liked === 'like' ? ThumbUpIcon : ThumbUpOutlinedIcon, onClick: () => setLiked((v) => (v === 'like' ? '' : 'like')) },
    { label: inCart ? 'In cart' : 'Add to cart', on: inCart, icon: inCart ? ShoppingCartCheckoutIcon : ShoppingCartOutlinedIcon, onClick: () => setInCart((v) => !v) },
    { label: liked === 'dislike' ? 'Marked not for me' : 'Not for me', on: liked === 'dislike', icon: liked === 'dislike' ? ThumbDownIcon : ThumbDownOutlinedIcon, onClick: () => setLiked((v) => (v === 'dislike' ? '' : 'dislike')) },
  ];
  return (
    <Box sx={{ position: 'absolute', inset: 0 }}>
      <Backdrop image={main} />
      <Box sx={{ position: 'absolute', inset: 0, overflowY: 'auto', pb: '110px', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
        <ButtonBase onClick={() => onView('photos')} aria-label="Show the photos" sx={{ display: 'block', width: '100%', height: 306, position: 'relative', WebkitMaskImage: 'linear-gradient(180deg,#000 68%,transparent 100%)', maskImage: 'linear-gradient(180deg,#000 68%,transparent 100%)' }}>
          {main && <Box component="img" src={main} alt={p.name || ''} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
          <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 25%)' }} />
        </ButtonBase>
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
          {f.brand && <Typography sx={{ fontSize: 13, letterSpacing: '0.08em', color: ACC }}>{f.brand.toUpperCase()}</Typography>}
          <Typography sx={{ fontSize: 26, color: '#fff', lineHeight: 1.25 }}>{text(p.name) || 'Product name'}</Typography>
          {line && <Typography sx={{ fontSize: 15, color: W2, mt: 0.25 }}>{line}</Typography>}
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
          <ButtonBase onClick={() => open('overview')} sx={{ flex: 1, height: 52, borderRadius: '26px', backgroundImage: GRADIENT, color: '#fff', gap: 1, fontSize: 16, boxShadow: '0 8px 20px rgba(0,0,0,0.25)' }}>
            <ArticleOutlinedIcon sx={{ fontSize: 19 }} />Details
          </ButtonBase>
        </Box>
        <Box sx={{ mt: 2 }}>
          <Rows rows={[
            { icon: ApartmentOutlinedIcon, label: 'Brand', value: f.brand, onClick: () => open('brand') },
            { icon: SpaOutlinedIcon, label: 'Materials', value: f.materials, onClick: () => open('materials') },
            { icon: FactoryOutlinedIcon, label: 'Made in', value: f.madeIn, onClick: () => open('made') },
            { icon: InfoOutlinedIcon, label: 'Care', value: f.care, onClick: () => open('care') },
            { icon: RecyclingOutlinedIcon, label: 'Service & resale', value: '', onClick: () => open('service') },
          ]} />
        </Box>
      </Box>
      <Box sx={{ position: 'absolute', top: 58, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }} aria-hidden>
        <Circle label="Back"><ChevronLeftIcon /></Circle>
        <Box sx={{ display: 'flex', gap: 1.25 }}>
          <Circle label="Share"><IosShareIcon sx={{ fontSize: 20 }} /></Circle>
          <Circle label="More"><MoreHorizIcon /></Circle>
        </Box>
      </Box>
      <TabBar />
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
          <Box sx={{ position: 'absolute', top: 11, left: '50%', ml: '-63px', width: 126, height: 37, borderRadius: '20px', bgcolor: '#000', zIndex: 5 }} aria-hidden />
          <Box sx={{ position: 'absolute', bottom: 8, left: '50%', ml: '-70px', width: 140, height: 5, borderRadius: '3px', bgcolor: 'rgba(255,255,255,0.7)', zIndex: 5 }} aria-hidden />
        </Box>
      </Box>
    </Box>
  );
}
