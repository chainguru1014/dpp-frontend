import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, IconButton } from '@mui/material';
import { Slide } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';
import { Backend_URL, getFileUrl } from '../helper';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import yometelLogo from '../assets/yometel-logo.png';
import appStoreBadge from '../assets/app-store-badge.png';
import googlePlayBadge from '../assets/google-play-badge.png';

const PublicProductPage = ({ qrcodeKey, onBack }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!qrcodeKey) {
        setError('Product key is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Decrypt and get product info from backend
        const response = await fetch(`${Backend_URL}qrcode/product/${encodeURIComponent(qrcodeKey)}`);
        const data = await response.json();

        if (response.ok && data.status === 'success') {
          setProduct(data.data);
        } else {
          setError(data.message || 'Product not found');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product information');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [qrcodeKey]);

  const slideProperties = {
    prevArrow: (
      <IconButton
        sx={{
          position: 'absolute',
          left: 10,
          zIndex: 1,
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
        }}
      >
        <ArrowBackIosIcon />
      </IconButton>
    ),
    nextArrow: (
      <IconButton
        sx={{
          position: 'absolute',
          right: 10,
          zIndex: 1,
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
        }}
      >
        <ArrowForwardIosIcon />
      </IconButton>
    ),
    indicators: true,
    autoplay: false,
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f5f5f5',
        }}
      >
        <Typography>Loading product information...</Typography>
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f5f5f5',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography variant="h6" color="error">
          {error || 'Product not found'}
        </Typography>
        {onBack && (
          <button onClick={onBack} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Go Back
          </button>
        )}
      </Box>
    );
  }

  const appStoreUrl = process.env.REACT_APP_APP_STORE_URL || '#';
  const playStoreUrl = process.env.REACT_APP_PLAY_STORE_URL || '#';

  return (
    <Box
      sx={{
        height: '100vh',
        bgcolor: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Container 
        maxWidth="md" 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          py: { xs: 1, sm: 2 },
          px: { xs: 1, sm: 2 },
        }}
      >
        {/* Yometel Logo at Top Center */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: { xs: 1, sm: 2 },
            flexShrink: 0,
            margin: '20px !important',
          }}
        >
          <Box
            component="img"
            src={yometelLogo}
            alt="Yometel Logo"
            sx={{
              height: { xs: '40px', sm: '50px', md: '60px' },
              width: 'auto',
              maxWidth: '100%',
            }}
          />
        </Box>
        
        {/* Image Carousel - 3/8 of viewport height */}
        {product.images && product.images.length > 0 && (
          <Box
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: 3,
              bgcolor: 'white',
              flexShrink: 0,
              mb: { xs: 1, sm: 1.5 },
              height: '37.5vh',
              minHeight: '37.5vh',
              maxHeight: '37.5vh',
              position: 'relative',
            }}
          >
            <Slide {...slideProperties}>
              {product.images.map((image, index) => (
                <Box
                  key={index}
                  sx={{
                    width: '100%',
                    height: '37.5vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#fafafa',
                    padding: { xs: 1, sm: 2 },
                    boxSizing: 'border-box',
                  }}
                >
                  <img
                    src={getFileUrl(image)}
                    alt={`${product.name || 'Product'} - Image ${index + 1}`}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                    onError={(e) => {
                      console.error('Image load error:', image, getFileUrl(image));
                      e.target.style.display = 'none';
                    }}
                  />
                </Box>
              ))}
            </Slide>
          </Box>
        )}

        {/* Product Details - Flexible to fill remaining space */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 2,
            p: { xs: 1.5, sm: 2, md: 3 },
            boxShadow: 3,
            mb: { xs: 1, sm: 2 },
            flex: '1 1 auto',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {product.name && (
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 600,
                mb: { xs: 0.5, sm: 1 },
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                flexShrink: 0,
              }}
            >
              {product.name}
            </Typography>
          )}

          {product.model && (
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                mb: { xs: 0.5, sm: 1 },
                fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' },
                flexShrink: 0,
              }}
            >
              Model: {product.model}
            </Typography>
          )}

          {product.company_id && product.company_id.name && (
            <Typography
              variant="body1"
              sx={{
                mb: { xs: 0.5, sm: 1 },
                fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
                color: 'text.secondary',
                flexShrink: 0,
              }}
            >
              Brand: {product.company_id.name}
            </Typography>
          )}

          {product.detail && (
            <Typography
              variant="body1"
              sx={{
                lineHeight: 1.6,
                fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.95rem' },
                whiteSpace: 'pre-wrap',
                flex: '1 1 auto',
                overflowY: 'auto',
              }}
            >
              {product.detail}
            </Typography>
          )}
        </Box>

        {/* App Store Buttons - Fixed at bottom */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: { xs: 1, sm: 2 },
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0,
            pb: { xs: 1, sm: 2 },
          }}
        >
          <a
            href={appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: 1.5,
                p: { xs: 1, sm: 1.5 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                minWidth: { xs: '160px', sm: '180px' },
                '&:hover': {
                  borderColor: '#757575',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Box
                component="img"
                src={appStoreBadge}
                alt="Download on the App Store"
                sx={{
                  height: { xs: '45px', sm: '55px', md: '65px' },
                  width: 'auto',
                  display: 'block',
                }}
              />
            </Box>
          </a>

          <a
            href={playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: 1.5,
                p: { xs: 1, sm: 1.5 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                minWidth: { xs: '160px', sm: '180px' },
                '&:hover': {
                  borderColor: '#757575',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Box
                component="img"
                src={googlePlayBadge}
                alt="Get it on Google Play"
                sx={{
                  height: { xs: '55px', sm: '65px', md: '75px' },
                  width: 'auto',
                  display: 'block',
                }}
              />
            </Box>
          </a>
        </Box>
      </Container>
    </Box>
  );
};

export default PublicProductPage;
