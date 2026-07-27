import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { TextField, Stack, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { PDFDownloadLink } from '@react-pdf/renderer';
import MyDocument from './exportPDF';

const cardStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 420,
    maxWidth: '92vw',
    bgcolor: 'background.paper',
    borderRadius: 3,
    boxShadow: 24,
    overflow: 'hidden',
    outline: 'none',
};

// Lightweight sibling of printModal/index.js's PrintModal, for tabs that have
// no server-side printed/unprinted-count tracking to drive a Print-new /
// Reprint flow (GS1 Digital Link, RFID, NFC, Barcode, Security QR) — those
// just export a PDF of whatever items are currently generated/registered.
export default function SimplePrintModal({ open, setOpen, title, items }) {
    const [itemsPerRow, setItemsPerRow] = React.useState(5);

    return (
        <Modal open={open} onClose={() => setOpen(false)}>
            <Box sx={cardStyle}>
                <Box
                    sx={{
                        px: 3,
                        py: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundImage: 'linear-gradient(120deg, #2f80c8 0%, #4a96dd 100%)',
                        color: '#fff',
                    }}
                >
                    <Typography sx={{ fontWeight: 400, fontSize: 18 }}>{title}</Typography>
                    <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: '#fff' }} aria-label="Close">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                <Box sx={{ p: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {items.length} item{items.length === 1 ? '' : 's'} ready to print.
                    </Typography>

                    <TextField
                        type="number"
                        label="Items per row"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={itemsPerRow}
                        onChange={(e) => setItemsPerRow(e.target.value)}
                        InputProps={{ inputProps: { min: 1, max: 20 } }}
                    />

                    <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center" sx={{ mt: 3 }}>
                        <Button variant="text" color="inherit" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <PDFDownloadLink
                            style={{ textDecoration: 'none' }}
                            document={<MyDocument items={items} itemsPerRow={Number(itemsPerRow) || 5} />}
                            onClick={() => setOpen(false)}
                            fileName={`${title.replace(/\s+/g, '-').toLowerCase()}.pdf`}
                        >
                            {({ loading }) => (
                                <Button variant="contained" disabled={items.length === 0}>
                                    {loading ? 'Preparing…' : 'Download PDF'}
                                </Button>
                            )}
                        </PDFDownloadLink>
                    </Stack>
                </Box>
            </Box>
        </Modal>
    );
}
