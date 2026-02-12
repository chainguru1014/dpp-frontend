import React from 'react';
import Box from '@mui/material/Box';

/**
 * Standard laundry care symbol icons (GINETEX-style).
 * Each icon is an inline SVG for reliability without external assets.
 */
const size = 32;
const stroke = 1.8;

function WashIcon({ temp, selected }) {
  return (
    <Box component="svg" viewBox="0 0 32 32" width={size} height={size} sx={{ display: 'block' }}>
      <path
        fill="none"
        stroke={selected ? '#1976d2' : '#333'}
        strokeWidth={stroke}
        d="M6 10c0-2 2-4 6-4h8c4 0 6 2 6 4v14H6V10z"
      />
      <path fill="none" stroke={selected ? '#1976d2' : '#333'} strokeWidth={stroke} d="M6 16h20" />
      <text x="16" y="14" textAnchor="middle" fontSize="8" fill={selected ? '#1976d2' : '#333'} fontWeight="bold">
        {temp}
      </text>
    </Box>
  );
}

function DryCleanIcon({ letter, selected }) {
  return (
    <Box component="svg" viewBox="0 0 32 32" width={size} height={size} sx={{ display: 'block' }}>
      <circle cx="16" cy="16" r="12" fill="none" stroke={selected ? '#1976d2' : '#333'} strokeWidth={stroke} />
      <text x="16" y="20" textAnchor="middle" fontSize="12" fill={selected ? '#1976d2' : '#333'} fontWeight="bold">
        {letter}
      </text>
    </Box>
  );
}

function IronIcon({ dots, selected }) {
  return (
    <Box component="svg" viewBox="0 0 32 32" width={size} height={size} sx={{ display: 'block' }}>
      <path
        fill="none"
        stroke={selected ? '#1976d2' : '#333'}
        strokeWidth={stroke}
        d="M8 6h16l-4 20H12L8 6z"
      />
      <path fill="none" stroke={selected ? '#1976d2' : '#333'} strokeWidth={stroke} d="M8 12h16" />
      {[1, 2, 3].slice(0, dots).map((_, i) => (
        <circle key={i} cx={12 + i * 8} cy="22" r="2.5" fill={selected ? '#1976d2' : '#333'} />
      ))}
    </Box>
  );
}

function BleachIcon({ allowed, selected }) {
  return (
    <Box component="svg" viewBox="0 0 32 32" width={size} height={size} sx={{ display: 'block' }}>
      <path
        fill="none"
        stroke={selected ? '#1976d2' : '#333'}
        strokeWidth={stroke}
        d="M16 4l12 24H4L16 4z"
      />
      {!allowed && (
        <path
          stroke={selected ? '#1976d2' : '#333'}
          strokeWidth={stroke}
          d="M8 8l16 16M24 8L8 24"
        />
      )}
    </Box>
  );
}

function TumbleDryIcon({ dots, selected }) {
  return (
    <Box component="svg" viewBox="0 0 32 32" width={size} height={size} sx={{ display: 'block' }}>
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="2"
        fill="none"
        stroke={selected ? '#1976d2' : '#333'}
        strokeWidth={stroke}
      />
      <circle cx="16" cy="16" r="6" fill="none" stroke={selected ? '#1976d2' : '#333'} strokeWidth={stroke} />
      {[1, 2].slice(0, dots).map((_, i) => (
        <circle key={i} cx={14 + i * 4} cy="22" r="1.5" fill={selected ? '#1976d2' : '#333'} />
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
