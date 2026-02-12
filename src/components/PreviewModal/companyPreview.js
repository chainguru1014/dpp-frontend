import * as React from 'react'

import {Box,Modal, Typography,Avatar,Dialog,DialogTitle,DialogContent} from '@mui/material'






export default function CompanyPreview({companyInfo,setCompanyInfo}) {
    return (
        <Dialog
        open={companyInfo !== undefined}
        onClose={() => setCompanyInfo(undefined)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        maxWidth="sm"
        >
            <DialogTitle id="alert-dialog-title">
             Company Detail
            </DialogTitle>
            <DialogContent>
                <Box sx={{minWidth:400}}>
                    <Box sx={{display:'flex',justifyContent:'center'}}>
                        {
                            companyInfo?.logo && (
                                <Avatar src={'https://shearnode.com/api/v1/files/' + companyInfo?.logo}></Avatar>
                            )
                        }
                        
                    </Box>
                    <Box sx={{marginTop:5}}>
                        <Typography>Name : {companyInfo?.name}</Typography>
                    </Box>
                    <Box sx={{marginTop:5}}>
                        <Typography>Email : {companyInfo?.email}</Typography>
                    </Box>
                    <Box sx={{marginTop:5}}>
                        <Typography>Title : {companyInfo?.title}</Typography>
                    </Box>
                    <Box sx={{marginTop:5}}>
                        <Typography>ID Documents</Typography>
                        {
                            companyInfo?.idDocuments?.map(item=>(
                                <Box>
                                    <a href={'https://shearnode.com/api/v1/files/' + item} target="_blank">{item}</a>
                                </Box>
                            ))
                        }
                    </Box>
                    <Box sx={{marginTop:5}}>
                        <Typography>Business Documents</Typography>
                        {
                            companyInfo?.businessDocuments?.map(item=>(
                                <Box>
                                    <a href={'https://shearnode.com/api/v1/files/' + item} target="_blank">{item}</a>
                                </Box>
                            ))
                        }
                    </Box>
                </Box>
            </DialogContent>
            
        </Dialog>
    )
}