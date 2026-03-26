import React from 'react';
import { Box, Button, MenuItem, TextField, Typography } from '@mui/material';
import desktopBgImage from '../../assets/background.png';
import mobileBgImage from '../../assets/background-mobile.png';
import yometelLogo from '../../assets/yometel-logo.png';

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
          width: 380,
          maxWidth: '90vw',
          bgcolor: 'rgba(255,255,255,0.98)',
          borderRadius: 2,
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
          px: 5,
          py: 4,
        }}
      >
        {/* Logo */}
        {/* <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <img
            src={yometelLogo}
            alt="Yometel"
            style={{ maxWidth: '75%', height: 'auto' }}
          />
        </Box> */}

        <Typography
          variant="h6"
          sx={{ fontWeight: 600, mb: 2, textAlign: 'left' }}
        >
          {isRegister ? 'Create Account' : 'Sign In'}
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
        >
          <TextField
            label="Username"
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />

          {isRegister && (
            <>
              <TextField
                label="Email"
                type="email"
                size="small"
                value={registerData.email}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, email: e.target.value }))
                }
                required
                fullWidth
              />
              <TextField
                label="First Name"
                size="small"
                value={registerData.firstName}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, firstName: e.target.value }))
                }
                required
                fullWidth
              />
              <TextField
                label="Last Name"
                size="small"
                value={registerData.lastName}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, lastName: e.target.value }))
                }
                required
                fullWidth
              />
              <TextField
                label="Street"
                size="small"
                value={registerData.addressStreet}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, addressStreet: e.target.value }))
                }
                required
                fullWidth
              />
              <TextField
                label="City"
                size="small"
                value={registerData.addressCity}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, addressCity: e.target.value }))
                }
                required
                fullWidth
              />
              <TextField
                label="State"
                size="small"
                value={registerData.addressState}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, addressState: e.target.value }))
                }
                required
                fullWidth
              />
              <TextField
                label="Zip Code"
                size="small"
                value={registerData.addressZipCode}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, addressZipCode: e.target.value }))
                }
                required
                fullWidth
              />
              <TextField
                label="Country"
                size="small"
                value={registerData.addressCountry}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, addressCountry: e.target.value }))
                }
                required
                fullWidth
              />
              <TextField
                label="Phone Number"
                size="small"
                value={registerData.phoneNumber}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, phoneNumber: e.target.value }))
                }
                required
                fullWidth
              />
              <TextField
                select
                label="Gender"
                size="small"
                value={registerData.gender}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, gender: e.target.value }))
                }
                required
                fullWidth
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </TextField>
              <TextField
                label="Date of Birth"
                type="date"
                size="small"
                value={registerData.dateOfBirth}
                onChange={(e) =>
                  setRegisterData((prev) => ({ ...prev, dateOfBirth: e.target.value }))
                }
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}

          <TextField
            label="Password"
            type="password"
            size="small"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />

          {!isRegister && (
            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                mb: 0,
                color: 'primary.main',
                cursor: 'pointer',
                width: 'fit-content',
              }}
            >
              Forgot your password?
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              mt: 2,
              textTransform: 'none',
              fontWeight: 600,
              py: 1,
              borderRadius: 1,
            }}
          >
            {isRegister ? 'Sign Up' : 'Sign In'}
          </Button>

          <Button
            variant="text"
            fullWidth
            onClick={() => setIsRegister(!isRegister)}
            sx={{ textTransform: 'none', mt: 1 }}
          >
            {isRegister
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </Button>
        </Box>

        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 3,
            color: 'text.secondary',
          }}
        >
          Copyright © {new Date().getFullYear()} Yometel. All rights
          reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthPage;

