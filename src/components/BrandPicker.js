import React, { useMemo, useState } from 'react';
import { Box, Button, ButtonBase, InputAdornment, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { BrandMark } from '../features/admin/CompanyManagementSection';
import { companyTypeLabel as typeLabel } from '../constants/companyTypes';

// The industry's name, or nothing when it is not set.
const companyTypeLabel = (key) => {
  const label = key ? typeLabel(key) : '';
  return label && label !== '—' ? label : '';
};

// Choosing a brand works like choosing a product on Product Journey: a
// search box and the brands as cards (logo, name, industry); click one.
// Once chosen, the page shows that brand with "Change brand" (BrandBar).
//
// options: [{ id, name, brand, companyType }]
export function BrandPickerGrid({ options = [], selectedId, onPick, title = 'Choose a brand' }) {
  const [query, setQuery] = useState('');
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...options].sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return q ? list.filter((o) => [o.name, o.brand?.tagline, companyTypeLabel(o.companyType)].some((v) => String(v || '').toLowerCase().includes(q))) : list;
  }, [options, query]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#16324a' }}>{title}</Typography>
        <TextField
          placeholder="Search by brand or industry"
          inputProps={{ 'aria-label': 'Search brands' }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ flex: 1, maxWidth: 520, bgcolor: 'background.paper', borderRadius: 2 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
        <Typography variant="body2" color="text.secondary">{shown.length} {shown.length === 1 ? 'brand' : 'brands'}</Typography>
      </Box>
      {shown.length === 0 ? (
        <Box sx={{ bgcolor: '#fff', borderRadius: 3, border: '1px dashed', borderColor: 'divider', p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">{options.length ? 'No brand matches your search.' : 'No brands yet. Add one on the Brands page.'}</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' } }}>
          {shown.map((o) => {
            const on = o.id === selectedId;
            return (
              <ButtonBase
                key={o.id}
                onClick={() => onPick(o.id)}
                aria-pressed={on}
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1.5, p: 1.5, textAlign: 'left', width: '100%',
                  bgcolor: on ? '#eef5fd' : '#fff', border: '1.5px solid', borderColor: on ? '#1b4f72' : '#dfe5ec', borderRadius: 3,
                  boxShadow: '0 4px 14px rgba(31,51,97,0.06)',
                  '&:hover': { borderColor: '#1b4f72', boxShadow: '0 8px 20px rgba(31,51,97,0.10)' },
                }}
              >
                <BrandMark brand={o.brand} name={o.name} size={48} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 700, fontSize: 16, color: '#16324a' }}>{o.name}</Typography>
                  <Typography noWrap variant="body2" color="text.secondary">
                    {[o.brand?.tagline, o.companyType ? companyTypeLabel(o.companyType) : ''].filter(Boolean).join(' · ') || 'Brand'}
                  </Typography>
                </Box>
              </ButtonBase>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

// The chosen brand in one bar: logo, name, industry, and Change brand.
export function BrandBar({ option, onChange, right }) {
  if (!option) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', p: 1.75, mb: 2.5, bgcolor: '#fff', border: '1px solid #dfe5ec', borderRadius: 4, boxShadow: '0 8px 24px rgba(31,51,97,0.08)' }}>
      <BrandMark brand={option.brand} name={option.name} size={52} />
      <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
        <Typography noWrap sx={{ fontWeight: 700, fontSize: 18, color: '#16324a' }}>{option.name}</Typography>
        <Typography noWrap color="text.secondary">
          {[option.brand?.tagline, option.companyType ? companyTypeLabel(option.companyType) : ''].filter(Boolean).join(' · ') || 'Brand'}
        </Typography>
      </Box>
      {right}
      {onChange && <Button variant="outlined" startIcon={<SwapHorizIcon />} onClick={onChange}>Change brand</Button>}
    </Box>
  );
}
