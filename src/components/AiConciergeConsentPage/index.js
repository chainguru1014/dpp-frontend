import React, { useState } from 'react';
import { Box, Button, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import ShieldIcon from '@mui/icons-material/Shield';
import PeopleIcon from '@mui/icons-material/People';
import LockIcon from '@mui/icons-material/Lock';
import AuthShell from '../AuthShell';
import { compactMediaQuery } from '../../theme';

// Text and icons on the see-through card in the brand blue (#2f80c8), (plain,
// no glow).
const AUTH_BLUE = '#2f80c8';
// Follows the background photo: white on the darker photos, blue on the
// bright one (CSS variables set by AuthShell).
const ON_GLASS = 'var(--auth-on-glass, #2f80c8)';
const onGlass = { color: ON_GLASS, textShadow: 'none' };

const FEATURES = [
  {
    icon: QrCode2Icon,
    title: 'Suggestions just for you',
    description: 'Learns from your scans and favourites to suggest products you may like.',
  },
  {
    icon: ShieldIcon,
    title: 'Your privacy comes first',
    description: 'Your real identity is never stored with this data.',
  },
  {
    icon: PeopleIcon,
    title: 'Helpful tips',
    description: 'Care tips and style ideas for the clothes you own.',
  },
  {
    icon: LockIcon,
    title: 'You stay in control',
    description: 'Change this choice any time under Privacy preferences.',
  },
];

// `mode: 'gate'` is shown once, right after a shopper account's first
// sign-in or sign-up, until that account has recorded a choice (see
// pages/index.js). It's also reachable before login via the "Privacy
// preferences" link (`mode: 'review'`), stored on this device only since
// there's no account yet — submitting or Cancel returns to the sign-in page.
const AiConciergeConsentPage = ({ mode, initialConsent, onSubmit, onClose, saving, apiError, activeSlide }) => {
  // `null` = no choice made yet, which keeps the main button disabled.
  const [consent, setConsent] = useState(initialConsent != null ? !!initialConsent : null);

  return (
    <AuthShell activeSlide={activeSlide} cardSx={{ height: 'auto', width: { xs: '100%', sm: 640 } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5 }}>
          <Typography variant="h5" component="h1" sx={{ textAlign: 'center', mb: 0.5, ...onGlass }}>
            {mode === 'review' ? 'Privacy preferences' : 'Meet your AI Concierge'}
          </Typography>
          <Typography sx={{ textAlign: 'center', mb: 2, ...onGlass }}>
            An optional helper that personalises the app for you.
          </Typography>

          {/* Two columns on wider screens so the Yes/No choice below stays
              visible without scrolling on a 1280x720 laptop. */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 2.5, rowGap: 1.5 }}>
          {FEATURES.map(({ icon: FeatureIcon, title, description }) => (
            <Box key={title} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
              <Box
                sx={{
                  width: 40, height: 40, flexShrink: 0, borderRadius: '50%',
                  bgcolor: 'var(--auth-icon-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <FeatureIcon sx={{ fontSize: 24, color: ON_GLASS }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 600, ...onGlass }}>{title}</Typography>
                <Typography sx={onGlass}>{description}</Typography>
              </Box>
            </Box>
          ))}
          </Box>

          {/* Placed after the explanation on purpose: read first, then choose.
              Nothing is pre-selected on a first visit. */}
          <Typography component="h2" sx={{ fontWeight: 600, mt: 2, mb: 1, ...onGlass }} id="consent-question">
            May the AI Concierge learn from your scans, favourites and browsing to personalise the app?
          </Typography>
          <RadioGroup
            aria-labelledby="consent-question"
            value={consent === null ? '' : consent ? 'yes' : 'no'}
            onChange={(e) => setConsent(e.target.value === 'yes')}
            sx={{ gap: 1, flexDirection: { xs: 'column', sm: 'row' }, '& > *': { flex: 1 } }}
          >
            {[
              { value: 'yes', label: 'Yes, personalise it' },
              { value: 'no', label: 'No, thank you' },
            ].map((opt) => (
              <FormControlLabel
                key={opt.value}
                value={opt.value}
                control={<Radio />}
                label={opt.label}
                sx={{
                  m: 0,
                  px: 1.5,
                  py: 0.75,
                  border: '2px solid',
                  borderColor: (consent === null ? '' : consent ? 'yes' : 'no') === opt.value ? AUTH_BLUE : 'divider',
                  borderRadius: 2,
                  bgcolor: (consent === null ? '' : consent ? 'yes' : 'no') === opt.value ? '#eef5fc' : '#fff',
                  '& .MuiFormControlLabel-label': { fontSize: '1.05rem', color: AUTH_BLUE },
                  '& .MuiRadio-root, & .MuiRadio-root.Mui-checked': { color: AUTH_BLUE },
                }}
              />
            ))}
          </RadioGroup>

          {!!apiError && (
            <Typography color="error" sx={{ mt: 1.5 }} role="alert">{apiError}</Typography>
          )}
        </Box>

        <Box sx={{ flexShrink: 0, pt: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => onSubmit(consent)}
            disabled={!!saving || consent === null}
            sx={{ minHeight: 50, fontSize: '1.05rem', borderRadius: 2, [compactMediaQuery]: { minHeight: 50 } }}
          >
            {saving ? 'Saving…' : mode === 'review' ? 'Save my choice' : 'Continue'}
          </Button>
          {consent === null && (
            <Typography variant="body2" sx={{ textAlign: 'center', ...onGlass }}>
              Please choose Yes or No above to continue.
            </Typography>
          )}
          {mode === 'review' && (
            <Button onClick={onClose} fullWidth sx={{ minHeight: 44, ...onGlass, '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }}>
              Cancel
            </Button>
          )}
        </Box>
      </Box>
    </AuthShell>
  );
};

export default AiConciergeConsentPage;
