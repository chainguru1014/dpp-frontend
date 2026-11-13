import React from 'react';
import { Tabs, Tab } from '@mui/material';

// Two pages shown as one menu item (Sustainability = Life cycle + ESG,
// Scans & Security, Shopper Preview = Recommendations + Chat): tabs at the
// top of each, switching between their own addresses (/admin/<page>).
// tabs: [[page, label], ...]
export default function PageTabs({ tabs, active, onChange }) {
  const visible = tabs.filter(Boolean);
  if (visible.length < 2) return null;
  return (
    <Tabs
      value={active}
      onChange={(e, v) => onChange(v)}
      sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { fontSize: 16, minHeight: 48 } }}
    >
      {visible.map(([page, label]) => <Tab key={page} value={page} label={label} />)}
    </Tabs>
  );
}
