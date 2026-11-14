import React, { useEffect, useState } from 'react';
import { Box, ButtonBase, Link, Pagination, Typography } from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import EmptyState from '../../components/EmptyState';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getFileUrl } from '../../helper';
import Loader from '../../components/Loader';
import { PassportScore } from './PassportReadinessPanel';

const PAGE_SIZE = 8;

// One product as a card. Two layouts share the same content:
//  - the default wide row (photo, then name/brand, then the figures that
//    matter, left to right) — used standalone, e.g. Generate Code's "already
//    picked" banner, where the card gets the full container width to itself;
//  - `compact`, a vertical card (photo on top, text and figures stacked
//    below) — used by ProductsTable's grid below, where each card only gets
//    ~1/4 (or 1/2) of the row and the wide layout would squeeze everything
//    unreadably thin.
export function ProductRow({ product, selected = false, onClick, onOwnerClick, isAppUser = false, showOwner = false, compact = false, dense = false }) {
  const thumb = Array.isArray(product.images) ? product.images[0] : null;
  const owner = product.company_id;
  const subtitle = [product.model, product.brandInfo?.name || owner?.name].filter(Boolean).join(' · ');
  const Root = onClick ? ButtonBase : Box;

  const rootSx = compact
    ? {
        display: 'flex',
        flexDirection: 'column',
        alignItems: dense ? 'center' : 'stretch',
        gap: 1,
        width: '100%',
        height: '100%',
        textAlign: dense ? 'center' : 'left',
        p: 1.5,
        bgcolor: selected ? 'rgba(47,128,200,0.10)' : '#fff',
        border: '1px solid',
        borderColor: selected ? '#2f80c8' : 'divider',
        boxShadow: selected ? 'inset 5px 0 0 #2f80c8' : 1,
        borderRadius: 3,
        transition: 'box-shadow 120ms, border-color 120ms',
        ...(onClick ? { '&:hover': { borderColor: '#2f80c8', boxShadow: selected ? 'inset 5px 0 0 #2f80c8' : 3 } } : {}),
        '&:focus-visible': { outline: '3px solid #2f80c8', outlineOffset: 2 },
      }
    : {
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
      };

  if (compact) {
    return (
      <Root
        {...(onClick ? { onClick, focusRipple: true, 'aria-pressed': selected } : {})}
        sx={rootSx}
      >
        <Box sx={{ position: 'relative', width: '33%' }}>
          <Box
            component="img"
            alt=""
            src={thumb ? getFileUrl(thumb) : undefined}
            sx={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 2, objectFit: 'cover', bgcolor: '#eef1f6', visibility: thumb ? 'visible' : 'hidden' }}
          />
          {onClick && !dense && (
            <ChevronRightIcon sx={{ position: 'absolute', top: 4, right: 4, color: '#fff', bgcolor: 'rgba(0,0,0,0.35)', borderRadius: '50%', p: 0.25, fontSize: 22 }} />
          )}
        </Box>
        <Box sx={{ minWidth: 0, width: dense ? '100%' : undefined }}>
          <Typography variant="subtitle2" component="span" sx={{ display: 'block', lineHeight: 1.3 }} noWrap>
            {product.name || 'Untitled product'}
          </Typography>
          {subtitle && <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block' }} noWrap>{subtitle}</Typography>}
          {showOwner && owner && (
            <Link
              component="span"
              role="button"
              tabIndex={0}
              underline="hover"
              variant="caption"
              sx={{ display: 'block' }}
              onClick={(e) => {
                e.stopPropagation();
                if (onOwnerClick) onOwnerClick(product);
              }}
            >
              <Typography variant="caption" noWrap sx={{ display: 'block' }}>Owner: {owner.name}</Typography>
            </Link>
          )}
        </Box>
        {isAppUser ? (
          <Typography variant="caption" color="text.secondary" component="span">{product.ownedQuantity || 0} I own</Typography>
        ) : dense ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, mt: 'auto' }}>
            <PassportScore product={product} width={50} />
            <Typography variant="caption" color="text.secondary" component="span">
              {(product.total_minted_amount || 0).toLocaleString()} codes
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 'auto' }}>
            <PassportScore product={product} width={50} />
            <Typography variant="caption" color="text.secondary" component="span" sx={{ textAlign: 'right' }}>
              {(product.total_minted_amount || 0).toLocaleString()} codes
            </Typography>
          </Box>
        )}
      </Root>
    );
  }

  return (
    <Root
      {...(onClick ? { onClick, focusRipple: true, 'aria-pressed': selected } : {})}
      sx={rootSx}
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
  columns = 4,
  dense = false,
  // 'table' (design: one row per product with Category, Passport, Codes,
  // Updated) or the photo cards.
  layout = 'cards',
  emptyAction,
  emptyNote,
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
    if (emptyAction || emptyNote) {
      return <EmptyState icon={Inventory2Icon} title="No products here" text={emptyText} action={emptyAction} note={emptyNote} compact />;
    }
    return (
      <Box sx={{ bgcolor: '#fff', borderRadius: 3, border: '1px dashed', borderColor: 'divider', p: 5, textAlign: 'center' }}>
        <Typography color="text.secondary" sx={{ maxWidth: 520, mx: 'auto' }}>{emptyText}</Typography>
      </Box>
    );
  }

  const pager = pages > 1 && (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mt: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, rows.length)} of {rows.length} products
      </Typography>
      <Pagination count={pages} page={current} onChange={(e, p) => setPage(p)} color="primary" shape="rounded" size="large" />
    </Box>
  );

  if (layout === 'table') {
    const updated = (p) => {
      const iso = p.updatedAt || p.createdAt;
      const d = iso ? new Date(iso) : (p._id && /^[0-9a-f]{24}$/i.test(p._id) ? new Date(parseInt(p._id.slice(0, 8), 16) * 1000) : null);
      return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '—';
    };
    const category = (p) => (p.itemCategory ? String(p.itemCategory).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase()) : '—');
    const cols = showOwner ? 'minmax(0, 2.6fr) minmax(0, 1.2fr) minmax(0, 1fr) 170px 90px 90px' : 'minmax(0, 2.6fr) minmax(0, 1fr) 170px 90px 90px';
    return (
      <Box>
        <Box sx={{ bgcolor: '#fff', border: '1px solid #dfe5ec', borderRadius: 4, overflow: 'hidden', boxShadow: '0 8px 24px rgba(31,51,97,0.08)' }}>
          <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: cols, gap: 2, px: 2, py: 1.5, bgcolor: '#f2f5f9', fontWeight: 600, color: '#16324a' }}>
            <span>Product</span>{showOwner && <span>Brand</span>}<span>Category</span><span>Passport</span><span>Codes</span><span>Updated</span>
          </Box>
          {shown.map((p) => {
            const thumb = Array.isArray(p.images) ? p.images[0] : null;
            const on = p._id === selectedId;
            return (
              <ButtonBase
                key={p._id}
                onClick={onSelectProduct ? () => onSelectProduct(p) : undefined}
                aria-pressed={on}
                sx={{ display: 'grid', width: '100%', textAlign: 'left', gridTemplateColumns: { xs: 'minmax(0, 1fr) auto', md: cols }, gap: 2, alignItems: 'center', px: 2, py: 1.25, borderTop: '1px solid #e8edf3', bgcolor: on ? '#eaf2fc' : 'transparent', '&:hover': { bgcolor: on ? '#eaf2fc' : '#f8fafc' } }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                  <Box sx={{ width: 48, height: 48, flex: 'none', borderRadius: 2, bgcolor: '#f2f5f9', border: '1px solid #e3e8ef', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {thumb && <Box component="img" src={getFileUrl(thumb)} alt="" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 600, color: '#16324a' }}>{p.name || 'Untitled product'}</Typography>
                    <Typography noWrap variant="body2" color="text.secondary">{p.model || p.brandInfo?.name || ''}</Typography>
                  </Box>
                </Box>
                {showOwner && <Typography noWrap sx={{ display: { xs: 'none', md: 'block' } }}>{p.brandInfo?.name || p.company_id?.name || '—'}</Typography>}
                <Typography noWrap sx={{ display: { xs: 'none', md: 'block' } }}>{category(p)}</Typography>
                <Box sx={{ display: { xs: 'none', md: 'block' } }}><PassportScore product={p} width={90} /></Box>
                <Typography sx={{ display: { xs: 'none', md: 'block' } }}>{(Number(p.total_minted_amount) || 0).toLocaleString()}</Typography>
                <Typography color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>{updated(p)}</Typography>
                <ChevronRightIcon sx={{ display: { xs: 'block', md: 'none' }, color: 'text.secondary' }} />
              </ButtonBase>
            );
          })}
        </Box>
        {pager}
      </Box>
    );
  }

  return (
    <Box>
      {/* minmax(0, 1fr), not plain 1fr -- an `fr` track's implicit minimum is
          its content's min-content size, so a card with a longer name (its
          Typography noWrap can't shrink below that) would end up wider than
          its neighbors. minmax(0, 1fr) forces every column to the same
          strict 1/N width regardless of content. */}
      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: `repeat(${Math.min(columns, 2)}, minmax(0, 1fr))`, md: `repeat(${columns}, minmax(0, 1fr))` } }}>
        {shown.map((product) => (
          <ProductRow
            key={product._id}
            product={product}
            selected={product._id === selectedId}
            onClick={onSelectProduct ? () => onSelectProduct(product) : undefined}
            onOwnerClick={onOwnerClick}
            isAppUser={isAppUser}
            showOwner={showOwner}
            compact
            dense={dense}
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
