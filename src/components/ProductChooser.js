import React, { useMemo, useState } from 'react';
import { Box, InputAdornment, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ProductsTable from '../features/products/ProductsTable';

// Choosing a product works the same on every page (Products, Generate Code,
// Product Journey, Sustainability): "Choose a product", a search box, and
// the products as cards grouped by company, each company with its own
// pages. Once one is chosen, the page shows it in a ProductBar with
// "Change product".
//
// query / onQueryChange: a page that searches by itself (e.g. Product
// Journey also looks a code up) passes its own; otherwise the box filters
// by product, model, style number or company.
// onSubmit + actions: a form (Enter / an extra button such as Find code).
export const matchesProduct = (p, q) => [p?.name, p?.model, p?.skuStyleNumber, p?.brandInfo?.name, p?.company_id?.name]
  .some((v) => String(v || '').toLowerCase().includes(q));

export default function ProductChooser({
  products = [],
  loading = false,
  selectedId,
  onSelect,
  showOwner = false,
  isAppUser = false,
  query,
  onQueryChange,
  placeholder,
  searchId,
  onSubmit,
  actions = null,
  emptyText = 'No products yet.',
  title = 'Choose a product',
  // Lines under each product's name, for the page (see ProductsTable).
  cardInfo,
}) {
  // Supervisors and staff see only their own company's products: no company
  // headings and no "company" in the search hint (client 2026-11-28).
  const hint = placeholder || (showOwner ? 'Search by product or company' : 'Search by product name or model');
  const [ownQuery, setOwnQuery] = useState('');
  const controlled = query !== undefined;
  const q = controlled ? query : ownQuery;
  const shown = useMemo(() => {
    if (controlled) return products;
    const t = ownQuery.trim().toLowerCase();
    return t ? products.filter((p) => matchesProduct(p, t)) : products;
  }, [products, ownQuery, controlled]);

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        component={onSubmit ? 'form' : 'div'}
        onSubmit={onSubmit ? (e) => { e.preventDefault(); onSubmit(); } : undefined}
        sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}
      >
        <Typography variant="h6" component="h2" sx={{ fontSize: 18, fontWeight: 400, color: '#16324a' }}>{title}</Typography>
        <TextField
          id={searchId}
          placeholder={hint}
          inputProps={{ 'aria-label': hint }}
          value={q}
          onChange={(e) => (controlled ? onQueryChange?.(e.target.value) : setOwnQuery(e.target.value))}
          sx={{ flex: 1, minWidth: 240, maxWidth: 520, bgcolor: 'background.paper', borderRadius: 2 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
        {actions}
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {shown.length} {shown.length === 1 ? 'product' : 'products'}
        </Typography>
      </Box>
      <ProductsTable
        products={shown}
        loading={loading}
        selectedId={selectedId}
        isAppUser={isAppUser}
        showOwner={showOwner}
        columns={4}
        dense
        groupByBrand={showOwner}
        emptyText={q.trim() ? 'No products match your search.' : emptyText}
        onSelectProduct={onSelect}
        cardInfo={cardInfo}
      />
    </Box>
  );
}
