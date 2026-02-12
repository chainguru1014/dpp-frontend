import React from 'react';
import { Box, Typography } from '@mui/material';

const ProductOwnerSection = ({ company, ownerInfo, onClick }) => {
  const isAdmin =
    !!company && (company.role === 'admin' || company.name === 'admin');

  if (!isAdmin || !ownerInfo) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1">Owner</Typography>
      <Typography variant="body2">
        <span
          style={{
            color: 'blue',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
          onClick={onClick}
        >
          {ownerInfo.name}
        </span>
        {ownerInfo.email && ` (${ownerInfo.email})`}
      </Typography>
    </Box>
  );
};

export default ProductOwnerSection;

