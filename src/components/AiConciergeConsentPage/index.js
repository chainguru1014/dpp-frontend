import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import AuthShell from '../AuthShell';

// Card background is transparent (see AuthShell) so the forest photo shows
// through — text sitting directly on it needs to be white with a shadow.
const whiteTextSx = { color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.6)' };

// Matches AuthPage's SMALL_CONTROL_HEIGHT (2/3 of its old 40px control
// height) — same height as the Send code/Verify/Google/Apple buttons there,
// so the I Agree / I Disagree buttons here are visually consistent with the
// rest of the sign-in flow's controls.
const CONSENT_BUTTON_HEIGHT = 27;

// `mode: 'gate'` is shown once, right after a User account's first sign-in
// or sign-up, until that account has recorded an AI Concierge consent
// decision (see pages/index.js's `isAppUser && !company?.aiConciergeConsentAt`
// render branch) — submitting syncs the choice to the account, which clears
// the gate and falls through to the dashboard on the next render, so this
// screen's own button is what sends the user there. It never reappears for
// that account afterward.
//
// It's also reachable before login via the "Privacy Preferences" link on
// AuthPage (`mode: 'review'`), so a user can preview/change their choice per
// GDPR even pre-account; that path stays device-local (localStorage) since
// there's no account yet to attach it to — submitting (or Cancel) there
// returns to wherever the link was opened from.
const AiConciergeConsentPage = ({ mode, initialConsent, onSubmit, onClose, saving, apiError }) => {
  // `null` = no explicit choice made yet, which is what keeps the primary
  // button disabled below. A prior local choice (either mode) starts
  // pre-selected so the user sees what they picked last time.
  const [consent, setConsent] = useState(initialConsent != null ? !!initialConsent : null);

  const handleSubmit = () => {
    onSubmit(consent);
  };

  // No fixed `height` override here (there used to be one, forcing the card
  // down to ~60vh purely to trigger a scrollbar) — AuthShell's own default
  // cap (94vh xs / 82vh sm) is tall enough for this content to fit without
  // scrolling, while still capping/scrolling as a fallback on very short
  // screens (see cardScroll-equivalent `overflowY: 'auto'` below).
  return (
    <AuthShell cardSx={{ height: 'auto', maxHeight: { xs: '94dvh', sm: '88dvh' } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5 }}>
          {/* Smaller font sizes + tighter line-heights/paragraph spacing than
              before — this content was overflowing the card on shorter
              screens; denser typography fits it without relying on scrolling. */}
          <Typography
            sx={{ ...whiteTextSx, textAlign: 'center', fontSize: '0.68rem', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', mb: 0.3 }}
          >
            Welcome
          </Typography>
          <Typography sx={{ ...whiteTextSx, textAlign: 'center', fontSize: '1.15rem', fontWeight: 400, lineHeight: 1.3, mb: 0.8 }}>
            Meet Your AI Concierge
          </Typography>

          <Typography sx={{ ...whiteTextSx, fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.3, mt: 0.5, mb: 0.3 }}>
            Scan the products you like, discover what you like next.
          </Typography>
          <Typography sx={{ ...whiteTextSx, fontSize: '0.78rem', lineHeight: 1.35, mb: 0.75 }}>
            Your AI Concierge learns your preferences and recommends products you'll love—across brands.
          </Typography>
          <Typography sx={{ ...whiteTextSx, fontSize: '0.78rem', lineHeight: 1.35, mb: 0.75 }}>
            Your preferences and scan history may also be shared with participating brands and retailers
            to deliver more relevant recommendations and help improve products and services.
          </Typography>
          <Typography sx={{ ...whiteTextSx, fontSize: '0.78rem', lineHeight: 1.35, mb: 1 }}>
            Your profile cannot be used to identify you personally. Your scans and preferences are linked
            only to your in-app profile—not to your real identity.
          </Typography>

          {/* Placed after all the explanatory content, on purpose — the user
              should read what they're agreeing to before choosing. Nothing is
              pre-selected for a fresh visit, and the primary button below
              stays disabled until one of these is picked. */}
          <Typography sx={{ ...whiteTextSx, fontSize: '0.78rem', lineHeight: 1.35, mb: 0.6 }}>
            I agree to let the AI Concierge of this app learn from my scans, favorites, and browsing
            history to personalize my experience.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1.25 }}>
            <Button
              onClick={() => setConsent(true)}
              variant={consent === true ? 'contained' : 'outlined'}
              color="inherit"
              sx={{
                flex: 1,
                textTransform: 'none',
                fontWeight: 400,
                borderRadius: 2,
                height: CONSENT_BUTTON_HEIGHT,
                minHeight: CONSENT_BUTTON_HEIGHT,
                py: 0,
                // The app's dark blue (theme.palette.primary.dark, #266aa8) —
                // matches the Continue/Save Preferences/Close button below
                // and the app project's equivalent.
                ...(consent === true
                  ? { bgcolor: '#266aa8', borderColor: '#266aa8', color: '#fff', '&:hover': { bgcolor: '#1f5688', borderColor: '#1f5688' } }
                  : { bgcolor: 'rgba(255,255,255,0.85)', color: 'text.primary', borderColor: 'transparent' }),
              }}
            >
              I Agree
            </Button>
            <Button
              onClick={() => setConsent(false)}
              variant={consent === false ? 'contained' : 'outlined'}
              color="inherit"
              sx={{
                flex: 1,
                textTransform: 'none',
                fontWeight: 400,
                borderRadius: 2,
                height: CONSENT_BUTTON_HEIGHT,
                minHeight: CONSENT_BUTTON_HEIGHT,
                py: 0,
                // Gray background with white text — reads as "declined"
                // without the alarm-red error color.
                ...(consent === false
                  ? { bgcolor: '#9ca3af', borderColor: '#9ca3af', color: '#fff', '&:hover': { bgcolor: '#6b7280', borderColor: '#6b7280' } }
                  : { bgcolor: 'rgba(255,255,255,0.85)', color: 'text.primary', borderColor: 'transparent' }),
              }}
            >
              I Disagree
            </Button>
          </Box>

          {!!apiError && (
            <Box sx={{ bgcolor: 'rgba(253,236,236,0.95)', borderRadius: 2, p: 1, mt: 1 }}>
              <Typography sx={{ fontSize: '0.78rem', color: 'error.main' }}>
                {apiError}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ flexShrink: 0, pt: 1.25, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={!!saving || consent === null}
            sx={{
              textTransform: 'none',
              fontWeight: 400,
              borderRadius: 2,
              height: CONSENT_BUTTON_HEIGHT,
              minHeight: CONSENT_BUTTON_HEIGHT,
              py: 0,
              // Same dark blue as the I Agree active state above.
              bgcolor: '#266aa8',
              '&:hover': { bgcolor: '#1f5688' },
            }}
          >
            {saving ? 'Saving…' : mode === 'review' ? 'Save Preferences' : 'Continue'}
          </Button>
          {mode === 'review' && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                component="span"
                onClick={onClose}
                sx={{ ...whiteTextSx, fontWeight: 400, fontSize: '0.95rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              >
                Cancel
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </AuthShell>
  );
};

export default AiConciergeConsentPage;
