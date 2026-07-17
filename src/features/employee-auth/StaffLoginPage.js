import React, { useState } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useEmployeeAuth } from './EmployeeAuthContext';
import AuthShell from '../../components/AuthShell';
import AudienceToggle from '../../components/AudienceToggle';

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } };

// Same visual shell as the consumer/brand AuthPage (background, tagline,
// logo, card frame) — only the card's inner content differs: a corporate
// email/OTP form instead of nickname/social buttons. See the client brief's
// requirement for a "dedicated Staff Login Screen... completely separated
// from the consumer flow" — separated in data/route, not in look-and-feel.
const StaffLoginPage = () => {
  const { requestOtp, verifyOtp } = useEmployeeAuth();
  const navigate = useNavigate();
  const [stage, setStage] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setBusy(true);
    setNotice('');
    const res = await requestOtp(trimmed);
    setBusy(false);
    if (!res.ok) {
      setNotice(res.message);
      return;
    }
    setNotice(res.message || 'Code sent — check your email.');
    setStage('code');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.trim().length !== 6) return;
    setBusy(true);
    setNotice('');
    const res = await verifyOtp(email.trim(), code.trim());
    setBusy(false);
    if (!res.ok) {
      setNotice(res.message);
    }
  };

  return (
    <AuthShell>
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, justifyContent: 'center', gap: 1.5 }}>
        <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', mb: 0.5 }}>
          Sign in with your corporate email
        </Typography>

        {stage === 'email' ? (
          <Box component="form" onSubmit={handleSendCode} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
              placeholder="you@company.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              fullWidth
              disabled={busy}
              sx={fieldSx}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={busy}
              sx={{ textTransform: 'none', fontWeight: 400, py: 1.1, borderRadius: 2 }}
            >
              {busy ? 'Sending…' : 'Send code'}
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleVerify} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Enter the 6-digit code sent to {email.trim()}
            </Typography>
            <TextField
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              autoFocus
              fullWidth
              disabled={busy}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6, style: { letterSpacing: 8, textAlign: 'center', fontSize: '1.3rem' } }}
              sx={fieldSx}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={busy || code.length !== 6}
              sx={{ textTransform: 'none', fontWeight: 400, py: 1.1, borderRadius: 2 }}
            >
              {busy ? 'Verifying…' : 'Verify'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                component="span"
                onClick={() => { setStage('email'); setCode(''); setNotice(''); }}
                sx={{ color: 'primary.main', fontWeight: 400, fontSize: '0.95rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              >
                Use a different email
              </Typography>
            </Box>
          </Box>
        )}

        {!!notice && (
          <Typography role="status" variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
            {notice}
          </Typography>
        )}

        <AudienceToggle value="staff" onSelectConsumer={() => navigate('/')} onSelectStaff={() => {}} />
      </Box>
    </AuthShell>
  );
};

export default StaffLoginPage;
