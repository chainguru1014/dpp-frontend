import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import axios from 'axios';
import { Backend_URL, getFileUrl, getProductsByUser } from '../../helper';
import { notifyError } from '../../utils/feedbackBus';
import PageHeader from '../../components/PageHeader';
import ProductPreviewDialog from '../products/ProductPreviewDialog';

// Shopper Preview (staff and super admin): what shoppers get, on one page.
// The shopper says what they want in one box (typed, or recorded with the
// microphone), or taps choices; the picks below update at once, each with a
// match score and the reason, and questions get an answer from the product
// assistant in the same place. The choices come from the real catalogue
// (its categories, colours, materials and prices), so they always fit it.

const cap = (s) => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);
const textOf = (p) => [p.name, p.model, p.detail, p.productType, p.color, p.itemCategory,
  ...(p.materialSize?.materials || []).map((m) => m.material), p.detailFacts?.material].filter(Boolean).join(' ').toLowerCase();
const priceText = (p) => (p.price ? new Intl.NumberFormat('en-IE', { style: 'currency', currency: p.currency || 'EUR', maximumFractionDigits: 0 }).format(p.price) : '');

// Colours by family (the catalogue's colour names vary: "Honey beige", "Raw indigo").
const COLOURS = [
  ['black', 'Black', /black|charcoal/],
  ['blue', 'Blue & navy', /blue|navy|indigo/],
  ['beige', 'Beige & camel', /beige|camel|sand|honey|khaki|tan/],
  ['white', 'White & cream', /white|cream|ivory|ecru/],
  ['grey', 'Grey', /gr[ae]y/],
  ['brown', 'Brown & rust', /brown|rust|chocolate|cognac/],
  ['green', 'Green', /green|olive|khaki/],
  ['red', 'Red & pink', /red|burgundy|pink/],
];
const MATERIALS = ['wool', 'cashmere', 'cotton', 'linen', 'denim', 'suede', 'leather', 'silk'];
const STYLES = [
  ['warm', 'Warm', /wool|cashmere|coat|sweater|knit|scarf|lambswool/],
  ['light', 'Light', /linen|summer|cotton shirt|t-shirt/],
  ['casual', 'Casual', /denim|jeans|sweater|shirt|bomber/],
  ['smart', 'Smart', /blazer|trench|tweed|coat|tailored/],
];
const BUDGETS = [[0, 150, 'Under €150'], [150, 400, '€150–400'], [400, 700, '€400–700'], [700, 1e9, '€700+']];
// Words that say nothing about the product.
const STOP = new Set(['and', 'the', 'for', 'with', 'from', 'made', 'something', 'want', 'need', 'looking', 'show', 'like', 'some', 'what', 'this', 'that', 'under', 'over', 'less', 'than', 'about', 'euro', 'euros', 'please', 'have', 'does', 'into', 'your', 'mine']);

// max: a price said in words ("under 700"), one chip "Up to €700".
const EMPTY = { category: [], colour: [], material: [], style: [], budget: [], words: [], max: [] };

// The choices, from the products on hand.
function optionsFrom(products) {
  const texts = products.map((p) => ({ p, t: textOf(p) }));
  const cats = [...new Set(products.map((p) => String(p.itemCategory || '').toLowerCase()).filter(Boolean))].sort();
  return [
    { key: 'category', label: 'Category', options: cats.map((c) => [c, cap(c)]) },
    { key: 'colour', label: 'Colour', options: COLOURS.filter(([, , re]) => products.some((p) => re.test(String(p.color || '').toLowerCase()))).map(([k, l]) => [k, l]) },
    { key: 'material', label: 'Material', options: MATERIALS.filter((m) => texts.some((x) => x.t.includes(m))).map((m) => [m, cap(m)]) },
    { key: 'style', label: 'Style', options: STYLES.filter(([, , re]) => texts.some((x) => re.test(x.t))).map(([k, l]) => [k, l]) },
    { key: 'budget', label: 'Budget', options: BUDGETS.filter(([lo, hi]) => products.some((p) => p.price >= lo && p.price < hi)).map(([lo, hi, l]) => [`${lo}-${hi}`, l]) },
  ].filter((g) => g.options.length > 0);
}

// Score one product against the choices (0-100) and say why.
function scoreProduct(p, prefs) {
  const txt = textOf(p);
  const colour = String(p.color || '').toLowerCase();
  let score = 45;
  const why = [];
  if (prefs.category.length) {
    if (prefs.category.includes(String(p.itemCategory || '').toLowerCase())) { score += 20; why.push(p.productType || cap(p.itemCategory)); } else score -= 25;
  }
  if (prefs.colour.length) {
    const hit = COLOURS.find(([k, , re]) => prefs.colour.includes(k) && re.test(colour));
    if (hit) { score += 14; why.push(String(p.color).toLowerCase()); } else score -= 10;
  }
  prefs.material.forEach((m) => { if (txt.includes(m)) { score += 12; why.push(m); } });
  prefs.style.forEach((s) => { const st = STYLES.find(([k]) => k === s); if (st && st[2].test(txt)) { score += 9; why.push(st[1].toLowerCase()); } });
  prefs.words.forEach((w) => { if (txt.includes(w)) { score += 10; why.push(w); } });
  if (prefs.budget.length || prefs.max.length) {
    const inBracket = !prefs.budget.length || prefs.budget.some((b) => { const [lo, hi] = b.split('-').map(Number); return p.price >= lo && p.price < hi; });
    const underMax = !prefs.max.length || p.price <= Math.min(...prefs.max);
    if (inBracket && underMax) { score += 12; why.push('in budget'); } else score -= 15;
  }
  return { score: Math.max(5, Math.min(98, score)), why: [...new Set(why)].slice(0, 3) };
}

// What a sentence asks for, as choices ("a warm wool coat under 700").
function prefsFromText(text, groups, products) {
  const t = ` ${text.toLowerCase()} `;
  const out = { category: [], colour: [], material: [], style: [], budget: [], words: [], max: [] };
  groups.forEach((g) => g.options.forEach(([k, label]) => {
    if (g.key === 'budget') return;
    if (g.key === 'colour') {
      const re = COLOURS.find(([c]) => c === k)?.[2];
      if (re && re.test(t)) out.colour.push(k);
      return;
    }
    const word = label.toLowerCase();
    if (t.includes(word) || t.includes(word.replace(/s$/, '')) || t.includes(k)) out[g.key].push(k);
  }));
  const num = t.match(/(?:€\s*)?(\d[\d,.]*)\s*(k|thousand)?/);
  if (num && /under|below|less|max|up to|cheaper|budget/.test(t)) {
    let v = Number(num[1].replace(/,/g, ''));
    if (num[2]) v *= 1000;
    if (v > 0) out.max.push(v);
  }
  // Any other word the catalogue knows ("jacket", "scarf", "trench").
  const known = products.map(textOf).join(' ');
  // (words that are a choice themselves are handled above)
  const taken = new Set(groups.flatMap((g) => g.options.flatMap(([k, label]) => [k, label.toLowerCase(), label.toLowerCase().replace(/s$/, '')])));
  t.split(/[^a-zÀ-ɏ]+/).forEach((w) => {
    const stem = w.replace(/(es|s)$/, '');
    if (stem.length < 4 || STOP.has(w) || taken.has(w) || taken.has(stem) || COLOURS.some(([, , re]) => re.test(w))) return;
    if (new RegExp(`\\b${stem}`).test(known)) out.words.push(stem);
  });
  out.words = [...new Set(out.words)];
  return out;
}

// A question, rather than a wish (it goes to the assistant too).
const isQuestion = (text) => /\?\s*$/.test(text) || /^(what|how|where|is|are|can|does|do|why|which|who|when)\b/i.test(text.trim());

const EXAMPLES = ['A warm coat under €700', 'Something casual in denim', 'What is the tweed jacket made of?'];

// onSelectProduct: a pick chosen here becomes the product selected on the
// Products page (client 2026-11-26); selectedId marks it in the picks.
// onViewProduct: shoppers — a pick opens the product's own page (as My
// Products) instead of the passport preview window.
export default function ShopperPreviewPage({ company, onSelectProduct, selectedId, onViewProduct }) {
  // Opened by a shopper (Recommendations): "you" instead of "the shopper".
  const forShopper = !!onViewProduct;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState(EMPTY);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [asking, setAsking] = useState(false);
  const [viewing, setViewing] = useState(null);
  // The picks open in a window once the shopper has said what they want (a
  // wish recorded or sent, or choices confirmed with Show picks).
  const [shown, setShown] = useState(false);
  const inputRef = useRef(null);
  const threadRef = useRef(null);

  // Voice: record with the microphone, then speech-to-text on the server
  // (/chat/transcribe); the words are sent as if typed.
  const [voice, setVoice] = useState('idle'); // idle | recording | transcribing
  const recorderRef = useRef(null);
  const voiceSupported = typeof window !== 'undefined' && !!window.MediaRecorder && !!navigator.mediaDevices?.getUserMedia;

  useEffect(() => {
    let alive = true;
    (forShopper
      ? axios.get(`${Backend_URL}product/catalog`).then((r) => r.data?.data || [])
      : getProductsByUser())
      .then((list) => { if (alive) setProducts((Array.isArray(list) ? list : []).filter((p) => !p.is_deleted)); })
      .catch(() => { if (alive) setProducts([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [forShopper]);

  // Never leave the microphone on after leaving the page.
  useEffect(() => () => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.onstop = null;
      rec.stop();
      rec.stream.getTracks().forEach((track) => track.stop());
    }
  }, []);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, asking]);

  const groups = useMemo(() => optionsFrom(products), [products]);
  const results = useMemo(() => products
    .map((p) => ({ p, ...scoreProduct(p, prefs) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 9), [products, prefs]);
  const chosen = [
    ...groups.flatMap((g) => g.options.filter(([k]) => prefs[g.key].includes(k)).map(([k, label]) => ({ group: g.key, k, label }))),
    ...prefs.words.map((w) => ({ group: 'words', k: w, label: `“${w}”` })),
    ...prefs.max.map((v) => ({ group: 'max', k: v, label: `Up to €${v.toLocaleString('en-IE')}` })),
  ];

  const toggle = (group, key) => setPrefs((cur) => {
    const has = cur[group].includes(key);
    return { ...cur, [group]: has ? cur[group].filter((k) => k !== key) : [...cur[group], key] };
  });

  // One box for everything: wishes become choices (the picks update), and
  // questions also get an answer from the assistant.
  const send = async (raw) => {
    const text = String(raw ?? input).trim();
    if (!text || asking) return;
    setInput('');
    const got = prefsFromText(text, groups, products);
    const added = Object.values(got).reduce((n, v) => n + v.length, 0);
    if (added && !isQuestion(text)) setShown(true);
    if (added) setPrefs((cur) => Object.fromEntries(Object.keys(cur).map((k) => [k, k === 'max' && got.max.length ? got.max : [...new Set([...cur[k], ...got[k]])]])));
    const history = messages.map((m) => ({ role: m.role, content: m.text }));
    setMessages((m) => [...m, { role: 'user', text }]);
    if (added && !isQuestion(text)) {
      setMessages((m) => [...m, { role: 'assistant', text: 'Here are the picks for that. Change the choices to fine-tune them, then press Show picks again.' }]);
      return;
    }
    setAsking(true);
    try {
      const { data } = await axios.post(`${Backend_URL}chat`, { message: text, history, brandId: company?._id });
      const reply = data?.reply || data?.message || data?.data?.reply;
      setMessages((m) => [...m, { role: 'assistant', text: reply || 'Thanks for your question! Our team will get back to you shortly.' }]);
    } catch (e) {
      console.error('Chat request failed:', e?.response?.status, e?.response?.data?.message || e?.message);
      setMessages((m) => [...m, { role: 'assistant', text: 'Sorry, the assistant is not available right now. Please try again in a few minutes.' }]);
    } finally {
      setAsking(false);
    }
  };

  const transcribe = async (blob) => {
    setVoice('transcribing');
    try {
      const body = new FormData();
      const ext = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm';
      body.append('audio', blob, `speech.${ext}`);
      const lang = String(navigator.language || '').slice(0, 2).toLowerCase();
      if (lang) body.append('language', lang);
      const { data } = await axios.post(`${Backend_URL}chat/transcribe`, body);
      const text = String(data?.text || '').trim();
      if (!text) notifyError('We couldn’t hear anything. Please try again a little closer to the microphone.');
      else send(text);
    } catch (e) {
      console.error('Transcription failed:', e?.response?.status, e?.response?.data?.message || e?.message);
      notifyError('Voice isn’t available right now. Please type instead.');
    } finally {
      setVoice('idle');
    }
  };

  const toggleVoice = async () => {
    if (voice === 'recording') { recorderRef.current?.stop(); return; }
    if (voice !== 'idle') return;
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      notifyError('Please allow microphone access in your browser to use your voice.');
      return;
    }
    const chunks = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      if (blob.size) transcribe(blob);
      else setVoice('idle');
    };
    recorderRef.current = recorder;
    recorder.start();
    setVoice('recording');
  };

  const pill = (on) => ({
    borderRadius: '999px', minHeight: 36, px: 1.75, fontSize: '0.95rem', whiteSpace: 'nowrap',
    bgcolor: on ? 'transparent' : 'rgba(120,120,128,0.12)',
    backgroundImage: on ? 'linear-gradient(135deg,#2a78bd,#1b4f72)' : 'none',
    color: on ? '#fff' : '#1c1c1e',
    '&:hover': { bgcolor: on ? 'transparent' : 'rgba(120,120,128,0.2)' },
  });
  const card = { bgcolor: '#fff', borderRadius: '20px', boxShadow: '0 4px 18px rgba(31,51,97,0.06)' };

  // Numbered step badge.
  const step = (n) => (
    <Box sx={{ width: 30, height: 30, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, backgroundImage: 'linear-gradient(135deg,#2a78bd,#1b4f72)' }}>{n}</Box>
  );
  const who = forShopper ? 'you' : 'the shopper';

  return (
    <Box>
      <PageHeader
        title={forShopper ? 'Recommendations' : 'Shopper Preview'}
        description={forShopper
          ? 'Find products that suit you: describe what you are looking for, or choose your preferences.'
          : 'See the products the AI suggests to a shopper: describe a wish or choose preferences, as shoppers do in the app.'}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <>
          {/* How it works, in one calm line of three steps. */}
          <Box sx={{ ...card, p: { xs: 2, md: 2.25 }, mb: 2.5, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0,1fr))' }, gap: { xs: 1.5, md: 2.5 } }}>
            {[
              [KeyboardIcon, 'Describe or choose', forShopper ? 'Say or type what you want, or tap your preferences.' : 'Say or type what the shopper wants, or tap their preferences.'],
              [AutoAwesomeIcon, 'See the best matches', 'Each product shows how well it matches and why.'],
              [TouchAppIcon, 'Open a product', forShopper ? 'See its details, passport and sustainability.' : 'See its page exactly as the shopper sees it.'],
            ].map(([Icon, title, text]) => (
              <Box key={title} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: '#e8f1fa', color: '#1b4f72', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Icon fontSize="small" /></Box>
                <Box>
                  <Typography sx={{ color: '#16324a', fontSize: 16 }}>{title}</Typography>
                  <Typography variant="body2" color="text.secondary">{text}</Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* 1. Describe it: one box, typed or said; questions answered too. */}
          <Box sx={{ ...card, p: { xs: 2, md: 2.75 }, mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
              {step(1)}
              <Typography sx={{ fontSize: 19, color: '#16324a' }}>{forShopper ? 'Describe what you are looking for' : 'Describe what the shopper is looking for'}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 5.25, mb: 1.75 }}>
              Type it or press the microphone and speak. You can also ask a question about a product.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
              {voiceSupported && (
                <Tooltip title={voice === 'recording' ? 'Stop and send' : 'Speak'}>
                  <span>
                    <IconButton
                      onClick={toggleVoice}
                      disabled={voice === 'transcribing' || asking}
                      aria-label={voice === 'recording' ? 'Stop recording and send' : `Say what ${who} want${forShopper ? '' : 's'}`}
                      sx={{
                        width: 52, height: 52, color: '#fff',
                        backgroundImage: voice === 'recording' ? 'none' : 'linear-gradient(135deg,#2a78bd,#1b4f72)',
                        bgcolor: voice === 'recording' ? 'error.main' : 'transparent',
                        boxShadow: voice === 'recording' ? '0 0 0 8px rgba(229,72,77,0.15)' : '0 6px 16px rgba(27,79,114,0.25)',
                        '&:hover': { bgcolor: voice === 'recording' ? 'error.dark' : 'transparent' },
                        '&.Mui-disabled': { color: '#fff', opacity: 0.7 },
                      }}
                    >
                      {voice === 'transcribing' ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : voice === 'recording' ? <StopIcon /> : <MicIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              <TextField
                fullWidth
                inputRef={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={voice === 'recording' ? 'Listening… press stop when you are done.' : voice === 'transcribing' ? 'Turning your words into text…' : 'For example: “A warm wool coat under €700”'}
                inputProps={{ 'aria-label': forShopper ? 'What you are looking for' : 'What the shopper is looking for' }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '999px', bgcolor: '#f6f8fb' } }}
              />
              <Button variant="contained" endIcon={asking ? <CircularProgress size={16} color="inherit" /> : <SendIcon />} onClick={() => send()} disabled={!input.trim() || asking} sx={{ height: 48, px: 2.5, borderRadius: '999px', flex: 'none' }}>
                Send
              </Button>
            </Box>
            {messages.length === 0 ? (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mt: 1.5, ml: { md: voiceSupported ? 8 : 0 } }}>
                <Typography variant="body2" color="text.secondary">Examples:</Typography>
                {EXAMPLES.map((ex) => (
                  <Button key={ex} size="small" onClick={() => send(ex)} sx={{ ...pill(false), minHeight: 30, fontSize: '0.88rem' }}>{ex}</Button>
                ))}
              </Box>
            ) : (
              // The conversation so far, right under the box.
              <Box ref={threadRef} aria-live="polite" sx={{ mt: 2, maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, pr: 0.5 }}>
                {messages.map((m, i) => {
                  const mine = m.role === 'user';
                  return (
                    <Box key={i} sx={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', gap: 1 }}>
                      {!mine && <Avatar sx={{ width: 28, height: 28, bgcolor: '#1b4f72' }}><AutoAwesomeIcon sx={{ fontSize: 16 }} /></Avatar>}
                      <Box sx={{ maxWidth: '78%', px: 1.5, py: 0.9, borderRadius: '14px', bgcolor: mine ? '#1b4f72' : '#f1f4f8', color: mine ? '#fff' : 'text.primary', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5 }}>
                        {m.text}
                      </Box>
                    </Box>
                  );
                })}
                {asking && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', pl: 4.5 }}>
                    <CircularProgress size={14} /><Typography variant="body2">Finding the best answer…</Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* 2. Or choose preferences: groups side by side, then one button. */}
          <Box sx={{ ...card, p: { xs: 2, md: 2.75 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
              {step(2)}
              <Typography sx={{ fontSize: 19, color: '#16324a', flex: 1 }}>{forShopper ? 'Or choose your preferences' : 'Or choose the shopper’s preferences'}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 5.25, mb: 2 }}>
              Tap as many as you like. Nothing chosen shows the best products overall.
            </Typography>
            {groups.length === 0 ? (
              <Typography color="text.secondary">No products yet. Add products on the Products page first.</Typography>
            ) : (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0,1fr))' }, columnGap: 4, rowGap: 2 }}>
                  {groups.map((g) => (
                    <Box key={g.key}>
                      <Typography sx={{ fontSize: 13, color: '#5f6b78', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.75 }}>{g.label}</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {g.options.map(([k, label]) => {
                          const on = prefs[g.key].includes(k);
                          return <Button key={k} onClick={() => toggle(g.key, k)} aria-pressed={on} sx={pill(on)}>{label}</Button>;
                        })}
                      </Box>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mt: 2.5, pt: 2, borderTop: '1px solid #eef0f3' }}>
                  <Typography color="text.secondary" sx={{ flex: '1 1 240px' }}>
                    {chosen.length ? `Chosen: ${chosen.map((c) => c.label).join(', ')}` : 'Nothing chosen yet.'}
                  </Typography>
                  {chosen.length > 0 && <Button onClick={() => setPrefs(EMPTY)}>Clear all</Button>}
                  <Button variant="contained" startIcon={<AutoAwesomeIcon />} onClick={() => setShown(true)} sx={{ height: 46, px: 3, borderRadius: '999px' }}>
                    {chosen.length ? 'Show matching products' : 'Show the best products'}
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </>
      )}

      {/* The picks, in a window. A chosen chip can be removed here; the picks
          change at once. */}
      <Dialog open={shown} onClose={() => setShown(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesomeIcon sx={{ color: '#2a78bd' }} />
              {chosen.length ? (forShopper ? 'Best matches for you' : 'Best matches for these preferences') : 'The best products overall'}
            </Box>
            {chosen.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
                {chosen.map((c) => (
                  <Button key={`${c.group}-${c.k}`} size="small" onClick={() => toggle(c.group, c.k)} aria-label={`Remove ${c.label}`}
                    endIcon={<CloseIcon sx={{ fontSize: 14 }} />} sx={{ ...pill(true), minHeight: 28, fontSize: '0.85rem', px: 1.25 }}>
                    {c.label}
                  </Button>
                ))}
              </Box>
            )}
          </Box>
          <IconButton onClick={() => setShown(false)} aria-label="Close"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#f6f8fb' }}>
          {results.length === 0 ? (
            <Typography color="text.secondary">No products yet. Add products on the Products page first.</Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', sm: 'repeat(3, minmax(0,1fr))', md: 'repeat(4, minmax(0,1fr))' }, gap: 1 }}>
              {results.map(({ p, score, why }, i) => {
                const img = (p.images && p.images[0]) || p.image;
                return (
                  <Box key={p._id || i} component="button" type="button" onClick={() => { if (onViewProduct) { onViewProduct(p); return; } setViewing(p); if (onSelectProduct) onSelectProduct(p); }} aria-label={`View ${p.name || 'product'}`} aria-pressed={!!selectedId && String(p._id) === String(selectedId)}
                    sx={{ bgcolor: '#fff', borderRadius: '14px', boxShadow: '0 2px 10px rgba(31,51,97,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column', textAlign: 'left', border: 0, outline: selectedId && String(p._id) === String(selectedId) ? '3px solid #1b4f72' : 'none', outlineOffset: '-3px', p: 0, cursor: 'pointer', font: 'inherit', '&:hover': { boxShadow: '0 8px 20px rgba(31,51,97,0.14)' } }}>
                    <Box sx={{ position: 'relative', width: '100%', height: 0, pt: '100%', overflow: 'hidden', bgcolor: '#eef1f4' }}>
                      {img && <Box component="img" src={getFileUrl(img)} alt="" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                      <Box sx={{ position: 'absolute', top: 6, left: 6, px: 0.9, height: 22, borderRadius: '11px', display: 'flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.92)', fontSize: 12, color: '#16324a' }}>
                        {score}% match
                      </Box>
                    </Box>
                    <Box sx={{ p: 1, width: '100%', boxSizing: 'border-box' }}>
                      <Typography sx={{ fontSize: 14, color: '#1c2430' }} noWrap title={p.name}>{p.name || 'Unnamed product'}</Typography>
                      <Typography color="text.secondary" sx={{ fontSize: 13 }}>{priceText(p)}</Typography>
                      {why.length > 0 && (
                        <Typography noWrap sx={{ fontSize: 12, color: '#1b5b91', mt: 0.25 }} title={why.join(' · ')}>{why.join(' · ')}</Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{forShopper ? 'Click a product to see its details.' : 'Click a product to see its page as the shopper sees it.'}</Typography>
          <Button variant="outlined" onClick={() => setShown(false)}>Change preferences</Button>
        </DialogActions>
      </Dialog>

      <ProductPreviewDialog open={!!viewing} onClose={() => setViewing(null)} productInfo={viewing} />
    </Box>
  );
}
