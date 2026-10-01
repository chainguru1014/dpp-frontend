import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import { Backend_URL } from '../helper';
import yometelLogo from '../assets/logo-y.png';
import { DppPassportView } from '../features/products/DppPhonePreview';
import { normalizeDppTheme } from '../utils/dppTheme';

// The web product page a scanned label opens when the shopper isn't using
// the app: the product's Digital Product Passport in the brand's own look —
// the same passport view the admin panel's studio previews.
const PublicProductPage = ({ qrcodeKey, productId, qrcodeId, gtin, serial }) => {
  const [product, setProduct] = useState(null);
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      const hasProductIds = !!productId && qrcodeId != null;
      const hasLegacyKey = !!qrcodeKey;
      const hasGs1 = !!gtin && serial != null;
      if (!hasProductIds && !hasLegacyKey && !hasGs1) {
        setError('This link is missing its product code.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let response;
        if (hasGs1) {
          response = await fetch(`${Backend_URL}qrcode/gs1/${encodeURIComponent(String(gtin))}/${encodeURIComponent(String(serial))}`);
        } else if (hasProductIds) {
          response = await fetch(`${Backend_URL}qrcode/public/${encodeURIComponent(String(productId))}/${encodeURIComponent(String(qrcodeId))}`);
        } else {
          // Backward-compatible support for old encrypted key links.
          response = await fetch(`${Backend_URL}qrcode/product/${encodeURIComponent(qrcodeKey)}`);
        }
        const data = await response.json();

        if (response.ok && data.status === 'success') {
          setProduct(data.data);
        } else {
          setError(data.message || 'We could not find this product.');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('The product information could not be loaded. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [qrcodeKey, productId, qrcodeId, gtin, serial]);

  // The brand's look. Any failure just leaves the standard look.
  const rawCompany = product?.company_id;
  const companyId = rawCompany && typeof rawCompany === 'object' ? rawCompany._id : rawCompany;
  const brandName = String(product?.brandInfo?.name || '');
  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    fetch(`${Backend_URL}company/${encodeURIComponent(String(companyId))}/dpp-theme?brand=${encodeURIComponent(brandName)}`)
      .then((r) => r.json())
      .then((j) => { if (!cancelled) setTheme(j?.data?.dppTheme || null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [companyId, brandName]);

  const t = normalizeDppTheme(theme);

  if (loading || error || !product) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f4f7fc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 3, textAlign: 'center' }}>
        <Box component="img" src={yometelLogo} alt="Yometel" sx={{ width: 48, height: 48 }} />
        {loading ? (
          <>
            <CircularProgress />
            <Typography color="text.secondary">Loading the product passport…</Typography>
          </>
        ) : (
          <>
            <Typography variant="h6" component="h1">Product not found</Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
              {error || 'We could not find this product.'} Please scan the label on the product again.
            </Typography>
          </>
        )}
      </Box>
    );
  }

  const shareUrl = window.location.href;
  const shareText = `${product.name ? `${product.name} — ` : ''}Digital Product Passport`;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: t.pageBg, display: 'flex', flexDirection: 'column' }}>
      <Box component="main" sx={{ flex: 1, width: '100%', maxWidth: 520, mx: 'auto', p: { xs: 1.5, sm: 3 } }}>
        {/* The passport view is sized for the studio's phone preview; scale
            it up to a comfortable reading size on a real screen. */}
        <Box sx={{ zoom: 1.3 }}>
          <DppPassportView
            product={product}
            theme={theme}
            live
            blocked={product.item_status === 'blocked'}
            itemId={product.pmc_code || (product.token_id != null ? String(product.token_id) : '')}
          />
        </Box>

        {/* Social share — repost this product to X, LinkedIn or Instagram */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
          <Typography sx={{ color: t.textColor, mr: 0.5 }}>Share:</Typography>
          <IconButton
            aria-label="Share on X"
            sx={{ color: '#000' }}
            onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,width=600,height=600')}
          >
            <TwitterIcon />
          </IconButton>
          <IconButton
            aria-label="Share on LinkedIn"
            sx={{ color: '#0a66c2' }}
            onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,width=600,height=600')}
          >
            <LinkedInIcon />
          </IconButton>
          <IconButton
            aria-label="Share on Instagram"
            sx={{ color: '#e4405f' }}
            onClick={() => {
              // Instagram has no web post-intent; use the native share sheet on
              // mobile (lets the user pick Instagram), else copy the link.
              if (navigator.share) {
                navigator.share({ title: product.name || 'Product', url: shareUrl }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(shareUrl);
                window.open('https://www.instagram.com/', '_blank', 'noopener');
              }
            }}
          >
            <InstagramIcon />
          </IconButton>
        </Box>
      </Box>

      <Box component="footer" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, p: 2 }}>
        <Box component="img" src={yometelLogo} alt="" sx={{ width: 20, height: 20 }} />
        <Typography variant="body2" sx={{ color: t.textColor, opacity: 0.8 }}>Digital Product Passport by Yometel</Typography>
      </Box>
    </Box>
  );
};

export default PublicProductPage;
