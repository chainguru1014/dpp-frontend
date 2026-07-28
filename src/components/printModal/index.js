import * as React from 'react';
import qrcode from 'qrcode';
import PrintDialog from './PrintDialog';
import { printProductQRCodes, getProductQRcodes } from '../../helper';

// QR tab wiring for the shared PrintDialog: fetches the chosen range's QR
// image for each code from the backend, and persists the printed count via
// Product.printed_amount on download. The PDF prints the code (image) only.
export default function PrintModal({ open, setOpen, totalAmount, product, setProduct }) {
    const printed = product ? product.printed_amount : 0;

    const itemsSource = async (fromN, toN) => {
        if (!product?._id) return [];
        // Returns { qrcode_id, ... } per item (only for ids that actually
        // still have a QRcode document).
        const urls = await getProductQRcodes(product._id, 0, fromN, toN);
        return Promise.all(
            (Array.isArray(urls) ? urls : []).map(async (item) => ({
                img: await qrcode.toDataURL(String(item?.url || '')),
                code: item?.url,
            }))
        );
    };

    const onMarkPrinted = async (count) => {
        const productInfo = await printProductQRCodes(product._id, count);
        setProduct(productInfo);
        return productInfo?.printed_amount;
    };

    return (
        <PrintDialog
            open={open}
            setOpen={setOpen}
            title="Print QR Codes"
            subtitle={product?.name}
            totalAmount={totalAmount}
            printedAmount={printed}
            itemsSource={itemsSource}
            onMarkPrinted={onMarkPrinted}
            fileNamePrefix={product?.name || 'qr-codes'}
        />
    );
}
