import React from 'react';
import { PageHelp, Box, Typography } from '@yometel/dpp-admin';

// The "?" help button next to a page title; click shows the page's help text.
// `page` is a key of the built-in help table (dashboard, products, brand,
// newProduct, generateCode, itemSearch, security, companies, users, ...).
export const NextToTitle = () => (
  <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
    <Typography variant="h5">Products</Typography>
    <PageHelp page="products" />
  </Box>
);

export const AppUserText = () => (
  <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
    <Typography variant="h5">Dashboard</Typography>
    <PageHelp page="dashboard" isAppUser />
  </Box>
);
