import React, { useEffect, useState } from 'react';
import { Box, Button, MenuItem, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AppleIcon from '@mui/icons-material/Apple';
import { useGoogleAuth } from '../../features/auth/useGoogleAuth';
import { useAppleAuth } from '../../features/auth/useAppleAuth';
import AuthShell from '../AuthShell';
import AudienceToggle from '../AudienceToggle';
import yometelLogoWhite from '../../assets/yometel-logo-white.png';

// Monochrome Google "G" mark (Simple Icons, CC0) — white so it reads against
// this button's black background (was the official 4-color "G" on white).
// Sized to fit inside the compact Send-code-height buttons (see
// SMALL_CONTROL_HEIGHT) without crowding them.
const GoogleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#ffffff"
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
    />
  </svg>
);

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } };

// Smaller boxes/text for the sign-in/sign-up view specifically — the
// profile-completion form (which also uses `fieldSx`) is unaffected.
// Shared fixed height so the email field, code field, Send code/Verify
// button, and the Google/Apple buttons all line up instead of the buttons'
// own vertical padding making them a few px taller/shorter than the inputs.
const COMPACT_CONTROL_HEIGHT = 40;
// 2/3 of COMPACT_CONTROL_HEIGHT — every control on this view (email field,
// code field, Send code/Verify button, Google/Apple buttons) uses this
// smaller height now.
const SMALL_CONTROL_HEIGHT = Math.round((COMPACT_CONTROL_HEIGHT * 2) / 3);
const smallFieldSx = {
  ...fieldSx,
  '& .MuiOutlinedInput-root': { ...fieldSx['& .MuiOutlinedInput-root'], height: SMALL_CONTROL_HEIGHT },
  // The code field overrides this via its own `inputProps.style` (inline
  // style wins over this sx-generated class), so this only really governs
  // the email field's text size.
  '& .MuiOutlinedInput-input': { padding: '4px 14px', fontSize: '0.85rem' },
};
const compactButtonSx = {
  textTransform: 'none',
  fontWeight: 400,
  fontSize: '0.85rem',
  height: SMALL_CONTROL_HEIGHT,
  minHeight: SMALL_CONTROL_HEIGHT,
  py: 0,
  borderRadius: 2,
};
const compactLinkSx = { fontWeight: 400, fontSize: '0.8rem' };

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
  onOpenPrivacyPreferences,
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
      // No "Code sent" success notice here — the code-entry step's own
      // "Enter the 6-digit code sent to {email}" line already says this,
      // so a separate notice below the form was just redundant.
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
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
        <Box sx={{ textAlign: 'center', mb: 2, flexShrink: 0 }}>
          <Box
            component="img"
            src={yometelLogoWhite}
            alt="Yometel"
            sx={{ width: { xs: 130, sm: 160 }, height: 'auto', display: 'inline-block' }}
          />
        </Box>
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
                  size="small"
                  sx={smallFieldSx}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={otpBusy}
                  sx={compactButtonSx}
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
                <Typography variant="body2" sx={{ ...whiteTextSx, fontSize: '0.85rem' }}>
                  Enter the 6-digit code sent to {otpEmail}
                </Typography>
                <TextField
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoFocus
                  fullWidth
                  size="small"
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    maxLength: 6,
                    style: { letterSpacing: 6, textAlign: 'center', fontSize: '1.1rem' },
                  }}
                  sx={smallFieldSx}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={otpBusy || otpCode.length !== 6}
                  sx={compactButtonSx}
                >
                  {otpBusy ? 'Verifying…' : 'Verify'}
                </Button>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <Typography
                    component="span"
                    onClick={resendCooldown > 0 || otpBusy ? undefined : handleResendCode}
                    sx={{
                      ...whiteTextSx,
                      ...compactLinkSx,
                      color: resendCooldown > 0 || otpBusy ? 'rgba(255,255,255,0.6)' : '#fff',
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
                      ...compactLinkSx,
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
                sx={{ textAlign: 'center', fontSize: '0.8rem', ...whiteTextSx }}
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
                    ...compactButtonSx,
                    px: 1,
                    bgcolor: '#000',
                    color: '#fff',
                    borderColor: '#000',
                    '&:hover': { bgcolor: '#222', borderColor: '#222' },
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
                startIcon={<AppleIcon sx={{ fontSize: 14, color: '#000' }} />}
                sx={{
                  ...compactButtonSx,
                  flex: 1,
                  px: 1,
                  bgcolor: '#fff',
                  color: '#000',
                  border: '1px solid #d9dce1',
                  '&:hover': { bgcolor: '#fafafa', borderColor: '#c4c8cf' },
                }}
              >
                Apple
              </Button>
            </Box>

            {/* Trailing links clustered tightly together (their own small
                gap, not the parent's larger gap:1.5) so they read as one
                "auxiliary links" group instead of three widely-spaced rows. */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              {/* Consumer/Staff and Sign In/Sign Up each show only the single
                  relevant question — one tap to switch, no pill toggle. */}
              <AudienceToggle value="consumer" onSelectConsumer={() => {}} onSelectStaff={() => navigate('/staff')} />

              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  component="span"
                  onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); setOtpNotice(''); }}
                  sx={{
                    ...whiteTextSx,
                    ...compactLinkSx,
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {authMode === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
                </Typography>
              </Box>

              {/* GDPR: lets a user reopen the AI Concierge consent screen at
                  any time to review or change their choice — see
                  AiConciergeConsentPage, opened via pages/index.js's
                  showPrivacyPreferences state. */}
              {onOpenPrivacyPreferences && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    component="span"
                    onClick={onOpenPrivacyPreferences}
                    sx={{
                      ...whiteTextSx,
                      fontWeight: 400,
                      fontSize: '0.85rem',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    Privacy Preferences
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
    </AuthShell>
  );
};

export default AuthPage;
