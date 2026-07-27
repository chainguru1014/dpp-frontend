import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// Shared stat tile used by PrintDialog (every print dialog: QR, Security QR,
// GS1DL, RFID, NFC, Barcode) so they all read as one consistent design.
const Stat = ({ label, value, highlight }) => (
    <Box
        sx={{
            flex: 1,
            textAlign: 'center',
            py: 1.25,
            px: 1,
            borderRadius: 2,
            border: '1px solid',
            borderColor: highlight ? 'primary.main' : 'divider',
            bgcolor: highlight ? 'rgba(31,51,97,0.06)' : 'background.default',
        }}
    >
        <Typography sx={{ fontWeight: 400, fontSize: 22, lineHeight: 1.2, color: highlight ? 'primary.main' : 'text.primary' }}>
            {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
            {label}
        </Typography>
    </Box>
);

export default Stat;
