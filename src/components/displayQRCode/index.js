import react, { useEffect, useState } from 'react';
import qrcode from 'qrcode';


const QRCode = ({data,identifer}) => {

    const [qrcodeImage, setQRcodeImage] = useState('');
    
    useEffect(() => {
        (async () => {
            const code = await qrcode.toDataURL('https://4dveritaspublic.com?qrcode=' + data);
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