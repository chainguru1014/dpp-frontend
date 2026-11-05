import React from 'react';
import SvgIcon from '@mui/material/SvgIcon';

// RFID icon: a rounded square, open at the top-right corner where a tag
// sends out three waves, with "RFID" across the bottom. Line-drawn in the
// current text colour, like the Material icons around it.
export default function RfidIcon(props) {
  return (
    <SvgIcon viewBox="0 0 24 24" {...props}>
      <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.4 1.6H4.6A3 3 0 0 0 1.6 4.6v14.8a3 3 0 0 0 3 3h14.8a3 3 0 0 0 3-3v-6" />
        <path d="M13.4 7.3a3.4 3.4 0 0 1 3.4 3.4" />
        <path d="M13.4 4.1a6.6 6.6 0 0 1 6.6 6.6" />
        <path d="M13.4 0.9a9.8 9.8 0 0 1 9.8 9.8" />
        <circle cx="13.4" cy="10.7" r="1.25" />
      </g>
      <text
        x="12"
        y="20.4"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="6.6"
        textLength="15.6"
        lengthAdjust="spacingAndGlyphs"
      >
        RFID
      </text>
    </SvgIcon>
  );
}
