import React, { useEffect, useState } from 'react';
import { Box, ButtonBase, Link, Pagination, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getFileUrl } from '../../helper';
import Loader from '../../components/Loader';
import { PassportScore } from './PassportReadinessPanel';

const PAGE_SIZE = 8;

// One product as a large row: its photo first (people recognise products by
// sight), then name and brand, then the two or three figures that matter.
export function ProductRow({ product, selected = false, onClick, onOwnerClick, isAppUser = false, showOwner = false }) {
  const thumb = Array.isArray(product.images) ? product.images[0] : null;
  const owner = product.company_id;
  const subtitle = [product.model, product.brandInfo?.name || owner?.name].filter(Boolean).join(' · ');
  const Root = onClick ? ButtonBase : Box;

  return (
    <Root
      {...(onClick ? { onClick, focusRipple: true, 'aria-pressed': selected } : {})}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 2,
        width: '100%',
        textAlign: 'left',
        p: 1.75,
        bgcolor: selected ? 'rgba(47,128,200,0.10)' : '#fff',
        border: '1px solid',
        borderColor: selected ? '#2f80c8' : 'divider',
        boxShadow: selected ? 'inset 5px 0 0 #2f80c8' : 1,
        borderRadius: 3,
        transition: 'box-shadow 120ms, border-color 120ms',
        ...(onClick ? { '&:hover': { borderColor: '#2f80c8', boxShadow: selected ? 'inset 5px 0 0 #2f80c8' : 3 } } : {}),
        '&:focus-visible': { outline: '3px solid #2f80c8', outlineOffset: 2 },
      }}
    >
      <Box
        component="img"
        alt=""
        src={thumb ? getFileUrl(thumb) : undefined}
        sx={{ width: 76, height: 76, borderRadius: 2, objectFit: 'cover', flexShrink: 0, bgcolor: '#eef1f6', visibility: thumb ? 'visible' : 'hidden' }}
      />
      <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
        <Typography variant="subtitle1" component="span" sx={{ display: 'block', lineHeight: 1.3 }}>
          {product.name || 'Untitled product'}
        </Typography>
        {subtitle && <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>{subtitle}</Typography>}
        {showOwner && owner && (
          <Link
            component="span"
            role="button"
            tabIndex={0}
            underline="hover"
            variant="body2"
            onClick={(e) => {
              e.stopPropagation();
              if (onOwnerClick) onOwnerClick(product);
            }}
          >
            Owner: {owner.name}{owner.email ? ` (${owner.email})` : ''}
          </Link>
        )}
      </Box>
      {isAppUser ? (
        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          <Typography variant="h6" component="span" sx={{ display: 'block', lineHeight: 1.1 }}>{product.ownedQuantity || 0}</Typography>
          <Typography variant="body2" color="text.secondary" component="span">I own</Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ flexShrink: 0, display: { xs: 'none', md: 'block' } }}>
            <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block', mb: 0.25 }}>Passport</Typography>
            <PassportScore product={product} width={90} />
          </Box>
          <Box sx={{ textAlign: 'right', flexShrink: 0, minWidth: 92, display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="h6" component="span" sx={{ display: 'block', lineHeight: 1.1 }}>
              {(product.total_minted_amount || 0).toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary" component="span">
              codes · {(product.printed_amount || 0).toLocaleString()} printed
            </Typography>
          </Box>
        </>
      )}
      {onClick && <ChevronRightIcon sx={{ color: 'text.secondary', flexShrink: 0 }} />}
    </Root>
  );
}

// The product list, as large photo rows (it used to be a dense grid table).
// Click a row to select it; long lists are split into pages.
export default function ProductsTable({
  products,
  loading,
  onSelectProduct,
  onOwnerClick,
  selectedId,
  isAppUser = false,
  showOwner = true,
  emptyText = 'No products yet.',
}) {
  const rows = products || [];
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  // Back to the first page whenever the list itself changes (a search, a reload).
  useEffect(() => {
    setPage(1);
  }, [rows.length]);
  const current = Math.min(page, pages);
  const shown = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  if (loading && !rows.length) return <Loader label="Loading products…" />;
  if (!rows.length) {
    return (
      <Box sx={{ bgcolor: '#fff', borderRadius: 3, border: '1px dashed', borderColor: 'divider', p: 5, textAlign: 'center' }}>
        <Typography color="text.secondary" sx={{ maxWidth: 520, mx: 'auto' }}>{emptyText}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {shown.map((product) => (
          <ProductRow
            key={product._id}
            product={product}
            selected={product._id === selectedId}
            onClick={onSelectProduct ? () => onSelectProduct(product) : undefined}
            onOwnerClick={onOwnerClick}
            isAppUser={isAppUser}
            showOwner={showOwner}
          />
        ))}
      </Box>
      {pages > 1 && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, rows.length)} of {rows.length} products
          </Typography>
          <Pagination count={pages} page={current} onChange={(e, p) => setPage(p)} color="primary" shape="rounded" size="large" />
        </Box>
      )}
    </Box>
  );
}
