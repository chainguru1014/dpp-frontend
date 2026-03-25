import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, IconButton, Avatar } from '@mui/material';
import { Slide } from 'react-slideshow-image';
import 'react-slideshow-image/dist/styles.css';
import { Backend_URL, getFileUrl } from '../helper';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import yometelLogo from '../assets/yometel-logo.png';
import appStoreBadge from '../assets/app-store-badge.png';
import googlePlayBadge from '../assets/google-play-badge.png';
import QrCodeIcon from '@mui/icons-material/QrCode';

// Sound wave icon component
const SoundWaveIcon = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      height: '20px',
      justifyContent: 'center',
      gap: '3px',
    }}
  >
    {[8, 12, 16, 12, 8].map((height, index) => (
      <Box
        key={index}
        sx={{
          width: '3px',
          height: `${height}px`,
          backgroundColor: '#1565C0',
          borderRadius: '2px',
        }}
      />
    ))}
  </Box>
);

const PublicProductPage = ({ qrcodeKey, productId, qrcodeId, onBack }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      const hasProductIds = !!productId && qrcodeId != null;
      const hasLegacyKey = !!qrcodeKey;
      if (!hasProductIds && !hasLegacyKey) {
        setError('Product key is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let response;
        if (hasProductIds) {
          response = await fetch(`${Backend_URL}qrcode/public/${encodeURIComponent(String(productId))}/${encodeURIComponent(String(qrcodeId))}`);
        } else {
          // Backward-compatible support for old encrypted key links.
          response = await fetch(`${Backend_URL}qrcode/product/${encodeURIComponent(qrcodeKey)}`);
        }
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
  }, [qrcodeKey, productId, qrcodeId]);

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

  // Show mobile app design when loading or no product
  if (loading || error || !product) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#E3F2FD', // Light pastel blue background
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '15px 20px',
            backgroundColor: 'transparent',
          }}
        >
          {/* QR Code Icon */}
          <Box
            sx={{
              width: '48px',
              height: '48px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '8px',
            }}
          >
            <QrCodeIcon sx={{ fontSize: 32, color: '#1565C0' }} />
          </Box>

          {/* Yometel Logo with Sound Wave */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1565C0',
                marginRight: '8px',
              }}
            >
              Yometel
            </Typography>
            <SoundWaveIcon />
          </Box>

          {/* Avatar */}
          <Box
            sx={{
              width: '48px',
              height: '48px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: '#1976d2',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              K
            </Avatar>
          </Box>
        </Box>

        {/* Main Content - QR Code Scanner Card */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: '#E3F2FD',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px 20px',
          }}
        >
          <Box
            sx={{
              width: '90%',
              maxWidth: '350px',
              aspectRatio: '1 / 1',
              backgroundColor: '#fff',
              borderRadius: '16px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Four quadrants */}
            <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1 }}>
              <Box sx={{ flex: 1 }} />
              <Box
                sx={{
                  flex: 1,
                  borderLeft: '1px solid #E0E0E0',
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1 }}>
              <Box
                sx={{
                  flex: 1,
                  borderTop: '1px solid #E0E0E0',
                }}
              />
              <Box
                sx={{
                  flex: 1,
                  borderTop: '1px solid #E0E0E0',
                  borderLeft: '1px solid #E0E0E0',
                }}
              />
            </Box>

            {/* Text overlay */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px',
              }}
            >
              <Typography
                sx={{
                  fontSize: '16px',
                  color: '#999',
                  textAlign: 'center',
                  fontWeight: 400,
                }}
              >
                Scan QR code to view product
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            backgroundColor: 'transparent',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >
          <Typography
            sx={{
              fontSize: '12px',
              color: '#999',
              lineHeight: '16px',
            }}
          >
            Digital
          </Typography>
          <Typography
            sx={{
              fontSize: '12px',
              color: '#999',
              lineHeight: '16px',
            }}
          >
            Product
          </Typography>
          <Typography
            sx={{
              fontSize: '12px',
              color: '#999',
              lineHeight: '16px',
            }}
          >
            Passport
          </Typography>
        </Box>
      </Box>
    );
  }

  // When product is loaded, still show mobile app design layout
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#E3F2FD', // Light pastel blue background
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '15px 20px',
          backgroundColor: 'transparent',
        }}
      >
        {/* QR Code Icon */}
        <Box
          sx={{
            width: '48px',
            height: '48px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '8px',
          }}
        >
          <QrCodeIcon sx={{ fontSize: 32, color: '#1565C0' }} />
        </Box>

        {/* Yometel Logo with Sound Wave */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            sx={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1565C0',
              marginRight: '8px',
            }}
          >
            Yometel
          </Typography>
          <SoundWaveIcon />
        </Box>

        {/* Avatar */}
        <Box
          sx={{
            width: '48px',
            height: '48px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: '#1976d2',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            K
          </Avatar>
        </Box>
      </Box>

      {/* Main Content - Product Display Card */}
      <Box
        sx={{
          flex: 1,
          backgroundColor: '#E3F2FD',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px 20px',
        }}
      >
        <Box
          sx={{
            width: '90%',
            maxWidth: '350px',
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {/* Product Images */}
          {product.images && product.images.length > 0 && (
            <Box
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                mb: 2,
                maxHeight: '300px',
              }}
            >
              <Slide {...slideProperties}>
                {product.images.map((image, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: '#fafafa',
                      padding: 2,
                    }}
                  >
                    <img
                      src={getFileUrl(image)}
                      alt={`${product.name || 'Product'} - Image ${index + 1}`}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                      }}
                    />
                  </Box>
                ))}
              </Slide>
            </Box>
          )}

          {/* Product Details */}
          {product.name && (
            <Typography
              sx={{
                fontSize: '18px',
                fontWeight: 600,
                mb: 1,
                color: '#333',
              }}
            >
              {product.name}
            </Typography>
          )}

          {product.model && (
            <Typography
              sx={{
                fontSize: '14px',
                color: '#666',
                mb: 1,
              }}
            >
              Model: {product.model}
            </Typography>
          )}

          {product.company_id && product.company_id.name && (
            <Typography
              sx={{
                fontSize: '14px',
                color: '#666',
                mb: 1,
              }}
            >
              Brand: {product.company_id.name}
            </Typography>
          )}

          {product.detail && (
            <Typography
              sx={{
                fontSize: '14px',
                color: '#666',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                mt: 1,
              }}
            >
              {product.detail}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          backgroundColor: 'transparent',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        <Typography
          sx={{
            fontSize: '12px',
            color: '#999',
            lineHeight: '16px',
          }}
        >
          Digital
        </Typography>
        <Typography
          sx={{
            fontSize: '12px',
            color: '#999',
            lineHeight: '16px',
          }}
        >
          Product
        </Typography>
        <Typography
          sx={{
            fontSize: '12px',
            color: '#999',
            lineHeight: '16px',
          }}
        >
          Passport
        </Typography>
      </Box>
    </Box>
  );
};

export default PublicProductPage;
