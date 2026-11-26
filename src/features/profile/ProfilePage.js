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
  TextField,
  Tooltip,
  Typography,
  Chip,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SaveIcon from '@mui/icons-material/Save';
import VerifiedIcon from '@mui/icons-material/Verified';
import DownloadIcon from '@mui/icons-material/Download';
import { uploadFile, updateCompany, updateUserProfile, getFileUrl } from '../../helper';
import { useAuth } from '../auth/AuthContext';
import PageHeader from '../../components/PageHeader';
import CoverCropDialog from '../../components/CoverCropDialog';
import { CROP, cropImage } from '../../components/ImageCrop';
import { notify, notifyError, notifySuccess } from '../../utils/feedbackBus';

const isValidEmail = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim());

const Detail = ({ label, value }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '180px 1fr' }, gap: { xs: 0.25, sm: 2 }, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
    <Typography color="text.secondary">{label}</Typography>
    <Typography sx={{ fontWeight: 400, wordBreak: 'break-word' }}>{value || '—'}</Typography>
  </Box>
);

// A staff member (Supervisor / Working Employee) signs in with a session that
// reuses their company's id, so the editable form below would have saved
// their input onto the COMPANY record. Staff get a read-only summary instead;
// their details are managed on the Staff page.
const StaffProfile = ({ company }) => (
  <Box>
    <PageHeader title="My profile" description="Your employee account. Sign-in uses a code sent to this email." />
    <Card sx={{ maxWidth: 720 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 28 }}>
            {(company.displayName || company.email || '?')[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6">{company.displayName || company.email}</Typography>
            <Typography color="text.secondary">
              {company.employeeType === 'supervisor' ? 'Supervisor' : 'Working employee'} at {company.name}
            </Typography>
          </Box>
        </Box>
        <Detail label="Name" value={company.displayName} />
        <Detail label="Email" value={company.email} />
        <Detail label="Role" value={company.employeeType === 'supervisor' ? 'Supervisor' : 'Working employee'} />
        <Detail label="Company" value={company.name} />
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          {company.employeeType === 'supervisor'
            ? 'To change these details, ask your company administrator or the Yometel team.'
            : 'To change these details, ask your Supervisor.'}
        </Typography>
      </CardContent>
    </Card>
  </Box>
);

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
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null); // 'avatar' | 'cover' | null
  const [coverFile, setCoverFile] = useState(null);

  if (!company) return null;
  if (company.actorKind === 'Employee') return <StaffProfile company={company} />;

  // Google / app users live in the users collection; brands in companies.
  const isAppUser = company.role === 'User' || !!company.userType;
  const persist = (id, payload) =>
    isAppUser ? updateUserProfile(id, payload) : updateCompany(id, payload);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // A cover is cut to the cover shape first (CoverCropDialog), then uploaded.
  const handleImage = async (kind, e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (kind === 'cover') {
      setCoverFile(file);
      return;
    }
    // The profile picture: cropped in a circle first.
    const cut = await cropImage(file, CROP.avatar);
    if (!cut) return;
    await uploadImage(kind, cut);
  };
  const uploadImage = async (kind, file) => {
    setUploading(kind);
    try {
      const body = new FormData();
      body.append('file', file);
      const url = await uploadFile(body);
      if (!url) {
        notifyError('The picture could not be uploaded. Please try another image.');
        return;
      }
      const key = kind === 'avatar' ? 'avatar' : 'background';
      setForm((f) => ({ ...f, [key]: url }));
      // Persist the image immediately so it survives even without a full save.
      await persist(company._id, { [key]: url });
      setCompany({ ...company, [key]: url });
      notifySuccess(kind === 'avatar' ? 'Picture updated.' : 'Cover image updated.');
    } catch (err) {
      notifyError('The picture could not be uploaded. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      notify(isAppUser ? 'Please enter your name.' : 'Please enter the company name.', 'warning');
      return;
    }
    if (!isValidEmail(form.email)) {
      notify('Please enter a valid email address, for example name@example.com.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const payload = isAppUser
        ? { name: form.name.trim(), email: form.email.trim(), location: form.location.trim(), avatar: form.avatar }
        : {
            name: form.name.trim(),
            email: form.email.trim(),
            title: form.title.trim(),
            location: form.location.trim(),
            detail: form.detail.trim(),
            avatar: form.avatar,
            background: form.background,
          };
      // For app users (e.g. Google sign-ups), saving the profile marks it
      // complete so future sign-ins route straight to the dashboard.
      if (isAppUser) payload.profileCompleted = true;
      const ok = await persist(company._id, payload);
      if (ok === false) {
        notifyError('Your changes could not be saved. Please try again.');
        return;
      }
      setCompany({ ...company, ...payload });
      notifySuccess('Your changes are saved.');
    } catch (err) {
      notifyError('Your changes could not be saved. Please try again.');
    } finally {
      setSaving(false);
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
      <PageHeader
        title="My profile"
        description={isAppUser
          ? 'Your name, email and picture. You sign in with a code sent to this email.'
          : 'Your company account: its name and details, and the email you sign in with (a code is sent to it). What shoppers see (your brand) is set on Company Profile.'}
      />

      {/* Header card. Companies: the cover photo is the background of the
          whole card (cut to the cover shape when uploaded), with the
          picture, name and Change cover on it. App users: picture and name. */}
      <Card
        sx={{
          borderRadius: 3, overflow: 'hidden', mb: 2, position: 'relative',
          ...(!isAppUser ? {
            aspectRatio: { md: '5 / 1' }, minHeight: 150, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            background: coverUrl
              ? `linear-gradient(180deg, rgba(10,25,40,0) 30%, rgba(10,25,40,0.78) 100%), url(${coverUrl}) center/cover no-repeat`
              : 'linear-gradient(135deg,#4a96dd,#1b4f72)',
          } : {}),
        }}
      >
        {!isAppUser && (
          <>
            <Button
              onClick={() => coverInputRef.current?.click()}
              startIcon={uploading === 'cover' ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <PhotoCameraIcon />}
              sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
            >
              Change cover
            </Button>
            <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={(e) => handleImage('cover', e)} />
          </>
        )}

        <CardContent sx={{ pt: 2, color: isAppUser ? undefined : '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={getFileUrl(form.avatar)}
                alt=""
                sx={{ width: 96, height: 96, border: '4px solid #fff', boxShadow: 2, bgcolor: '#cfd8e6', fontSize: 36 }}
              >
                {(form.name || '?')[0].toUpperCase()}
              </Avatar>
              <Tooltip title="Change picture">
                <IconButton
                  onClick={() => avatarInputRef.current?.click()}
                  aria-label="Change picture"
                  sx={{ position: 'absolute', bottom: -4, right: -4, bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } }}
                >
                  {uploading === 'avatar' ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <PhotoCameraIcon />}
                </IconButton>
              </Tooltip>
              <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={(e) => handleImage('avatar', e)} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={isAppUser ? undefined : { color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                  {form.name || (isAppUser ? 'Your name' : 'Company')}
                </Typography>
                {!isAppUser && company.isVerified && (
                  <Chip size="small" color="success" icon={<VerifiedIcon />} label="Verified" />
                )}
              </Box>
              <Typography sx={isAppUser ? { color: 'text.secondary' } : { color: 'rgba(255,255,255,0.92)', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                {isAppUser ? form.email : (form.title || form.email)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
      <CoverCropDialog
        file={coverFile}
        onCancel={() => setCoverFile(null)}
        onDone={(cut) => { setCoverFile(null); uploadImage('cover', cut); }}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} md={company.qrcode && !isAppUser ? 8 : 12} lg={company.qrcode && !isAppUser ? 8 : 9}>
          <Card sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                {isAppUser ? 'Your details' : 'Company details'}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth required label={isAppUser ? 'Name' : 'Company name'} value={form.name} onChange={setField('name')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Email" type="email" value={form.email} onChange={setField('email')}
                    helperText="Your sign-in code is sent here." />
                </Grid>
                {!isAppUser && (
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Short tagline" placeholder="e.g. Sustainable denim since 1990" value={form.title} onChange={setField('title')} />
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label={isAppUser ? 'Country or city' : 'Location'} value={form.location} onChange={setField('location')} />
                </Grid>
                {!isAppUser && (
                  <Grid item xs={12}>
                    <TextField fullWidth label="About the company" value={form.detail} onChange={setField('detail')} multiline minRows={3} />
                  </Grid>
                )}
              </Grid>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="contained" startIcon={saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <SaveIcon />} onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {company.qrcode && !isAppUser && (
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                  Company QR code
                </Typography>
                <Box
                  component="img"
                  src={company.qrcode}
                  alt="Company QR code"
                  loading="lazy"
                  sx={{ width: 180, height: 180, borderRadius: 1, border: '1px solid', borderColor: 'divider', p: 1, bgcolor: '#fff' }}
                />
                <Divider sx={{ my: 1.5 }} />
                <Button startIcon={<DownloadIcon />} onClick={downloadQr}>
                  Download QR code
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ProfilePage;
