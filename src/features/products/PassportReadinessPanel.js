import React from 'react';
import { Box, LinearProgress, Link, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { passportCompleteness, passportColor } from '../../utils/passportCompleteness';

// Small bar + percentage, used in the Products table and the product window.
export function PassportScore({ product, width = 90 }) {
  const { percent } = passportCompleteness(product);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} title={`Passport ${percent}% complete`}>
      <LinearProgress
        variant="determinate"
        value={percent}
        color={passportColor(percent)}
        sx={{ width, height: 8, borderRadius: 4, bgcolor: '#e6eaf1' }}
      />
      <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 38 }}>{percent}%</Typography>
    </Box>
  );
}

// "How ready is this passport?" — every section with what is filled in and
// what is still missing. A missing item is a link that opens the form step
// where that field lives.
export default function PassportReadinessPanel({ product, onGoToStep }) {
  const { percent, done, total, groups } = passportCompleteness(product);
  return (
    <Box>
      <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>Passport readiness</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {percent === 100
          ? 'Everything a Digital Product Passport is expected to show is filled in.'
          : `${done} of ${total} passport details are filled in. Click a missing one to add it.`}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <LinearProgress
          variant="determinate"
          value={percent}
          color={passportColor(percent)}
          sx={{ flex: 1, height: 10, borderRadius: 5, bgcolor: '#e6eaf1' }}
        />
        <Typography variant="h6" component="span">{percent}%</Typography>
      </Box>
      <Stack spacing={1.5}>
        {groups.map(({ group, done: groupDone, total: groupTotal, rows }) => (
          <Box key={group}>
            <Typography variant="subtitle2" sx={{ mb: 0.25 }}>
              {group} <Typography component="span" variant="body2" color="text.secondary">({groupDone}/{groupTotal})</Typography>
            </Typography>
            {rows.map((row) => (
              <Box key={row.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.25 }}>
                {row.ok
                  ? <CheckCircleIcon color="success" sx={{ fontSize: 18 }} />
                  : <RadioButtonUncheckedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />}
                {row.ok || !onGoToStep ? (
                  <Typography variant="body2" color={row.ok ? 'text.primary' : 'text.secondary'}>{row.label}</Typography>
                ) : (
                  <Link component="button" type="button" variant="body2" underline="hover" onClick={() => onGoToStep(row.step)} sx={{ textAlign: 'left' }}>
                    {row.label}
                  </Link>
                )}
              </Box>
            ))}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
