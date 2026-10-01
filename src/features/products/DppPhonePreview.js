import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ImageIcon from '@mui/icons-material/Image';
import { getFileUrl } from '../../helper';
import { dppFontCss, dppSectionLabel, normalizeDppTheme } from '../../utils/dppTheme';

const text = (v) => String(v ?? '').trim();
const list = (v) => (Array.isArray(v) ? v : []);

const safeUrl = (url) => (/^https?:\/\//i.test(text(url)) ? text(url) : `https://${text(url)}`);
const todayIso = () => new Date().toISOString().slice(0, 10);

// A row whose value is a link. In the studio preview (`live` off) it only
// looks like one, so clicking around the preview never leaves the page.
function LinkRow({ label, href, color, live, linkText = 'Open ›' }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, py: 0.5 }}>
      <Typography sx={{ fontSize: 12, opacity: 0.7, color, fontFamily: 'inherit', wordBreak: 'break-word' }}>{label}</Typography>
      {live ? (
        <Box component="a" href={href} target="_blank" rel="noopener noreferrer" sx={{ fontSize: 12, fontWeight: 600, color, fontFamily: 'inherit', flexShrink: 0 }}>
          {linkText}
        </Box>
      ) : (
        <Typography sx={{ fontSize: 12, fontWeight: 600, color, fontFamily: 'inherit', flexShrink: 0 }}>{linkText}</Typography>
      )}
    </Box>
  );
}

function Row({ label, value, color }) {
  if (!text(value)) return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, py: 0.5 }}>
      <Typography sx={{ fontSize: 12, opacity: 0.7, color, fontFamily: 'inherit' }}>{label}</Typography>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color, textAlign: 'right', fontFamily: 'inherit', wordBreak: 'break-word' }}>{value}</Typography>
    </Box>
  );
}

const Empty = ({ color }) => (
  <Typography sx={{ fontSize: 12, opacity: 0.6, color, fontStyle: 'italic', fontFamily: 'inherit' }}>
    Nothing added yet.
  </Typography>
);

// What each section shows for this product. Returns null when it has nothing,
// so the preview can say "Nothing added yet" instead of an empty box.
function sectionBody(key, p, color, live) {
  if (key === 'journey') {
    const rows = [
      ['Type', p.productType], ['Color', p.color], ['Size', p.size], ['Style / SKU', p.skuStyleNumber],
      ['Made on', p.manufactureDate], ['Fit', p.detailFacts?.fit], ['Durability', p.detailFacts?.durability],
    ].filter(([, v]) => text(v));
    if (!rows.length && !text(p.aboutProduct)) return null;
    return (
      <>
        {text(p.aboutProduct) && (
          <Typography sx={{ fontSize: 12, color, mb: 0.75, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{p.aboutProduct}</Typography>
        )}
        {rows.map(([l, v]) => <Row key={l} label={l} value={v} color={color} />)}
      </>
    );
  }
  if (key === 'materials') {
    const rows = list(p.materialSize?.materials).filter((m) => text(m?.material));
    const certs = list(p.certifications).map((c) => (typeof c === 'string' ? c : c?.title)).filter((c) => text(c));
    if (!rows.length && !certs.length) return null;
    return (
      <>
        {rows.map((m, i) => (
          <Row key={i} label={`${m.material}${text(m.origin) ? ` · ${m.origin}` : ''}`} value={`${Number(m.percent) || 0}%`} color={color} />
        ))}
        {certs.map((c, i) => <Row key={`c${i}`} label="Certified" value={c} color={color} />)}
      </>
    );
  }
  if (key === 'care') {
    const m = p.maintenance || {};
    const tips = list(m.tips).filter(Boolean);
    if (!list(m.iconIds).length && !text(m.description) && !tips.length) return null;
    return (
      <>
        {list(m.iconIds).length > 0 && <Row label="Care symbols" value={`${list(m.iconIds).length} selected`} color={color} />}
        {text(m.description) && <Typography sx={{ fontSize: 12, color, fontFamily: 'inherit' }}>{m.description}</Typography>}
        {tips.map((t, i) => <Typography key={i} sx={{ fontSize: 12, color, fontFamily: 'inherit' }}>• {t}</Typography>)}
      </>
    );
  }
  if (key === 'dispose') {
    const d = p.disposal || {};
    const links = [['Repair', d.repairUrl], ['Resell / reuse', d.reuseUrl], ['Rent', d.rentalUrl], ['Recycle', d.disposeUrl]].filter(([, v]) => text(v));
    const s = p.sustainabilityImpact || {};
    const impact = list(s.items).filter((it) => text(it?.value));
    const legacy = [['CO2 avoided', s.co2Avoided], ['Water saved', s.waterSaved], ['Energy saved', s.energySaved]].filter(([, v]) => text(v));
    if (!links.length && !impact.length && !legacy.length) return null;
    return (
      <>
        {links.map(([l, url]) => <LinkRow key={l} label={l} href={safeUrl(url)} color={color} live={live} />)}
        {impact.map((it, i) => <Row key={i} label={it.label || 'Impact'} value={it.value} color={color} />)}
        {!impact.length && legacy.map(([l, v]) => <Row key={l} label={l} value={v} color={color} />)}
      </>
    );
  }
  if (key === 'compliance') {
    const certs = list(p.certifications)
      .map((c) => (typeof c === 'string' ? { title: c } : c))
      .filter((c) => c && text(c.title));
    const docs = [...list(p.files), ...list(p.manualsAndCerts?.files)].filter((d) => text(d));
    const years = Number(p.warrantyValidYears) || 0;
    const origin = p.traceabilityEsg?.originCountry || p.traceabilityEsg?.madeIn;
    if (!certs.length && !docs.length && !text(p.warrantyStatus) && !years && !text(origin)) return null;
    return (
      <>
        {certs.map((c, i) => {
          const expired = text(c.validUntil) && c.validUntil < todayIso();
          const meta = [
            text(c.issuer) && `Issued by ${c.issuer}`,
            text(c.validUntil) && `${expired ? 'Expired' : 'Valid until'} ${c.validUntil}`,
          ].filter(Boolean).join(' · ');
          return text(c.fileUrl)
            ? <LinkRow key={i} label={`${c.title}${meta ? ` — ${meta}` : ''}`} href={getFileUrl(c.fileUrl)} color={color} live={live} linkText="View ›" />
            : <Row key={i} label={c.title} value={meta || 'Certified'} color={color} />;
        })}
        {docs.map((d, i) => (
          <LinkRow key={`d${i}`} label={decodeURIComponent(String(d).split('/').pop() || 'Document')} href={getFileUrl(d)} color={color} live={live} />
        ))}
        <Row label="Country of origin" value={origin} color={color} />
        <Row label="Warranty" value={p.warrantyStatus} color={color} />
        {years > 0 && <Row label="Warranty valid for" value={`${years} year${years === 1 ? '' : 's'}`} color={color} />}
      </>
    );
  }
  if (key === 'traceability') {
    const t = p.traceabilityEsg || {};
    const suppliers = list(t.materialOrigins).filter((m) => text(m?.companyName) || text(m?.country));
    const rows = [
      ['Country of origin', t.originCountry || t.madeIn],
      ['Shipping', t.shippingLog || [t.route?.origin, t.route?.destination].filter((v) => text(v)).join(' → ')],
      ['CO2 from production', t.co2Production],
      ['CO2 from transport', t.co2Transportation || t.route?.emissions],
    ].filter(([, v]) => text(v));
    if (!rows.length && !suppliers.length) return null;
    return (
      <>
        {rows.map(([l, v]) => <Row key={l} label={l} value={v} color={color} />)}
        {suppliers.map((m, i) => (
          <Row key={i} label={m.material || 'Supplier'} value={[m.companyName, m.country].filter((v) => text(v)).join(' · ')} color={color} />
        ))}
      </>
    );
  }
  return null;
}

// The passport itself: the authenticated banner, the product card, then the
// brand's sections in its order and colours. Shared by the studio's phone
// preview and the public web product page (`live` there, so links open).
export function DppPassportView({ product, theme, live = false, itemId = '', blocked = false }) {
  const p = product || {};
  const t = normalizeDppTheme(theme);
  const [open, setOpen] = useState('journey');
  const image = list(p.images)[0];
  const brand = p.brandInfo || {};
  const subtitle = [text(p.color), text(p.skuStyleNumber) && `Style No. ${p.skuStyleNumber}`].filter(Boolean).join(' | ');
  const sections = t.sections.filter((s) => s.visible);

  return (
      <Box sx={{ fontFamily: dppFontCss(t.fontFamily) }}>
        {blocked ? (
          // The brand marked this label as a suspected copy.
          <Box role="alert" sx={{ bgcolor: '#fdecec', color: '#d32f2f', border: '1px solid #d32f2f', borderRadius: 2, px: 1.25, py: 0.9, mb: 1.5 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>Check this product carefully</Typography>
            <Typography sx={{ fontSize: 11, fontFamily: 'inherit' }}>
              This code has been scanned in an unusual pattern. It may be a copy of a genuine label.
            </Typography>
          </Box>
        ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#e7f4e8', color: '#2e7d32', borderRadius: 2, px: 1.25, py: 0.9, mb: 1.5 }}>
          <VerifiedUserIcon sx={{ fontSize: 20 }} />
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>Product ID authenticated</Typography>
            {text(itemId) && <Typography sx={{ fontSize: 11, fontFamily: 'inherit' }}>ID: {itemId}</Typography>}
          </Box>
        </Box>
        )}

        <Box sx={{ bgcolor: t.cardBg, borderRadius: 3, p: 1.5, mb: 1.5 }}>
          <Box sx={{ height: 170, borderRadius: 2, bgcolor: '#eef1f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', mb: 1.25 }}>
            {image
              ? <Box component="img" src={getFileUrl(image)} alt="" sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              : <ImageIcon sx={{ fontSize: 48, color: '#b6c0d0' }} />}
          </Box>
          {(text(brand.name) || text(brand.logoUrl)) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
              {text(brand.logoUrl) && <Box component="img" src={getFileUrl(brand.logoUrl)} alt="" sx={{ width: 20, height: 20, objectFit: 'contain' }} />}
              <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: t.textColor, opacity: 0.8, fontFamily: 'inherit' }}>
                {brand.name}
              </Typography>
            </Box>
          )}
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: t.accent, lineHeight: 1.25, fontFamily: 'inherit' }}>
            {text(p.name) || 'Product name'}
          </Typography>
          {subtitle && <Typography sx={{ fontSize: 12, color: t.textColor, fontFamily: 'inherit' }}>{subtitle}</Typography>}
        </Box>

        {sections.map(({ key }) => {
          const isOpen = open === key;
          const body = isOpen ? sectionBody(key, p, t.textColor, live) : null;
          return (
            <Box key={key} sx={{ mb: 1 }}>
              <Box
                component="button"
                type="button"
                onClick={() => setOpen(isOpen ? '' : key)}
                aria-expanded={isOpen}
                sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: 0,
                  cursor: 'pointer',
                  bgcolor: t.accent,
                  color: t.buttonText,
                  borderRadius: `${t.buttonRadius}px`,
                  px: 1.75,
                  py: 1.1,
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {dppSectionLabel(key)}
                {isOpen ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
              </Box>
              {isOpen && (
                <Box sx={{ bgcolor: t.cardBg, borderRadius: 2, px: 1.5, py: 1, mt: 0.75 }}>
                  {body || <Empty color={t.textColor} />}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
  );
}

// A phone-sized picture of the product page a shopper sees after scanning,
// drawn from the product as it is right now (saved or still being typed) and
// the brand's theme. Sections open and close like the real page.
export default function DppPhonePreview({ product, theme, width = 300 }) {
  const t = normalizeDppTheme(theme);
  return (
    <Box
      aria-label="Preview of the shopper's product page"
      sx={{
        width,
        maxWidth: '100%',
        mx: 'auto',
        border: '10px solid #1f2430',
        borderRadius: '34px',
        overflow: 'hidden',
        boxShadow: 4,
        bgcolor: t.pageBg,
      }}
    >
      <Box sx={{ height: 520, overflowY: 'auto', p: 1.5 }}>
        <DppPassportView product={product} theme={theme} />
      </Box>
    </Box>
  );
}
