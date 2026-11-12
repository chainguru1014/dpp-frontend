import React from 'react';
import { CareSymbol, Box } from '@yometel/dpp-admin';

// One laundry care symbol in its tile.
export const Label = () => (
  <Box sx={{ p: 3, display: 'flex', gap: 1 }}>
    {['wash_30', 'bleach_no', 'tumble_dry_low', 'iron_med', 'dry_clean_P'].map((id) => (
      <CareSymbol key={id} iconId={id} />
    ))}
  </Box>
);

export const Selected = () => (
  <Box sx={{ p: 3, display: 'flex', gap: 1 }}>
    <CareSymbol iconId="wash_40" selected />
    <CareSymbol iconId="iron_low" selected />
    <CareSymbol iconId="wash_60" />
  </Box>
);
