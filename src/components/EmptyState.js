import React from 'react';
import { Box, Button, Typography } from '@mui/material';

// An empty page or list (design): a picture, a title, one sentence, and the
// button only for roles that can use it (pass no action otherwise; then
// `note` says who can, e.g. "Your Supervisor adds them.").
export default function EmptyState({ icon: Icon, title, text, action, note, compact = false }) {
  return (
    <Box sx={{
      bgcolor: '#fff', border: '1px solid #dfe5ec', borderRadius: 4, boxShadow: '0 8px 24px rgba(31,51,97,0.08)',
      py: compact ? 4 : 7, px: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 1.5,
    }}
    >
      {Icon && (
        <Box sx={{ width: compact ? 80 : 104, height: compact ? 80 : 104, borderRadius: '50%', bgcolor: '#e8f1fb', color: '#4a96dd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon sx={{ fontSize: compact ? 40 : 50 }} />
        </Box>
      )}
      <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#16324a' }}>{title}</Typography>
      {text && <Typography sx={{ fontSize: 16.5, color: '#51617a', maxWidth: 540 }}>{text}</Typography>}
      {action && (
        <Button variant="contained" startIcon={action.icon ? <action.icon /> : undefined} onClick={action.onClick} sx={{ mt: 0.75 }}>
          {action.label}
        </Button>
      )}
      {!action && note && <Typography color="text.secondary">{note}</Typography>}
    </Box>
  );
}
