import React from 'react';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// The × at the right of every dialog's title: a grey circle (HIG sheets).
export default function DialogClose({ onClick, disabled }) {
  return (
    <IconButton onClick={onClick} disabled={disabled} color="inherit" aria-label="Close" sx={{ ml: 'auto', flex: 'none', width: 36, height: 36, bgcolor: 'rgba(120,120,128,0.14)', color: '#1c1c1e', '&:hover': { bgcolor: 'rgba(120,120,128,0.22)' } }}>
      <CloseIcon />
    </IconButton>
  );
}
