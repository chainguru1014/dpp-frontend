import React from 'react';
import { Box, Typography } from '@mui/material';

// Clean pill-style "who are you" switch shown at the top of both sign-in
// cards (consumer/brand AuthPage and StaffLoginPage) so switching between
// them is a single obvious tap instead of a buried text link. `onSelectCompany`
// is optional — StaffLoginPage doesn't offer a company option, only AuthPage does.
const AudienceToggle = ({ value, onSelectConsumer, onSelectStaff, onSelectCompany }) => (
  <Box
    sx={{
      display: 'flex',
      bgcolor: 'rgba(0,0,0,0.06)',
      borderRadius: 999,
      p: 0.5,
      mb: 3,
      flexShrink: 0,
    }}
  >
    {[
      { key: 'consumer', label: 'Consumer', onClick: onSelectConsumer },
      ...(onSelectCompany ? [{ key: 'company', label: 'Company', onClick: onSelectCompany }] : []),
      { key: 'staff', label: 'Staff', onClick: onSelectStaff },
    ].map((opt) => (
      <Box
        key={opt.key}
        onClick={opt.onClick}
        sx={{
          flex: 1,
          textAlign: 'center',
          py: 0.9,
          borderRadius: 999,
          cursor: 'pointer',
          transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
          bgcolor: value === opt.key ? '#fff' : 'transparent',
          boxShadow: value === opt.key ? '0 1px 4px rgba(0,0,0,0.18)' : 'none',
        }}
      >
        <Typography
          sx={{
            fontSize: '0.9rem',
            fontWeight: value === opt.key ? 600 : 400,
            color: value === opt.key ? '#1B5E20' : 'text.secondary',
          }}
        >
          {opt.label}
        </Typography>
      </Box>
    ))}
  </Box>
);

export default AudienceToggle;
