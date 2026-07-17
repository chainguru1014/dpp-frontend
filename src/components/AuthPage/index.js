import React, { useEffect, useState } from 'react';
import { Box, Button, MenuItem, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AppleIcon from '@mui/icons-material/Apple';
import { useGoogleAuth } from '../../features/auth/useGoogleAuth';
import { useAppleAuth } from '../../features/auth/useAppleAuth';
import AuthShell from '../AuthShell';
import AudienceToggle from '../AudienceToggle';

// Multi-color Google "G" mark (rendered inline so no extra asset is needed).
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } };

// Card background is deliberately transparent (see AuthShell) so the forest
// photo shows through — any text sitting directly on it (not on a solid
// button/field surface) needs to be white with a shadow to stay legible
// against a busy, variable-brightness photo.
const whiteTextSx = { color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.6)' };

const AuthPage = ({
  needsProfileCompletion,
  registerData,
  setRegisterData,
  onCompleteProfile,
  onCancelProfileCompletion,
  onGoogleCredential,
  onAppleCredential,
  onRequestOtp,
  onVerifyOtp,
}) => {
  // OTP flow's own local UI state — nothing here needs to be lifted up, the
  // parent only cares once verification actually succeeds.
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'
  const [emailStep, setEmailStep] = useState('email'); // 'email' | 'code'
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpNotice, setOtpNotice] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const { buttonContainerRef: googleButtonRef } = useGoogleAuth(onGoogleCredential);
  const { signIn: appleSignIn } = useAppleAuth();

  // Counts the resend cooldown down to 0 once a code has been (re)sent.
  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Must match the backend's per-email resend cooldown (see authController.otpRequest) —
  // a shorter client cooldown would let users retry before the server accepts it, guaranteeing a 429.
  const RESEND_COOLDOWN_SECONDS = 60;

  const sendOtp = async (email) => {
    setOtpBusy(true);
    setOtpNotice('');
    const res = await onRequestOtp(email, authMode);
    setOtpBusy(false);
    if (res?.ok) {
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setOtpNotice(res.message || 'Code sent — check your email.');
    } else {
      setOtpNotice(res?.message || 'Failed to send code. Please try again.');
    }
    return res;
  };

  const handleAppleClick = async () => {
    try {
      const { identityToken, user } = await appleSignIn();
      onAppleCredential?.(identityToken, user);
    } catch (err) {
      alert(err?.message || 'Apple sign-in failed');
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    const email = otpEmail.trim();
    if (!email) return;
    const res = await sendOtp(email);
    if (res?.ok) setEmailStep('code');
  };

  const handleResendCode = async () => {
    if (otpBusy || resendCooldown > 0) return;
    await sendOtp(otpEmail.trim());
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const code = otpCode.trim();
    if (code.length !== 6) return;
    setOtpBusy(true);
    setOtpNotice('');
    const res = await onVerifyOtp(otpEmail.trim(), code, authMode);
    setOtpBusy(false);
    if (!res?.ok) {
      setOtpNotice(res?.message || 'Invalid or expired code. Please try again.');
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    onCompleteProfile(registerData);
  };

  const navigate = useNavigate();

  return (
    <AuthShell>
        {needsProfileCompletion ? (
          <Box
            component="form"
            onSubmit={handleProfileSubmit}
            sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
          >
            <Typography variant="body2" sx={{ mb: 1.5, flexShrink: 0, ...whiteTextSx }}>
              Just a few more details to finish setting up your account.
            </Typography>

            {/* Scrollable field area */}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 1.5, sm: 2 },
                pr: 0.5,
              }}
            >
              <TextField
                placeholder="Username"
                value={registerData.name}
                onChange={(e) => setRegisterData((prev) => ({ ...prev, name: e.target.value }))}
                required
                fullWidth
                sx={fieldSx}
              />
              <TextField
                placeholder="Email"
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData((prev) => ({ ...prev, email: e.target.value }))}
                required
                fullWidth
                sx={fieldSx}
              />
              <TextField
                placeholder="First Name"
                value={registerData.firstName}
                onChange={(e) => setRegisterData((prev) => ({ ...prev, firstName: e.target.value }))}
                required
                fullWidth
                sx={fieldSx}
              />
              <TextField
                placeholder="Last Name"
                value={registerData.lastName}
                onChange={(e) => setRegisterData((prev) => ({ ...prev, lastName: e.target.value }))}
                required
                fullWidth
                sx={fieldSx}
              />
              <TextField
                placeholder="Street"
                value={registerData.addressStreet}
                onChange={(e) => setRegisterData((prev) => ({ ...prev, addressStreet: e.target.value }))}
                required
                fullWidth
                sx={fieldSx}
              />
              <TextField
                placeholder="City"
                value={registerData.addressCity}
                onChange={(e) => setRegisterData((prev) => ({ ...prev, addressCity: e.target.value }))}
                required
                fullWidth
                sx={fieldSx}
              />
              <TextField
                placeholder="State"
                value={registerData.addressState}
                onChange={(e) => setRegisterData((prev) => ({ ...prev, addressState: e.target.value }))}
                required
                fullWidth
                sx={fieldSx}
              />
              <TextField
                placeholder="Zip Code"
                value={registerData.addressZipCode}
                onChange={(e) => setRegisterData((prev) => ({ ...prev, addressZipCode: e.target.value }))}
                required
                fullWidth
                sx={fieldSx}
              />
              <TextField
                placeholder="Country"
                value={registerData.addressCountry}
                onChange={(e) => setRegisterData((prev) => ({ ...prev, addressCountry: e.target.value }))}
                required
                fullWidth
                sx={fieldSx}
              />
              <TextField
                placeholder="Phone Number"
                value={registerData.phoneNumber}
                onChange={(e) => setRegisterData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                required
                fullWidth
                sx={fieldSx}
              />
              <TextField
                select
                label="Gender"
                value={registerData.gender}
                onChange={(e) => setRegisterData((prev) => ({ ...prev, gender: e.target.value }))}
                required
                fullWidth
                sx={fieldSx}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </TextField>
              <TextField
                label="Date of Birth"
                type="date"
                value={registerData.dateOfBirth}
                onChange={(e) => setRegisterData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />
            </Box>

            {/* Pinned action area — always visible below the scrolling fields */}
            <Box sx={{ flexShrink: 0, pt: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ textTransform: 'none', fontWeight: 400, py: 1.1, borderRadius: 2 }}
              >
                Complete Profile
              </Button>
              {onCancelProfileCompletion && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    component="span"
                    onClick={onCancelProfileCompletion}
                    sx={{
                      ...whiteTextSx,
                      fontWeight: 400,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    Not you? Sign out
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, justifyContent: 'center', gap: 1.5 }}>
            {emailStep === 'email' && (
              <Box
                component="form"
                onSubmit={handleSendCode}
                sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
              >
                <TextField
                  placeholder="Email"
                  type="email"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  required
                  autoFocus
                  fullWidth
                  sx={fieldSx}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={otpBusy}
                  sx={{ textTransform: 'none', fontWeight: 400, py: 1.1, borderRadius: 2 }}
                >
                  {otpBusy ? 'Sending…' : authMode === 'signup' ? 'Create account' : 'Send code'}
                </Button>
              </Box>
            )}

            {emailStep === 'code' && (
              <Box
                component="form"
                onSubmit={handleVerifyCode}
                sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
              >
                <Typography variant="body2" sx={whiteTextSx}>
                  Enter the 6-digit code sent to {otpEmail}
                </Typography>
                <TextField
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoFocus
                  fullWidth
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    maxLength: 6,
                    style: { letterSpacing: 8, textAlign: 'center', fontSize: '1.3rem' },
                  }}
                  sx={fieldSx}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={otpBusy || otpCode.length !== 6}
                  sx={{ textTransform: 'none', fontWeight: 400, py: 1.1, borderRadius: 2 }}
                >
                  {otpBusy ? 'Verifying…' : 'Verify'}
                </Button>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <Typography
                    component="span"
                    onClick={resendCooldown > 0 || otpBusy ? undefined : handleResendCode}
                    sx={{
                      ...whiteTextSx,
                      color: resendCooldown > 0 || otpBusy ? 'rgba(255,255,255,0.6)' : '#fff',
                      fontWeight: 400,
                      fontSize: '0.95rem',
                      cursor: resendCooldown > 0 || otpBusy ? 'default' : 'pointer',
                      '&:hover': resendCooldown > 0 || otpBusy ? undefined : { textDecoration: 'underline' },
                    }}
                  >
                    {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
                  </Typography>
                  <Typography
                    component="span"
                    onClick={() => {
                      setEmailStep('email');
                      setOtpCode('');
                      setOtpNotice('');
                    }}
                    sx={{
                      ...whiteTextSx,
                      fontWeight: 400,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    Use a different email
                  </Typography>
                </Box>
              </Box>
            )}

            {otpNotice && (
              <Typography
                role="status"
                variant="body2"
                sx={{ textAlign: 'center', ...whiteTextSx }}
              >
                {otpNotice}
              </Typography>
            )}

            {/* Google + Apple side by side, each half width. Google is a
                custom-styled button with the real (invisible) GIS button
                stacked on top — see useGoogleAuth for why. */}
            <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
              <Box sx={{ position: 'relative', flex: 1 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<GoogleIcon />}
                  tabIndex={-1}
                  aria-hidden="true"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 400,
                    py: 1.1,
                    px: 1,
                    borderRadius: 2,
                    bgcolor: '#fff',
                    color: 'text.primary',
                    borderColor: '#d9dce1',
                    '&:hover': { bgcolor: '#fafafa', borderColor: '#c4c8cf' },
                  }}
                >
                  Google
                </Button>
                <Box
                  ref={googleButtonRef}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1,
                    opacity: 0,
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                />
              </Box>

              {/* White background, app-blue label, black Apple glyph. */}
              <Button
                fullWidth
                onClick={handleAppleClick}
                startIcon={<AppleIcon sx={{ fontSize: 20, color: '#000' }} />}
                sx={{
                  flex: 1,
                  textTransform: 'none',
                  fontWeight: 400,
                  py: 1.1,
                  px: 1,
                  borderRadius: 2,
                  bgcolor: '#fff',
                  color: 'primary.main',
                  border: '1px solid #d9dce1',
                  '&:hover': { bgcolor: '#fafafa', borderColor: '#c4c8cf' },
                }}
              >
                Apple
              </Button>
            </Box>

            {/* Consumer/Staff and Sign In/Sign Up each show only the single
                relevant question — one tap to switch, no pill toggle. */}
            <AudienceToggle value="consumer" onSelectConsumer={() => {}} onSelectStaff={() => navigate('/staff')} />

            <Box sx={{ textAlign: 'center', mt: 0.5 }}>
              <Typography
                component="span"
                onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); setOtpNotice(''); }}
                sx={{
                  ...whiteTextSx,
                  fontWeight: 400,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {authMode === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </Typography>
            </Box>
          </Box>
        )}
    </AuthShell>
  );
};

export default AuthPage;
