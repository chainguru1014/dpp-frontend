import * as React from 'react';
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { getFileUrl } from '../../helper';

const Row = ({ label, children }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '170px 1fr' }, gap: { xs: 0.25, sm: 2 }, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
    <Typography color="text.secondary">{label}</Typography>
    <Box sx={{ minWidth: 0, wordBreak: 'break-word' }}>{children}</Box>
  </Box>
);

const FileLinks = ({ files }) => (
  Array.isArray(files) && files.length
    ? files.map((item) => (
      <Box key={item}>
        <Link href={getFileUrl(item)} target="_blank" rel="noopener noreferrer">{String(item).split('/').pop()}</Link>
      </Box>
    ))
    : <Typography>None uploaded</Typography>
);

// Read-only company summary opened from the Companies table. File links go
// through getFileUrl (they used to point at an old, unrelated server).
export default function CompanyPreview({ companyInfo, setCompanyInfo }) {
  const close = () => setCompanyInfo(undefined);
  return (
    <Dialog open={companyInfo !== undefined} onClose={close} maxWidth="sm" fullWidth aria-labelledby="company-detail-title">
      <DialogTitle id="company-detail-title">
        Company details
        <IconButton onClick={close} color="inherit" aria-label="Close"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Avatar src={companyInfo?.logo ? getFileUrl(companyInfo.logo) : getFileUrl(companyInfo?.avatar)} sx={{ width: 56, height: 56 }}>
            {(companyInfo?.name || '?')[0]}
          </Avatar>
          <Typography variant="h6">{companyInfo?.name}</Typography>
        </Box>
        <Row label="Admin email"><Typography>{companyInfo?.email || '—'}</Typography></Row>
        <Row label="Tagline"><Typography>{companyInfo?.title || '—'}</Typography></Row>
        <Row label="Location"><Typography>{companyInfo?.location || '—'}</Typography></Row>
        <Row label="Company domain"><Typography>{(companyInfo?.allowedEmailDomains || []).join(', ') || '—'}</Typography></Row>
        <Row label="ID documents"><FileLinks files={companyInfo?.idDocuments} /></Row>
        <Row label="Business documents"><FileLinks files={companyInfo?.businessDocuments} /></Row>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={close}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
