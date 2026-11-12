import React from 'react';
import { PageHeader, Button, Box, Icons } from '@yometel/dpp-admin';

// The heading block at the top of every admin page: icon, title, one-line
// description, primary actions on the right and a "More actions" menu.
export const WithActions = () => (
  <Box sx={{ p: 3, bgcolor: 'background.default', width: 660 }}>
    <PageHeader
      icon={Icons.Inventory2}
      title="Products"
      description="Every product your company has registered. Click a row to open its passport."
      actions={<Button variant="contained" startIcon={<Icons.Add />}>New product</Button>}
      moreActions={[
        { label: 'Import from CSV', onClick: () => {} },
        { label: 'Export list', onClick: () => {} },
      ]}
    />
  </Box>
);

// Title and description only.
export const Simple = () => (
  <Box sx={{ p: 3, bgcolor: 'background.default', width: 660 }}>
    <PageHeader icon={Icons.Dashboard} title="Dashboard" description="Your main figures at a glance." />
  </Box>
);

// Two actions, secondary outlined.
export const TwoActions = () => (
  <Box sx={{ p: 3, bgcolor: 'background.default', width: 660 }}>
    <PageHeader
      icon={Icons.QrCode2}
      title="Generate Code"
      description="Create QR codes and RFID tag identifiers for a product."
      actions={
        <>
          <Button variant="outlined">Print sheet</Button>
          <Button variant="contained">Generate</Button>
        </>
      }
    />
  </Box>
);
