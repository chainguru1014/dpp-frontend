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

// Shown once after a User's first login (see pages/index.js `needsAiConsent`,
// derived from `!company.aiConciergeConsentAt`) and reachable any time after
// via the "Privacy Preferences" link on AuthPage, so a user can change or
// withdraw consent per GDPR.
//
// `mode`:
//  - 'onboarding': first-ever decision — submitting always proceeds into the
//    dashboard (the parent's gate clears itself once `company` updates).
//  - 'review': already decided once, reopened via Privacy Preferences —
//    submitting (or Cancel) returns to wherever the link was opened from.
//  - 'preview': nobody is signed in (Privacy Preferences tapped from a
//    signed-out AuthPage) — informational only, nothing is persisted, since
//    there's no account to attach a decision to yet.
const AiConciergeConsentPage = ({ mode, initialConsent, onSubmit, onClose, saving, apiError }) => {
  // `null` = no explicit choice made yet, which is what keeps the primary
  // button disabled below. Only 'review' (reopened via Privacy Preferences)
  // starts pre-selected, since a decision already exists to show; a fresh
  // 'onboarding'/'preview' visit always requires an active choice.
  const [consent, setConsent] = useState(mode === 'review' ? !!initialConsent : null);

  const handleSubmit = () => {
    if (mode === 'preview') {
      onClose();
      return;
    }
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
                // Gray background with dark blue text — reads as "declined"
                // without the alarm-red error color.
                ...(consent === false
                  ? { bgcolor: '#e5e7eb', borderColor: '#e5e7eb', color: '#266aa8', '&:hover': { bgcolor: '#d1d5db', borderColor: '#d1d5db' } }
                  : { bgcolor: 'rgba(255,255,255,0.85)', color: 'text.primary', borderColor: 'transparent' }),
              }}
            >
              I Disagree
            </Button>
          </Box>

          {mode === 'preview' && (
            <Typography sx={{ ...whiteTextSx, fontSize: '0.78rem', fontStyle: 'italic', mt: 0.75 }}>
              Sign in to save this preference to your account.
            </Typography>
          )}

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
            {saving
              ? 'Saving…'
              : mode === 'onboarding'
              ? 'Continue'
              : mode === 'review'
              ? 'Save Preferences'
              : 'Close'}
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
