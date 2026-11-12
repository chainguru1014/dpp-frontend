import React from 'react';
import { Box, Stack, Typography, Button, TextField, Chip, Card, CardContent, Switch, FormControlLabel, Icons } from '@yometel/dpp-admin';

// The provider wraps every card (and must wrap any design): it applies the
// admin theme. These cells show plain MUI parts under that theme.
export const TypeScale = () => (
  <Box sx={{ p: 3, width: 620 }}>
    <Typography variant="h5">Products</Typography>
    <Typography variant="h6">Shirt Jacket</Typography>
    <Typography variant="subtitle1">Materials</Typography>
    <Typography>Body text is 17px for easy reading on laptops and iPads.</Typography>
    <Typography color="text.secondary">Secondary text, dark enough to pass contrast checks.</Typography>
  </Box>
);

export const Controls = () => (
  <Box sx={{ p: 3, width: 620 }}>
    <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
      <Button variant="contained" startIcon={<Icons.Add />}>New product</Button>
      <Button variant="outlined">Cancel</Button>
      <Button>Learn more</Button>
    </Stack>
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
      <TextField label="Product name" defaultValue="Shirt Jacket" size="medium" />
      <FormControlLabel control={<Switch defaultChecked />} label="Published" />
    </Stack>
    <Stack direction="row" spacing={1}>
      <Chip label="Active" color="success" />
      <Chip label="Draft" />
      <Chip label="RFID" color="primary" variant="outlined" />
    </Stack>
  </Box>
);

export const CardSurface = () => (
  <Box sx={{ p: 3, width: 620, bgcolor: 'background.default' }}>
    <Card>
      <CardContent>
        <Typography variant="subtitle1">Scans this week</Typography>
        <Typography variant="h4" color="primary">1,284</Typography>
        <Typography color="text.secondary">+12% on last week</Typography>
      </CardContent>
    </Card>
  </Box>
);
