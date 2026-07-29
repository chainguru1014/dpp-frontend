import React from 'react';
import Box from '@mui/material/Box';

/**
 * Standard laundry care symbol icons (GINETEX / ISO 3758 style).
 * Each icon is an inline SVG for reliability without external assets.
 */
const size = 32;
const stroke = 1.7;

const ACTIVE = '#2f80c8';
const IDLE = '#5b6b8c';

const common = {
  fill: 'none',
  strokeWidth: stroke,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

// Evenly spread N filled dots across the symbol (heat / temperature level).
function dotPositions(count) {
  if (count <= 1) return [16];
  if (count === 2) return [13, 19];
  return [11, 16, 21];
}

function WashIcon({ temp, selected }) {
  const color = selected ? ACTIVE : IDLE;
  return (
    <Box component="svg" viewBox="0 0 32 32" width={size} height={size} sx={{ display: 'block' }}>
      <path {...common} stroke={color} d="M6 12.5 q2.5 -2.6 5 0 t5 0 t5 0 t5 0" />
      <path
        {...common}
        stroke={color}
        d="M6 12.5 L7.6 23.4 Q7.9 26 10.3 26 L21.7 26 Q24.1 26 24.4 23.4 L26 12.5"
      />
      <text x="16" y="22" textAnchor="middle" fontSize="9" fill={color} fontWeight="bold">
        {temp}
      </text>
    </Box>
  );
}

function DryCleanIcon({ letter, selected }) {
  const color = selected ? ACTIVE : IDLE;
  return (
    <Box component="svg" viewBox="0 0 32 32" width={size} height={size} sx={{ display: 'block' }}>
      <circle cx="16" cy="16" r="11.5" {...common} stroke={color} />
      <text x="16" y="20.5" textAnchor="middle" fontSize="13" fill={color} fontWeight="bold">
        {letter}
      </text>
    </Box>
  );
}

function IronIcon({ dots, selected }) {
  const color = selected ? ACTIVE : IDLE;
  return (
    <Box component="svg" viewBox="0 0 32 32" width={size} height={size} sx={{ display: 'block' }}>
      <path
        {...common}
        stroke={color}
        d="M6 20.5 L25.5 20.5 L25.5 17 C25.5 13.5 22.5 11.5 18.5 11.5 L12 11.5 C9 11.5 6.8 13.8 6 17 Z"
      />
      <path {...common} stroke={color} d="M12.5 11.5 C13.5 9.2 16.9 9.2 18 11.5" />
      {dotPositions(dots).map((cx, i) => (
        <circle key={i} cx={cx} cy="17" r="1.6" fill={color} />
      ))}
    </Box>
  );
}

function BleachIcon({ allowed, selected }) {
  const color = selected ? ACTIVE : IDLE;
  return (
    <Box component="svg" viewBox="0 0 32 32" width={size} height={size} sx={{ display: 'block' }}>
      <path {...common} stroke={color} d="M16 5 L27 25 L5 25 Z" />
      {!allowed && (
        <path {...common} stroke={color} strokeWidth={stroke * 1.3} d="M9.5 12 L22.5 23 M22.5 12 L9.5 23" />
      )}
    </Box>
  );
}

function TumbleDryIcon({ dots, selected }) {
  const color = selected ? ACTIVE : IDLE;
  return (
    <Box component="svg" viewBox="0 0 32 32" width={size} height={size} sx={{ display: 'block' }}>
      <rect x="4" y="4" width="24" height="24" rx="3.5" {...common} stroke={color} />
      <circle cx="16" cy="16" r="6.5" {...common} stroke={color} />
      {dotPositions(Math.min(dots, 2)).map((cx, i) => (
        <circle key={i} cx={cx} cy="16" r="1.5" fill={color} />
      ))}
    </Box>
  );
}

const MAINTENANCE_ICON_CONFIG = [
  { id: 'wash_30', label: 'Wash 30', render: (selected) => <WashIcon temp={30} selected={selected} /> },
  { id: 'wash_40', label: 'Wash 40', render: (selected) => <WashIcon temp={40} selected={selected} /> },
  { id: 'wash_50', label: 'Wash 50', render: (selected) => <WashIcon temp={50} selected={selected} /> },
  { id: 'wash_60', label: 'Wash 60', render: (selected) => <WashIcon temp={60} selected={selected} /> },
  { id: 'wash_70', label: 'Wash 70', render: (selected) => <WashIcon temp={70} selected={selected} /> },
  { id: 'dry_clean_P', label: 'Dry clean P', render: (selected) => <DryCleanIcon letter="P" selected={selected} /> },
  { id: 'dry_clean_F', label: 'Dry clean F', render: (selected) => <DryCleanIcon letter="F" selected={selected} /> },
  { id: 'iron_low', label: 'Iron low', render: (selected) => <IronIcon dots={1} selected={selected} /> },
  { id: 'iron_med', label: 'Iron med', render: (selected) => <IronIcon dots={2} selected={selected} /> },
  { id: 'iron_high', label: 'Iron high', render: (selected) => <IronIcon dots={3} selected={selected} /> },
  { id: 'bleach_no', label: 'Bleach no', render: (selected) => <BleachIcon allowed={false} selected={selected} /> },
  { id: 'bleach_any', label: 'Bleach any', render: (selected) => <BleachIcon allowed selected={selected} /> },
  { id: 'tumble_dry_low', label: 'Tumble dry low', render: (selected) => <TumbleDryIcon dots={1} selected={selected} /> },
  { id: 'tumble_dry_high', label: 'Tumble dry high', render: (selected) => <TumbleDryIcon dots={2} selected={selected} /> },
];

export function getMaintenanceIconConfig() {
  return MAINTENANCE_ICON_CONFIG;
}

export function CareSymbol({ iconId, selected = false, size: iconSize }) {
  const config = MAINTENANCE_ICON_CONFIG.find((c) => c.id === iconId);
  if (!config || typeof config.render !== 'function') return null;
  return (
    <Box
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: iconSize || 56,
        minWidth: iconSize || 56,
        p: 0.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? 'primary.50' : 'transparent',
      }}
    >
      <Box sx={{ transform: iconSize ? `scale(${iconSize / size})` : undefined, transformOrigin: 'center' }}>{config.render(selected)}</Box>
      <Box component="span" sx={{ fontSize: 10, color: selected ? 'primary.main' : 'text.secondary', mt: 0.25 }}>
        {config.label}
      </Box>
    </Box>
  );
}

export default function CareSymbols({ selectedIds = [], onToggle, size: iconSize }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {MAINTENANCE_ICON_CONFIG.map(({ id }) => {
        const selected = selectedIds.includes(id);
        const content = <CareSymbol key={id} iconId={id} selected={selected} size={iconSize} />;
        if (onToggle) {
          return (
            <Box
              key={id}
              component="button"
              type="button"
              onClick={() => onToggle(id)}
              sx={{
                border: 0,
                background: 'none',
                cursor: 'pointer',
                padding: 0,
                '&:focus': { outline: 'none' },
                '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' },
              }}
            >
              {content}
            </Box>
          );
        }
        return <Box key={id}>{content}</Box>;
      })}
    </Box>
  );
}
