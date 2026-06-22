import React from 'react';
import { Box, Button, MenuItem, TextField, Typography } from '@mui/material';
import desktopBgImage from '../../assets/background.png';
import mobileBgImage from '../../assets/background-mobile.png';
import yometelLogo from '../../assets/logo-y.png';

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

const AuthPage = ({
  isRegister,
  name,
  setName,
  password,
  setPassword,
  registerData,
  setRegisterData,
  onLogin,
  onRegister,
  setIsRegister,
  onGoogleLogin,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegister) {
      onRegister(registerData);
    } else {
      onLogin();
    }
  };

  return (
    <Box
      sx={{
        width: '100vw',
        maxWidth: '100vw',
        height: '100dvh',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: { xs: 'center', md: 'flex-end' },
        pr: { xs: 0, md: '10vw', lg: '14vw' },
        boxSizing: 'border-box',
        overflow: 'hidden',
        backgroundImage: {
          xs: `url(${mobileBgImage})`,
          md: `url(${desktopBgImage})`,
        },
        backgroundSize: '100vw 100dvh',
        backgroundPosition: {
          xs: 'center center',
          md: 'left center',
        },
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Auth card */}
      <Box
        sx={{
          width: 360,
          maxWidth: '90vw',
          // Cap the card height so the long Sign Up form scrolls inside it while
          // the logo (top) and the action buttons (bottom) stay pinned.
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: '#f3f4f6',
          border: '1px solid',
          borderColor: 'primary.main',
          borderRadius: 3,
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          px: 4,
          py: 4.5,
        }}
      >
        {/* Yometel wordmark (pinned) */}
        <Box sx={{ textAlign: 'center', mb: 4, flexShrink: 0 }}>
          <Box
            component="img"
            src={yometelLogo}
            alt="Yometel"
            sx={{ width: 96, height: 96, display: 'inline-block' }}
          />
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Scrollable field area */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              pr: 0.5,
            }}
          >
          <TextField
            placeholder="Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          {isRegister && (
            <>
              <TextField
                placeholder="Email"
                type="email"
                value={registerData.email}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, email: e.target.value }))
                }
                required
                fullWidth
                sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                placeholder="First Name"
                value={registerData.firstName}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, firstName: e.target.value }))
                }
                required
                fullWidth
                sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                placeholder="Last Name"
                value={registerData.lastName}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, lastName: e.target.value }))
                }
                required
                fullWidth
                sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                placeholder="Street"
                value={registerData.addressStreet}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, addressStreet: e.target.value }))
                }
                required
                fullWidth
                sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                placeholder="City"
                value={registerData.addressCity}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, addressCity: e.target.value }))
                }
                required
                fullWidth
                sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                placeholder="State"
                value={registerData.addressState}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, addressState: e.target.value }))
                }
                required
                fullWidth
                sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                placeholder="Zip Code"
                value={registerData.addressZipCode}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, addressZipCode: e.target.value }))
                }
                required
                fullWidth
                sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                placeholder="Country"
                value={registerData.addressCountry}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, addressCountry: e.target.value }))
                }
                required
                fullWidth
                sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                placeholder="Phone Number"
                value={registerData.phoneNumber}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, phoneNumber: e.target.value }))
                }
                required
                fullWidth
                sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                select
                label="Gender"
                value={registerData.gender}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, gender: e.target.value }))
                }
                required
                fullWidth
                sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </TextField>
              <TextField
                label="Date of Birth"
                type="date"
                value={registerData.dateOfBirth}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, dateOfBirth: e.target.value }))
                }
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
                sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </>
          )}

          <TextField
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          </Box>

          {/* Pinned action area — always visible below the scrolling fields */}
          <Box
            sx={{
              flexShrink: 0,
              pt: 2.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                textTransform: 'none',
                fontWeight: 400,
                py: 1.1,
                borderRadius: 2,
              }}
            >
              {isRegister ? 'Sign Up' : 'Sign in'}
            </Button>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<GoogleIcon />}
              onClick={onGoogleLogin}
              sx={{
                textTransform: 'none',
                fontWeight: 400,
                py: 1.1,
                borderRadius: 2,
                bgcolor: '#fff',
                color: 'text.primary',
                borderColor: '#d9dce1',
                '&:hover': { bgcolor: '#fafafa', borderColor: '#c4c8cf' },
              }}
            >
              Continue with Google
            </Button>

            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Typography
                component="span"
                onClick={() => setIsRegister(!isRegister)}
                sx={{
                  color: 'primary.main',
                  fontWeight: 400,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {isRegister
                  ? 'Already have an account ? Sign in'
                  : "Don't have an account ? Sign Up"}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AuthPage;
