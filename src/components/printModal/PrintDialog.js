import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { TextField, Stack, IconButton, ToggleButton, ToggleButtonGroup } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { PDFDownloadLink } from '@react-pdf/renderer';
import MyDocument from './exportPDF';
import Stat from './Stat';

const cardStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 420,
    maxWidth: '92vw',
    // Caps the card to the viewport and scrolls the body internally — without
    // this, taller content (e.g. the Reprint range fields plus PDF actions)
    // ran off the bottom of the screen on short/low-resolution displays with
    // no way to reach the Apply/Download button.
    maxHeight: '90vh',
    bgcolor: 'background.paper',
    borderRadius: 3,
    boxShadow: 24,
    overflow: 'hidden',
    outline: 'none',
    display: 'flex',
    flexDirection: 'column',
};

// Generic "print a range of already-generated/registered items to PDF"
// dialog — the same Total/Printed/Available stats, Print-new (next N) /
// Reprint (arbitrary range) mode, and items-per-row PDF layout control,
// shared by every tab (QR, Security QR, GS1 Digital Link, RFID, NFC,
// Barcode) so they all look and behave identically. Only the data plumbing
// differs per tab, supplied via props:
//
// - `itemsSource(fromN, toN)` resolves the PDF-ready `{ img, identifiers }[]`
//   for the given 1-indexed inclusive position range.
// - `onMarkPrinted(count)`, called only in Print-new mode on download,
//   persists the new printed count server-side and resolves the updated
//   printed amount so the dialog's stats stay in sync.
export default function PrintDialog({
    open,
    setOpen,
    title,
    subtitle,
    totalAmount,
    printedAmount,
    onPrintedAmountChange,
    itemsSource,
    onMarkPrinted,
    fileNamePrefix,
}) {
    const [from, setFrom] = React.useState(0);
    const [to, setTo] = React.useState(0);
    const [printMode, setPrintMode] = React.useState('print');
    const [apply, setApply] = React.useState(false);
    const [count, setCount] = React.useState(0);
    const [preparing, setPreparing] = React.useState(false);
    const [pdfItems, setPdfItems] = React.useState([]);
    const [itemsPerRow, setItemsPerRow] = React.useState(5);

    const total = Number(totalAmount) || 0;
    const printed = Number(printedAmount) || 0;
    const available = total - printed;

    const handleApply = async () => {
        setPreparing(true);
        try {
            const fromN = printMode === 'print' ? printed + 1 : Number(from);
            const toN = printMode === 'print' ? printed + Number(count) : Number(to);
            const items = await itemsSource(fromN, toN);
            setPdfItems(Array.isArray(items) ? items : []);
            setApply(true);
        } finally {
            setPreparing(false);
        }
    };

    const downloadPDFHandler = async () => {
        if (printMode === 'print' && onMarkPrinted) {
            const newPrinted = await onMarkPrinted(Number(count));
            if (typeof newPrinted === 'number' && onPrintedAmountChange) onPrintedAmountChange(newPrinted);
        }
        setApply(false);
        setPdfItems([]);
    };

    React.useEffect(() => {
        if (count > available) setCount(available);
    }, [count]); // eslint-disable-line react-hooks/exhaustive-deps

    React.useEffect(() => {
        if (from > printed) setFrom(printed);
    }, [from]); // eslint-disable-line react-hooks/exhaustive-deps

    React.useEffect(() => {
        if (to > printed) setTo(printed);
    }, [to]); // eslint-disable-line react-hooks/exhaustive-deps

    // Reset the apply state whenever the mode changes.
    React.useEffect(() => {
        setApply(false);
        setPdfItems([]);
    }, [printMode]);

    const applyDisabled = printMode === 'print' ? !(Number(count) > 0) : !(Number(to) >= Number(from) && Number(from) > 0);

    return (
        <Modal open={open} onClose={() => setOpen(false)}>
            <Box sx={cardStyle}>
                {/* Header — flexShrink: 0 keeps it pinned above the scrolling body below. */}
                <Box
                    sx={{
                        px: 3,
                        py: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundImage: 'linear-gradient(120deg, #2f80c8 0%, #4a96dd 100%)',
                        color: '#fff',
                        flexShrink: 0,
                    }}
                >
                    <Typography sx={{ fontWeight: 400, fontSize: 18 }}>{title}</Typography>
                    <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: '#fff' }} aria-label="Close">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Body — scrolls internally when it doesn't fit within cardStyle's maxHeight. */}
                <Box sx={{ p: 3, overflowY: 'auto' }}>
                    {subtitle && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {subtitle}
                        </Typography>
                    )}

                    {/* Stats */}
                    <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
                        <Stat label="Total" value={total} />
                        <Stat label="Printed" value={printed} />
                        <Stat label="Available" value={Math.max(0, available)} highlight />
                    </Stack>

                    {/* Mode */}
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Mode
                    </Typography>
                    <ToggleButtonGroup
                        value={printMode}
                        exclusive
                        onChange={(e, v) => v && setPrintMode(v)}
                        size="small"
                        fullWidth
                        sx={{ mb: 3 }}
                    >
                        <ToggleButton value="print">Print new</ToggleButton>
                        <ToggleButton value="reprint">Reprint</ToggleButton>
                    </ToggleButtonGroup>

                    {/* Range / count */}
                    {printMode === 'print' ? (
                        <TextField
                            type="number"
                            label="Count"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={count}
                            onChange={(e) => setCount(e.target.value)}
                            InputProps={{ inputProps: { min: 0, max: available } }}
                            helperText={`Up to ${Math.max(0, available)} unprinted item${available === 1 ? '' : 's'} available`}
                        />
                    ) : (
                        <Stack direction="row" spacing={2} alignItems="center">
                            <TextField
                                type="number"
                                label="From"
                                variant="outlined"
                                size="small"
                                fullWidth
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                InputProps={{ inputProps: { min: 0, max: printed } }}
                            />
                            <Typography color="text.secondary">to</Typography>
                            <TextField
                                type="number"
                                label="To"
                                variant="outlined"
                                size="small"
                                fullWidth
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                InputProps={{ inputProps: { min: 0, max: printed } }}
                            />
                        </Stack>
                    )}

                    <TextField
                        type="number"
                        label="Items per row"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={itemsPerRow}
                        onChange={(e) => setItemsPerRow(e.target.value)}
                        InputProps={{ inputProps: { min: 1, max: 20 } }}
                        sx={{ mt: 2 }}
                    />

                    {/* Actions */}
                    <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center" sx={{ mt: 3 }}>
                        <Button variant="text" color="inherit" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        {!apply ? (
                            <Button variant="contained" onClick={handleApply} disabled={applyDisabled || preparing}>
                                {preparing ? 'Preparing…' : 'Apply'}
                            </Button>
                        ) : (
                            <PDFDownloadLink
                                style={{ textDecoration: 'none' }}
                                document={<MyDocument items={pdfItems} itemsPerRow={Number(itemsPerRow) || 5} />}
                                onClick={downloadPDFHandler}
                                fileName={`${fileNamePrefix}-${printMode}-${printMode === 'print' ? printed + 1 : from}-${printMode === 'print' ? printed + Number(count) : to}.pdf`}
                            >
                                {({ loading }) => (
                                    <Button variant="contained">{loading ? 'Preparing…' : 'Download PDF'}</Button>
                                )}
                            </PDFDownloadLink>
                        )}
                    </Stack>
                </Box>
            </Box>
        </Modal>
    );
}
