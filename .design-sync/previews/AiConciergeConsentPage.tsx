import React from 'react';
import { AiConciergeConsentPage, Box } from '@yometel/dpp-admin';

// The AI Concierge opt-in (first sign-in) and its "Privacy preferences"
// review mode.
export const FirstTime = () => (
  <Box sx={{ width: 1280, height: 820, position: 'relative', overflow: 'hidden' }}>
    <AiConciergeConsentPage mode="onboarding" onSubmit={() => {}} onClose={() => {}} saving={false} />
  </Box>
);

export const Review = () => (
  <Box sx={{ width: 1280, height: 820, position: 'relative', overflow: 'hidden' }}>
    <AiConciergeConsentPage mode="review" initialConsent onSubmit={() => {}} onClose={() => {}} saving={false} />
  </Box>
);
