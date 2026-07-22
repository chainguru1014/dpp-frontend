import React, { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

// Small clipboard-copy affordance reused everywhere a code/PMC value is
// displayed (Generate & Print tabs). Shows a brief checkmark instead of a
// blocking alert/snackbar on success.
const CopyIconButton = ({ value, size = 'small' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(String(value ?? ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
    }
  };

  return (
    <Tooltip title={copied ? 'Copied!' : 'Copy'}>
      <IconButton size={size} onClick={handleCopy} disabled={!value}>
        {copied ? <CheckIcon fontSize="inherit" color="success" /> : <ContentCopyIcon fontSize="inherit" />}
      </IconButton>
    </Tooltip>
  );
};

export default CopyIconButton;
