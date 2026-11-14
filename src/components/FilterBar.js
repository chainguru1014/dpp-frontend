import React from 'react';
import { Box, InputAdornment, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

// The one filter row every list uses (design: search + 2–3 drop-downs, the
// number of rows on the right). `search` = { value, onChange, placeholder };
// `children` are the drop-downs; `count` is shown on the right.
export default function FilterBar({ search, children, count, sx }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 2, ...sx }}>
      {search && (
        <TextField
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
          placeholder={search.placeholder}
          inputProps={{ 'aria-label': search.placeholder }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          sx={{ flex: '1 1 280px', maxWidth: 440, bgcolor: 'background.paper', borderRadius: 2 }}
        />
      )}
      {children}
      {count != null && (
        <Typography color="text.secondary" sx={{ ml: 'auto', whiteSpace: 'nowrap' }}>{count}</Typography>
      )}
    </Box>
  );
}

// A drop-down in the filter row.
export const filterSelectSx = { minWidth: 190, bgcolor: 'background.paper', borderRadius: 2 };
