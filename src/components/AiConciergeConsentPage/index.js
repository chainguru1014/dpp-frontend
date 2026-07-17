import React, { useState } from 'react';
import { Box, Button, Checkbox, Typography } from '@mui/material';
import AuthShell from '../AuthShell';

// Card background is transparent (see AuthShell) so the forest photo shows
// through — text sitting directly on it needs to be white with a shadow.
const whiteTextSx = { color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.6)' };

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
  const [consent, setConsent] = useState(!!initialConsent);

  const handleSubmit = () => {
    if (mode === 'preview') {
      onClose();
      return;
    }
    onSubmit(consent);
  };

  return (
    <AuthShell cardSx={{ maxHeight: { xs: '94vh', sm: '86vh' } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5 }}>
          <Typography
            sx={{ ...whiteTextSx, textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', mb: 0.5 }}
          >
            Welcome
          </Typography>
          <Typography variant="h5" sx={{ ...whiteTextSx, textAlign: 'center', fontWeight: 400, mb: 1.5 }}>
            Meet Your AI Concierge
          </Typography>
          <Typography variant="body2" sx={{ ...whiteTextSx, mb: 2 }}>
            Discover products you'll love.
          </Typography>

          <Box
            onClick={() => setConsent((c) => !c)}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              bgcolor: 'rgba(255,255,255,0.92)',
              borderRadius: 2,
              p: 1.5,
              mb: 2,
              cursor: 'pointer',
            }}
          >
            <Checkbox
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              sx={{ p: 0, mr: 1.5, mt: 0.25 }}
            />
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              I agree to let the AI Concierge of this app learn from my scans, favorites, and browsing
              history to personalize my experience.
            </Typography>
          </Box>

          <Typography variant="subtitle1" sx={{ ...whiteTextSx, fontWeight: 600, mt: 1, mb: 0.5 }}>
            Scan the products you love.
          </Typography>
          <Typography variant="body2" sx={{ ...whiteTextSx, mb: 1.5 }}>
            Your AI Concierge learns your preferences and recommends products you'll love—across brands.
          </Typography>
          <Typography variant="body2" sx={{ ...whiteTextSx, mb: 1.5 }}>
            Your preferences and scan history may also be shared with participating brands and retailers
            to deliver more relevant recommendations and help improve products and services.
          </Typography>
          <Typography variant="body2" sx={whiteTextSx}>
            Your profile cannot be used to identify you personally. Your scans and preferences are linked
            only to your in-app profile—not to your real identity.
          </Typography>

          {mode === 'preview' && (
            <Typography variant="body2" sx={{ ...whiteTextSx, fontStyle: 'italic', mt: 1.5 }}>
              Sign in to save this preference to your account.
            </Typography>
          )}

          {!!apiError && (
            <Box sx={{ bgcolor: 'rgba(253,236,236,0.95)', borderRadius: 2, p: 1.5, mt: 2 }}>
              <Typography variant="body2" sx={{ color: 'error.main' }}>
                {apiError}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ flexShrink: 0, pt: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={!!saving}
            sx={{ textTransform: 'none', fontWeight: 400, py: 1.1, borderRadius: 2 }}
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
