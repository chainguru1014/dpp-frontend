import React, { useState, useRef } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
  TextField,
  Tooltip,
  Typography,
  Chip,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SaveIcon from '@mui/icons-material/Save';
import LockResetIcon from '@mui/icons-material/LockReset';
import VerifiedIcon from '@mui/icons-material/Verified';
import DownloadIcon from '@mui/icons-material/Download';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { uploadFile, updateCompany, getFileUrl } from '../../helper';
import { useAuth } from '../auth/AuthContext';

const isValidEmail = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim());

const ProfilePage = () => {
  const { company, setCompany } = useAuth();
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [form, setForm] = useState({
    name: company?.name || '',
    email: company?.email || '',
    title: company?.title || '',
    location: company?.location || '',
    detail: company?.detail || '',
    avatar: company?.avatar || '',
    background: company?.background || '',
  });
  const [pwd, setPwd] = useState({ next: '', confirm: '', show: false });
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [uploading, setUploading] = useState(null); // 'avatar' | 'cover' | null
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });

  if (!company) return null;

  const notify = (msg, severity = 'success') => setToast({ open: true, msg, severity });
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleImage = async (kind, e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploading(kind);
    try {
      const body = new FormData();
      body.append('file', file);
      const url = await uploadFile(body);
      if (!url) {
        notify('Image upload failed', 'error');
        return;
      }
      const key = kind === 'avatar' ? 'avatar' : 'background';
      setForm((f) => ({ ...f, [key]: url }));
      // Persist the image immediately so it survives even without a full save.
      await updateCompany(company._id, { [key]: url });
      setCompany({ ...company, [key]: url });
      notify(kind === 'avatar' ? 'Avatar updated' : 'Cover image updated');
    } catch (err) {
      notify('Upload failed', 'error');
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    if (!isValidEmail(form.email)) {
      notify('Please enter a valid email address', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        title: form.title.trim(),
        location: form.location.trim(),
        detail: form.detail.trim(),
        avatar: form.avatar,
        background: form.background,
      };
      const ok = await updateCompany(company._id, payload);
      if (ok === false) {
        notify('Failed to save profile', 'error');
        return;
      }
      setCompany({ ...company, ...payload });
      notify('Profile saved');
    } catch (err) {
      notify('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwd.next || pwd.next.length < 4) {
      notify('New password must be at least 4 characters', 'error');
      return;
    }
    if (pwd.next !== pwd.confirm) {
      notify('Passwords do not match', 'error');
      return;
    }
    setSavingPwd(true);
    try {
      const ok = await updateCompany(company._id, { password: pwd.next });
      if (ok === false) {
        notify('Failed to update password', 'error');
        return;
      }
      setPwd({ next: '', confirm: '', show: false });
      notify('Password updated');
    } catch (err) {
      notify('Failed to update password', 'error');
    } finally {
      setSavingPwd(false);
    }
  };

  const downloadQr = () => {
    if (!company.qrcode) return;
    const a = document.createElement('a');
    a.href = company.qrcode;
    a.download = `${(company.name || 'company').replace(/[^a-z0-9-_]+/gi, '_')}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const coverUrl = form.background ? getFileUrl(form.background) : '';

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 400 }}>
        Profile
      </Typography>

      {/* Header card with cover + avatar */}
      <Card sx={{ borderRadius: 2, overflow: 'hidden', mb: 2 }}>
        <Box
          sx={{
            height: 160,
            position: 'relative',
            background: coverUrl
              ? `url(${coverUrl}) center/cover no-repeat`
              : 'linear-gradient(135deg,#1f3361,#3d5c93)',
          }}
        >
          <Tooltip title="Change cover image">
            <IconButton
              onClick={() => coverInputRef.current?.click()}
              sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(0,0,0,0.45)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' } }}
              size="small"
            >
              {uploading === 'cover' ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <PhotoCameraIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={(e) => handleImage('cover', e)} />
        </Box>

        <CardContent sx={{ pt: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ position: 'relative', mt: -7 }}>
              <Avatar
                src={getFileUrl(form.avatar)}
                sx={{ width: 96, height: 96, border: '4px solid #fff', boxShadow: 2, bgcolor: '#cfd8e6' }}
              />
              <Tooltip title="Change avatar">
                <IconButton
                  onClick={() => avatarInputRef.current?.click()}
                  size="small"
                  sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } }}
                >
                  {uploading === 'avatar' ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <PhotoCameraIcon sx={{ fontSize: 16 }} />}
                </IconButton>
              </Tooltip>
              <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={(e) => handleImage('avatar', e)} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontWeight: 400 }}>
                  {form.name || 'Company'}
                </Typography>
                {company.isVerified && (
                  <Chip size="small" color="success" icon={<VerifiedIcon />} label="Verified" />
                )}
              </Box>
              {form.title && (
                <Typography variant="body2" color="text.secondary">{form.title}</Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {/* Company info */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 400, mb: 2 }}>
                Company Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Company Name" value={form.name} onChange={setField('name')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Email" type="email" value={form.email} onChange={setField('email')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Title / Tagline" value={form.title} onChange={setField('title')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Location" value={form.location} onChange={setField('location')} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="About / Details" value={form.detail} onChange={setField('detail')} multiline minRows={3} />
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="contained" startIcon={saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <SaveIcon />} onClick={handleSave} disabled={saving}>
                  Save changes
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Security + QR */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 2, mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 400, mb: 2 }}>
                Change Password
              </Typography>
              <TextField
                fullWidth size="small" label="New password" sx={{ mb: 2 }}
                type={pwd.show ? 'text' : 'password'}
                value={pwd.next}
                onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setPwd((p) => ({ ...p, show: !p.show }))} edge="end">
                        {pwd.show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth size="small" label="Confirm new password"
                type={pwd.show ? 'text' : 'password'}
                value={pwd.confirm}
                onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="outlined" startIcon={savingPwd ? <CircularProgress size={18} /> : <LockResetIcon />} onClick={handleChangePassword} disabled={savingPwd}>
                  Update password
                </Button>
              </Box>
            </CardContent>
          </Card>

          {company.qrcode && (
            <Card sx={{ borderRadius: 2 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 400, mb: 1 }}>
                  Company QR
                </Typography>
                <Box
                  component="img"
                  src={company.qrcode}
                  alt="Company QR"
                  loading="lazy"
                  sx={{ width: 180, height: 180, borderRadius: 1, border: '1px solid', borderColor: 'divider', p: 1, bgcolor: '#fff' }}
                />
                <Divider sx={{ my: 1.5 }} />
                <Button size="small" startIcon={<DownloadIcon />} onClick={downloadQr}>
                  Download QR
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast((t) => ({ ...t, open: false }))}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfilePage;
