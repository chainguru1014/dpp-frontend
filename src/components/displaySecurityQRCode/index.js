import react, { useEffect, useState } from 'react';
import qrcode from 'qrcode';

// Security URL base - should be configurable
// For production, this should be your VPS domain/IP
// You can set REACT_APP_SECURITY_BASE_URL in your .env file
// For development: http://localhost:3000
// For production: http://82.165.217.122:3000 (or your VPS IP/domain)
// Default to VPS URL for production use
const SECURITY_BASE_URL = process.env.REACT_APP_SECURITY_BASE_URL || process.env.REACT_APP_WEB_BASE_URL || 'http://82.165.217.122:3000';

const SecurityQRCode = ({data, identifer}) => {
    const [qrcodeImage, setQRcodeImage] = useState('');
    
    useEffect(() => {
        (async () => {
            // Generate QR code with security URL format: http://82.165.217.122:3000/product/{encryptedKey}
            const securityUrl = `${SECURITY_BASE_URL}/product/${data}`;
            const code = await qrcode.toDataURL(securityUrl);
            setQRcodeImage(code);
        })()
    }, [data]);

    return (
        <div style={{maxWidth:228}}>
            <div>
                <img
                    src={`${qrcodeImage}`}
                    alt="Security QR Code"
                    loading="lazy"
                />
            </div>
            {
                identifer && identifer.map((item, index) => (
                    <div key={index}>{item.type} : {item.serial}</div>
                ))
            }
        </div>
    );
}

export default SecurityQRCode;
