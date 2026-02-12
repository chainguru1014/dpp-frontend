import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { Divider, Grid, TextField } from '@mui/material';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import MyDocument from './exportPDF';
import Switch from '@mui/material/Switch';
import { printProductQRCodes } from '../../helper';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '70%',
    minWidth: '300px',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

export default function PrintModal({open, setOpen, totalAmount, product, setProduct}) {
    const [from, setFrom] = React.useState(0);
    const [to, setTo] = React.useState(0);
    const [printMode, setPrintMode] = React.useState('print');
    const [apply, setApply] = React.useState(false);

    const [count, setCount] = React.useState(0);

    const downloadPDFHandler = async () => {
        if (printMode === 'print') {
            const productInfo = await printProductQRCodes(product._id, Number(count));
            // console.log(productInfo);
            setProduct(productInfo);
        }
        setApply(false);
    }

    React.useEffect(() => {
        if (count > totalAmount - (product ? product.printed_amount : 0)) {
            setCount(totalAmount - (product ? product.printed_amount : 0));
        }
    }, [count]);

    React.useEffect(() => {
        if (from > (product ? product.printed_amount : 0)) {
            setFrom((product ? product.printed_amount : 0));
        }
    }, [from]);

    React.useEffect(() => {
        if (to > (product ? product.printed_amount : 0)) {
            setTo((product ? product.printed_amount : 0));
        }
    }, [to]);

    return (
        <Modal
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        >
        <Box sx={style}>
            <Typography id="modal-modal-title" variant="h5" component="h2">
                Print
            </Typography>
            <br/>
            <Divider/>
            <br/>
            <Grid container spacing={2}>
                <Grid item xs={12} >
                    <Typography sx={{ textDecoration: 'underline', fontSize: 18}}>
                        Option
                    </Typography>

                    <br/>
                    <Typography>
                        Total Minted Items: {totalAmount}
                    </Typography>
                    <br/>
                    <Typography>
                        Printed Items: {product ? product.printed_amount : 0}
                    </Typography>
                    <br/>
                    
                    <RadioGroup
                        row
                        aria-labelledby="demo-row-radio-buttons-group-label"
                        name="row-radio-buttons-group"
                        value={printMode}
                        onChange={(e) => { setPrintMode(e.target.value) }}
                    >
                        <FormControlLabel value="print" control={<Radio />} label="Print" />
                        <FormControlLabel value="reprint" control={<Radio />} label="Reprint" />
                    </RadioGroup>
                    <br/>

                    {printMode === 'print' 
                        ? <Box>
                            <Typography>
                                Available: {totalAmount - (product ? product.printed_amount : 0)}
                            </Typography>
                            <br/>

                            <TextField type='number' InputProps={{ inputProps: { min: 0, max: totalAmount - (product ? product.printed_amount : 0)}}} label="Count" variant="outlined" size='small' value={count} onChange={(e) => setCount(e.target.value)} sx={{ width: 80}}/>
                        </Box>
                        : <Box>
                            <Typography>
                                Available: {product && product.printed_amount > 0 ? 1 : 0} ~ {product ? product.printed_amount : 0}
                            </Typography>
                            <br/>
                            <Box sx={{ display: 'flex', alignItems: 'center'}}>
                                <TextField type='number' InputProps={{ inputProps: { min: 0, max: (product ? product.printed_amount : 0)}}} label="From" variant="outlined" size='small' value={from} onChange={(e) => setFrom(e.target.value)} sx={{ width: 80}}/>
                                &nbsp;&nbsp;~&nbsp;&nbsp;
                                <TextField type='number' InputProps={{ inputProps: { min: 0, max: (product ? product.printed_amount : 0)}}} label="To" variant="outlined" size='small' value={to} onChange={(e) => setTo(e.target.value)} sx={{ width: 80}}/>
                            </Box>
                        </Box>
                    }
                    

                    <br/>
                    {!apply && <Button variant='contained' color='primary' onClick={() => { setApply(true) }}>Apply</Button>}
                    {/* <Button variant='contained' color='primary' onClick={() => { setApply(true) }}>Apply</Button> */}
                    
                    <PDFDownloadLink hidden={!apply} document={<MyDocument product={product} apply={apply} printMode={printMode} count={count} from={from} to={to} />} 
                        onClick={downloadPDFHandler} fileName={`${product.name}-${printMode}-${printMode === 'print' ? product.printed_amount + 1 : from}-${printMode === 'print' ? product.printed_amount + Number(count) : to}.pdf`}>
                        {({ blob, url, loading, error }) => <Button variant='contained' color='primary'>{loading ? 'In Progress...' : 'Download PDF'}</Button>}
                    </PDFDownloadLink>
                    <br/>
                    
                </Grid>
                {/* <Grid item xs={12} lg={6}>
                    <Typography sx={{ textDecoration: 'underline', fontSize: 18}}>
                        Preview
                    </Typography>
                    <PDFViewer width="100%" height="600px">
                        <MyDocument product={product} printMode={printMode} count={count} from={from} to={to}/>
                    </PDFViewer>
                </Grid> */}
            </Grid>
        </Box>
        </Modal>
    );
}