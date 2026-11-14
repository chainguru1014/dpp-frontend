import React from 'react';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// The × at the right of every dialog's blue title bar (design).
export default function DialogClose({ onClick, disabled }) {
  return (
    <IconButton onClick={onClick} disabled={disabled} color="inherit" aria-label="Close" sx={{ ml: 'auto', flex: 'none' }}>
      <CloseIcon />
    </IconButton>
  );
}
