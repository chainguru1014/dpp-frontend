import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography, Button, CircularProgress, IconButton, Dialog, DialogContent } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MicIcon from '@mui/icons-material/Mic';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { Backend_URL, getFileUrl, getProductsByUser, getOwnedProducts } from '../../helper';
import PageHeader from '../../components/PageHeader';
import ProductPreviewDialog from '../products/ProductPreviewDialog';

// Shopper Preview / Recommendations (design WEB_ShopperPreview, _Listen,
// _Results): the shopper taps what they like (or says it), and the picks come
// back with a match score and a one-line reason. Their favorites count as
// hints. Scoring runs here on the product data, so it works without the AI
// provider; the wording stays simple on purpose.

const GROUPS = [
  { key: 'category', label: 'Category', options: [['watches', 'Watches'], ['rings', 'Rings'], ['necklaces', 'Necklaces'], ['earrings', 'Earrings'], ['bracelets', 'Bracelets']] },
  { key: 'style', label: 'Style', options: [['classic', 'Classic'], ['modern', 'Modern'], ['vintage', 'Vintage'], ['minimal', 'Minimal'], ['statement', 'Statement']] },
  { key: 'material', label: 'Material', options: [['gold', 'Gold'], ['rose gold', 'Rose gold'], ['platinum', 'Platinum'], ['silver', 'Silver'], ['steel', 'Steel'], ['diamond', 'Diamond'], ['emerald', 'Emerald']] },
  { key: 'budget', label: 'Budget', options: [['0-1000', 'Under €1,000'], ['1000-2500', '€1,000–2,500'], ['2500-4000', '€2,500–4,000'], ['4000-99999', '€4,000+']] },
  { key: 'for', label: 'For', options: [['me', 'Me'], ['partner', 'My partner'], ['gift', 'A gift'], ['wedding', 'A wedding']] },
];
const STYLE_WORDS = {
  classic: /solitaire|classic|stud|round/i,
  modern: /chronograph|automatic|twisted|mesh/i,
  vintage: /vintage|milgrain|halo/i,
  minimal: /stud|hoop|slim|simple|single/i,
  statement: /halo|emerald|pendant|set|cocktail/i,
};
const FOR_WORDS = {
  wedding: /wedding|engagement|solitaire|ring/i,
  partner: /ring|pendant|earring|necklace/i,
  gift: /earring|bangle|bracelet|hoop|pendant/i,
  me: /./,
};
const GLASS_PILL = { borderRadius: '999px', minHeight: 40, px: 2, fontSize: '0.98rem' };

const textOf = (p) => [p.name, p.model, p.detail, p.productType, p.color, p.itemCategory,
  ...(p.materialSize?.materials || []).map((m) => m.material), p.detailFacts?.material].filter(Boolean).join(' ').toLowerCase();
const priceText = (p) => (p.price ? new Intl.NumberFormat('en-IE', { style: 'currency', currency: p.currency || 'EUR', maximumFractionDigits: 0 }).format(p.price) : '');

// Score one product against the chosen preferences (0-100) and say why.
function scoreProduct(p, prefs, favIds) {
  const txt = textOf(p);
  let score = 40;
  const why = [];
  if (prefs.category.length) {
    if (prefs.category.includes(String(p.itemCategory || '').toLowerCase())) { score += 22; why.push(p.productType || p.itemCategory); } else score -= 25;
  }
  prefs.material.forEach((m) => { if (txt.includes(m)) { score += 12; why.push(m); } });
  prefs.style.forEach((s) => { if (STYLE_WORDS[s]?.test(txt)) { score += 9; why.push(`${s} style`); } });
  prefs.for.forEach((f) => { if (FOR_WORDS[f]?.test(txt)) { score += 6; if (f !== 'me') why.push(f === 'gift' ? 'good as a gift' : `for ${f === 'partner' ? 'a partner' : 'a wedding'}`); } });
  if (prefs.budget.length) {
    const fits = prefs.budget.some((b) => { const [lo, hi] = b.split('-').map(Number); return p.price >= lo && p.price <= hi; });
    if (fits) { score += 12; why.push('in your budget'); } else score -= 12;
  }
  if (favIds.has(String(p._id))) { score += 8; why.push('like your favorites'); }
  return { score: Math.max(5, Math.min(98, score)), why: [...new Set(why)].slice(0, 3) };
}

// Words heard by voice -> preference keys.
function prefsFromSpeech(text) {
  const t = text.toLowerCase();
  const out = { category: [], style: [], material: [], budget: [], for: [] };
  GROUPS.forEach((g) => g.options.forEach(([k, label]) => {
    const word = label.toLowerCase().replace(/^my /, '').replace(/^a /, '');
    const stem = word.replace(/s$/, '');
    if (g.key !== 'budget' && (t.includes(word) || t.includes(stem))) out[g.key].push(k);
  }));
  const num = t.match(/(\d[\d,.]*)\s*(k|thousand|euro|€)?/);
  if (num) {
    let v = Number(num[1].replace(/[,]/g, ''));
    if (num[2] === 'k' || num[2] === 'thousand') v *= 1000;
    if (/under|below|less|max|up to/.test(t)) out.budget.push(v <= 1000 ? '0-1000' : v <= 2500 ? '1000-2500' : v <= 4000 ? '2500-4000' : '4000-99999');
  }
  if (/wife|husband|girlfriend|boyfriend|partner/.test(t)) out.for.push('partner');
  if (/present|birthday|gift/.test(t)) out.for.push('gift');
  return out;
}

const EMPTY = { category: [], style: [], material: [], budget: [], for: [] };

export default function RecommendationsPage({ company, isAdmin, isAppUser = false }) {
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState(EMPTY);
  const [step, setStep] = useState('pick'); // pick | results
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [saved, setSaved] = useState(new Set());
  // The product whose passport preview is open (View).
  const [viewing, setViewing] = useState(null);
  const recRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const list = isAdmin || !isAppUser
          ? await getProductsByUser()
          : await getOwnedProducts('User', company?._id);
        let all = Array.isArray(list) ? list : [];
        if (isAppUser) {
          // Shoppers: everything they could buy, not only what they own.
          const pub = await axios.get(`${Backend_URL}product/catalog`).then((r) => r.data?.data).catch(() => null);
          if (Array.isArray(pub) && pub.length) all = pub;
        }
        if (alive) setProducts(all.filter((p) => !p.is_deleted));
        if (isAppUser && company?._id) {
          const fav = await axios.get(`${Backend_URL}engagement/album/list?user_id=${encodeURIComponent(company._id)}`).then((r) => r.data?.data || []).catch(() => []);
          if (alive) { setFavorites(fav); setSaved(new Set(fav.map((f) => String(f.product_id?._id || f.product_id)))); }
        }
      } catch (e) {
        if (alive) setProducts([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [company, isAdmin, isAppUser]);

  const favIds = useMemo(() => new Set(favorites.map((f) => String(f.product_id?._id || f.product_id))), [favorites]);
  const results = useMemo(() => products
    .map((p) => ({ p, ...scoreProduct(p, prefs, favIds) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8), [products, prefs, favIds]);

  const toggle = (group, key) => setPrefs((cur) => {
    const has = cur[group].includes(key);
    return { ...cur, [group]: has ? cur[group].filter((k) => k !== key) : [...cur[group], key] };
  });
  const chosenCount = Object.values(prefs).reduce((n, v) => n + v.length, 0);

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setHeard('');
    setListening(true);
    if (!SR) { setHeard(''); return; }
    const rec = new SR();
    rec.lang = navigator.language || 'en-US';
    rec.interimResults = true;
    rec.onresult = (e) => setHeard(Array.from(e.results).map((r) => r[0].transcript).join(' '));
    rec.onerror = () => {};
    rec.onend = () => { recRef.current = null; };
    recRef.current = rec;
    try { rec.start(); } catch (e) { /* already running */ }
  };
  const stopListening = (apply) => {
    try { recRef.current?.stop(); } catch (e) { /* ignore */ }
    setListening(false);
    if (apply && heard.trim()) {
      const got = prefsFromSpeech(heard);
      setPrefs((cur) => Object.fromEntries(Object.keys(cur).map((k) => [k, [...new Set([...cur[k], ...got[k]])]])));
      setStep('results');
    }
  };
  const heardChips = useMemo(() => {
    const got = prefsFromSpeech(heard);
    return GROUPS.flatMap((g) => g.options.filter(([k]) => got[g.key].includes(k)).map(([, label]) => label));
  }, [heard]);

  const toggleSave = async (p) => {
    const id = String(p._id);
    const on = saved.has(id);
    setSaved((s) => { const n = new Set(s); if (on) n.delete(id); else n.add(id); return n; });
    if (!isAppUser || !company?._id) return;
    await axios({ method: on ? 'delete' : 'post', url: `${Backend_URL}engagement/album`, data: { user_id: company._id, product_id: p._id, token_id: null, productSnapshot: { name: p.name, model: p.model, images: p.images, brandInfo: p.brandInfo } } }).catch(() => {});
  };

  const pill = (on) => ({
    ...GLASS_PILL,
    bgcolor: on ? 'transparent' : 'rgba(120,120,128,0.13)',
    backgroundImage: on ? 'linear-gradient(135deg,#2a78bd,#1b4f72)' : 'none',
    color: on ? '#fff' : '#1c1c1e',
    boxShadow: on ? '0 6px 16px rgba(27,79,114,0.24)' : 'none',
    '&:hover': { bgcolor: on ? 'transparent' : 'rgba(120,120,128,0.2)' },
  });

  return (
    <Box>
      <PageHeader
        title={isAppUser ? 'Recommendations' : 'Shopper Preview'}
        actions={step === 'results' ? (
          <Button variant="outlined" startIcon={<TuneIcon />} onClick={() => setStep('pick')}>Change what I like</Button>
        ) : null}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : step === 'pick' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 340px' }, gap: 3 }}>
          <Box sx={{ bgcolor: '#fff', borderRadius: '24px', p: { xs: 2.5, md: 3.5 } }}>
            <Typography sx={{ fontSize: 22 }}>What do you like?</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>Tap as many as you want. You can change them later.</Typography>
            {GROUPS.map((g) => (
              <Box key={g.key} sx={{ mb: 2.25 }}>
                <Typography sx={{ fontSize: 13, color: '#5f6b78', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1 }}>{g.label}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {g.options.map(([k, label]) => {
                    const on = prefs[g.key].includes(k);
                    return <Button key={k} onClick={() => toggle(g.key, k)} aria-pressed={on} sx={pill(on)}>{label}</Button>;
                  })}
                </Box>
              </Box>
            ))}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1 }}>
              <Button variant="contained" startIcon={<AutoAwesomeIcon />} onClick={() => setStep('results')} sx={{ minWidth: 220 }}>
                {chosenCount ? `Show my picks (${chosenCount})` : 'Show picks for me'}
              </Button>
              {chosenCount > 0 && <Button variant="outlined" onClick={() => setPrefs(EMPTY)}>Clear</Button>}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ bgcolor: '#fff', borderRadius: '24px', p: 3, textAlign: 'center' }}>
              <Typography sx={{ fontSize: 20 }}>Or just say it</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>“A rose gold ring for my wife under €2,500”</Typography>
              <IconButton onClick={startListening} aria-label="Speak what you like" sx={{ width: 96, height: 96, backgroundImage: 'linear-gradient(135deg,#2a78bd,#1b4f72)', color: '#fff', boxShadow: '0 12px 28px rgba(27,79,114,0.32)', '&:hover': { backgroundImage: 'linear-gradient(135deg,#256aa8,#123a56)' } }}>
                <MicIcon sx={{ fontSize: 44 }} />
              </IconButton>
              <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: 14 }}>Tap and talk</Typography>
            </Box>
            <Box sx={{ bgcolor: '#fff', borderRadius: '24px', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FavoriteIcon sx={{ color: '#2a78bd' }} />
                <Typography sx={{ fontSize: 17 }}>{isAppUser ? 'Your favorites help' : 'Shoppers’ favorites help'}</Typography>
              </Box>
              <Typography color="text.secondary">
                {isAppUser
                  ? (favorites.length ? `${favorites.length} saved products are used as hints.` : 'Save products with ♥ and they are used as hints.')
                  : 'Products shoppers save with ♥ rank a little higher for similar shoppers.'}
              </Typography>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
            {GROUPS.flatMap((g) => g.options.filter(([k]) => prefs[g.key].includes(k)).map(([k, label]) => (
              <Button key={`${g.key}-${k}`} onClick={() => toggle(g.key, k)} sx={{ ...pill(true), minHeight: 34 }} endIcon={<CloseIcon sx={{ fontSize: 16 }} />}>{label}</Button>
            )))}
            {chosenCount === 0 && <Typography color="text.secondary">Showing the best picks overall. Add what you like to narrow them down.</Typography>}
          </Box>
          {results.length === 0 ? (
            <Typography color="text.secondary">{isAppUser ? 'No products to suggest yet.' : 'No products yet. Add products on the Products page first.'}</Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', md: 'repeat(3, minmax(0,1fr))', xl: 'repeat(4, minmax(0,1fr))' }, gap: 2.5 }}>
              {results.map(({ p, score, why }, i) => {
                const img = (p.images && p.images[0]) || p.image;
                const on = saved.has(String(p._id));
                return (
                  <Box key={p._id || i} sx={{ bgcolor: '#fff', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ position: 'relative', height: 220, bgcolor: '#eef1f4' }}>
                      {img && <Box component="img" src={getFileUrl(img)} alt={p.name || 'Product'} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                      <Box sx={{ position: 'absolute', top: 12, left: 12, px: 1.5, height: 30, borderRadius: '15px', display: 'flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', fontSize: 14 }}>
                        {score}% match
                      </Box>
                      <IconButton onClick={() => toggleSave(p)} aria-label={on ? 'Remove from favorites' : 'Save to favorites'} sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: '#fff' } }}>
                        {on ? <FavoriteIcon sx={{ color: '#2a78bd' }} /> : <FavoriteBorderIcon sx={{ color: '#2a78bd' }} />}
                      </IconButton>
                    </Box>
                    <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      <Typography sx={{ fontSize: 13, color: '#5f6b78', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{p.brandInfo?.name || ''}</Typography>
                      <Typography sx={{ fontSize: 17 }} noWrap title={p.name}>{p.name || 'Unnamed product'}</Typography>
                      <Typography color="text.secondary" sx={{ fontSize: 15 }}>{priceText(p)}</Typography>
                      {why.length > 0 && (
                        <Typography sx={{ fontSize: 14, color: '#1b5b91', mt: 0.75, display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
                          <AutoAwesomeIcon sx={{ fontSize: 16, mt: '2px' }} />
                          {`Because: ${why.join(', ')}`}
                        </Typography>
                      )}
                      <Box sx={{ flexGrow: 1 }} />
                      {/* Save (heart) and View (the passport shoppers see). */}
                      <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                        <Button variant="outlined" onClick={() => toggleSave(p)} aria-pressed={on}
                          startIcon={on ? <FavoriteIcon sx={{ color: '#2a78bd' }} /> : <FavoriteBorderIcon />}
                          sx={{ flex: 1, height: 40, px: 1, whiteSpace: 'nowrap', ...(on ? { bgcolor: '#e8f1fa', borderColor: '#bcd6ee', color: '#1b4f72' } : {}) }}>
                          {on ? 'Saved' : 'Save'}
                        </Button>
                        <Button variant="contained" onClick={() => setViewing(p)} sx={{ flex: 1, height: 40, px: 1 }}>View</Button>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      <ProductPreviewDialog open={!!viewing} onClose={() => setViewing(null)} productInfo={viewing} />

      {/* Listening sheet: what we heard, as chips, then Show picks. */}
      <Dialog open={listening} onClose={() => stopListening(false)} maxWidth="xs" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <Box sx={{ width: 96, height: 96, mx: 'auto', borderRadius: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'linear-gradient(135deg,#2a78bd,#1b4f72)', color: '#fff', boxShadow: '0 0 0 14px rgba(42,120,189,0.14), 0 0 0 28px rgba(42,120,189,0.07)' }}>
            <MicIcon sx={{ fontSize: 44 }} />
          </Box>
          <Typography sx={{ fontSize: 22, mt: 4 }}>Listening…</Typography>
          <Typography color="text.secondary" sx={{ minHeight: 48, mt: 1 }}>
            {(window.SpeechRecognition || window.webkitSpeechRecognition)
              ? (heard || 'Say what you are looking for.')
              : 'Voice is not available in this browser. Tap your choices instead.'}
          </Typography>
          {heardChips.length > 0 && (
            <>
              <Typography sx={{ fontSize: 13, color: '#5f6b78', textTransform: 'uppercase', mt: 1 }}>We heard</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 1 }}>
                {heardChips.map((c) => <Box key={c} sx={{ px: 1.5, height: 30, borderRadius: '15px', bgcolor: '#e3eef8', color: '#1b5b91', display: 'flex', alignItems: 'center' }}>{c}</Box>)}
              </Box>
            </>
          )}
          <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
            <Button variant="outlined" fullWidth onClick={() => stopListening(false)}>Cancel</Button>
            <Button variant="contained" fullWidth onClick={() => stopListening(true)} disabled={!heard.trim()}>Show picks</Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
