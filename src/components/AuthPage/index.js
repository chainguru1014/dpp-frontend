import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Divider, Grid, MenuItem, TextField, Typography } from '@mui/material';
import AppleIcon from '@mui/icons-material/Apple';
import { useGoogleAuth } from '../../features/auth/useGoogleAuth';
import { useAppleAuth } from '../../features/auth/useAppleAuth';
import AuthShell from '../AuthShell';
import yometelLogoWhite from '../../assets/yometel-logo-white.png';
import { compactMediaQuery } from '../../theme';
import { notifyError } from '../../utils/feedbackBus';

// Colours on the see-through sign-in card: the brand blue (#2f80c8) for
// text, labels, icons and button text; the logo is the white version.
const AUTH_BLUE = '#2f80c8';
const AUTH_TEXT = AUTH_BLUE;
const AUTH_MUTED = AUTH_BLUE;
// A soft white glow keeps the blue text readable over darker photos.
const textShadow = '0 0 2px #ffffff, 0 0 4px #ffffff, 0 0 10px rgba(255,255,255,0.85)';
const onGlass = { color: AUTH_TEXT, textShadow };

// Google "G" mark (Simple Icons, CC0) in the app's navy.
const GoogleIcon = ({ color = AUTH_BLUE }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill={color}
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
    />
  </svg>
);

// Every control on the sign-in card is at least 48px tall with 16px+ text —
// easy to read and to tap on an iPad (they used to be 27px with 13px text).
const CONTROL_HEIGHT = 50;
const fieldSx = {
  '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff', color: AUTH_BLUE },
  '& .MuiInputLabel-root': { color: AUTH_BLUE },
  '& .MuiInputLabel-root.Mui-focused': { color: AUTH_BLUE },
  '& .MuiInputLabel-shrink': { bgcolor: '#fff', px: 0.75, borderRadius: 1 },
  '& .MuiSvgIcon-root': { color: AUTH_BLUE },
  '& .MuiFormHelperText-root': { ...onGlass },
};
const bigFieldSx = {
  ...fieldSx,
  '& .MuiOutlinedInput-root': { ...fieldSx['& .MuiOutlinedInput-root'], minHeight: CONTROL_HEIGHT, fontSize: '1.05rem' },
};
// The laptop density rule in theme.js would shrink these to 40px; the
// sign-in screen keeps its large controls everywhere.
const bigButtonSx = { minHeight: CONTROL_HEIGHT, fontSize: '1.05rem', borderRadius: 2, [compactMediaQuery]: { minHeight: CONTROL_HEIGHT, fontSize: '1.05rem' } };
const outlineButtonSx = {
  ...bigButtonSx,
  bgcolor: '#fff',
  color: AUTH_BLUE,
  border: '1px solid #c9d2dd',
  '&:hover': { bgcolor: '#f5f8fb', borderColor: '#9fb0c3' },
};

// Must match the backend's per-email resend cooldown (see authController.otpRequest).
const RESEND_COOLDOWN_SECONDS = 60;

const AuthPage = ({
  needsProfileCompletion,
  registerData,
  setRegisterData,
  accountEmail,
  onCompleteProfile,
  onCancelProfileCompletion,
  onGoogleCredential,
  onAppleCredential,
  onRequestOtp,
  onVerifyOtp,
  onOpenPrivacyPreferences,
  activeSlide,
}) => {
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'
  const [emailStep, setEmailStep] = useState('email'); // 'email' | 'code'
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpNotice, setOtpNotice] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const { buttonContainerRef: googleButtonRef } = useGoogleAuth(onGoogleCredential);
  const { signIn: appleSignIn } = useAppleAuth();

  // The email was just verified — pre-fill it on the details form.
  useEffect(() => {
    if (needsProfileCompletion && accountEmail && !registerData.email) {
      setRegisterData((prev) => ({ ...prev, email: accountEmail }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsProfileCompletion, accountEmail]);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const sendOtp = async (email) => {
    setOtpBusy(true);
    setOtpNotice('');
    const res = await onRequestOtp(email, authMode);
    setOtpBusy(false);
    if (res?.ok) {
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } else {
      setOtpNotice(res?.message || 'We could not send the code. Please check the email address and try again.');
    }
    return res;
  };

  const handleAppleClick = async () => {
    try {
      const { identityToken, user } = await appleSignIn();
      onAppleCredential?.(identityToken, user);
    } catch (err) {
      notifyError(err?.message || 'Apple sign-in did not work. Please try again or use your email.');
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

  // Takes the code explicitly so the auto-verify-on-6-digits path can call it
  // with the just-typed value instead of racing React's state update.
  const verifyCode = async (code) => {
    if (code.length !== 6) return;
    setOtpBusy(true);
    setOtpNotice('');
    const res = await onVerifyOtp(otpEmail.trim(), code, authMode);
    setOtpBusy(false);
    if (!res?.ok) {
      setOtpNotice(res?.message || 'That code is not right or has expired. Please check it, or ask for a new code.');
    }
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    verifyCode(otpCode.trim());
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    onCompleteProfile(registerData);
  };

  const setReg = (key) => (e) => setRegisterData((prev) => ({ ...prev, [key]: e.target.value }));

  const logo = (
    <Box sx={{ textAlign: 'center', mb: 2.5, flexShrink: 0 }}>
      <Box component="img" src={yometelLogoWhite} alt="Yometel" sx={{ width: { xs: 140, sm: 170 }, height: 'auto', display: 'inline-block' }} />
    </Box>
  );

  // ---------- Profile details after a first sign-up ----------
  if (needsProfileCompletion) {
    return (
      <AuthShell activeSlide={activeSlide} cardSx={{ width: { xs: '100%', sm: 560 } }}>
        {logo}
        <Box component="form" onSubmit={handleProfileSubmit} sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <Typography variant="h5" component="h1" sx={{ mb: 0.5, ...onGlass }}>Your details</Typography>
          <Typography color={AUTH_MUTED} sx={{ textShadow,  mb: 2 }}>
            Almost done. Please fill in these details to finish setting up your account. Fields marked * are required.
          </Typography>

          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5, pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField label="Username" required fullWidth value={registerData.name} onChange={setReg('name')}
                  helperText="Shown to others instead of your full name." sx={fieldSx} autoFocus />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="First name" required fullWidth value={registerData.firstName} onChange={setReg('firstName')} sx={fieldSx} autoComplete="given-name" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Last name" required fullWidth value={registerData.lastName} onChange={setReg('lastName')} sx={fieldSx} autoComplete="family-name" />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Email" type="email" required fullWidth value={registerData.email} onChange={setReg('email')} sx={fieldSx}
                  InputProps={{ readOnly: !!accountEmail }} helperText={accountEmail ? 'The email you signed up with.' : undefined} autoComplete="email" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Phone number" required fullWidth value={registerData.phoneNumber} onChange={setReg('phoneNumber')} sx={fieldSx} autoComplete="tel" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Date of birth" type="date" required fullWidth value={registerData.dateOfBirth} onChange={setReg('dateOfBirth')}
                  InputLabelProps={{ shrink: true }} sx={fieldSx} autoComplete="bday" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Gender" required fullWidth value={registerData.gender} onChange={setReg('gender')} sx={fieldSx}>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="other">Other / prefer not to say</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 0.5, '&::before, &::after': { borderColor: 'rgba(47,128,200,0.5)' } }}><Typography variant="body2" sx={{ color: AUTH_MUTED, textShadow }}>Address</Typography></Divider>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Street and house number" required fullWidth value={registerData.addressStreet} onChange={setReg('addressStreet')} sx={fieldSx} autoComplete="street-address" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="City" required fullWidth value={registerData.addressCity} onChange={setReg('addressCity')} sx={fieldSx} autoComplete="address-level2" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="State / prefecture" required fullWidth value={registerData.addressState} onChange={setReg('addressState')} sx={fieldSx} autoComplete="address-level1" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Postal code" required fullWidth value={registerData.addressZipCode} onChange={setReg('addressZipCode')} sx={fieldSx} autoComplete="postal-code" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Country" required fullWidth value={registerData.addressCountry} onChange={setReg('addressCountry')} sx={fieldSx} autoComplete="country-name" />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ flexShrink: 0, pt: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button type="submit" variant="contained" fullWidth sx={bigButtonSx}>
              Finish setting up my account
            </Button>
            {onCancelProfileCompletion && (
              <Button onClick={onCancelProfileCompletion} fullWidth sx={{ ...onGlass, '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }}>
                Not you? Sign out
              </Button>
            )}
          </Box>
        </Box>
      </AuthShell>
    );
  }

  // ---------- Sign in / create account ----------
  const isSignup = authMode === 'signup';
  return (
    <AuthShell activeSlide={activeSlide}>
      {logo}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {emailStep === 'email' ? (
          <>
            <Box>
              <Typography variant="h5" component="h1" sx={{ textAlign: 'center', ...onGlass }}>
                {isSignup ? 'Create an account' : 'Sign in'}
              </Typography>
              <Typography color={AUTH_MUTED} sx={{ textShadow,  textAlign: 'center', mt: 0.75 }}>
                Enter your email. We will send you a 6-digit code, so you don&apos;t need a password.
              </Typography>
            </Box>
            <Box component="form" onSubmit={handleSendCode} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <TextField
                id="signin-email"
                label="Email address"
                type="email"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                required
                autoFocus
                fullWidth
                autoComplete="email"
                sx={bigFieldSx}
              />
              <Button type="submit" variant="contained" fullWidth disabled={otpBusy} sx={bigButtonSx}>
                {otpBusy ? 'Sending code…' : 'Email me a code'}
              </Button>
            </Box>

            {otpNotice && <Alert severity="error" role="alert">{otpNotice}</Alert>}

            <Divider sx={{ '&::before, &::after': { borderColor: 'rgba(47,128,200,0.5)' } }}><Typography variant="body2" sx={{ color: AUTH_MUTED, textShadow }}>or</Typography></Divider>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {/* Custom-styled Google button with the real (invisible) Google
                  button stacked on top — see useGoogleAuth for why. */}
              <Box sx={{ position: 'relative' }}>
                <Button fullWidth startIcon={<GoogleIcon />} tabIndex={-1} aria-hidden="true" sx={outlineButtonSx}>
                  Continue with Google
                </Button>
                <Box
                  ref={googleButtonRef}
                  sx={{ position: 'absolute', inset: 0, zIndex: 1, opacity: 0, overflow: 'hidden', cursor: 'pointer' }}
                />
              </Box>
              <Button fullWidth onClick={handleAppleClick} startIcon={<AppleIcon sx={{ color: AUTH_BLUE }} />} sx={outlineButtonSx}>
                Continue with Apple
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <Typography sx={{ color: AUTH_MUTED, textShadow }}>
                {isSignup ? 'Already have an account?' : 'New here?'}
                <Button
                  onClick={() => { setAuthMode(isSignup ? 'signin' : 'signup'); setOtpNotice(''); }}
                  sx={{ minHeight: 40, ml: 0.5, px: 1, fontWeight: 700, ...onGlass, textDecoration: 'underline', '&:hover': { bgcolor: 'rgba(255,255,255,0.35)', textDecoration: 'underline' } }}
                >
                  {isSignup ? 'Sign in' : 'Create an account'}
                </Button>
              </Typography>
              {onOpenPrivacyPreferences && (
                <Button onClick={onOpenPrivacyPreferences} sx={{ minHeight: 40, ...onGlass, textDecoration: 'underline', '&:hover': { bgcolor: 'rgba(255,255,255,0.35)', textDecoration: 'underline' } }}>
                  Privacy preferences
                </Button>
              )}
            </Box>
          </>
        ) : (
          <>
            <Box>
              <Typography variant="h5" component="h1" sx={{ textAlign: 'center', ...onGlass }}>Check your email</Typography>
              <Typography color={AUTH_MUTED} sx={{ textShadow,  textAlign: 'center', mt: 0.75 }}>
                We sent a 6-digit code to <Box component="strong" sx={{ color: AUTH_TEXT, wordBreak: 'break-all' }}>{otpEmail}</Box>. Type it below.
              </Typography>
            </Box>
            <Box component="form" onSubmit={handleVerifyCode} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <TextField
                id="signin-code"
                label="6-digit code"
                value={otpCode}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpCode(digits);
                  // Auto-submit once all 6 digits are in; the button stays as
                  // an explicit fallback.
                  if (digits.length === 6 && !otpBusy) verifyCode(digits);
                }}
                required
                autoFocus
                fullWidth
                autoComplete="one-time-code"
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  maxLength: 6,
                  style: { letterSpacing: 10, textAlign: 'center', fontSize: '1.6rem', fontWeight: 600 },
                }}
                sx={bigFieldSx}
              />
              <Button type="submit" variant="contained" fullWidth disabled={otpBusy || otpCode.length !== 6} sx={bigButtonSx}>
                {otpBusy ? 'Checking…' : 'Sign in'}
              </Button>
            </Box>

            {otpNotice && <Alert severity="error" role="alert">{otpNotice}</Alert>}

            <Typography variant="body2" color={AUTH_MUTED} sx={{ textShadow,  textAlign: 'center' }}>
              No email? Check your spam folder, or ask for a new code.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" onClick={handleResendCode} disabled={resendCooldown > 0 || otpBusy} sx={{ ...bigButtonSx, ...outlineButtonSx }}>
                {resendCooldown > 0 ? `Send a new code (in ${resendCooldown} s)` : 'Send a new code'}
              </Button>
              <Button
                onClick={() => { setEmailStep('email'); setOtpCode(''); setOtpNotice(''); }}
                sx={{ minHeight: 44, ...onGlass, '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }}
              >
                Use a different email
              </Button>
            </Box>
          </>
        )}
      </Box>
    </AuthShell>
  );
};

export default AuthPage;
