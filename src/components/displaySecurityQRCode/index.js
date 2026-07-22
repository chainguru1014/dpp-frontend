import React, { useEffect, useState } from 'react';
import qrcode from 'qrcode';
import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CopyIconButton from '../CopyIconButton';

// Security URL base - should be configurable
// For production, this should be your VPS domain/IP
// You can set REACT_APP_SECURITY_BASE_URL in your .env file
// For development: http://82.165.217.122:3001
// For production: http://82.165.217.122:3001 (or your VPS IP/domain)
// Default to VPS URL for production use
const SECURITY_BASE_URL = process.env.REACT_APP_SECURITY_BASE_URL || process.env.REACT_APP_WEB_BASE_URL || 'https://dpp.innosynch.com';

const SecurityQRCode = ({ data, identifer }) => {
    const [qrcodeImage, setQRcodeImage] = useState('');
    const [securityUrl, setSecurityUrl] = useState('');

    useEffect(() => {
        (async () => {
            // Generate QR code with security URL format: http://82.165.217.122:3001/product/{encryptedKey}
            const url = `${SECURITY_BASE_URL}/product/${data}`;
            setSecurityUrl(url);
            const code = await qrcode.toDataURL(url);
            setQRcodeImage(code);
        })()
    }, [data]);

    const entries = identifer || [];
    const pmcEntry = entries.find((item) => item.type === 'PMC Code');
    const otherEntries = entries.filter((item) => item.type !== 'PMC Code');

    return (
        <Box sx={{ maxWidth: 228 }}>
            <Box sx={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                <img src={qrcodeImage} alt="Security QR Code" loading="lazy" style={{ width: '100%', display: 'block' }} />
                {qrcodeImage && (
                    <Tooltip title="Download image">
                        <IconButton
                            component="a"
                            href={qrcodeImage}
                            download={`security-qr-${data}.png`}
                            size="small"
                            sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: '#fff' } }}
                        >
                            <DownloadIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
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
        </Box>
    );
}

export default SecurityQRCode;
