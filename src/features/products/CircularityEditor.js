import React from 'react';
import {
  Alert, Box, Button, Chip, Collapse, FormControlLabel, Grid, IconButton, Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import RecyclingIcon from '@mui/icons-material/Recycling';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { MAX_STEPS, SERVICE_KINDS, SERVICE_META, serviceIsReady } from '../../utils/circularity';

export const SERVICE_ICONS = { repair: BuildIcon, resell: StorefrontIcon, rent: EventRepeatIcon, recycle: RecyclingIcon };

const looksLikeUrl = (value) => !value || /^https?:\/\/\S+\.\S+/i.test(value.trim());
const looksLikeEmail = (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

// One service: a switch, and (when on) what the shopper is told and how
// they proceed.
function ServiceCard({ kind, value, onChange }) {
  const meta = SERVICE_META[kind];
  const Icon = SERVICE_ICONS[kind];
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });
  const setSteps = (steps) => onChange({ ...value, steps });
  const ready = serviceIsReady({ ...value, steps: value.steps.filter((s) => s.trim()) });

  return (
    <Box sx={{ border: '1px solid', borderColor: value.enabled ? 'primary.light' : 'divider', borderRadius: 2, bgcolor: '#fff' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, flexWrap: 'wrap' }}>
        <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: value.enabled ? 'rgba(47,128,200,0.12)' : '#eef1f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon sx={{ color: value.enabled ? 'primary.main' : 'text.disabled' }} />
        </Box>
        <Box sx={{ flex: '1 1 240px', minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="subtitle1" component="h4">{meta.title}</Typography>
            {value.enabled && ready && <Chip size="small" color="success" label="Shown to shoppers" />}
            {value.enabled && !ready && <Chip size="small" color="warning" label="Needs a link, a contact or steps" />}
          </Stack>
          <Typography variant="body2" color="text.secondary">{meta.intro}</Typography>
        </Box>
        <FormControlLabel
          sx={{ ml: 0 }}
          control={<Switch checked={value.enabled} onChange={(e) => onChange({ ...value, enabled: e.target.checked })} />}
          label={value.enabled ? 'Offered' : 'Not offered'}
        />
      </Box>

      <Collapse in={value.enabled} unmountOnExit>
        <Stack spacing={2.5} sx={{ px: 2, pb: 2.5 }}>
          <TextField
            label="In one or two sentences"
            placeholder={meta.summaryPlaceholder}
            helperText="The first thing shoppers read about this service."
            fullWidth multiline minRows={2}
            value={value.summary} onChange={set('summary')}
            inputProps={{ maxLength: 500 }}
          />

          {/* The Box keeps the grid's negative margins from widening the row. */}
          <Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label={meta.cost.label} placeholder={meta.cost.placeholder} fullWidth value={value.cost} onChange={set('cost')} inputProps={{ maxLength: 160 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label={meta.time.label} placeholder={meta.time.placeholder} fullWidth value={value.time} onChange={set('time')} inputProps={{ maxLength: 160 }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label={meta.note.label} placeholder={meta.note.placeholder} fullWidth multiline minRows={2} value={value.note} onChange={set('note')} inputProps={{ maxLength: 500 }} />
            </Grid>
          </Grid>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.25 }}>How it works</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>The steps the shopper follows, in order. Two to four short steps work best.</Typography>
            <Stack spacing={1}>
              {value.steps.map((step, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ width: 24, textAlign: 'right', fontWeight: 600 }}>{i + 1}.</Typography>
                  <TextField
                    fullWidth size="small" value={step}
                    inputProps={{ 'aria-label': `${meta.title} step ${i + 1}`, maxLength: 240 }}
                    onChange={(e) => setSteps(value.steps.map((s, j) => (j === i ? e.target.value : s)))}
                  />
                  <Tooltip title="Remove this step">
                    <IconButton color="error" aria-label={`Remove step ${i + 1}`} onClick={() => setSteps(value.steps.filter((_, j) => j !== i))}><DeleteIcon /></IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
              <Button startIcon={<AddIcon />} disabled={value.steps.length >= MAX_STEPS} onClick={() => setSteps([...value.steps, ''])}>Add a step</Button>
              {value.steps.length === 0 && (
                <Button variant="outlined" onClick={() => setSteps([...meta.steps])}>Start from our suggested steps</Button>
              )}
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Who to contact</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label={meta.partner} placeholder="e.g. your own workshop, or a partner’s name" fullWidth value={value.partnerName} onChange={set('partnerName')} inputProps={{ maxLength: 120 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Web page" placeholder="https://" fullWidth value={value.url} onChange={set('url')}
                  error={!looksLikeUrl(value.url)}
                  helperText={!looksLikeUrl(value.url) ? 'A web address starts with https://' : 'Opens when the shopper presses “Open website”.'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email" type="email" fullWidth value={value.email} onChange={set('email')}
                  error={!looksLikeEmail(value.email)}
                  helperText={!looksLikeEmail(value.email) ? 'Please check this email address.' : undefined}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Phone" fullWidth value={value.phone} onChange={set('phone')} inputProps={{ maxLength: 60 }} />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ p: 1.5, bgcolor: 'rgba(47,128,200,0.08)', borderRadius: 2 }}>
            <FormControlLabel
              control={<Switch checked={value.acceptRequests} onChange={(e) => onChange({ ...value, acceptRequests: e.target.checked })} />}
              label={`Let shoppers send a request in the app (“${meta.button}”)`}
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
              The shopper writes what they need; you get a notification and answer it on the Service Requests page. They see your answer and the status in the app.
            </Typography>
          </Box>
        </Stack>
      </Collapse>
    </Box>
  );
}

// The product form's end-of-life part: repair, resell, rent, recycle. Each
// is switched on only if the brand really offers it.
export default function CircularityEditor({ value, onChange }) {
  const offered = SERVICE_KINDS.filter((kind) => value[kind].enabled).length;
  return (
    <Box component="section">
      <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>Repair, resale, rental and recycling</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        What a shopper can do with this product after buying it. Switch on only what you really offer; each one appears in the app with its own steps and contact.
      </Typography>
      {offered === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Nothing is offered yet. Repair and recycling information is what shoppers look for most, and what the EU product passport rules ask for.
        </Alert>
      )}
      <Stack spacing={1.5}>
        {SERVICE_KINDS.map((kind) => (
          <ServiceCard key={kind} kind={kind} value={value[kind]} onChange={(next) => onChange({ ...value, [kind]: next })} />
        ))}
      </Stack>
    </Box>
  );
}
