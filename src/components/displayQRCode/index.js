import react, { useEffect, useState } from 'react';
import qrcode from 'qrcode';

// If backend returns a full URL (often localhost in dev),
// rewrite it to the configured public web base URL before encoding into QR.
const WEB_BASE_URL = process.env.REACT_APP_WEB_BASE_URL || 'http://82.165.217.122:3001';

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

const QRCode = ({data,identifer}) => {

    const [qrcodeImage, setQRcodeImage] = useState('');
    
    useEffect(() => {
        (async () => {
            const payload = normalizeQrPayload(data);
            const code = await qrcode.toDataURL(payload);
            setQRcodeImage(code);
        })()
    }, [data]);

    return (
        <div style={{maxWidth:228}}>
            <div>
            <img
                // srcSet={`${item.img}?w=161&fit=crop&auto=format&dpr=2 2x`}
                src={`${qrcodeImage}`}
                // alt={item.title}
                loading="lazy"
            />
            </div>
            {
                identifer.map(item=>(
                    <div>{item.type} : {item.serial}</div>
                ))
            }
        </div>
    );
}

export default QRCode;