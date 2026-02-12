import React from 'react';
import { Avatar, Box, Button, Typography } from '@mui/material';
import { uploadFile, updateCompanyAvatar, getFileUrl } from '../../helper';
import { useAuth } from '../auth/AuthContext';

const ProfilePage = () => {
  const { company, setCompany } = useAuth();

  if (!company) {
    return null;
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const body = new FormData();
    body.append('file', file);
    const url = await uploadFile(body);
    if (!url) return;
    const ok = await updateCompanyAvatar(company._id, url);
    if (ok) {
      setCompany({ ...company, avatar: url });
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Profile
      </Typography>
      <Box
        sx={{
          bgcolor: '#fff',
          p: 3,
          borderRadius: 1,
          boxShadow: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
          <Avatar src={getFileUrl(company.avatar)} sx={{ width: 64, height: 64 }} />
          <Button variant="outlined" component="label">
            Upload Avatar
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarChange}
            />
          </Button>
        </Box>
        <Typography>Company Name: {company.name}</Typography>
        <br />
        <img src={`${company.qrcode}`} alt="Company QR" loading="lazy" />
      </Box>
    </Box>
  );
};

export default ProfilePage;

