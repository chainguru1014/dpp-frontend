import React, { useState } from 'react';
import { Box, Button, ButtonBase, Typography } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import lake from '../../assets/consent-lake.jpg';
import logo from '../../assets/yometel-logo-blue-clear.png';

// AI Concierge (client design 2026-11-24): a mountain-lake photo filling the
// screen and one white card in the middle — the logo, "Welcome / Meet Your
// AI Concierge", the four points, the agreement, I agree / I disagree and
// Continue. Nothing is chosen at first, so Continue waits for a choice.
//
// `mode: 'gate'` shows once after a shopper account's first sign-in; 'review'
// is the Privacy preferences link (with Cancel).
const NAVY = '#1d4f91';
const SERIF = 'Georgia, "Times New Roman", serif';

const FEATURES = [
  { icon: QrCodeScannerIcon, title: 'Personalized just for you', text: 'Your AI Concierge learns from your scans, favorites, and browsing habits to recommend products and brands you’ll love.' },
  { icon: VerifiedUserOutlinedIcon, title: 'Your privacy is our priority', text: 'Your real identity is never saved. Your scans and preferences are linked only to your unique profile, and to what you ask or need help.' },
  { icon: GroupsOutlinedIcon, title: 'Smarter recommendations', text: 'From styling trends to care tips, you’ll receive relevant information about your closet and preferences to improve product recommendations and services.' },
  { icon: LockOutlinedIcon, title: 'You’re in control', text: 'You can update your preferences and manage data permissions anytime in your account settings.' },
];

const Rule = ({ diamond }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1.75 }}>
    <Box sx={{ flex: 1, height: '1px', bgcolor: '#d8dee8' }} />
    {diamond && <Box sx={{ width: 6, height: 6, transform: 'rotate(45deg)', bgcolor: '#9aaccb' }} />}
    {diamond && <Box sx={{ flex: 1, height: '1px', bgcolor: '#d8dee8' }} />}
  </Box>
);

const AiConciergeConsentPage = ({ mode, initialConsent, onSubmit, onClose, saving, apiError }) => {
  const [consent, setConsent] = useState(initialConsent != null ? !!initialConsent : null);
  const choice = (value, label) => {
    const on = consent === value;
    return (
      <ButtonBase
        onClick={() => setConsent(value)}
        role="radio"
        aria-checked={on}
        sx={{
          flex: 1, height: 46, borderRadius: 23, fontSize: 16,
          border: '2px solid', borderColor: NAVY,
          bgcolor: on ? NAVY : '#fff', color: on ? '#fff' : '#7a8698',
          transition: 'background-color 120ms',
        }}
      >
        {label}
      </ButtonBase>
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundImage: `url(${lake})`, backgroundSize: 'cover', backgroundPosition: 'center', p: { xs: 1.5, sm: 3 },
      }}
    >
      <Box
        sx={{
          width: '100%', maxWidth: 620, bgcolor: 'rgba(255,255,255,0.97)', borderRadius: '28px',
          boxShadow: '0 24px 60px rgba(10,30,60,0.28)', px: { xs: 2.5, sm: 5 }, py: { xs: 3, sm: 3.5 },
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Box component="img" src={logo} alt="Yometel" sx={{ height: 42, display: 'inline-block' }} />
          <Typography sx={{ mt: 1.25, letterSpacing: 3, fontSize: 14, color: NAVY }}>WELCOME</Typography>
          <Typography component="h1" sx={{ fontFamily: SERIF, fontSize: { xs: 28, sm: 36 }, color: NAVY, lineHeight: 1.2 }}>
            {mode === 'review' ? 'Privacy Preferences' : 'Meet Your AI Concierge'}
          </Typography>
        </Box>
        <Rule diamond />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <Box key={title} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Box sx={{ width: 50, height: 50, flexShrink: 0, borderRadius: '50%', bgcolor: '#e8eff8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon sx={{ fontSize: 26, color: NAVY }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#10233f' }}>{title}</Typography>
                <Typography sx={{ fontSize: 14, lineHeight: 1.45, color: '#2b3a52' }}>{text}</Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Rule />
        <Typography sx={{ textAlign: 'center', fontSize: 14.5, color: '#1c2b44', px: { sm: 3 } }}>
          I agree to let the AI Concierge of this app learn from my scans, favorites, and browsing history to personalize my experience.
        </Typography>

        <Box role="radiogroup" aria-label="Your choice" sx={{ display: 'flex', gap: 2, mt: 2 }}>
          {choice(true, 'I agree')}
          {choice(false, 'I disagree')}
        </Box>
        {!!apiError && <Typography color="error" sx={{ mt: 1.5, textAlign: 'center' }} role="alert">{apiError}</Typography>}
        <Button
          variant="contained"
          fullWidth
          onClick={() => onSubmit(consent)}
          disabled={!!saving || consent === null}
          sx={{ mt: 1.5, height: 46, borderRadius: 23, fontSize: 16, bgcolor: NAVY, '&:hover': { bgcolor: '#173f74' } }}
        >
          {saving ? 'Saving…' : 'Continue'}
        </Button>
        {mode === 'review' && (
          <Button onClick={onClose} fullWidth sx={{ mt: 1, color: NAVY }}>Cancel</Button>
        )}
      </Box>
    </Box>
  );
};

export default AiConciergeConsentPage;
