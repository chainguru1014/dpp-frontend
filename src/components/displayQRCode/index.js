import React, { useEffect, useState } from 'react';
import qrcode from 'qrcode';
import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CopyIconButton from '../CopyIconButton';

// If backend returns a full URL (often localhost in dev),
// rewrite it to the configured public web base URL before encoding into QR.
const WEB_BASE_URL = process.env.REACT_APP_WEB_BASE_URL || 'https://dpp.innosynch.com';

const normalizeQrPayload = (raw) => {
    const value = String(raw || '').trim();
    if (!value) return '';

    // If it's already not a URL, return as-is.
    if (!/^https?:\/\//i.test(value)) return value;

    try {
        const incoming = new URL(value);
        // Only rewrite known public product routes.
        if (!incoming.pathname.toLowerCase().startsWith('/product/')) return value;

        const base = new URL(WEB_BASE_URL);
        base.pathname = incoming.pathname;
        base.search = incoming.search;
        base.hash = incoming.hash;
        return base.toString();
    } catch (e) {
        return value;
    }
};

const QRCode = ({ data, identifer }) => {
    const [qrcodeImage, setQRcodeImage] = useState('');

    useEffect(() => {
        (async () => {
            const payload = normalizeQrPayload(data);
            const code = await qrcode.toDataURL(payload);
            setQRcodeImage(code);
        })()
    }, [data]);

    const entries = identifer || [];
    const pmcEntry = entries.find((item) => item.type === 'PMC Code');
    const otherEntries = entries.filter((item) => item.type !== 'PMC Code');

    return (
        <Box sx={{ maxWidth: 228 }}>
            <Box sx={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                <img src={qrcodeImage} loading="lazy" style={{ width: '100%', display: 'block' }} alt="QR code" />
                {qrcodeImage && (
                    <Tooltip title="Download image">
                        <IconButton
                            component="a"
                            href={qrcodeImage}
                            download={`qr-${data}.png`}
                            size="small"
                            sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: '#fff' } }}
                        >
                            <DownloadIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <Typography variant="caption" sx={{ wordBreak: 'break-all', flex: 1 }}>{data}</Typography>
                <CopyIconButton value={data} />
            </Box>
            {otherEntries.map((item, i) => (
                <div key={i}>{item.type} : {item.serial}</div>
            ))}
            {pmcEntry && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', flex: 1 }}>
                        {pmcEntry.serial}
                    </Typography>
                    <CopyIconButton value={pmcEntry.serial} />
                </Box>
            )}
        </Box>
    );
}

export default QRCode;
