import React, { useEffect, useState } from 'react';
import qrcode from 'qrcode';
import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import CopyIconButton from '../CopyIconButton';

// Security URL base - should be configurable
// For production, this should be your VPS domain/IP
// You can set REACT_APP_SECURITY_BASE_URL in your .env file
// For development: http://82.165.217.122:3001
// For production: http://82.165.217.122:3001 (or your VPS IP/domain)
// Default to VPS URL for production use
const SECURITY_BASE_URL = process.env.REACT_APP_SECURITY_BASE_URL || process.env.REACT_APP_WEB_BASE_URL || 'https://dpp.innosynch.com';

// `onDelete`, when provided, renders a bottom-right remove button alongside
// the download button — both sit in the same flex row so they never overlap
// each other or the image above them.
const SecurityQRCode = ({ data, identifer, onDelete }) => {
    const [qrcodeImage, setQRcodeImage] = useState('');
    const [securityUrl, setSecurityUrl] = useState('');

    useEffect(() => {
        // Generate QR code with security URL format: http://82.165.217.122:3001/product/{encryptedKey}
        const url = `${SECURITY_BASE_URL}/product/${data}`;
        setSecurityUrl(url);
        let cancelled = false;
        qrcode.toDataURL(url)
            .then((code) => { if (!cancelled) setQRcodeImage(code); })
            .catch((err) => console.error('Failed to render Security QR code:', err));
        return () => { cancelled = true; };
    }, [data]);

    const entries = identifer || [];
    const pmcEntry = entries.find((item) => item.type === 'PMC Code');
    const otherEntries = entries.filter((item) => item.type !== 'PMC Code');

    return (
        <Box sx={{ maxWidth: 228, width: '100%' }}>
            <img src={qrcodeImage} alt="Security QR Code" loading="lazy" style={{ width: '100%', display: 'block' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <Typography variant="caption" sx={{ wordBreak: 'break-all', flex: 1 }}>{securityUrl}</Typography>
                <CopyIconButton value={securityUrl} />
            </Box>
            {otherEntries.map((item, index) => (
                <div key={index}>{item.type} : {item.serial}</div>
            ))}
            {pmcEntry && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', flex: 1 }}>
                        {pmcEntry.serial}
                    </Typography>
                    <CopyIconButton value={pmcEntry.serial} />
                </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
                {qrcodeImage && (
                    <Tooltip title="Download image">
                        <IconButton component="a" href={qrcodeImage} download={`security-qr-${data}.png`} size="small">
                            <DownloadIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
                {onDelete && (
                    <Tooltip title="Remove">
                        <IconButton size="small" onClick={onDelete}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        </Box>
    );
}

export default SecurityQRCode;
