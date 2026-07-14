import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { useEmployeeAuth } from './EmployeeAuthContext';

// Web counterpart to app/src/screens/StaffLoginScreen.tsx. Same two-stage
// email/OTP flow, same /employee-auth endpoints, same "admin must provision
// you first" backend behavior — just rendered for a browser instead of RN.
const StaffLoginPage = () => {
  const { requestOtp, verifyOtp } = useEmployeeAuth();
  const [stage, setStage] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    setError('');
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid corporate email address.');
      return;
    }
    setBusy(true);
    const res = await requestOtp(trimmed);
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setStage('code');
  };

  const handleVerify = async () => {
    setError('');
    if (code.trim().length !== 6) {
      setError('Enter the 6-digit code we emailed you.');
      return;
    }
    setBusy(true);
    const res = await verifyOtp(email.trim(), code.trim());
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#e8ecf0' }}>
      <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 4, width: '100%', maxWidth: 380, boxShadow: 3 }}>
        <Typography variant="h6" sx={{ mb: 0.5, textAlign: 'center' }}>Staff Login</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Sign in with your corporate email
        </Typography>

        {stage === 'email' ? (
          <>
            <TextField
              fullWidth
              size="small"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              sx={{ mb: 2 }}
            />
            <Button fullWidth variant="contained" onClick={handleSendCode} disabled={busy}>
              {busy ? <CircularProgress size={22} color="inherit" /> : 'Send code'}
            </Button>
          </>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Enter the 6-digit code sent to {email.trim()}
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              disabled={busy}
              sx={{ mb: 2 }}
            />
            <Button fullWidth variant="contained" onClick={handleVerify} disabled={busy} sx={{ mb: 1 }}>
              {busy ? <CircularProgress size={22} color="inherit" /> : 'Verify'}
            </Button>
            <Button fullWidth onClick={() => { setStage('email'); setCode(''); setError(''); }} disabled={busy}>
              Use a different email
            </Button>
          </>
        )}

        {!!error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Box>
    </Box>
  );
};

export default StaffLoginPage;
