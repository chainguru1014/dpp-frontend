import React from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import bgImage from '../../assets/bg.jpg';
// TODO: Replace this path/name with your actual Yometel logo file in src/assets
import yometelLogo from '../../assets/yometel-logo.png';

const AuthPage = ({
  isRegister,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  onLogin,
  onRegister,
  setIsRegister,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegister) {
      onRegister();
    } else {
      onLogin();
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundImage: `url(${bgImage})`,
        backgroundColor: 'white',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left green accent similar to reference UI */}
      <Box
        sx={{
          position: 'absolute',
          left: '-10%',
          top: 0,
          bottom: 0,
          width: '40%',
          background:
            'linear-gradient(135deg, #00c48c 0%, #00b07d 40%, #00a16f 100%)',
          clipPath: 'polygon(0 0, 100% 0, 60% 100%, 0% 100%)',
          opacity: 0.95,
        }}
      />

      {/* Semi-transparent dark overlay on background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: 'rgba(0,0,0,0.45)',
        }}
      />

      {/* Auth card */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
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
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <img
            src={yometelLogo}
            alt="Yometel"
            style={{ maxWidth: '75%', height: 'auto' }}
          />
        </Box>

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
            <TextField
              label="Email"
              type="email"
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
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

