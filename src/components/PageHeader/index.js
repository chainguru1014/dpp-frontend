import React from 'react';
import { Box, Typography } from '@mui/material';

// One title + plain-language description + optional actions at the top of
// every admin page, so each screen says what it is and what it's for.
const PageHeader = ({ title, description, actions, icon: Icon }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: { xs: 'flex-start', sm: 'center' },
      justifyContent: 'space-between',
      flexDirection: { xs: 'column', sm: 'row' },
      gap: 1.5,
      mb: 2.5,
    }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {Icon && <Icon sx={{ color: 'primary.main', fontSize: 28 }} />}
        <Typography variant="h5" component="h1">
          {title}
        </Typography>
      </Box>
      {description && (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5, maxWidth: '75ch' }}>
          {description}
        </Typography>
      )}
    </Box>
    {actions && (
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>{actions}</Box>
    )}
  </Box>
);

export default PageHeader;
