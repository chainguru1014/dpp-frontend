import react, { useEffect, useState } from 'react';
import qrcode from 'qrcode';

// Web URL base - should be configurable
// For production, this should be your actual domain
// You can set REACT_APP_WEB_BASE_URL in your .env file
// For development: http://82.165.217.122:3001
// For production: https://yourdomain.com
const WEB_BASE_URL = process.env.REACT_APP_WEB_BASE_URL || 'http://82.165.217.122:3001';

const WebQRCode = ({data, identifer}) => {
    const [qrcodeImage, setQRcodeImage] = useState('');
    
    useEffect(() => {
        (async () => {
            // Generate QR code with web URL format: http://82.165.217.122:3001/product/{encryptedKey}
            const webUrl = `${WEB_BASE_URL}/product/${data}`;
            const code = await qrcode.toDataURL(webUrl);
            setQRcodeImage(code);
        })()
    }, [data]);

    return (
        <div style={{maxWidth:228}}>
            <div>
                <img
                    src={`${qrcodeImage}`}
                    alt="Web QR Code"
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

export default WebQRCode;
