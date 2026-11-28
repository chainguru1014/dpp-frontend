import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, IconButton, TextField, InputAdornment, CircularProgress, Button } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SearchIcon from '@mui/icons-material/Search';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import axios from 'axios';
import { Backend_URL, getFileUrl } from '../../helper';
import PageHeader from '../../components/PageHeader';

// A shopper's Favorites (design WEB_ConsumerFavorites): photo cards with a
// heart to take a product out, a search box, and a way to recommendations.
// onOpenProduct: a card opens the product's page here (client 2026-11-28).
export default function FavoritesPage({ company, onOpenRecommendations, onOpenProduct }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!company?._id) { setLoading(false); return; }
      const rows = await axios.get(`${Backend_URL}engagement/album/list?user_id=${encodeURIComponent(company._id)}`)
        .then((r) => r.data?.data || []).catch(() => []);
      if (alive) { setItems(rows); setLoading(false); }
    })();
    return () => { alive = false; };
  }, [company]);

  const view = (it) => {
    const live = it.product || {};
    const snap = it.productSnapshot || {};
    return {
      name: live.name || snap.name || '',
      brand: live.brandInfo?.name || snap.brandInfo?.name || '',
      image: (live.images || snap.images || [])[0],
      price: live.price ? new Intl.NumberFormat('en-IE', { style: 'currency', currency: live.currency || 'EUR', maximumFractionDigits: 0 }).format(live.price) : '',
      productId: String(it.product_id?._id || it.product_id),
      tokenId: it.token_id,
    };
  };
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => { const v = view(it); return !q || v.name.toLowerCase().includes(q) || v.brand.toLowerCase().includes(q); });
  }, [items, query]);

  const remove = async (it) => {
    setItems((list) => list.filter((x) => x._id !== it._id));
    await axios.delete(`${Backend_URL}engagement/album`, { data: { user_id: company._id, product_id: it.product_id?._id || it.product_id, token_id: it.token_id ?? null } }).catch(() => {});
  };

  return (
    <Box>
      <PageHeader
        title="Favorites"
        actions={onOpenRecommendations ? <Button variant="outlined" startIcon={<AutoAwesomeIcon />} onClick={onOpenRecommendations}>Find more like these</Button> : null}
      />
      {items.length > 0 && (
        <TextField
          placeholder="Search favorites"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ mb: 3, width: { xs: '100%', md: 420 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
      )}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Box sx={{ bgcolor: '#fff', borderRadius: '24px', p: 6, textAlign: 'center' }}>
          <FavoriteIcon sx={{ fontSize: 48, color: '#2a78bd' }} />
          <Typography sx={{ fontSize: 20, mt: 1 }}>No favorites yet</Typography>
          <Typography color="text.secondary">Tap ♥ on a product in the app and it shows here.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', md: 'repeat(3, minmax(0,1fr))', xl: 'repeat(4, minmax(0,1fr))' }, gap: 2.5 }}>
          {shown.map((it) => {
            const v = view(it);
            return (
              <Box key={it._id} component={onOpenProduct ? 'button' : 'a'} type={onOpenProduct ? 'button' : undefined}
                onClick={onOpenProduct ? () => onOpenProduct({ ...(it.productSnapshot || {}), ...(it.product || {}), _id: v.productId }) : undefined}
                href={onOpenProduct ? undefined : `${(process.env.REACT_APP_WEB_BASE_URL || 'https://dpp.innosynch.com').replace(/\/$/, '')}/product/${v.productId}/${v.tokenId ?? ''}`}
                target={onOpenProduct ? undefined : '_blank'} rel={onOpenProduct ? undefined : 'noreferrer'}
                aria-label={onOpenProduct ? `Open ${v.name || 'product'}` : undefined}
                sx={{ border: 0, p: 0, font: 'inherit', textAlign: 'left', cursor: 'pointer', bgcolor: '#fff', borderRadius: '24px', overflow: 'hidden', color: 'inherit', textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ position: 'relative', height: 220, bgcolor: '#eef1f4' }}>
                  {v.image && <Box component="img" src={getFileUrl(v.image)} alt={v.name} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                  <IconButton
                    aria-label="Remove from Favorites"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(it); }}
                    sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', '&:hover': { bgcolor: '#fff' } }}
                  >
                    <FavoriteIcon sx={{ color: '#2a78bd' }} />
                  </IconButton>
                </Box>
                <Box sx={{ p: 2 }}>
                  <Typography sx={{ fontSize: 13, color: '#5f6b78', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{v.brand}</Typography>
                  <Typography sx={{ fontSize: 17 }} noWrap>{v.name || 'Product'}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 15 }}>{v.price}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
