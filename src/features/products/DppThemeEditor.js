import React, { useState } from 'react';
import {
  Box, Button, Checkbox, FormControlLabel, IconButton, MenuItem, Slider, Stack, Switch, Tab, Tabs, TextField,
  ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import {
  DEFAULT_DPP_THEME, DPP_CHOICES, DPP_FONTS, dppBlockLabel, dppSectionLabel,
} from '../../utils/dppTheme';

// Ready-made looks: a full set of colours and style choices in one click.
const PRESETS = [
  { name: 'Yometel blue', swatch: ['#1b4f72', '#f4f7fc'], theme: {} },
  {
    name: 'Black & white',
    swatch: ['#111111', '#ffffff'],
    theme: { accent: '#111111', pageBg: '#ffffff', cardBg: '#f5f5f5', textColor: '#222222', buttonText: '#ffffff', headerStyle: 'solid', buttonStyle: 'solid', cardStyle: 'flat', buttonRadius: 0, cardRadius: 0 },
  },
  {
    name: 'Forest',
    swatch: ['#2e6b4f', '#f3f8f4'],
    theme: { accent: '#2e6b4f', pageBg: '#f3f8f4', cardBg: '#ffffff', textColor: '#2f3d36', buttonText: '#ffffff', buttonRadius: 24, cardRadius: 20 },
  },
  {
    name: 'Sand',
    swatch: ['#8a5a2b', '#fbf6ee'],
    theme: { accent: '#8a5a2b', pageBg: '#fbf6ee', cardBg: '#ffffff', textColor: '#4a3f33', buttonText: '#ffffff', fontFamily: 'serif', headerStyle: 'solid', cardStyle: 'border' },
  },
  {
    name: 'Sunshine',
    swatch: ['#111111', '#feda00'],
    theme: { accent: '#111111', pageBg: '#feda00', cardBg: '#ffffff', textColor: '#222222', buttonText: '#ffffff', headerColor: '#feda00', headerStyle: 'solid', buttonStyle: 'solid', buttonRadius: 30, cardStyle: 'flat' },
  },
  {
    name: 'Midnight',
    swatch: ['#7fb2ff', '#0f172a'],
    theme: { accent: '#7fb2ff', pageBg: '#0f172a', cardBg: '#1e293b', textColor: '#e2e8f0', buttonText: '#0f172a', headerColor: '#0f172a', headerStyle: 'solid', buttonStyle: 'solid', cardStyle: 'flat', tabStyle: 'pills' },
  },
];
// A preset changes the look only — never the brand's own layout or text.
const KEPT_BY_PRESETS = ['heroLayout', 'showProductId', 'blocks', 'sections', 'message', 'cta'];

const HEX = /^#[0-9a-fA-F]{6}$/;

// Colour swatch (the browser's own picker) beside the hex value, so it can be
// picked by eye or pasted from the brand guide. `fallback` is the colour an
// optional setting follows while it is left empty.
function ColorField({ label, value, onChange, disabled, fallback }) {
  const optional = fallback !== undefined;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        component="input"
        type="color"
        value={HEX.test(value) ? value : (fallback || '#000000')}
        disabled={disabled}
        aria-label={`${label} colour`}
        onChange={(e) => onChange(e.target.value)}
        sx={{ width: 48, height: 48, p: 0, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'transparent', cursor: disabled ? 'default' : 'pointer', flexShrink: 0 }}
      />
      <TextField
        label={label}
        fullWidth
        value={value}
        disabled={disabled}
        placeholder={optional ? 'Same as buttons' : undefined}
        InputLabelProps={optional ? { shrink: true } : undefined}
        onChange={(e) => onChange(e.target.value)}
        error={optional ? !!value && !HEX.test(value) : !HEX.test(value)}
        inputProps={{ maxLength: 7 }}
      />
    </Box>
  );
}

// One style setting as a row of large either/or buttons.
function Choice({ label, value, options, onChange, disabled }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.75 }}>{label}</Typography>
      <ToggleButtonGroup
        exclusive
        color="primary"
        value={value}
        disabled={disabled}
        onChange={(e, next) => { if (next) onChange(next); }}
        sx={{ flexWrap: 'wrap' }}
      >
        {options.map((o) => (
          <ToggleButton key={o.value} value={o.value} sx={{ textTransform: 'none', px: 2 }}>{o.label}</ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}

// A list the brand can reorder and switch on and off, row by row.
function OrderList({ items, labelOf, onChange, disabled }) {
  const move = (index, delta) => {
    const next = [...items];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      {items.map((item, i) => (
        <Box key={item.key} sx={{ display: 'flex', alignItems: 'center', px: 1, borderTop: i ? '1px solid' : 0, borderColor: 'divider' }}>
          <Checkbox
            checked={item.visible}
            disabled={disabled}
            inputProps={{ 'aria-label': `Show ${labelOf(item.key)}` }}
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...item, visible: e.target.checked };
              onChange(next);
            }}
          />
          <Typography sx={{ flex: 1 }} color={item.visible ? 'text.primary' : 'text.disabled'}>{labelOf(item.key)}</Typography>
          <Tooltip title="Move up">
            <span>
              <IconButton size="small" disabled={disabled || i === 0} onClick={() => move(i, -1)} aria-label={`Move ${labelOf(item.key)} up`}>
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Move down">
            <span>
              <IconButton size="small" disabled={disabled || i === items.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${labelOf(item.key)} down`}>
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ))}
    </Box>
  );
}

// Design controls for the shopper's product page, in four short groups:
// Colours, Style, Layout, Content. `theme` is always a complete, normalized
// theme; every change is reported through `onChange` so the phone preview
// beside it updates as the brand edits.
export default function DppThemeEditor({ theme, onChange, onSave, onReset, saving, dirty, canEdit = true }) {
  const [group, setGroup] = useState('colours');
  const set = (patch) => onChange({ ...theme, ...patch });
  const off = !canEdit;
  const blockOn = (key) => theme.blocks.some((b) => b.key === key && b.visible);
  const showBlock = (key) => set({ blocks: theme.blocks.map((b) => (b.key === key ? { ...b, visible: true } : b)) });

  return (
    <Box>
      <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>Design</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {canEdit
          ? 'How your product page looks in the app. It applies to all your products; the preview changes as you edit.'
          : 'How your company’s product page looks. Only a Supervisor or the company account can change it.'}
      </Typography>

      <Tabs value={group} onChange={(e, v) => setGroup(v)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="colours" label="Colours" />
        <Tab value="style" label="Style" />
        <Tab value="layout" label="Layout" />
        <Tab value="content" label="Content" />
      </Tabs>

      {group === 'colours' && (
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Start from a ready-made look</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outlined"
                  size="small"
                  disabled={off}
                  onClick={() => onChange({
                    ...DEFAULT_DPP_THEME,
                    ...preset.theme,
                    ...Object.fromEntries(KEPT_BY_PRESETS.map((key) => [key, theme[key]])),
                  })}
                  startIcon={<Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: preset.swatch[0], border: `4px solid ${preset.swatch[1]}`, outline: '1px solid #c5cbd6' }} />}
                >
                  {preset.name}
                </Button>
              ))}
            </Stack>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <ColorField label="Buttons and headings" value={theme.accent} disabled={off} onChange={(v) => set({ accent: v })} />
            <ColorField label="Button text" value={theme.buttonText} disabled={off} onChange={(v) => set({ buttonText: v })} />
            <ColorField label="Page background" value={theme.pageBg} disabled={off} onChange={(v) => set({ pageBg: v })} />
            <ColorField label="Card background" value={theme.cardBg} disabled={off} onChange={(v) => set({ cardBg: v })} />
            <ColorField label="Text" value={theme.textColor} disabled={off} onChange={(v) => set({ textColor: v })} />
            <ColorField label="Top bar" value={theme.headerColor} fallback={theme.accent} disabled={off} onChange={(v) => set({ headerColor: v })} />
            <ColorField label="“Authenticated” badge" value={theme.badgeColor} fallback={theme.accent} disabled={off} onChange={(v) => set({ badgeColor: v })} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Leave Top bar or the badge empty to use the button colour. Text on the top bar turns dark or white by itself so it stays readable.
          </Typography>
        </Stack>
      )}

      {group === 'style' && (
        <Stack spacing={2.5}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField select label="Font" value={theme.fontFamily} disabled={off} onChange={(e) => set({ fontFamily: e.target.value })}>
              {DPP_FONTS.map((f) => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
            </TextField>
          </Box>
          <Choice label="Text size" value={theme.textScale} options={DPP_CHOICES.textScale} disabled={off} onChange={(v) => set({ textScale: v })} />
          <Choice label="Top bar" value={theme.headerStyle} options={DPP_CHOICES.headerStyle} disabled={off} onChange={(v) => set({ headerStyle: v })} />
          <Choice label="Main buttons" value={theme.buttonStyle} options={DPP_CHOICES.buttonStyle} disabled={off} onChange={(v) => set({ buttonStyle: v })} />
          <Box>
            <Typography variant="subtitle2" id="dpp-button-radius">Button corners: {theme.buttonRadius === 0 ? 'square' : `${theme.buttonRadius}px round`}</Typography>
            <Slider aria-labelledby="dpp-button-radius" value={theme.buttonRadius} min={0} max={30} step={1} disabled={off} onChange={(e, v) => set({ buttonRadius: v })} sx={{ maxWidth: 360 }} />
          </Box>
          <Choice label="Cards" value={theme.cardStyle} options={DPP_CHOICES.cardStyle} disabled={off} onChange={(v) => set({ cardStyle: v })} />
          <Box>
            <Typography variant="subtitle2" id="dpp-card-radius">Card corners: {theme.cardRadius === 0 ? 'square' : `${theme.cardRadius}px round`}</Typography>
            <Slider aria-labelledby="dpp-card-radius" value={theme.cardRadius} min={0} max={28} step={1} disabled={off} onChange={(e, v) => set({ cardRadius: v })} sx={{ maxWidth: 360 }} />
          </Box>
          <Choice label="Lifecycle tabs" value={theme.tabStyle} options={DPP_CHOICES.tabStyle} disabled={off} onChange={(v) => set({ tabStyle: v })} />
        </Stack>
      )}

      {group === 'layout' && (
        <Stack spacing={2.5}>
          <Choice label="Product photo" value={theme.heroLayout} options={DPP_CHOICES.heroLayout} disabled={off} onChange={(v) => set({ heroLayout: v })} />
          <FormControlLabel
            control={<Switch checked={theme.showProductId} disabled={off} onChange={(e) => set({ showProductId: e.target.checked })} />}
            label="Show the product ID under the name"
          />
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.25 }}>Overview page</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              What shows under the product, and in what order. Untick to hide; use the arrows to move.
            </Typography>
            <OrderList items={theme.blocks} labelOf={dppBlockLabel} disabled={off} onChange={(blocks) => set({ blocks })} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.25 }}>Lifecycle page tabs</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Open “Lifecycle” at the bottom of the preview to see these.
            </Typography>
            <OrderList items={theme.sections} labelOf={dppSectionLabel} disabled={off} onChange={(sections) => set({ sections })} />
          </Box>
        </Stack>
      )}

      {group === 'content' && (
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.25 }}>Your message</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              A short note from your brand on every product page, for example a thank-you or your promise.
            </Typography>
            <Stack spacing={2}>
              <TextField label="Title" placeholder="e.g. Thank you for choosing us" value={theme.message.title} disabled={off}
                inputProps={{ maxLength: 80 }}
                onChange={(e) => set({ message: { ...theme.message, title: e.target.value } })} />
              <TextField label="Text" multiline minRows={3} value={theme.message.body} disabled={off}
                inputProps={{ maxLength: 400 }}
                helperText={`${theme.message.body.length}/400`}
                onChange={(e) => set({ message: { ...theme.message, body: e.target.value } })} />
            </Stack>
            {(theme.message.title || theme.message.body) && !blockOn('message') && canEdit && (
              <Button sx={{ mt: 1 }} onClick={() => showBlock('message')}>Show it on the page</Button>
            )}
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.25 }}>Your button</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              One button that opens a web page of yours, for example your shop, warranty registration or loyalty programme.
            </Typography>
            <Stack spacing={2}>
              <TextField label="Button text" placeholder="e.g. Shop the collection" value={theme.cta.label} disabled={off}
                inputProps={{ maxLength: 40 }}
                onChange={(e) => set({ cta: { ...theme.cta, label: e.target.value } })} />
              <TextField label="Web address" placeholder="https://" value={theme.cta.url} disabled={off}
                onChange={(e) => set({ cta: { ...theme.cta, url: e.target.value } })} />
            </Stack>
            {theme.cta.label && theme.cta.url && !blockOn('cta') && canEdit && (
              <Button sx={{ mt: 1 }} onClick={() => showBlock('cta')}>Show it on the page</Button>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            Where these appear is set under Layout.
          </Typography>
        </Stack>
      )}

      {canEdit && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 3 }}>
          <Button variant="contained" onClick={onSave} disabled={saving || !dirty}>
            {saving ? 'Saving…' : dirty ? 'Save design' : 'Design saved'}
          </Button>
          {dirty && <Button onClick={onReset}>Undo changes</Button>}
          <Button onClick={() => onChange({ ...DEFAULT_DPP_THEME })}>Back to the Yometel look</Button>
        </Stack>
      )}
    </Box>
  );
}
