import react, { useEffect, useState } from 'react';
import qrcode from 'qrcode';

const FRONTEND_BASE_URL = process.env.REACT_APP_PUBLIC_URL || window.location.origin;

const QRCode = ({data,identifer}) => {

    const [qrcodeImage, setQRcodeImage] = useState('');
    
    useEffect(() => {
        (async () => {
            // Use frontend URL for normal QR codes: ?qrcode={encryptedKey}
            const qrUrl = `${FRONTEND_BASE_URL}?qrcode=${encodeURIComponent(data)}`;
            const code = await qrcode.toDataURL(qrUrl);
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