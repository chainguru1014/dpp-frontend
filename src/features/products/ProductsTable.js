import React, { useEffect, useMemo, useState } from 'react';
import { Box, ButtonBase, Link, Pagination, Typography } from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EmptyState from '../../components/EmptyState';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getFileUrl } from '../../helper';
import Loader from '../../components/Loader';
import useSaveCounts from './useSaveCounts';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { PassportScore } from './PassportReadinessPanel';

// Per page; with brand groups more fit, since the headings split the grid.
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
  const saves = useSaveCounts().counts[String(product._id)] || 0;

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
        borderColor: selected ? '#2f80c8' : 'transparent',
        boxShadow: selected ? 'inset 5px 0 0 #2f80c8' : 'none',
        borderRadius: '20px',
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
        borderColor: selected ? '#2f80c8' : 'transparent',
        boxShadow: selected ? 'inset 5px 0 0 #2f80c8' : 'none',
        borderRadius: '20px',
        transition: 'box-shadow 120ms, border-color 120ms',
        ...(onClick ? { '&:hover': { borderColor: '#2f80c8', boxShadow: selected ? 'inset 5px 0 0 #2f80c8' : 3 } } : {}),
        '&:focus-visible': { outline: '3px solid #2f80c8', outlineOffset: 2 },
      };

  // Products / Product Journey lists: the photo on the left, the name,
  // model, owner, passport and codes on the right — a low card.
  if (compact && dense) {
    return (
      <Root
        {...(onClick ? { onClick, focusRipple: true, 'aria-pressed': selected } : {})}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', height: '100%', textAlign: 'left', p: 1.25,
          bgcolor: selected ? 'rgba(47,128,200,0.10)' : '#fff',
          border: '1px solid', borderColor: selected ? '#2f80c8' : 'transparent',
          boxShadow: selected ? 'inset 4px 0 0 #2f80c8' : 'none',
          borderRadius: '20px',
          transition: 'box-shadow 120ms, border-color 120ms',
          ...(onClick ? { '&:hover': { borderColor: '#2f80c8', boxShadow: selected ? 'inset 4px 0 0 #2f80c8' : 3 } } : {}),
          '&:focus-visible': { outline: '3px solid #2f80c8', outlineOffset: 2 },
        }}
      >
        <Box sx={{ width: 76, height: 76, flexShrink: 0, borderRadius: 2, bgcolor: '#f2f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {thumb && <Box component="img" alt="" src={getFileUrl(thumb)} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" component="span" sx={{ display: 'block', lineHeight: 1.3, fontSize: 15 }} noWrap>
            {product.name || 'Untitled product'}
          </Typography>
          {subtitle && <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block' }} noWrap>{subtitle}</Typography>}
          {!isAppUser && saves > 0 && <Typography variant="caption" component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#1b5b91' }}><FavoriteIcon sx={{ fontSize: 14, color: '#2a78bd' }} />{saves} {saves === 1 ? 'shopper saved' : 'shoppers saved'} this</Typography>}
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
          {isAppUser ? (
            <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block' }}>{product.ownedQuantity || 0} I own</Typography>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <PassportScore product={product} width={44} />
              <Typography variant="caption" color="text.secondary" component="span" noWrap>
                · {(product.total_minted_amount || 0).toLocaleString()} codes
              </Typography>
            </Box>
          )}
        </Box>
      </Root>
    );
  }

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
          {!isAppUser && saves > 0 && <Typography variant="caption" component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#1b5b91' }}><FavoriteIcon sx={{ fontSize: 14, color: '#2a78bd' }} />{saves} {saves === 1 ? 'shopper saved' : 'shoppers saved'} this</Typography>}
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

// The brand a product belongs to (its brand company), for grouping.
export const brandOf = (p) => String(p?.brandInfo?.name || p?.company_id?.name || 'Other').trim() || 'Other';
const groupsOf = (list) => {
  const groups = [];
  list.forEach((p) => {
    const brand = brandOf(p);
    let g = groups.find((x) => x.brand === brand);
    if (!g) { g = { brand, logo: '', items: [] }; groups.push(g); }
    if (!g.logo && p?.brandInfo?.logoUrl) g.logo = p.brandInfo.logoUrl;
    g.items.push(p);
  });
  return groups;
};

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
  // Cards under a heading per brand company (brands A–Z, the list's own
  // order inside each brand).
  groupByBrand = false,
}) {
  const rows = useMemo(() => {
    const list = products || [];
    if (!groupByBrand) return list;
    return list
      .map((p, i) => ({ p, i, b: brandOf(p) }))
      .sort((x, y) => x.b.localeCompare(y.b, undefined, { sensitivity: 'base' }) || x.i - y.i)
      .map((x) => x.p);
  }, [products, groupByBrand]);
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
      <Box sx={{ bgcolor: '#fff', borderRadius: '20px', border: '1px dashed', borderColor: 'divider', p: 5, textAlign: 'center' }}>
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
          <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: cols, gap: 2, px: 2, py: 1.5, bgcolor: '#f2f5f9', fontWeight: 400, color: '#16324a' }}>
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
                    {thumb && <Box component="img" src={getFileUrl(thumb)} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 400, color: '#16324a' }}>{p.name || 'Untitled product'}</Typography>
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
      {(groupByBrand ? groupsOf(shown) : [{ brand: '', items: shown }]).map((g) => (
        <Box key={g.brand || 'all'} sx={{ mb: groupByBrand ? 2.5 : 0 }}>
          {groupByBrand && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.25 }}>
              <Box sx={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', bgcolor: '#fff', border: '1px solid #dfe5ec', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {g.logo
                  ? <Box component="img" src={getFileUrl(g.logo)} alt="" sx={{ width: '82%', height: '82%', objectFit: 'contain' }} />
                  : <StorefrontIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
              </Box>
              <Typography sx={{ fontSize: 18, fontWeight: 400, color: '#16324a' }}>{g.brand}</Typography>
              <Box sx={{ px: 1, py: 0.25, borderRadius: 999, bgcolor: '#e8f1fb', color: '#1b4f72', fontSize: 13, fontWeight: 400 }}>
                {g.items.length} {g.items.length === 1 ? 'product' : 'products'}
              </Box>
              <Box sx={{ flex: 1, height: '1px', bgcolor: '#e3e8ef', ml: 1 }} />
            </Box>
          )}
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: `repeat(${Math.min(columns, 2)}, minmax(0, 1fr))`, md: `repeat(${columns}, minmax(0, 1fr))` } }}>
            {g.items.map((product) => (
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
        </Box>
      ))}
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
