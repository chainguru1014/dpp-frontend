import React, { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { getProductIdentifiers, getProductQRcodes } from '../../helper';
import qrcode from 'qrcode';

// Create styles
const styles = StyleSheet.create({
  page: {
    // flexDirection: 'row',
    backgroundColor: '#fff',
    padding: '80px 40px 50px 40px',
    fontSize: '10px',
    fontWeight: 'thin',
    display: 'flex',
  },
});

const QRCode = ({data,identifer}) => {

    const [qrcodeImage, setQRcodeImage] = useState('');
    
    useEffect(() => {
        (async () => {
            const code = await qrcode.toDataURL('https://4dveritaspublic.com?qrcode=' + data);
            setQRcodeImage(code);
        })()
    }, [data]);

    return (
        <View style={{maxWidth:'100px'}}>
            <Image
                src={`${qrcodeImage}`}
                style={{ width: "100px", height: "100px"}}
            />
            <View>
            {
                identifer.map(item=>{
                const identiferInfo = `${item.type} : ${item.serial}`;
                const identiferItems = [];
                
                for(let i = 0; i < Math.round(identiferInfo.length / 15); i ++) {
                    identiferItems.push(identiferInfo.substr(i * 15,15))
                }

                return (
                    <View>
                        {
                            identiferItems.map(info=>(
                                <Text style={{fontSize:12,color:'black'}}>{info}</Text>
                            ))
                        }
                        
                    </View>
                )})
            }
            </View>
        </View>
    );
}

// Create Document Component
const MyDocument = ({ product, apply, printMode, count, from, to }) => {
    const [qrcodes, setQrCodes] = useState([]);
    const [identifiers,setIdentifiers] = useState([])

    useEffect(() => {
        // console.log(apply);
        if(apply) {
            (async () => {
                const res = await getProductQRcodes(product._id, 0, printMode === 'print' ? product.printed_amount + 1 : from, printMode === 'print' ? product.printed_amount + Number(count) : to);
                const identiferRes = await getProductIdentifiers(product._id,0, printMode === 'print' ? product.printed_amount + 1 : from, printMode === 'print' ? product.printed_amount + Number(count) : to)
                setIdentifiers(identiferRes)
                setQrCodes(res);
            })()
        }
    }, [apply]);
    // console.log(qrcodes);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                
                <View style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap'}}>
                    {qrcodes.map((item, index) => (
                        <QRCode key={index} data={item} identifer={identifiers[index]?identifiers[index]:[]} />
                    ))}
                </View>
            </Page>
        </Document>
    );
};

export default MyDocument;