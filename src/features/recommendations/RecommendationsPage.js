import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Grid,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import axios from 'axios';
import { Backend_URL, getFileUrl, getProductsByUser, getOwnedProducts } from '../../helper';
import PageHeader from '../../components/PageHeader';

/**
 * Brand-curated, AI-assisted product recommendations.
 *
 * The catalogue (real products) is always shown as the candidate pool. Pressing
 * "Generate with AI" asks the backend to rank/personalise them; if the AI
 * provider (OpenAI) is not yet wired up the page degrades gracefully
 * and keeps showing the catalogue with a short notice.
 */
export default function RecommendationsPage({ company, isAdmin, isAppUser = false }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [aiNote, setAiNote] = useState('');
  const [recommended, setRecommended] = useState(null); // null until AI runs

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const list = isAdmin
          ? await getProductsByUser()
          : await getOwnedProducts(company?.role === 'User' || company?.userType ? 'User' : 'Company', company?._id);
        if (alive) setProducts(Array.isArray(list) ? list : []);
      } catch (e) {
        if (alive) setProducts([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [company, isAdmin]);

  const generate = async () => {
    setGenerating(true);
    setAiNote('');
    try {
      const { data } = await axios.post(`${Backend_URL}recommendations`, {
        ownerId: company?._id,
        ownerKind: company?.role === 'User' || company?.userType ? 'User' : 'Company',
      });
      const items = data?.data || data?.recommendations || [];
      if (Array.isArray(items) && items.length) {
        setRecommended(items);
        setAiNote('Personalized by AI from recent shopper preferences.');
      } else {
        setRecommended(products);
        setAiNote('No personal suggestions yet, so all products are shown.');
      }
    } catch (e) {
      // AI backend not configured — keep the page useful, and keep the
      // technical reason out of the user's view.
      console.error('Recommendations request failed:', e?.response?.status, e?.message);
      setRecommended(products);
      setAiNote('Personal suggestions are not available right now, so all products are shown. Please try again later.');
    } finally {
      setGenerating(false);
    }
  };

  const shown = recommended || products;

  return (
    <Box>
      <PageHeader
        title="Recommendations"
        icon={AutoAwesomeIcon}
        description={isAppUser
          ? 'Products picked for you, based on what you scan and like.'
          : 'See how your products are suggested to shoppers based on what they scan and like.'}
      />

      <Card sx={{ mb: 2 }}>
        <CardContent
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1.5,
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <AutoAwesomeIcon sx={{ color: 'primary.main' }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1">
                Personal suggestions
              </Typography>
              <Typography color="text.secondary">
                Press the button to sort the products by what fits best. This uses an AI assistant.
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
            onClick={generate}
            disabled={generating || loading}
          >
            {generating ? 'Working…' : 'Show suggestions'}
          </Button>
        </CardContent>
      </Card>

      {aiNote && (
        <Alert severity={recommended && recommended.length && aiNote.startsWith('Personalized') ? 'success' : 'info'} sx={{ mb: 2 }}>
          {aiNote}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : shown.length === 0 ? (
        <Alert severity="info">{isAppUser ? 'No products to suggest yet.' : 'No products yet. Add products on the Products page first.'}</Alert>
      ) : (
        <Grid container spacing={{ xs: 1.5, md: 2 }}>
          {shown.map((p, i) => {
            const img = (p.images && p.images[0]) || p.image;
            return (
              <Grid item xs={6} sm={4} md={3} key={p._id || i}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {img ? (
                    <CardMedia
                      component="img"
                      image={getFileUrl(img)}
                      alt={p.name || 'Product'}
                      sx={{ height: { xs: 110, md: 140 }, objectFit: 'contain', bgcolor: '#fafbfd', p: 1 }}
                    />
                  ) : (
                    <Box sx={{ height: { xs: 110, md: 140 }, bgcolor: '#eef2f8' }} />
                  )}
                  <CardContent sx={{ py: 1.25, flexGrow: 1 }}>
                    {recommended && <Chip label="Suggested" size="small" color="primary" sx={{ mb: 0.5 }} />}
                    <Typography variant="subtitle2" noWrap title={p.name}>
                      {p.name || 'Unnamed product'}
                    </Typography>
                    {p.model && (
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {p.model}
                      </Typography>
                    )}
                    {p.ai_reason && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.35 }}>
                        {p.ai_reason}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
