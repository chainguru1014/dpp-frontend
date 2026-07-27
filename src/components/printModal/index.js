import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { TextField, Stack, IconButton, ToggleButton, ToggleButtonGroup } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { PDFDownloadLink } from '@react-pdf/renderer';
import qrcode from 'qrcode';
import MyDocument from './exportPDF';
import Stat from './Stat';
import { printProductQRCodes, getProductQRcodes, getProductIdentifiers } from '../../helper';

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

export default function PrintModal({ open, setOpen, totalAmount, product, setProduct }) {
    const [from, setFrom] = React.useState(0);
    const [to, setTo] = React.useState(0);
    const [printMode, setPrintMode] = React.useState('print');
    const [apply, setApply] = React.useState(false);
    const [count, setCount] = React.useState(0);
    const [preparing, setPreparing] = React.useState(false);
    const [pdfItems, setPdfItems] = React.useState([]);
    const [itemsPerRow, setItemsPerRow] = React.useState(5);

    const printed = product ? product.printed_amount : 0;
    const available = totalAmount - printed;

    // Fetch the code URLs for the chosen range and pre-generate their QR images,
    // so the PDF is built from ready images (never blank).
    const handleApply = async () => {
        if (!product?._id) return;
        setPreparing(true);
        try {
            const fromN = printMode === 'print' ? printed + 1 : Number(from);
            const toN = printMode === 'print' ? printed + Number(count) : Number(to);
            // Both now return { qrcode_id, ... } per item (only for ids that
            // actually still have a QRcode document), matched by id below —
            // not bare arrays keyed by position.
            const urls = await getProductQRcodes(product._id, 0, fromN, toN);
            const idents = await getProductIdentifiers(product._id, 0, fromN, toN);
            const identifiersByQrcodeId = new Map(
                (Array.isArray(idents) ? idents : []).map((entry) => [entry.qrcode_id, entry.identifiers])
            );
            const items = await Promise.all(
                (Array.isArray(urls) ? urls : []).map(async (item) => ({
                    img: await qrcode.toDataURL(String(item?.url || '')),
                    identifiers: identifiersByQrcodeId.get(item?.qrcode_id) || [],
                }))
            );
            setPdfItems(items);
            setApply(true);
        } finally {
            setPreparing(false);
        }
    };

    const downloadPDFHandler = async () => {
        if (printMode === 'print') {
            const productInfo = await printProductQRCodes(product._id, Number(count));
            setProduct(productInfo);
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
                {/* Header */}
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
                    <Typography sx={{ fontWeight: 400, fontSize: 18 }}>Print QR Codes</Typography>
                    <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: '#fff' }} aria-label="Close">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Body */}
                <Box sx={{ p: 3 }}>
                    {product?.name && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {product.name}
                        </Typography>
                    )}

                    {/* Stats */}
                    <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
                        <Stat label="Total Minted" value={totalAmount} />
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
                            helperText={`Up to ${Math.max(0, available)} unprinted code${available === 1 ? '' : 's'} available`}
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
                                fileName={`${product?.name}-${printMode}-${printMode === 'print' ? printed + 1 : from}-${printMode === 'print' ? printed + Number(count) : to}.pdf`}
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
