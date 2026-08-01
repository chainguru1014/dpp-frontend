import React, { useEffect, useState } from 'react';
import { LinearProgress } from '@mui/material';
import { subscribe } from '../../utils/loadingBus';

// Fixed top-of-viewport progress bar shown while any axios request is in
// flight (see utils/loadingBus.js) — mounted once at the app root so every
// page gets it without individual pages managing their own loading state.
const GlobalLoadingBar = () => {
  const [active, setActive] = useState(false);

  useEffect(() => subscribe((count) => setActive(count > 0)), []);

  if (!active) return null;

  return (
    <LinearProgress
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.tooltip + 1,
        height: 3,
      }}
    />
  );
};

export default GlobalLoadingBar;
