import React, { useEffect, useRef, useState } from 'react';
import { LinearProgress } from '@mui/material';
import { subscribe } from '../../utils/loadingBus';

// Fixed top-of-viewport progress bar shown while a request is in flight (see
// utils/loadingBus.js) — mounted once at the app root. It only appears when
// loading takes longer than SHOW_AFTER_MS, so quick requests never make it
// flash; once shown it stays at least MIN_SHOW_MS so it does not flicker.
const SHOW_AFTER_MS = 500;
const MIN_SHOW_MS = 300;

const GlobalLoadingBar = () => {
  const [visible, setVisible] = useState(false);
  const showTimer = useRef(null);
  const hideTimer = useRef(null);
  const shownAt = useRef(0);

  useEffect(() => {
    const unsubscribe = subscribe((count) => {
      if (count > 0) {
        clearTimeout(hideTimer.current);
        if (!showTimer.current && !shownAt.current) {
          showTimer.current = setTimeout(() => {
            showTimer.current = null;
            shownAt.current = Date.now();
            setVisible(true);
          }, SHOW_AFTER_MS);
        }
      } else {
        clearTimeout(showTimer.current);
        showTimer.current = null;
        if (shownAt.current) {
          const wait = Math.max(0, MIN_SHOW_MS - (Date.now() - shownAt.current));
          hideTimer.current = setTimeout(() => {
            shownAt.current = 0;
            setVisible(false);
          }, wait);
        }
      }
    });
    return () => {
      unsubscribe();
      clearTimeout(showTimer.current);
      clearTimeout(hideTimer.current);
    };
  }, []);

  if (!visible) return null;

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
