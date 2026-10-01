import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { TextField, Stack, IconButton, ToggleButton, ToggleButtonGroup } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { pdf } from '@react-pdf/renderer';
import MyDocument from './exportPDF';
import Stat from './Stat';
import { notifyError, notifySuccess } from '../../utils/feedbackBus';

const cardStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 460,
    maxWidth: '92vw',
    // Caps the card to the viewport and scrolls the body internally — without
    // this, taller content ran off the bottom of the screen on short displays.
    maxHeight: '90vh',
    bgcolor: 'background.paper',
    borderRadius: 3,
    boxShadow: 24,
    overflow: 'hidden',
    outline: 'none',
    display: 'flex',
    flexDirection: 'column',
};

// Generic "print a range of already-created labels to PDF" dialog, shared
// by every tab (QR, Security QR, GS1 Digital Link, RFID, NFC, Barcode).
// One button now builds and downloads the PDF (it used to take two steps:
// "Apply" and then "Download PDF"). Only the data plumbing differs per tab:
//
// - `itemsSource(fromN, toN)` resolves the PDF-ready `{ img, identifiers }[]`
//   for the given 1-indexed inclusive position range.
// - `onMarkPrinted(count)`, called only for new labels after the download,
//   persists the new printed count and resolves the updated printed amount.
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
    const total = Number(totalAmount) || 0;
    const printed = Number(printedAmount) || 0;
    const available = Math.max(0, total - printed);

    const [printMode, setPrintMode] = React.useState('print');
    const [count, setCount] = React.useState(available);
    const [from, setFrom] = React.useState(1);
    const [to, setTo] = React.useState(printed);
    const [itemsPerRow, setItemsPerRow] = React.useState(5);
    const [busy, setBusy] = React.useState(false);

    // Start each opening with sensible numbers: all not-yet-printed labels,
    // or (for reprinting) everything printed so far.
    React.useEffect(() => {
        if (!open) return;
        setPrintMode(available > 0 ? 'print' : 'reprint');
        setCount(available);
        setFrom(printed > 0 ? 1 : 0);
        setTo(printed);
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || 0));
    const range = printMode === 'print'
        ? { fromN: printed + 1, toN: printed + clamp(count, 0, available) }
        : { fromN: clamp(from, 1, printed), toN: clamp(to, 1, printed) };
    const labelCount = Math.max(0, range.toN - range.fromN + 1);
    const canDownload = labelCount > 0 && !busy;

    const handleDownload = async () => {
        setBusy(true);
        try {
            const items = await itemsSource(range.fromN, range.toN);
            const blob = await pdf(
                <MyDocument items={Array.isArray(items) ? items : []} itemsPerRow={clamp(itemsPerRow, 1, 20) || 5} />
            ).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileNamePrefix}-${printMode === 'print' ? 'new' : 'reprint'}-${range.fromN}-${range.toN}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
            if (printMode === 'print' && onMarkPrinted) {
                const newPrinted = await onMarkPrinted(labelCount);
                if (typeof newPrinted === 'number' && onPrintedAmountChange) onPrintedAmountChange(newPrinted);
            }
            notifySuccess(`PDF with ${labelCount} label${labelCount === 1 ? '' : 's'} downloaded. Open it and print.`);
            setOpen(false);
        } catch (err) {
            console.error('PDF build failed:', err);
            notifyError('The PDF could not be created. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal open={open} onClose={() => !busy && setOpen(false)} aria-labelledby="print-dialog-title">
            <Box sx={cardStyle}>
                {/* Header — flexShrink: 0 keeps it pinned above the scrolling body below. */}
                <Box
                    sx={{
                        px: 3,
                        py: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundImage: 'linear-gradient(135deg, #4a96dd 0%, #1b4f72 100%)',
                        color: '#fff',
                        flexShrink: 0,
                    }}
                >
                    <Typography id="print-dialog-title" sx={{ fontWeight: 600, fontSize: 20 }}>{title}</Typography>
                    <IconButton onClick={() => setOpen(false)} sx={{ color: '#fff' }} aria-label="Close" disabled={busy}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Body — scrolls internally when it doesn't fit within cardStyle's maxHeight. */}
                <Box sx={{ p: 3, overflowY: 'auto', display: 'grid', gap: 2.5 }}>
                    {subtitle && (
                        <Typography color="text.secondary">{subtitle}</Typography>
                    )}

                    <Stack direction="row" spacing={1.5}>
                        <Stat label="Created" value={total} />
                        <Stat label="Already printed" value={printed} />
                        <Stat label="Not printed yet" value={available} highlight />
                    </Stack>

                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>What do you want to print?</Typography>
                        <ToggleButtonGroup
                            value={printMode}
                            exclusive
                            onChange={(e, v) => v && setPrintMode(v)}
                            fullWidth
                        >
                            <ToggleButton value="print" disabled={available === 0}>New codes</ToggleButton>
                            <ToggleButton value="reprint" disabled={printed === 0}>Print again</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {printMode === 'print' ? (
                        <TextField
                            type="number"
                            label="How many new codes?"
                            fullWidth
                            value={count}
                            onChange={(e) => setCount(e.target.value)}
                            inputProps={{ min: 1, max: available }}
                            helperText={`Up to ${available} label${available === 1 ? '' : 's'} not printed yet.`}
                        />
                    ) : (
                        <Box>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <TextField
                                    type="number"
                                    label="From code no."
                                    fullWidth
                                    value={from}
                                    onChange={(e) => setFrom(e.target.value)}
                                    inputProps={{ min: 1, max: printed }}
                                />
                                <Typography color="text.secondary">to</Typography>
                                <TextField
                                    type="number"
                                    label="To code no."
                                    fullWidth
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                    inputProps={{ min: 1, max: printed }}
                                />
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                                Codes 1 to {printed} have been printed before.
                            </Typography>
                        </Box>
                    )}

                    <TextField
                        type="number"
                        label="Codes per row on the page"
                        fullWidth
                        value={itemsPerRow}
                        onChange={(e) => setItemsPerRow(e.target.value)}
                        inputProps={{ min: 1, max: 20 }}
                        helperText="Fewer per row makes each code bigger."
                    />

                    <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center">
                        <Button onClick={() => setOpen(false)} disabled={busy}>
                            Cancel
                        </Button>
                        <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownload} disabled={!canDownload}>
                            {busy ? 'Preparing PDF…' : `Download PDF (${labelCount})`}
                        </Button>
                    </Stack>
                </Box>
            </Box>
        </Modal>
    );
}
