import React from 'react';
import { Box, Button, Checkbox, IconButton, MenuItem, Slider, Stack, TextField, Tooltip, Typography } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { DEFAULT_DPP_THEME, DPP_FONTS, dppSectionLabel } from '../../utils/dppTheme';

// Ready-made looks, so a brand can start from one click instead of five
// colour pickers.
const PRESETS = [
  { name: 'Yometel blue', accent: '#1b4f72', pageBg: '#f4f7fc', cardBg: '#ffffff', textColor: '#33415c', buttonText: '#ffffff' },
  { name: 'Black & white', accent: '#111111', pageBg: '#ffffff', cardBg: '#f5f5f5', textColor: '#222222', buttonText: '#ffffff' },
  { name: 'Forest', accent: '#2e6b4f', pageBg: '#f3f8f4', cardBg: '#ffffff', textColor: '#2f3d36', buttonText: '#ffffff' },
  { name: 'Sand', accent: '#8a5a2b', pageBg: '#fbf6ee', cardBg: '#ffffff', textColor: '#4a3f33', buttonText: '#ffffff' },
  { name: 'Sunshine', accent: '#111111', pageBg: '#feda00', cardBg: '#ffffff', textColor: '#222222', buttonText: '#ffffff' },
];

const COLOR_FIELDS = [
  ['accent', 'Buttons and headings'],
  ['buttonText', 'Button text'],
  ['pageBg', 'Page background'],
  ['cardBg', 'Card background'],
  ['textColor', 'Text'],
];

// Colour swatch (the browser's own picker) beside the hex value, so it can be
// picked by eye or pasted from the brand guide.
function ColorField({ label, value, onChange, disabled }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        component="input"
        type="color"
        value={value}
        disabled={disabled}
        aria-label={`${label} colour`}
        onChange={(e) => onChange(e.target.value)}
        sx={{ width: 44, height: 44, p: 0, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'transparent', cursor: disabled ? 'default' : 'pointer', flexShrink: 0 }}
      />
      <TextField
        label={label}
        size="small"
        fullWidth
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        error={!/^#[0-9a-fA-F]{6}$/.test(value)}
        inputProps={{ maxLength: 7 }}
      />
    </Box>
  );
}

// Design controls for the shopper's product page. `theme` is always a
// complete, normalized theme; every change is reported through `onChange`
// so the phone preview beside it updates as the brand edits.
export default function DppThemeEditor({ theme, onChange, onSave, onReset, saving, dirty, canEdit = true }) {
  const set = (patch) => onChange({ ...theme, ...patch });
  const moveSection = (index, delta) => {
    const next = [...theme.sections];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set({ sections: next });
  };

  return (
    <Box>
      <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>Design</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {canEdit
          ? 'The look of your product page. It applies to all your products — the preview changes as you edit.'
          : 'The look of your company’s product page. Only a Supervisor or the company account can change it.'}
      </Typography>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Start from a ready-made look</Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2.5 }}>
        {PRESETS.map((preset) => {
          const { name, ...colors } = preset;
          return (
            <Button
              key={name}
              variant="outlined"
              size="small"
              disabled={!canEdit}
              onClick={() => set(colors)}
              startIcon={<Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: preset.accent, border: `3px solid ${preset.pageBg}`, outline: '1px solid #c5cbd6' }} />}
            >
              {name}
            </Button>
          );
        })}
      </Stack>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Colours</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mb: 2.5 }}>
        {COLOR_FIELDS.map(([key, label]) => (
          <ColorField key={key} label={label} value={theme[key]} disabled={!canEdit} onChange={(v) => set({ [key]: v })} />
        ))}
        <TextField select size="small" label="Font" value={theme.fontFamily} disabled={!canEdit} onChange={(e) => set({ fontFamily: e.target.value })}>
          {DPP_FONTS.map((f) => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
        </TextField>
      </Box>

      <Typography variant="subtitle2" id="dpp-radius-label">Button corners: {theme.buttonRadius === 0 ? 'square' : `${theme.buttonRadius}px round`}</Typography>
      <Slider
        aria-labelledby="dpp-radius-label"
        value={theme.buttonRadius}
        min={0}
        max={30}
        step={1}
        disabled={!canEdit}
        onChange={(e, v) => set({ buttonRadius: v })}
        sx={{ maxWidth: 320, mb: 1.5 }}
      />

      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Sections</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Untick a section to hide it. Use the arrows to change the order.
      </Typography>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
        {theme.sections.map((section, i) => (
          <Box key={section.key} sx={{ display: 'flex', alignItems: 'center', px: 1, borderTop: i ? '1px solid' : 0, borderColor: 'divider' }}>
            <Checkbox
              checked={section.visible}
              disabled={!canEdit}
              inputProps={{ 'aria-label': `Show ${dppSectionLabel(section.key)}` }}
              onChange={(e) => {
                const next = [...theme.sections];
                next[i] = { ...section, visible: e.target.checked };
                set({ sections: next });
              }}
            />
            <Typography sx={{ flex: 1 }} color={section.visible ? 'text.primary' : 'text.disabled'}>
              {dppSectionLabel(section.key)}
            </Typography>
            <Tooltip title="Move up">
              <span>
                <IconButton size="small" disabled={!canEdit || i === 0} onClick={() => moveSection(i, -1)} aria-label={`Move ${dppSectionLabel(section.key)} up`}>
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move down">
              <span>
                <IconButton size="small" disabled={!canEdit || i === theme.sections.length - 1} onClick={() => moveSection(i, 1)} aria-label={`Move ${dppSectionLabel(section.key)} down`}>
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        ))}
      </Box>

      {canEdit && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="contained" onClick={onSave} disabled={saving || !dirty}>
            {saving ? 'Saving…' : dirty ? 'Save design' : 'Design saved'}
          </Button>
          <Button onClick={() => onChange({ ...DEFAULT_DPP_THEME })}>Back to the Yometel look</Button>
          {dirty && <Button onClick={onReset}>Undo changes</Button>}
        </Stack>
      )}
    </Box>
  );
}
