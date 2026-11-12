import React, { useState } from 'react';
import { CareSymbols, Box } from '@yometel/dpp-admin';

// The care-symbol picker on the product form: every symbol, tap to toggle.
export const Picker = () => {
  const [ids, setIds] = useState(['wash_30', 'iron_low', 'dry_clean_P']);
  return (
    <Box sx={{ p: 3, width: 560 }}>
      <CareSymbols selectedIds={ids} onToggle={(id: string) => setIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))} />
    </Box>
  );
};

// Read-only, nothing selected.
export const ReadOnly = () => (
  <Box sx={{ p: 3, width: 560 }}>
    <CareSymbols selectedIds={[]} />
  </Box>
);
